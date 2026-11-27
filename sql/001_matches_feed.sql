-- هدف: كل مباريات العالم في قاعدة البيانات. Postgres يجيب ويفكّ البيانات، والموقع يقرا صفوف صغيرة.
create table if not exists public.matches(
  id text primary key, eid text not null, sport text not null, slug text, league_id text, league_name text, league_logo text,
  kickoff timestamptz not null, state text, detail text, clock text,
  home text, away text, home_logo text, away_logo text, home_rec text, away_rec text, home_id text, away_id text,
  score_h int, score_a int, updated_at timestamptz default now());
create index if not exists matches_kickoff on public.matches(kickoff);
create index if not exists matches_eid on public.matches(eid);
create table if not exists public.leagues(id text primary key, slug text, name text, logo text, updated_at timestamptz default now());
create table if not exists public.feed_jobs(req_id bigint primary key, path text, kind text, created timestamptz default now());
create table if not exists public.feed_log(at timestamptz default now(), what text);
alter table public.matches enable row level security;
alter table public.leagues enable row level security;
alter table public.feed_jobs enable row level security;
alter table public.feed_log enable row level security;

create or replace function public.hadaf_fetch(p_days int[] default array[0]) returns int
language plpgsql security definer set search_path=public as $$
declare d int; p text; n int:=0; ymd text;
begin
  foreach p in array array['soccer/all','basketball/nba','basketball/wnba','hockey/nhl','football/nfl','baseball/mlb'] loop
    foreach d in array p_days loop
      ymd:=to_char((now() at time zone 'Africa/Algiers')::date+d,'YYYYMMDD');
      insert into feed_jobs(req_id,path,kind) values(
        net.http_get(url:='https://site.api.espn.com/apis/site/v2/sports/'||p||'/scoreboard?dates='||ymd||'&limit=1000',timeout_milliseconds:=25000),p,'board');
      n:=n+1;
    end loop;
  end loop;
  return n;
end $$;

create or replace function public.hadaf_fetch_leagues() returns void
language plpgsql security definer set search_path=public as $$
begin
  insert into feed_jobs(req_id,path,kind) values(
    net.http_get(url:='https://site.api.espn.com/apis/site/v2/leagues/dropdown?sport=soccer&limit=1000',timeout_milliseconds:=25000),'soccer','leagues');
end $$;

create or replace function public.hadaf_parse() returns int
language plpgsql security definer set search_path=public as $$
declare j record; body jsonb; e jsonb; c jsonb; h jsonb; a jsonb; lg jsonb; n int:=0; sp text; lid text; sl text; ln text; lo text;
begin
  for j in select f.req_id,f.path,f.kind,r.status_code,r.content from feed_jobs f join net._http_response r on r.id=f.req_id loop
    begin
      if j.status_code=200 then
        body:=j.content::jsonb;
        if j.kind='leagues' then
          insert into leagues(id,slug,name,logo)
            select x->>'id',x->>'slug',x->>'name',x->'logos'->0->>'href' from jsonb_array_elements(body->'leagues') x where x->>'id' is not null
            on conflict(id) do update set slug=excluded.slug,name=excluded.name,logo=excluded.logo,updated_at=now();
        else
          sp:=split_part(j.path,'/',1); lg:=body->'leagues'->0;
          for e in select x from jsonb_array_elements(coalesce(body->'events','[]'::jsonb)) x loop
            c:=e->'competitions'->0; h:=null; a:=null;
            select x into h from jsonb_array_elements(c->'competitors') x where x->>'homeAway'='home';
            select x into a from jsonb_array_elements(c->'competitors') x where x->>'homeAway'='away';
            continue when h is null or a is null;
            lid:=substring(e->>'uid' from 'l:([0-9]+)');
            if sp='soccer' then select l.slug,l.name,l.logo into sl,ln,lo from leagues l where l.id=lid;
            else sl:=lg->>'slug'; ln:=coalesce(lg->>'abbreviation',lg->>'name'); lo:=lg->'logos'->0->>'href'; end if;
            insert into matches(id,eid,sport,slug,league_id,league_name,league_logo,kickoff,state,detail,clock,home,away,home_logo,away_logo,home_rec,away_rec,home_id,away_id,score_h,score_a,updated_at)
            values(sp||':'||(e->>'id'),e->>'id',sp,coalesce(sl,'all'),lid,coalesce(ln,c->>'altGameNote'),lo,(e->>'date')::timestamptz,
              e->'status'->'type'->>'state',e->'status'->'type'->>'shortDetail',e->'status'->>'displayClock',
              h->'team'->>'displayName',a->'team'->>'displayName',h->'team'->>'logo',a->'team'->>'logo',
              h->'records'->0->>'summary',a->'records'->0->>'summary',h->'team'->>'id',a->'team'->>'id',
              case when e->'status'->'type'->>'state'='pre' then null else nullif(h->>'score','')::int end,
              case when e->'status'->'type'->>'state'='pre' then null else nullif(a->>'score','')::int end,now())
            on conflict(id) do update set slug=excluded.slug,league_id=excluded.league_id,league_name=excluded.league_name,league_logo=excluded.league_logo,
              kickoff=excluded.kickoff,state=excluded.state,detail=excluded.detail,clock=excluded.clock,home=excluded.home,away=excluded.away,
              home_logo=excluded.home_logo,away_logo=excluded.away_logo,home_rec=excluded.home_rec,away_rec=excluded.away_rec,home_id=excluded.home_id,away_id=excluded.away_id,
              score_h=excluded.score_h,score_a=excluded.score_a,updated_at=now();
            n:=n+1;
          end loop;
        end if;
      end if;
    exception when others then insert into feed_log(what) values('parse '||j.path||': '||sqlerrm);
    end;
    delete from feed_jobs where req_id=j.req_id;
    begin delete from net._http_response where id=j.req_id; exception when others then null; end;
  end loop;
  delete from feed_jobs where created<now()-interval '1 hour';
  delete from feed_log where at<now()-interval '3 days';
  return n;
end $$;

-- ختم الـ AI للدوريات الجديدة (الموقع القديم يختم الدوريات الكبار، ما نتعداوش عليهم)
create or replace function public.hadaf_strength(r text) returns float language sql immutable as $$
  select (coalesce(nullif(split_part(r,'-',1),'')::float,0)+0.4*case when array_length(string_to_array(r,'-'),1)>=3 then split_part(r,'-',2)::float else 0 end+2)
   /(coalesce(nullif(split_part(r,'-',1),'')::float,0)+case when array_length(string_to_array(r,'-'),1)>=3 then split_part(r,'-',2)::float+split_part(r,'-',3)::float else coalesce(nullif(split_part(r,'-',2),'')::float,0) end+4) $$;

create or replace function public.hadaf_seal() returns int
language plpgsql security definer set search_path=public as $$
declare m record; sh float; sa float; diff float; dr float; rest float; hh float; z float; p float; n int:=0;
begin
  for m in select * from matches x where x.state='pre' and x.kickoff between now()+interval '10 minutes' and now()+interval '6 hours'
      and x.home_rec ~ '^\d+(-\d+){1,2}$' and x.away_rec ~ '^\d+(-\d+){1,2}$'
      and coalesce(x.slug,'') not in ('eng.1','esp.1','ger.1','ita.1','fra.1','uefa.champions','caf.champions','nba')
      and not exists(select 1 from predictions q where q.match_id=x.eid) loop
    begin
      sh:=hadaf_strength(m.home_rec); sa:=hadaf_strength(m.away_rec);
      if m.sport='soccer' then
        diff:=sh+0.05-sa; dr:=greatest(0.16,0.30-abs(diff)*0.35); rest:=1-dr;
        hh:=least(greatest(rest*(0.5+diff*0.6),0.12),rest-0.12);
        insert into predictions(match_id,league,kickoff,home,away,p_home,p_draw,p_away,model_version)
          values(m.eid,m.slug,m.kickoff,m.home,m.away,round(hh::numeric,3),round(dr::numeric,3),round((rest-hh)::numeric,3),'v0-rec-sql');
      else
        z:=2.6*(sh-sa)+0.28; p:=least(0.92,greatest(0.08,1/(1+exp(-z))));
        insert into predictions(match_id,league,kickoff,home,away,p_home,p_draw,p_away,model_version)
          values(m.eid,m.slug,m.kickoff,m.home,m.away,round(p::numeric,3),0,round((1-p)::numeric,3),'v0-rec-sql');
      end if;
      n:=n+1;
    exception when others then insert into feed_log(what) values('seal '||m.eid||': '||sqlerrm);
    end;
  end loop;
  return n;
end $$;

-- الجدولة
select cron.schedule('hadaf-fetch-today','*/5 * * * *',$$select public.hadaf_fetch(array[0])$$);
select cron.schedule('hadaf-fetch-around','17 */2 * * *',$$select public.hadaf_fetch(array[-1,1])$$);
select cron.schedule('hadaf-parse','* * * * *',$$select public.hadaf_parse(); select public.hadaf_seal();$$);
select cron.schedule('hadaf-leagues','11 4 * * *',$$select public.hadaf_fetch_leagues()$$);
select public.hadaf_fetch_leagues();
select public.hadaf_fetch(array[-1,0,1]);
