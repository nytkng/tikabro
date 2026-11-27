create or replace function public.hadaf_learn(p_limit int default 3000) returns int
language plpgsql security definer set search_path=public as $$
declare m record; kh text; ka text; rh float; ra float; adv float; e float; s float; k float; mult float; cnt int:=0;
begin
  for m in select * from matches where state='post' and not coalesce(processed,false) and score_h is not null and score_a is not null
           and home_id is not null and away_id is not null order by kickoff limit p_limit loop
    kh:=m.sport||':'||m.home_id; ka:=m.sport||':'||m.away_id;
    insert into team_ratings(key,sport,team) values(kh,m.sport,m.home),(ka,m.sport,m.away) on conflict(key) do nothing;
    select elo into rh from team_ratings where key=kh; select elo into ra from team_ratings where key=ka;
    adv:=case m.sport when 'soccer' then 65 when 'basketball' then 70 when 'football' then 55 else 35 end;
    k:=case m.sport when 'soccer' then 22 when 'basketball' then 18 when 'football' then 25 else 12 end;
    e:=1/(1+power(10,(ra-rh-adv)/400.0));
    s:=case when m.score_h>m.score_a then 1 when m.score_h<m.score_a then 0 else 0.5 end;
    mult:=case when m.sport='soccer' then ln(abs(m.score_h-m.score_a)+1)+1 else least(2.0,ln(abs(m.score_h-m.score_a)+1)/2+0.6) end;
    update team_ratings set elo=elo+k*mult*(s-e),n=team_ratings.n+1,updated_at=now() where key=kh;
    update team_ratings set elo=elo-k*mult*(s-e),n=team_ratings.n+1,updated_at=now() where key=ka;
    update matches set processed=true where id=m.id;
    cnt:=cnt+1;
  end loop;
  return cnt;
end $$;

select cron.schedule('hadaf-backfill','*/2 * * * *',$$select public.hadaf_backfill()$$);
select cron.schedule('hadaf-learn','*/10 * * * *',$$select public.hadaf_learn()$$);
select cron.schedule('hadaf-tune','23 3 * * *',$$select public.hadaf_tune()$$);
notify pgrst, 'reload schema';
select public.hadaf_learn() as learned;
