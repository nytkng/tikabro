-- 021: إشعارات مجانية (Web Push). الهاتف يتسجّل، ونبعثو "دقة" فارغة، والهاتف يجبد الرسالة بنفسو.
create table if not exists public.push_subs(endpoint text primary key, p256dh text, auth text, lang text default 'ar', created timestamptz default now());
create table if not exists public.push_follows(endpoint text references public.push_subs(endpoint) on delete cascade, match_id text, url text, created timestamptz default now(), primary key(endpoint,match_id));
create index if not exists push_follows_match on public.push_follows(match_id);
create table if not exists public.push_queue(id bigserial primary key, endpoint text references public.push_subs(endpoint) on delete cascade, title text, body text, url text, created timestamptz default now(), sent_at timestamptz, delivered_at timestamptz);
create index if not exists push_queue_pending on public.push_queue(endpoint) where delivered_at is null;
alter table public.push_subs enable row level security;
alter table public.push_follows enable row level security;
alter table public.push_queue enable row level security;
grant all on public.push_subs, public.push_follows, public.push_queue to service_role;
grant usage, select on sequence public.push_queue_id_seq to service_role;

create or replace function public.hadaf_push_trg() returns trigger
language plpgsql security definer set search_path=public as $$
declare f record; t text; b text; sc text;
begin
  if new.state is not distinct from old.state and new.score_h is not distinct from old.score_h and new.score_a is not distinct from old.score_a then return new; end if;
  sc:=coalesce(new.home,'')||' '||coalesce(new.score_h::text,'0')||' - '||coalesce(new.score_a::text,'0')||' '||coalesce(new.away,'');
  for f in select s.endpoint, s.lang, pf.url from push_follows pf join push_subs s on s.endpoint=pf.endpoint where pf.match_id=new.eid loop
    if new.state='in' and old.state is distinct from 'in' then
      t:=case f.lang when 'fr' then 'Coup d''envoi' when 'en' then 'Kick-off' else 'بدات المباراة' end;
    elsif new.state='post' and old.state is distinct from 'post' then
      t:=case f.lang when 'fr' then 'Fin du match' when 'en' then 'Full time' else 'كملت المباراة' end;
    elsif new.state='in' and (new.score_h is distinct from old.score_h or new.score_a is distinct from old.score_a) then
      t:=case f.lang when 'fr' then 'But !' when 'en' then 'Goal!' else 'هدف!' end;
    else continue; end if;
    insert into push_queue(endpoint,title,body,url) values(f.endpoint,t,sc,coalesce(f.url,'/'));
  end loop;
  return new;
end $$;
drop trigger if exists hadaf_push on public.matches;
create trigger hadaf_push after update on public.matches for each row execute function public.hadaf_push_trg();

-- تنظيف: الرسائل القديمة والمتابعات تاع مباريات كملت من 3 أيام
select cron.schedule('hadaf-push-clean','17 4 * * *',$$delete from public.push_queue where created<now()-interval '2 days'; delete from public.push_follows pf using public.matches m where m.eid=pf.match_id and m.state='post' and m.kickoff<now()-interval '3 days'$$);
-- كل دقيقة: الـ Worker يبعث الدقات (نفس سر hadaf-settle-new، منسوخ أوتوماتيكيا)
select cron.schedule('hadaf-push','* * * * *', replace((select command from cron.job where jobname='hadaf-settle-new'),'/api/settle','/api/push/send'));
notify pgrst,'reload schema';
select jobname, schedule from cron.job where jobname like 'hadaf-push%';
