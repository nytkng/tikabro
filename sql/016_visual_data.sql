-- 016: بيانات الرسومات (تاريخ الاحتمالات، الفورمة، إحصائيات الفريق، نسبة Elo). الصق مرة واحدة.
-- 1) تاريخ تحرك التوقع
create table if not exists public.prob_history(
  match_id text not null, at timestamptz not null default now(),
  ph real, pd real, pa real, primary key(match_id, at));
alter table public.prob_history enable row level security;
grant select, insert, update, delete on public.prob_history to service_role;

create or replace function public.hadaf_prob_snapshot() returns int language plpgsql security definer set search_path=public as $$
declare v_m record; v_r record; v_n int:=0;
begin
  for v_m in select id from matches
    where kickoff between now() and now()+interval '72 hours'
      and coalesce(state,'pre')='pre'
      and sport in ('soccer','basketball','hockey','football','baseball','rugby')
    order by kickoff limit 1500
  loop
    begin
      select * into v_r from hadaf_probs(v_m.id);
      if v_r.ph is not null then
        insert into prob_history(match_id,at,ph,pd,pa) values(v_m.id,date_trunc('minute',now()),v_r.ph,v_r.pd,v_r.pa)
        on conflict do nothing;
        v_n:=v_n+1;
      end if;
    exception when others then null;
    end;
  end loop;
  delete from prob_history where at < now()-interval '30 days';
  return v_n;
end $$;

-- 2) الفورمة قبل كل ماتش (آخر 5 نتائج)
alter table public.matches add column if not exists home_form text;
alter table public.matches add column if not exists away_form text;

create or replace function public.hadaf_team_form(p_sport text, p_team text, p_before timestamptz) returns text
language sql stable set search_path=public as $$
  select string_agg(r, '' order by k desc) from (
    select x.kickoff k,
      case when gf>ga then 'W' when gf<ga then 'L' else 'D' end r
    from (
      select kickoff, case when home_id=p_team then score_h else score_a end gf,
                      case when home_id=p_team then score_a else score_h end ga
      from matches
      where sport=p_sport and state='post' and score_h is not null and score_a is not null
        and (home_id=p_team or away_id=p_team) and kickoff < p_before
      order by kickoff desc limit 5) x) y
$$;

create or replace function public.hadaf_form_refresh() returns int language plpgsql security definer set search_path=public as $$
declare v_m record; v_n int:=0;
begin
  for v_m in select id, sport, home_id, away_id, kickoff from matches
    where kickoff between now()-interval '2 days' and now()+interval '3 days'
      and home_id is not null and away_id is not null
  loop
    begin
      update matches set home_form=hadaf_team_form(v_m.sport,v_m.home_id,v_m.kickoff),
                         away_form=hadaf_team_form(v_m.sport,v_m.away_id,v_m.kickoff)
      where id=v_m.id;
      v_n:=v_n+1;
    exception when others then null;
    end;
  end loop;
  return v_n;
end $$;

-- 3) آخر 10 نتائج لفريق (للرادار والموجة)
create or replace function public.team_stats(p_sport text, p_team text)
returns table(kickoff timestamptz, opponent text, opp_id text, at_home boolean, gf int, ga int, result text)
language sql stable security definer set search_path=public as $$
  select m.kickoff,
    case when m.home_id=p_team then m.away else m.home end,
    case when m.home_id=p_team then m.away_id else m.home_id end,
    m.home_id=p_team,
    (case when m.home_id=p_team then m.score_h else m.score_a end)::int,
    (case when m.home_id=p_team then m.score_a else m.score_h end)::int,
    case when (case when m.home_id=p_team then m.score_h-m.score_a else m.score_a-m.score_h end)>0 then 'W'
         when m.score_h=m.score_a then 'D' else 'L' end
  from matches m
  where m.sport=p_sport and m.state='post' and m.score_h is not null and m.score_a is not null
    and (m.home_id=p_team or m.away_id=p_team)
  order by m.kickoff desc limit 10
$$;

-- 4) نسبة Elo داخل الرياضة (0..100)
create or replace function public.sport_elo_percentile(p_sport text, p_elo float) returns float
language sql stable security definer set search_path=public as $$
  select case when count(*)=0 then null else round((100.0*count(*) filter (where elo < p_elo)/count(*))::numeric,1)::float end
  from team_ratings where sport=p_sport and n>=3
$$;

grant execute on function public.hadaf_prob_snapshot() to service_role;
grant execute on function public.hadaf_form_refresh() to service_role;
grant execute on function public.hadaf_team_form(text,text,timestamptz) to service_role;
grant execute on function public.team_stats(text,text) to service_role;
grant execute on function public.sport_elo_percentile(text,float) to service_role;
revoke execute on function public.team_stats(text,text) from anon, authenticated;
revoke execute on function public.sport_elo_percentile(text,float) from anon, authenticated;
create index if not exists matches_home_post_idx on public.matches(sport, home_id, kickoff desc) where state='post';
create index if not exists matches_away_post_idx on public.matches(sport, away_id, kickoff desc) where state='post';

select cron.schedule('hadaf-prob-history','7 * * * *',$$select public.hadaf_prob_snapshot()$$);
select cron.schedule('hadaf-form','*/30 * * * *',$$select public.hadaf_form_refresh()$$);

notify pgrst, 'reload schema';
select public.hadaf_form_refresh();
select public.hadaf_prob_snapshot();
