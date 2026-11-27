-- التصويت السريع: بلا تسجيل، للايفات. الهوية = hash فقط.
create table if not exists public.polls(
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^\d{4}$'),
  match_id text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  closes_at timestamptz not null,
  closed boolean not null default false
);
create index if not exists polls_match_idx on public.polls(match_id, created_at desc);
create table if not exists public.poll_votes(
  poll_id uuid not null references public.polls(id) on delete cascade,
  voter_hash text not null,
  choice text not null check (choice in ('home','draw','away')),
  created_at timestamptz not null default now(),
  primary key(poll_id, voter_hash)
);
create or replace function public.poll_counts(p_poll uuid)
returns table(home bigint, draw bigint, away bigint) language sql stable security definer set search_path=public as $$
  select count(*) filter (where choice='home'), count(*) filter (where choice='draw'), count(*) filter (where choice='away')
  from public.poll_votes where poll_id=p_poll $$;
-- تصويت ذرّي: يرفض بعد الإغلاق وفوق 50k، ويسمح بتبديل الاختيار
create or replace function public.poll_vote(p_poll uuid, p_voter text, p_choice text)
returns text language plpgsql security definer set search_path=public as $$
declare p public.polls;
begin
  select * into p from public.polls where id=p_poll;
  if p.id is null then return 'missing'; end if;
  if p.closed or p.closes_at<=now() then return 'closed'; end if;
  if not exists(select 1 from public.poll_votes where poll_id=p_poll and voter_hash=p_voter)
     and (select count(*) from public.poll_votes where poll_id=p_poll)>=50000 then return 'full'; end if;
  insert into public.poll_votes(poll_id,voter_hash,choice) values(p_poll,p_voter,p_choice)
  on conflict (poll_id,voter_hash) do update set choice=excluded.choice, created_at=now();
  return 'ok';
end $$;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
grant all on public.polls, public.poll_votes to service_role;
revoke execute on function public.poll_counts(uuid), public.poll_vote(uuid,text,text) from public, anon, authenticated;
grant execute on function public.poll_counts(uuid), public.poll_vote(uuid,text,text) to service_role;
notify pgrst, 'reload schema';
