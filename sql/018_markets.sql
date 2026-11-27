-- 018: Dixon-Coles لكل الدوريات من نتائجنا + أسواق BTTS/Over2.5 مختومة ومحسومة
create index if not exists matches_home_post on public.matches(sport,home_id,kickoff desc) where state='post';
create index if not exists matches_away_post on public.matches(sport,away_id,kickoff desc) where state='post';

create or replace function public.team_goals(p_sport text, p_team text, p_n int default 12)
returns table(gp int, gf int, ga int, home_gf int, home_ga int, away_gf int, away_ga int)
language sql stable security definer set search_path=public as $$
  with r as (
    select (x.home_id=p_team) is_home,
           case when x.home_id=p_team then x.score_h else x.score_a end f,
           case when x.home_id=p_team then x.score_a else x.score_h end a
    from matches x
    where x.sport=p_sport and x.state='post' and x.score_h is not null and x.score_a is not null
      and (x.home_id=p_team or x.away_id=p_team)
    order by x.kickoff desc limit greatest(p_n,1))
  select count(*)::int, coalesce(sum(f),0)::int, coalesce(sum(a),0)::int,
         coalesce(sum(f) filter(where is_home),0)::int, coalesce(sum(a) filter(where is_home),0)::int,
         coalesce(sum(f) filter(where not is_home),0)::int, coalesce(sum(a) filter(where not is_home),0)::int
  from r $$;

create or replace function public.league_goal_avg(p_slug text) returns real
language sql stable security definer set search_path=public as $$
  select coalesce(case when count(*)>=10 then (avg(x.score_h+x.score_a)/2.0)::real end,1.35::real)
  from matches x where x.sport='soccer' and x.slug=p_slug and x.state='post'
    and x.score_h is not null and x.score_a is not null and x.kickoff>now()-interval '90 days' $$;

create table if not exists public.prediction_markets(
  match_id text primary key, p_btts real not null, p_over25 real not null,
  created_at timestamptz default now(), btts_hit boolean, over25_hit boolean, settled_at timestamptz);
alter table public.prediction_markets enable row level security;
revoke all on public.prediction_markets from anon, authenticated;
grant all on public.prediction_markets to service_role;

-- يختم الأسواق قبل الانطلاق فقط (insert مرة وحدة، بلا تحديث بعدين)
create or replace function public.hadaf_seal_markets() returns int
language plpgsql security definer set search_path=public as $$
declare r record; hg record; ag record; lg real; k constant real:=12; ha constant real:=1.15;
  v_lh real; v_la real; v_t real; n int:=0;
begin
  for r in select p.match_id, x.home_id hid, x.away_id aid, x.slug sl
    from predictions p join matches x on x.eid=p.match_id and x.sport='soccer'
    where p.created_at>now()-interval '2 hours' and x.kickoff>now()
      and x.home_id is not null and x.away_id is not null
      and not exists(select 1 from prediction_markets q where q.match_id=p.match_id) loop
    select * into hg from team_goals('soccer',r.hid,12);
    select * into ag from team_goals('soccer',r.aid,12);
    continue when hg.gp<5 or ag.gp<5;
    lg:=league_goal_avg(r.sl);
    v_lh:=greatest(0.2, lg*((hg.gf+k*lg)/(hg.gp+k)/lg)*((ag.ga+k*lg)/(ag.gp+k)/lg)*ha);
    v_la:=greatest(0.2, lg*((ag.gf+k*lg)/(ag.gp+k)/lg)*((hg.ga+k*lg)/(hg.gp+k)/lg)/ha);
    v_t:=v_lh+v_la;
    insert into prediction_markets(match_id,p_btts,p_over25)
    values(r.match_id,(1-exp(-v_lh))*(1-exp(-v_la)),1-exp(-v_t)*(1+v_t+v_t*v_t/2))
    on conflict (match_id) do nothing;
    n:=n+1;
  end loop;
  return n;
end $$;

create or replace function public.hadaf_settle_markets() returns int
language plpgsql security definer set search_path=public as $$
declare n int;
begin
  update prediction_markets q set btts_hit=(x.score_h>0 and x.score_a>0),
    over25_hit=(x.score_h+x.score_a>2), settled_at=now()
  from matches x where x.eid=q.match_id and x.sport='soccer' and q.settled_at is null
    and x.state='post' and x.score_h is not null and x.score_a is not null;
  get diagnostics n=row_count; return n;
end $$;

create or replace function public.ai_markets_summary()
returns table(market text, n int, hit_rate real, brier real)
language sql stable security definer set search_path=public as $$
  select 'btts', count(*)::int,
    avg(case when (q.p_btts>=0.5)=q.btts_hit then 1 else 0 end)::real,
    avg(power(q.p_btts-case when q.btts_hit then 1 else 0 end,2))::real
  from prediction_markets q where q.settled_at is not null
  union all
  select 'over25', count(*)::int,
    avg(case when (q.p_over25>=0.5)=q.over25_hit then 1 else 0 end)::real,
    avg(power(q.p_over25-case when q.over25_hit then 1 else 0 end,2))::real
  from prediction_markets q where q.settled_at is not null $$;

revoke all on function public.team_goals(text,text,int), public.league_goal_avg(text),
  public.hadaf_seal_markets(), public.hadaf_settle_markets(), public.ai_markets_summary() from public, anon, authenticated;
grant execute on function public.team_goals(text,text,int), public.league_goal_avg(text),
  public.hadaf_seal_markets(), public.hadaf_settle_markets(), public.ai_markets_summary() to service_role;

select cron.unschedule('hadaf-markets') where exists(select 1 from cron.job where jobname='hadaf-markets');
select cron.schedule('hadaf-markets','*/10 * * * *',$$select public.hadaf_seal_markets(); select public.hadaf_settle_markets()$$);

notify pgrst, 'reload schema';
select public.hadaf_seal_markets() sealed, public.hadaf_settle_markets() settled;
