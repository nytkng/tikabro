-- دوريات الأصحاب: مجموعات خاصة بلا فلوس بلا جوائز
create table if not exists public.groups(
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  code text not null unique check (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$'),
  owner uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists groups_owner_idx on public.groups(owner);
create table if not exists public.group_members(
  group_id uuid not null references public.groups(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(group_id,player_id)
);
create index if not exists group_members_player_idx on public.group_members(player_id);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
grant select,insert,update,delete on public.groups,public.group_members to service_role;

create or replace function public.group_board(p_group uuid,p_since timestamptz)
returns table(nick text,n bigint,hits bigint,points numeric)
language sql stable security definer set search_path=public as $$
  select p.nick::text,count(k.*) as n,count(*) filter (where k.hit) as hits,coalesce(sum(k.points),0) as points
  from group_members gm
  join players p on p.id=gm.player_id
  join picks k on k.player_id=gm.player_id and k.settled_at is not null and k.settled_at>=p_since and not coalesce(k.void,false)
  where gm.group_id=p_group
  group by p.nick
  order by points desc,hits desc,n asc;
$$;
revoke all on function public.group_board(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.group_board(uuid,timestamptz) to service_role;
notify pgrst, 'reload schema';
