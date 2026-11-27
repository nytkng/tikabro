-- 015: سجل التوقعات المتسلسل (tamper-evident ledger)
-- كل توقع جديد في predictions ينكتب نص قانوني (payload) ويتسلسل بالـ sha256 مع اللي قبلو.
-- أي تبديل في توقع قديم يكسر كل السلسلة من بعدو. الجذر اليومي يتختم خارجيا في OpenTimestamps (بيتكوين).
--
-- ملاحظة عن الختم الخارجي: net.http_post في pg_net يبعث body من نوع jsonb فقط، ما يقدرش يبعث 32 بايت خام
-- (application/octet-stream) اللي يطلبها كالندر OpenTimestamps. لذلك الختم يتم عبر مسار في الـ Worker:
-- /api/verify/anchor (محمي بـ CRON_SECRET) و pg_cron ينادي عليه بـ net.http_get (آخر الملف).

create extension if not exists pgcrypto;

create table if not exists public.ledger_entries(
  seq bigserial primary key,
  match_id text unique not null,
  payload text not null,
  entry_hash text not null,
  prev_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists ledger_entries_hash_idx on public.ledger_entries(entry_hash);
create index if not exists ledger_entries_created_idx on public.ledger_entries(created_at);

create table if not exists public.daily_roots(
  day date primary key,
  last_seq bigint,
  root_hash text,
  ots_request_id bigint,
  ots_proof text,          -- base64 لملف .ots (رد الكالندر)
  submitted_at timestamptz,
  proof_at timestamptz
);

-- النص القانوني: match_id|league|kickoff|home|away|p_home|p_draw|p_away|pick|model_version|created_at
create or replace function public.hadaf_ledger_payload(p public.predictions) returns text
language sql immutable as $$
  select concat_ws('|',
    coalesce(p.match_id,''),
    coalesce(p.league,''),
    coalesce(to_char(p.kickoff at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),''),
    coalesce(p.home,''),
    coalesce(p.away,''),
    coalesce(p.p_home::text,''),
    coalesce(p.p_draw::text,''),
    coalesce(p.p_away::text,''),
    coalesce(p.pick::text,''),
    coalesce(p.model_version,''),
    coalesce(to_char(p.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),''))
$$;

create or replace function public.hadaf_ledger_append(p public.predictions) returns void
language plpgsql security definer set search_path=public,extensions as $$
declare prev text; pl text;
begin
  perform pg_advisory_xact_lock(hashtext('hadaf_ledger'));
  if exists(select 1 from public.ledger_entries where match_id=p.match_id) then return; end if;
  select entry_hash into prev from public.ledger_entries order by seq desc limit 1;
  prev:=coalesce(prev,repeat('0',64));
  pl:=public.hadaf_ledger_payload(p);
  insert into public.ledger_entries(match_id,payload,entry_hash,prev_hash)
  values(p.match_id,pl,encode(sha256(convert_to(prev||'|'||pl,'UTF8')),'hex'),prev);
end $$;

create or replace function public.hadaf_ledger_trg() returns trigger
language plpgsql security definer set search_path=public as $$
begin perform public.hadaf_ledger_append(new); return new; end $$;

drop trigger if exists hadaf_ledger_ins on public.predictions;
create trigger hadaf_ledger_ins after insert on public.predictions
  for each row execute function public.hadaf_ledger_trg();

-- ممنوع التعديل والحذف
create or replace function public.hadaf_ledger_block() returns trigger
language plpgsql as $$
begin raise exception 'ledger_entries is append-only'; end $$;
drop trigger if exists hadaf_ledger_noupd on public.ledger_entries;
create trigger hadaf_ledger_noupd before update or delete on public.ledger_entries
  for each row execute function public.hadaf_ledger_block();
drop trigger if exists hadaf_ledger_notrunc on public.ledger_entries;
create trigger hadaf_ledger_notrunc before truncate on public.ledger_entries
  for each statement execute function public.hadaf_ledger_block();

-- تعبئة التوقعات الموجودة (بالترتيب)
do $$
declare r public.predictions;
begin
  for r in select * from public.predictions order by created_at, match_id loop
    perform public.hadaf_ledger_append(r);
  end loop;
end $$;

-- الجذر اليومي: آخر entry_hash حتى نهاية يوم البارح (توقيت الجزائر)
create or replace function public.hadaf_ledger_root(d date default ((now() at time zone 'Africa/Algiers')::date - 1))
returns text language plpgsql security definer set search_path=public as $$
declare s bigint; h text;
begin
  select seq,entry_hash into s,h from public.ledger_entries
   where created_at < ((d+1)::timestamp at time zone 'Africa/Algiers')
   order by seq desc limit 1;
  if h is null then return null; end if;
  insert into public.daily_roots(day,last_seq,root_hash) values(d,s,h)
  on conflict (day) do nothing;
  return h;
end $$;

alter table public.ledger_entries enable row level security;
alter table public.daily_roots enable row level security;
drop policy if exists ledger_read on public.ledger_entries;
create policy ledger_read on public.ledger_entries for select using (true);
drop policy if exists roots_read on public.daily_roots;
create policy roots_read on public.daily_roots for select using (true);
grant select on public.ledger_entries, public.daily_roots to anon, authenticated;
grant all on public.ledger_entries, public.daily_roots to service_role;
grant usage, select on sequence public.ledger_entries_seq_seq to service_role;
grant execute on function public.hadaf_ledger_root(date) to service_role;
-- service_role يقدر يكتب ots_proof في daily_roots (PATCH)؛ ledger_entries يبقى محمي بالتريغر حتى منو.

-- المهام اليومية (00:10 الجزائر = 23:10 UTC، الجزائر UTC+1 بلا توقيت صيفي)
select cron.unschedule('hadaf-ledger-root') where exists(select 1 from cron.job where jobname='hadaf-ledger-root');
select cron.schedule('hadaf-ledger-root','10 23 * * *',$$select public.hadaf_ledger_root()$$);

notify pgrst, 'reload schema';
