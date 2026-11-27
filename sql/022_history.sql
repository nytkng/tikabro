-- 022: تاريخ طويل للـ AI من openfootball (ملك عام، CC0). 11 موسم × 5 دوريات كبار.
-- يخدم وحدو: كل دقيقة يقرا الردود، وكي يكمل يعاود يحسب Elo من 2015، ومن بعد يحبس روحو.
create extension if not exists pg_trgm;

create table if not exists public.hist_jobs(req_id bigint primary key, league text, season text, done boolean default false, n int default 0);
create table if not exists public.hist_matches(league text, season text, d date, home text, away text, hg int, ag int, primary key(league,d,home,away));
create table if not exists public.team_alias(league text, src_name text, team_key text, espn_name text, sim float, primary key(league,src_name));
create table if not exists public.hist_state(id int primary key default 1, applied_at timestamptz, mapped int, unmapped int, replayed int, note text);
alter table public.hist_jobs enable row level security;
alter table public.hist_matches enable row level security;
alter table public.team_alias enable row level security;
alter table public.hist_state enable row level security;
grant all on public.hist_jobs, public.hist_matches, public.team_alias, public.hist_state to service_role;

-- اسم موحّد: حروف صغار، بلا FC/CF/AC، بلا رموز
create or replace function public.hadaf_norm(t text) returns text language sql immutable as $$
  select trim(regexp_replace(regexp_replace(lower(translate(coalesce(t,''),'áàâäãéèêëíìîïóòôöõúùûüñçÁÉÍÓÚÖÜ','aaaaaeeeeiiiiooooouuuuncaeiouou')),
    '\m(fc|cf|afc|ac|sc|ssc|as|ss|us|rc|cd|ud|sd|club|de|calcio|1\.|vfl|vfb|tsg|sv|fsv|bsc|ogc|stade|olympique|hove|albion)\M','','g'),'[^a-z0-9]+',' ','g'))
$$;

-- 1) نطلبو الملفات (55 طلب)
do $$
declare lg text; ss text; m text;
begin
  if exists(select 1 from hist_jobs) then return; end if;
  foreach lg in array array['en.1','es.1','de.1','it.1','fr.1'] loop
    foreach ss in array array['2015-16','2016-17','2017-18','2018-19','2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26'] loop
      insert into hist_jobs(req_id,league,season) values(
        net.http_get(url:='https://raw.githubusercontent.com/openfootball/football.json/master/'||ss||'/'||lg||'.json',timeout_milliseconds:=30000),lg,ss);
    end loop;
  end loop;
end $$;

-- 2) كل دقيقة: نقراو الردود، وكي يكملو كامل نطبّقو
create or replace function public.hadaf_hist_tick() returns text
language plpgsql security definer set search_path=public as $$
declare j record; x jsonb; mm jsonb; hg int; ag int; left_ int; espn text; lg text; m record; best record; mapped int:=0; unm int:=0; rep int:=0; cutoff date;
begin
  for j in select h.req_id,h.league,h.season,r.status_code,r.content from hist_jobs h join net._http_response r on r.id=h.req_id where not h.done loop
    if j.status_code=200 then
      begin x:=j.content::jsonb; exception when others then x:=null; end;
      if x is not null then
        for mm in select * from jsonb_array_elements(coalesce(x->'matches','[]'::jsonb)) loop
          hg:=coalesce((mm->'score'->'ft'->>0)::int,(mm->>'score1')::int); ag:=coalesce((mm->'score'->'ft'->>1)::int,(mm->>'score2')::int);
          if hg is null or ag is null or mm->>'date' is null then continue; end if;
          insert into hist_matches values(j.league,j.season,(mm->>'date')::date,mm->>'team1',mm->>'team2',hg,ag) on conflict do nothing;
        end loop;
      end if;
    end if;
    update hist_jobs set done=true,n=(select count(*) from hist_matches where league=j.league and season=j.season) where req_id=j.req_id;
  end loop;
  select count(*) into left_ from hist_jobs where not done;
  if left_>0 then return 'waiting '||left_; end if;
  if exists(select 1 from hist_state where applied_at is not null) then return 'already applied'; end if;

  -- 3) نربطو أسماء openfootball بفرق ESPN (نفس الدوري، أقرب اسم)
  for lg,espn in select * from (values('en.1','eng.1'),('es.1','esp.1'),('de.1','ger.1'),('it.1','ita.1'),('fr.1','fra.1')) v(a,b) loop
    for m in select distinct n from (select home n from hist_matches where league=lg union select away from hist_matches where league=lg) q loop
      select t.key, t.nm, similarity(hadaf_norm(t.nm),hadaf_norm(m.n)) s into best from (
        select distinct 'soccer:'||home_id key, home nm from matches where slug=espn and home_id is not null
        union select distinct 'soccer:'||away_id, away from matches where slug=espn and away_id is not null) t
        order by similarity(hadaf_norm(t.nm),hadaf_norm(m.n)) desc limit 1;
      if best.key is not null and best.s>=0.45 then
        insert into team_alias values(lg,m.n,best.key,best.nm,best.s) on conflict(league,src_name) do update set team_key=excluded.team_key,espn_name=excluded.espn_name,sim=excluded.sim; mapped:=mapped+1;
      else unm:=unm+1; end if;
    end loop;
  end loop;

  -- 4) نعاودو نحسبو Elo: نبداو من 1500، التاريخ أولا، ومن بعد مباريات ESPN بالترتيب
  create temp table if not exists _r(key text primary key, elo float, n int, season text) on commit drop;
  delete from _r;
  select min(kickoff)::date into cutoff from matches where slug in ('eng.1','esp.1','ger.1','ita.1','fra.1') and state='post';
  for m in select h.*, a1.team_key kh, a2.team_key ka from hist_matches h
           join team_alias a1 on a1.league=h.league and a1.src_name=h.home
           join team_alias a2 on a2.league=h.league and a2.src_name=h.away
           where h.d < coalesce(cutoff,current_date) order by h.d loop
    insert into _r values(m.kh,1500,0,m.season),(m.ka,1500,0,m.season) on conflict do nothing;
    -- بداية موسم جديد: نرجعو التقييم شوية للوسط
    update _r set elo=1500+(elo-1500)*0.8,season=m.season where key in (m.kh,m.ka) and season<>m.season;
    declare rh float; ra float; e float; s float; k float:=22; mult float;
    begin
      select elo into rh from _r where key=m.kh; select elo into ra from _r where key=m.ka;
      e:=1/(1+power(10,(ra-rh-65)/400.0)); s:=case when m.hg>m.ag then 1 when m.hg<m.ag then 0 else 0.5 end;
      mult:=ln(abs(m.hg-m.ag)+1)+1;
      update _r set elo=elo+k*mult*(s-e),n=n+1 where key=m.kh;
      update _r set elo=elo-k*mult*(s-e),n=n+1 where key=m.ka;
    end;
    rep:=rep+1;
  end loop;

  -- نحطو التقييم التاريخي، ونخليو hadaf_learn يعاود يطبّق مباريات ESPN فوقو
  update team_ratings t set elo=r.elo, n=r.n, updated_at=now() from _r r where t.key=r.key;
  insert into team_ratings(key,sport,team,elo,n) select r.key,'soccer',a.espn_name,r.elo,r.n from _r r
    join lateral (select espn_name from team_alias where team_key=r.key limit 1) a on true on conflict(key) do nothing;
  update matches set processed=false where sport='soccer' and state='post'
    and ('soccer:'||home_id in (select key from _r) or 'soccer:'||away_id in (select key from _r));
  perform hadaf_learn(20000);

  insert into hist_state(id,applied_at,mapped,unmapped,replayed,note) values(1,now(),mapped,unm,rep,'openfootball 2015-2026')
    on conflict(id) do update set applied_at=now(),mapped=excluded.mapped,unmapped=excluded.unmapped,replayed=excluded.replayed;
  perform cron.unschedule('hadaf-hist');
  return 'applied: '||rep||' matches, '||mapped||' teams mapped, '||unm||' unmapped';
end $$;

select cron.schedule('hadaf-hist','* * * * *',$$select public.hadaf_hist_tick()$$);
notify pgrst,'reload schema';
select count(*) as requests_sent from hist_jobs;
