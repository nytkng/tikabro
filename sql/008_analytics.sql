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
