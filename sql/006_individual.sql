-- الرياضات الفردية: التنس (ATP/WTA)، الغولف (PGA)، الفورمولا 1، UFC.
-- جدول طلبات خاص (ind_jobs) باش hadaf_parse تاع الرياضات الجماعية ما تاكلش هاد الطلبات (هي تقرا feed_jobs كامل بلا فلتر kind).
create table if not exists public.ind_events(
  id text primary key, sport text, tour text, event_name text, event_logo text,
  start timestamptz, end_date timestamptz, state text, detail text, payload jsonb, updated_at timestamptz default now());
create index if not exists ind_events_sport_start on public.ind_events(sport,start);
alter table public.ind_events enable row level security;
grant select, insert, update, delete on public.ind_events to service_role;

create table if not exists public.ind_jobs(req_id bigint primary key, path text, kind text default 'ind', created timestamptz default now());
alter table public.ind_jobs enable row level security;
grant select, insert, update, delete on public.ind_jobs to service_role;

-- لاعب واحد بشكل صغير
create or replace function public.hadaf_ind_player(p jsonb) returns jsonb
language plpgsql immutable as $$
begin
  if p is null then return null; end if;
  return jsonb_build_object(
    'name', coalesce(p->'athlete'->>'displayName', p->'athlete'->>'shortName', p->'team'->>'displayName'),
    'flag', p->'athlete'->'flag'->>'href',
    'won', coalesce((p->>'winner')::boolean,false),
    'sets', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('v',ls->'value','tb',ls->'tiebreak')))
                      from jsonb_array_elements(case when jsonb_typeof(p->'linescores')='array' then p->'linescores' else '[]'::jsonb end) ls),'[]'::jsonb));
end $$;

-- منافس رقم k (حسب order)
create or replace function public.hadaf_ind_nth(p_comp jsonb, k int) returns jsonb
language plpgsql immutable as $$
declare r jsonb;
begin
  select x into r from jsonb_array_elements(case when jsonb_typeof(p_comp->'competitors')='array' then p_comp->'competitors' else '[]'::jsonb end) x
    order by nullif(x->>'order','')::int nulls last, x->>'homeAway' desc offset k-1 limit 1;
  return r;
end $$;

create or replace function public.hadaf_fetch_ind(p_days int[] default array[0]) returns int
language plpgsql security definer set search_path=public as $$
declare d int; p text; cnt int:=0; ymd text;
begin
  foreach p in array array['tennis/atp','tennis/wta','golf/pga','racing/f1','mma/ufc'] loop
    foreach d in array p_days loop
      ymd:=to_char((now() at time zone 'Africa/Algiers')::date+d,'YYYYMMDD');
      insert into ind_jobs(req_id,path,kind) values(
        net.http_get(url:='https://site.api.espn.com/apis/site/v2/sports/'||p||'/scoreboard?dates='||ymd,timeout_milliseconds:=25000),p,'ind');
      cnt:=cnt+1;
    end loop;
  end loop;
  return cnt;
end $$;

create or replace function public.hadaf_parse_ind() returns int
language plpgsql security definer set search_path=public as $$
declare j record; body jsonb; e jsonb; pl jsonb; cal jsonb; cnt int:=0; v_sport text; v_tour text; v_logo text; v_state text;
begin
  for j in select f.req_id,f.path,r.status_code,r.content from ind_jobs f join net._http_response r on r.id=f.req_id loop
    begin
      if j.status_code=200 then
        body:=j.content::jsonb;
        v_tour:=split_part(j.path,'/',2);
        v_sport:=case split_part(j.path,'/',1) when 'racing' then 'f1' when 'mma' then 'ufc' else split_part(j.path,'/',1) end;
        v_logo:=body->'leagues'->0->'logos'->0->>'href';
        for e in select x from jsonb_array_elements(case when jsonb_typeof(body->'events')='array' then body->'events' else '[]'::jsonb end) x loop
          pl:=null;
          if v_sport='tennis' then
            select jsonb_build_object('matches',coalesce(jsonb_agg(m),'[]'::jsonb)) into pl from (
              select jsonb_build_object(
                'draw', g->'grouping'->>'displayName',
                'round', coalesce(c->'round'->>'displayName', g->'grouping'->>'displayName'),
                'start', coalesce(c->>'startDate',c->>'date'),
                'p1', hadaf_ind_player(hadaf_ind_nth(c,1)), 'p2', hadaf_ind_player(hadaf_ind_nth(c,2)),
                'state', c->'status'->'type'->>'state', 'detail', c->'status'->'type'->>'shortDetail') m
              from jsonb_array_elements(case when jsonb_typeof(e->'groupings')='array' then e->'groupings' else '[]'::jsonb end) g,
                   jsonb_array_elements(case when jsonb_typeof(g->'competitions')='array' then g->'competitions' else '[]'::jsonb end) c
              order by case c->'status'->'type'->>'state' when 'in' then 0 when 'pre' then 1 else 2 end, coalesce(c->>'startDate',c->>'date') desc
              limit 120) q;
          elsif v_sport='golf' then
            select jsonb_build_object('board',coalesce(jsonb_agg(b order by o),'[]'::jsonb)) into pl from (
              select nullif(x->>'order','')::int o, jsonb_build_object('pos',x->'order','name',x->'athlete'->>'displayName',
                'flag',x->'athlete'->'flag'->>'href','score',coalesce(x->>'score',x->'score'->>'displayValue')) b
              from jsonb_array_elements(case when jsonb_typeof(e->'competitions'->0->'competitors')='array' then e->'competitions'->0->'competitors' else '[]'::jsonb end) x
              order by nullif(x->>'order','')::int nulls last limit 30) q;
          elsif v_sport='f1' then
            select jsonb_build_object(
              'sessions',coalesce((select jsonb_agg(jsonb_build_object('name',coalesce(c->'type'->>'abbreviation',c->'type'->>'text'),
                  'start',coalesce(c->>'startDate',c->>'date'),'state',c->'status'->'type'->>'state') order by coalesce(c->>'startDate',c->>'date'))
                from jsonb_array_elements(case when jsonb_typeof(e->'competitions')='array' then e->'competitions' else '[]'::jsonb end) c),'[]'::jsonb),
              'results',coalesce((select jsonb_agg(jsonb_build_object('pos',x->'order','name',x->'athlete'->>'displayName','flag',x->'athlete'->'flag'->>'href',
                  'won',coalesce((x->>'winner')::boolean,false)) order by nullif(x->>'order','')::int nulls last)
                from (select c from jsonb_array_elements(case when jsonb_typeof(e->'competitions')='array' then e->'competitions' else '[]'::jsonb end) c
                      where jsonb_typeof(c->'competitors')='array' and jsonb_array_length(c->'competitors')>0
                      order by (c->'type'->>'abbreviation'='Race') desc, coalesce(c->>'startDate',c->>'date') desc limit 1) s,
                  lateral (select y x from jsonb_array_elements(s.c->'competitors') y order by nullif(y->>'order','')::int nulls last limit 10) t),'[]'::jsonb),
              'session_of_results',(select c->'type'->>'abbreviation' from jsonb_array_elements(case when jsonb_typeof(e->'competitions')='array' then e->'competitions' else '[]'::jsonb end) c
                      where jsonb_typeof(c->'competitors')='array' and jsonb_array_length(c->'competitors')>0
                      order by (c->'type'->>'abbreviation'='Race') desc, coalesce(c->>'startDate',c->>'date') desc limit 1)) into pl;
          else -- ufc
            select jsonb_build_object('fights',coalesce(jsonb_agg(f),'[]'::jsonb)) into pl from (
              select jsonb_build_object('a',hadaf_ind_player(hadaf_ind_nth(c,1))-'sets','b',hadaf_ind_player(hadaf_ind_nth(c,2))-'sets',
                'cls',coalesce(c->'type'->>'abbreviation',c->'note'->>'text'),'state',c->'status'->'type'->>'state',
                'detail',coalesce(c->'status'->>'result',c->'status'->'type'->>'shortDetail')) f
              from jsonb_array_elements(case when jsonb_typeof(e->'competitions')='array' then e->'competitions' else '[]'::jsonb end) c
              limit 30) q;
          end if;
          v_state:=coalesce(e->'status'->'type'->>'state',e->'competitions'->0->'status'->'type'->>'state');
          insert into ind_events(id,sport,tour,event_name,event_logo,start,end_date,state,detail,payload,updated_at)
          values(v_sport||':'||v_tour||':'||(e->>'id'),v_sport,v_tour,coalesce(e->>'name',e->>'shortName'),v_logo,
            nullif(e->>'date','')::timestamptz,nullif(e->>'endDate','')::timestamptz,v_state,
            coalesce(e->'status'->'type'->>'shortDetail',e->'competitions'->0->'status'->'type'->>'shortDetail'),pl,now())
          on conflict(id) do update set event_name=excluded.event_name,event_logo=excluded.event_logo,start=excluded.start,end_date=excluded.end_date,
            state=excluded.state,detail=excluded.detail,payload=excluded.payload,updated_at=now();
          cnt:=cnt+1;
        end loop;
        -- رزنامة الموسم: المواعيد الجاية (للحالة الفارغة)
        select coalesce(jsonb_agg(jsonb_build_object('name',x->>'label','start',x->>'startDate','end',x->>'endDate') order by x->>'startDate'),'[]'::jsonb) into cal
          from (select x from jsonb_array_elements(case when jsonb_typeof(body->'leagues'->0->'calendar')='array' then body->'leagues'->0->'calendar' else '[]'::jsonb end) x
                where jsonb_typeof(x)='object' and nullif(coalesce(x->>'endDate',x->>'startDate'),'')::timestamptz>=now()
                order by x->>'startDate' limit 6) s;
        insert into ind_events(id,sport,tour,event_name,state,payload,updated_at)
          values('cal:'||v_sport||':'||v_tour,v_sport,v_tour,'calendar','cal',jsonb_build_object('next',cal),now())
          on conflict(id) do update set payload=excluded.payload,updated_at=now();
      end if;
    exception when others then insert into feed_log(what) values('parse_ind '||j.path||': '||sqlerrm);
    end;
    delete from ind_jobs where req_id=j.req_id;
    begin delete from net._http_response where id=j.req_id; exception when others then null; end;
  end loop;
  delete from ind_jobs where created<now()-interval '1 hour';
  delete from ind_events where state<>'cal' and coalesce(end_date,start)<now()-interval '30 days';
  return cnt;
end $$;

do $$ begin perform cron.unschedule('hadaf-ind-fetch'); exception when others then null; end $$;
do $$ begin perform cron.unschedule('hadaf-ind-parse'); exception when others then null; end $$;
select cron.schedule('hadaf-ind-fetch','*/10 * * * *',$$select public.hadaf_fetch_ind(array[0])$$);
select cron.schedule('hadaf-ind-parse','* * * * *',$$select public.hadaf_parse_ind()$$);

notify pgrst, 'reload schema';
select public.hadaf_fetch_ind(array[0,1]);
