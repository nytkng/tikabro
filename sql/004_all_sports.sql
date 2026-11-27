-- كل الرياضات الجماعية من المصدر: الكورة، السلة (NBA، الجامعات، G League، أستراليا)، الهوكي، الـ NFL والجامعات، البيسبول، الطائرة، الركبي (10 بطولات)، الركبي ليغ، الكرة الأسترالية.
-- قائمة المصادر ولّات جدول: نزيد رياضة جديدة بسطر واحد بلا ما نبدلو الكود.
create table if not exists public.feed_paths(path text primary key, enabled boolean not null default true);
alter table public.feed_paths enable row level security;
insert into public.feed_paths(path) values ('soccer/all'),('basketball/nba'),('basketball/wnba'),('basketball/mens-college-basketball'),('basketball/womens-college-basketball'),('basketball/nba-development'),('basketball/nbl'),('hockey/nhl'),('hockey/mens-college-hockey'),('hockey/womens-college-hockey'),('hockey/pwhl'),('football/nfl'),('football/college-football'),('baseball/mlb'),('volleyball/womens-college-volleyball'),('rugby/270559'),('rugby/267979'),('rugby/270557'),('rugby/271937'),('rugby/272073'),('rugby/180659'),('rugby/244293'),('rugby/242041'),('rugby/289234'),('rugby/289262'),('rugby-league/3'),('australian-football/afl') on conflict do nothing;

create or replace function public.hadaf_fetch(p_days int[] default array[0]) returns int
language plpgsql security definer set search_path=public as $$
declare d int; p text; n int:=0; ymd text;
begin
  for p in select path from feed_paths where enabled order by path loop
    foreach d in array p_days loop
      ymd:=to_char((now() at time zone 'Africa/Algiers')::date+d,'YYYYMMDD');
      insert into feed_jobs(req_id,path,kind) values(
        net.http_get(url:='https://site.api.espn.com/apis/site/v2/sports/'||p||'/scoreboard?dates='||ymd||'&limit=1000'||case when p like '%college-basketball' then '&groups=50' else '' end,timeout_milliseconds:=25000),p,'board');
      n:=n+1;
    end loop;
  end loop;
  return n;
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
            else sl:=split_part(j.path,'/',2); ln:=coalesce(lg->>'abbreviation',lg->>'name'); lo:=lg->'logos'->0->>'href'; end if;
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


notify pgrst, 'reload schema';
select public.hadaf_fetch(array[0,1]) as requested;
