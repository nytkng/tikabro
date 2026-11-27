-- لصقة وحدة: الرياضات الفردية + دوريات الأصحاب + التحليلات

-- ===== 006_individual =====
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

-- ===== 007_friends =====
-- دوريات الأصحاب: مجموعات خاصة بلا فلوس بلا جوائز
create table if not exists public.groups(
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  code text not null unique check (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$'),
  owner uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists groups_owner_idx on public.groups(owner);
create table if not exists public.group_members(
  group_id uuid not null references public.groups(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(group_id,player_id)
);
create index if not exists group_members_player_idx on public.group_members(player_id);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
grant select,insert,update,delete on public.groups,public.group_members to service_role;

create or replace function public.group_board(p_group uuid,p_since timestamptz)
returns table(nick text,n bigint,hits bigint,points numeric)
language sql stable security definer set search_path=public as $$
  select p.nick::text,count(k.*) as n,count(*) filter (where k.hit) as hits,coalesce(sum(k.points),0) as points
  from group_members gm
  join players p on p.id=gm.player_id
  join picks k on k.player_id=gm.player_id and k.settled_at is not null and k.settled_at>=p_since and not coalesce(k.void,false)
  where gm.group_id=p_group
  group by p.nick
  order by points desc,hits desc,n asc;
$$;
revoke all on function public.group_board(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.group_board(uuid,timestamptz) to service_role;
notify pgrst, 'reload schema';

-- ===== 008_analytics =====
-- 008: تحليلات سجل الـ AI (تجميع في القاعدة باش الخادم يبقى خفيف)
create or replace function public.ai__s(x float) returns float language sql immutable as $$
  select case when x is null then null when x>1 then x/100.0 else x end $$;

create or replace function public.ai_summary()
returns table(grp text, k text, n int, hits int, brier float, logloss float, crowd_cnt int, crowd_brier float, model_brier_c float)
language sql stable security definer set search_path=public as $$
  with base as (
    select model_version mv, league lg, hit h, outcome oc,
      ai__s(p_home) ph, coalesce(ai__s(p_draw),0) pd, ai__s(p_away) pa,
      crowd_home chh, crowd_draw cdd, crowd_away caa, coalesce(crowd_n,0) cn
    from predictions where settled_at is not null and coalesce(void,false)=false and outcome is not null),
  sc as (
    select mv, lg, h, cn,
      power(ph-(oc='home')::int,2)+power(pd-(oc='draw')::int,2)+power(pa-(oc='away')::int,2) bm,
      -ln(greatest(1e-6, case oc when 'home' then ph when 'draw' then pd else pa end)) ll,
      case when cn>0 and chh is not null then
        power(chh-(oc='home')::int,2)+power(coalesce(cdd,0)-(oc='draw')::int,2)+power(coalesce(caa,0)-(oc='away')::int,2) end bc
    from base),
  u as (select 'version'::text g, coalesce(mv,'?') kk, * from sc union all select 'league', coalesce(lg,'?'), * from sc)
  select g, kk, count(*)::int, count(*) filter (where h)::int, avg(bm), avg(ll),
    count(bc)::int, avg(bc), avg(bm) filter (where bc is not null)
  from u group by g, kk order by g, count(*) desc $$;

create or replace function public.ai_calibration(p_version text default null)
returns table(bin int, said float, happened float, n int)
language sql stable security definer set search_path=public as $$
  with b as (select ai__s(p_home) ph, ai__s(p_draw) pd, ai__s(p_away) pa, outcome oc from predictions
    where settled_at is not null and coalesce(void,false)=false and outcome is not null
      and (p_version is null or model_version=p_version)),
  x as (select ph p, (oc='home')::int y from b union all select pd, (oc='draw')::int from b where pd is not null
        union all select pa, (oc='away')::int from b),
  g as (select least(9, floor(p*10))::int bb, p, y from x where p is not null)
  select s.i, coalesce(avg(g.p),0), coalesce(avg(g.y),0), count(g.p)::int
  from generate_series(0,9) s(i) left join g on g.bb=s.i group by s.i order by s.i $$;

create or replace function public.ai_worst(p_limit int default 8)
returns table(match_id text, league text, kickoff timestamptz, home text, away text, pick text, outcome text, prob float,
  home_logo text, away_logo text, score_h int, score_a int, slug text)
language sql stable security definer set search_path=public as $$
  select q.match_id::text, q.league, q.kickoff, q.home, q.away, q.pk, q.outcome, q.pr, m.home_logo, m.away_logo, m.score_h::int, m.score_a::int, m.slug
  from (select p.match_id, p.league, p.kickoff, p.home, p.away, p.outcome,
      case when ai__s(p.p_home)>=greatest(coalesce(ai__s(p.p_draw),0),ai__s(p.p_away)) then 'home'
           when ai__s(p.p_away)>=coalesce(ai__s(p.p_draw),0) then 'away' else 'draw' end pk,
      greatest(ai__s(p.p_home),coalesce(ai__s(p.p_draw),0),ai__s(p.p_away)) pr
    from predictions p where p.settled_at is not null and coalesce(p.void,false)=false and p.outcome is not null) q
  left join matches m on m.eid::text=q.match_id::text
  where q.pk<>q.outcome order by q.pr desc limit greatest(1,least(coalesce(p_limit,8),30)) $$;

grant execute on function public.ai_summary() to service_role;
grant execute on function public.ai_calibration(text) to service_role;
grant execute on function public.ai_worst(int) to service_role;
notify pgrst, 'reload schema';
