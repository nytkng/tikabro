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
