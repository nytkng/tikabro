-- 023: Peer score (فكرة Metaculus): شحال انت خير من الجمهور في نفس المباريات.
-- لكل مباراة: (1 إذا صبت، 0 إذا لا) ناقص (نسبة اللي صابو من كامل اللي توقعو فيها). المعدّل × 100.
-- موجب = تغلب الجمهور. صبت في مباراة غلط فيها الكل = نقاط كبار. صبت في مباراة صاب فيها الكل = تقريبا 0.
create or replace function public.peer_board(p_since timestamptz default now()-interval '30 days', p_min int default 5, p_limit int default 50)
returns table(nick text, n int, hits int, peer float, vs_ai float)
language sql stable security definer set search_path=public as $$
  with m as (
    select match_id, avg(case when hit then 1.0 else 0.0 end) crowd, count(*) c
    from picks where settled_at>=p_since and not coalesce(void,false) and hit is not null group by match_id having count(*)>=2),
  a as (select match_id, case when hit then 1.0 else 0.0 end ai from predictions where settled_at>=p_since and not coalesce(void,false) and hit is not null)
  select pl.nick, count(*)::int, sum(case when k.hit then 1 else 0 end)::int,
    round((100*avg((case when k.hit then 1.0 else 0.0 end)-m.crowd))::numeric,1)::float,
    round((100*avg((case when k.hit then 1.0 else 0.0 end)-a.ai) filter (where a.ai is not null))::numeric,1)::float
  from picks k join m on m.match_id=k.match_id join players pl on pl.id=k.player_id
  left join a on a.match_id=k.match_id
  where k.settled_at>=p_since and not coalesce(k.void,false) and k.hit is not null
  group by pl.nick having count(*)>=p_min
  order by 4 desc, 2 desc limit p_limit
$$;
grant execute on function public.peer_board(timestamptz,int,int) to service_role;
notify pgrst,'reload schema';
select * from public.peer_board(now()-interval '365 days',1,5);
