-- لصقة وحدة: الأمان + مصدر ثاني + النقاش

-- ===== 010_security =====
-- 010: حدّ الطلبات (rate limiting) بدون خدمات مدفوعة
create table if not exists public.rate_hits(key text not null, at timestamptz not null default now());
create index if not exists rate_hits_key_at on public.rate_hits(key, at);
alter table public.rate_hits enable row level security;
revoke all on public.rate_hits from anon, authenticated;
grant all on public.rate_hits to service_role;

create or replace function public.hit_rate(p_key text, p_window_seconds int, p_max int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into rate_hits(key) values (p_key);
  select count(*) into n from rate_hits where key = p_key and at > now() - make_interval(secs => p_window_seconds);
  if random() < 0.01 then delete from rate_hits where at < now() - interval '1 day'; end if;
  return n <= p_max;
end $$;
revoke all on function public.hit_rate(text,int,int) from public, anon, authenticated;
grant execute on function public.hit_rate(text,int,int) to service_role;

-- ===== 011_more_sources =====
-- مصدر ثاني مجاني: TheSportsDB (مفتاح التجربة 123). يزيد بطولات ما يغطيهاش ESPN (اليورو ليغ، كرة اليد، الطائرة...).
-- تنبيه: المفتاح المجاني يرجّع 3 مباريات برك لكل eventsday (تأكدنا 2026-11-27)، و30 طلب/دقيقة، وبلا livescore.
-- باش تكون التغطية حقيقية لازم مفتاح Patreon: بدّل tsdb_conf.api_key وخلاص.
-- eid = '9' || lpad(idEvent,9,'0') => 10 أرقام تبدا بـ 9، ESPN عندو 9 أرقام => ما يتصادموش أبداً.

create table if not exists public.tsdb_conf(id int primary key default 1 check (id=1), api_key text not null default '123');
insert into public.tsdb_conf(id) values(1) on conflict do nothing;
create table if not exists public.tsdb_sports(sport_param text primary key, our_sport text not null, enabled boolean not null default true);
insert into public.tsdb_sports(sport_param,our_sport) values
 ('Basketball','basketball'),('Soccer','soccer'),('Handball','handball'),('Volleyball','volleyball'),
 ('Ice_Hockey','hockey'),('Rugby','rugby'),('American_Football','football'),('Baseball','baseball')
on conflict do nothing;
create table if not exists public.tsdb_jobs(req_id bigint primary key, sport_param text, our_sport text, created timestamptz default now());

alter table public.tsdb_conf enable row level security;
alter table public.tsdb_sports enable row level security;
alter table public.tsdb_jobs enable row level security;
grant all on public.tsdb_conf, public.tsdb_sports, public.tsdb_jobs to service_role;

-- تطبيع الأسماء للمقارنة: حروف صغيرة، بلا لكنات، بلا كلمات زايدة، بلا رموز.
create or replace function public.hadaf_norm(p_name text) returns text
language sql immutable as $$
  select regexp_replace(
    regexp_replace(
      translate(lower(coalesce(p_name,'')),
        'áàâäãåāéèêëēíìîïīóòôöõøōúùûüūçñýÿšžğışł','aaaaaaaeeeeeiiiiiooooooouuuuucnyyszgisl'),
      '\m(fc|cf|sc|ac|afc|bc|kk|bk|hc|rc|cd|ud|sk|fk|club|basketball|basket|handball|volleyball|hockey|rugby|the|de|of)\M','','g'),
    '[^a-z0-9]','','g')
$$;

create or replace function public.hadaf_fetch_tsdb(p_days int[] default array[0,1]) returns int
language plpgsql security definer set search_path=public as $$
declare v_sp record; v_d int; v_n int:=0; v_ymd text; v_key text;
begin
  select api_key into v_key from tsdb_conf where id=1;
  for v_sp in select sport_param, our_sport from tsdb_sports where enabled order by sport_param loop
    foreach v_d in array p_days loop
      v_ymd:=to_char((now() at time zone 'UTC')::date+v_d,'YYYY-MM-DD');
      insert into tsdb_jobs(req_id,sport_param,our_sport) values(
        net.http_get(url:='https://www.thesportsdb.com/api/v1/json/'||coalesce(v_key,'123')||'/eventsday.php?d='||v_ymd||'&s='||v_sp.sport_param,
                     timeout_milliseconds:=25000),
        v_sp.sport_param, v_sp.our_sport);
      v_n:=v_n+1;
    end loop;
  end loop;
  return v_n;
end $$;

create or replace function public.hadaf_parse_tsdb() returns int
language plpgsql security definer set search_path=public as $$
declare j record; v_body jsonb; e jsonb; v_n int:=0; v_ko timestamptz; v_st text; v_raw text;
  v_h text; v_a text; v_nh text; v_na text; v_eid text; v_sh int; v_sa int;
begin
  for j in select t.req_id,t.sport_param,t.our_sport,r.status_code,r.content
           from tsdb_jobs t join net._http_response r on r.id=t.req_id loop
    begin
      if j.status_code=200 and j.content is not null and j.content<>'' then
        v_body:=j.content::jsonb;
        for e in select x from jsonb_array_elements(case when jsonb_typeof(v_body->'events')='array' then v_body->'events' else '[]'::jsonb end) x loop
          v_h:=nullif(e->>'strHomeTeam',''); v_a:=nullif(e->>'strAwayTeam','');
          continue when v_h is null or v_a is null or coalesce(e->>'idEvent','') !~ '^[0-9]+$';
          -- الوقت: strTimestamp (UTC) وإلا dateEvent + strTime
          v_ko:=null;
          begin
            if coalesce(e->>'strTimestamp','')<>'' then v_ko:=((e->>'strTimestamp')||'+00')::timestamptz;
            elsif coalesce(e->>'dateEvent','')<>'' then
              v_ko:=((e->>'dateEvent')||' '||coalesce(nullif(substr(e->>'strTime',1,8),''),'00:00:00')||'+00')::timestamptz;
            end if;
          exception when others then v_ko:=null; end;
          continue when v_ko is null;
          -- الحالة
          v_raw:=coalesce(nullif(trim(e->>'strStatus'),''),'NS');
          v_st:=case
            when lower(v_raw) in ('ns','not started','tbd','scheduled','time to be defined') then 'pre'
            when lower(v_raw) in ('pst','postponed','canc','cancelled','abd','abandoned','susp') then 'post'
            when lower(v_raw) in ('ft','aet','aot','ap','pen','fin','final','match finished','finished','ended','after over time','after extra time','after penalties')
              or lower(v_raw) like '%finished%' then 'post'
            else 'in' end;  -- 1H, 2H, HT, Q1..Q4, OT, P1.., LIVE ...
          if v_st='pre' and v_ko < now()-interval '6 hours' and e->>'intHomeScore' is not null then v_st:='post'; end if;
          v_sh:=case when v_st='pre' then null else nullif(e->>'intHomeScore','')::int end;
          v_sa:=case when v_st='pre' then null else nullif(e->>'intAwayScore','')::int end;
          v_eid:='9'||lpad(e->>'idEvent',9,'0');
          -- منع التكرار مع ESPN: نفس الرياضة، ±3 ساعات، أسماء متساوية أو وحدة داخل الأخرى
          v_nh:=hadaf_norm(v_h); v_na:=hadaf_norm(v_a);
          continue when length(v_nh)>=3 and length(v_na)>=3 and exists(
            select 1 from matches m
            where m.sport=j.our_sport and m.eid !~ '^9[0-9]{9,}$'
              and m.kickoff between v_ko-interval '3 hours' and v_ko+interval '3 hours'
              and ((hadaf_norm(m.home)=v_nh or strpos(hadaf_norm(m.home),v_nh)>0 or strpos(v_nh,hadaf_norm(m.home))>0)
               and (hadaf_norm(m.away)=v_na or strpos(hadaf_norm(m.away),v_na)>0 or strpos(v_na,hadaf_norm(m.away))>0)
               or (hadaf_norm(m.home)=v_na and hadaf_norm(m.away)=v_nh)));
          insert into matches(id,eid,sport,slug,league_id,league_name,league_logo,kickoff,state,detail,clock,
                              home,away,home_logo,away_logo,home_id,away_id,score_h,score_a,updated_at)
          values(j.our_sport||':'||v_eid, v_eid, j.our_sport, 'ts-'||coalesce(e->>'idLeague','0'), 'ts'||coalesce(e->>'idLeague','0'),
                 e->>'strLeague', nullif(e->>'strLeagueBadge',''), v_ko, v_st, v_raw, null,
                 v_h, v_a, nullif(e->>'strHomeTeamBadge',''), nullif(e->>'strAwayTeamBadge',''),
                 'ts'||coalesce(e->>'idHomeTeam',''), 'ts'||coalesce(e->>'idAwayTeam',''), v_sh, v_sa, now())
          on conflict(id) do update set league_name=excluded.league_name, league_logo=coalesce(excluded.league_logo,matches.league_logo),
            kickoff=excluded.kickoff, state=excluded.state, detail=excluded.detail, home=excluded.home, away=excluded.away,
            home_logo=coalesce(excluded.home_logo,matches.home_logo), away_logo=coalesce(excluded.away_logo,matches.away_logo),
            score_h=excluded.score_h, score_a=excluded.score_a, updated_at=now();
          v_n:=v_n+1;
        end loop;
      elsif j.status_code is not null and j.status_code<>200 then
        insert into feed_log(what) values('tsdb '||j.sport_param||': http '||j.status_code);
      end if;
    exception when others then insert into feed_log(what) values('tsdb '||j.sport_param||': '||sqlerrm);
    end;
    delete from tsdb_jobs where req_id=j.req_id;
    begin delete from net._http_response where id=j.req_id; exception when others then null; end;
  end loop;
  delete from tsdb_jobs where created<now()-interval '1 hour';
  return v_n;
end $$;

grant execute on function public.hadaf_fetch_tsdb(int[]), public.hadaf_parse_tsdb(), public.hadaf_norm(text) to service_role;

-- 8 رياضات × يومين = 16 طلب كل 15 دقيقة (تحت حد 30/دقيقة).
do $$ begin
  perform cron.unschedule('hadaf-tsdb-fetch'); exception when others then null; end $$;
do $$ begin
  perform cron.unschedule('hadaf-tsdb-parse'); exception when others then null; end $$;
select cron.schedule('hadaf-tsdb-fetch','*/15 * * * *',$$select public.hadaf_fetch_tsdb(array[0,1])$$);
select cron.schedule('hadaf-tsdb-parse','*/2 * * * *',$$select public.hadaf_parse_tsdb()$$);

notify pgrst, 'reload schema';
select public.hadaf_fetch_tsdb(array[0,1]) as requested;

-- ===== 013_comments =====
-- 013: النقاش تحت المباريات
alter table public.players add column if not exists created_at timestamptz not null default now();

create table if not exists public.comments(
  id bigserial primary key,
  match_id text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  reports int not null default 0
);
create index if not exists comments_match_idx on public.comments(match_id, created_at desc);

create table if not exists public.comment_reports(
  comment_id bigint not null references public.comments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id, player_id)
);

alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
revoke all on public.comments, public.comment_reports from anon, authenticated;
grant all on public.comments, public.comment_reports to service_role;
grant usage, select on sequence public.comments_id_seq to service_role;

create or replace function public.report_comment(p_comment bigint, p_player uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_n int;
begin
  insert into comment_reports(comment_id, player_id) values (p_comment, p_player) on conflict do nothing;
  if not found then return false; end if;
  update comments set reports=reports+1, hidden = hidden or (reports+1)>=3
   where id=p_comment returning reports into v_n;
  return v_n is not null;
end $$;
revoke all on function public.report_comment(bigint,uuid) from public, anon, authenticated;
grant execute on function public.report_comment(bigint,uuid) to service_role;

notify pgrst, 'reload schema';
