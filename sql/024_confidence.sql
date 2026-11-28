-- 024: شحال راك متأكد؟ اللاعب يعطي نسبة (55..95) لاختيارو. تتحسب بـ Brier بعد المباراة.
create table if not exists public.pick_conf(player_id text, match_id text, conf int not null check(conf between 50 and 99), set_at timestamptz default now(), primary key(player_id,match_id));
alter table public.pick_conf enable row level security;
grant all on public.pick_conf to service_role;

-- ما نقبلوش النسبة إلا كي يكون عندك اختيار، وقبل ما تبدا المباراة
create or replace function public.set_conf(p_player text, p_match text, p_conf int) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if p_conf<50 or p_conf>99 then raise exception 'bad conf'; end if;
  if not exists(select 1 from picks where player_id::text=p_player and match_id=p_match) then raise exception 'pick first'; end if;
  if exists(select 1 from matches where eid=p_match and (state<>'pre' or kickoff<=now())) then raise exception 'started'; end if;
  insert into pick_conf(player_id,match_id,conf) values(p_player,p_match,p_conf)
    on conflict(player_id,match_id) do update set conf=excluded.conf,set_at=now();
  return true;
end $$;

-- الترتيب: Brier تاع النسبة (كل ما يصغر خير). 0.25 = كيما واحد يقول 50% ديما.
create or replace function public.conf_board(p_since timestamptz default now()-interval '30 days', p_min int default 5, p_limit int default 20)
returns table(nick text, n int, brier float, avg_conf float, hit_rate float)
language sql stable security definer set search_path=public as $$
  select pl.nick, count(*)::int,
    round(avg(power(c.conf/100.0-(case when k.hit then 1 else 0 end),2))::numeric,3)::float,
    round(avg(c.conf)::numeric,0)::float,
    round((100*avg(case when k.hit then 1.0 else 0.0 end))::numeric,0)::float
  from pick_conf c join picks k on k.player_id::text=c.player_id and k.match_id=c.match_id join players pl on pl.id::text=c.player_id
  where k.settled_at>=p_since and k.hit is not null and not coalesce(k.void,false)
  group by pl.nick having count(*)>=p_min order by 3 asc, 2 desc limit p_limit
$$;
grant execute on function public.set_conf(text,text,int), public.conf_board(timestamptz,int,int) to service_role;
notify pgrst,'reload schema';
select 'ok' as status;
