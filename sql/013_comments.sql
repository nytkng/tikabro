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
