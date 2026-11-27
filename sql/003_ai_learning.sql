-- هدف AI v2: يتعلّم وحدو من النتائج (Elo لكل فريق) ومن خبرة المستعملين (وزن الجمهور لكل دوري، يتحسب بـ Brier).
-- كلشي في Postgres، مفتوح المصدر، بلا أي خدمة مدفوعة.

alter table public.matches add column if not exists processed boolean default false;
create index if not exists matches_learn on public.matches(state,processed,kickoff);

create table if not exists public.team_ratings(key text primary key, sport text, team text, elo float not null default 1500, n int not null default 0, updated_at timestamptz default now());
create table if not exists public.model_weights(league text primary key, w_crowd float not null default 0, n int not null default 0,
  brier_model float, brier_crowd float, brier_blend float, updated_at timestamptz default now());
create table if not exists public.backfill_state(id int primary key default 1, next_day int not null default -1);
insert into public.backfill_state(id,next_day) values(1,-1) on conflict do nothing;
alter table public.team_ratings enable row level security;
alter table public.model_weights enable row level security;
alter table public.backfill_state enable row level security;
grant select, insert, update, delete on public.team_ratings, public.model_weights to service_role;

-- 1) التعلّم من النتائج: Elo مع أفضلية الأرض وفارق الأهداف
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

-- 2) الاحتمالات: Elo + سجل الموسم + الجمهور (بالوزن اللي تعلّمو النموذج لهذا الدوري)
create or replace function public.hadaf_probs(p_id text, out ph float, out pd float, out pa float, out crowd_n int, out ch float, out cd float, out ca float)
language plpgsql stable security definer set search_path=public as $$
declare m record; rh float; ra float; nh int; na int; adv float; diff float; pw float; sh float; sa float; d0 float; rest float; hh float;
  w float; eh float; ed float; ea float; wr float;
begin
  select * into m from matches where id=p_id;
  select elo,n into rh,nh from team_ratings where key=m.sport||':'||m.home_id;
  select elo,n into ra,na from team_ratings where key=m.sport||':'||m.away_id;
  rh:=coalesce(rh,1500); ra:=coalesce(ra,1500); nh:=coalesce(nh,0); na:=coalesce(na,0);
  adv:=case m.sport when 'soccer' then 65 when 'basketball' then 70 when 'football' then 55 else 35 end;
  diff:=rh+adv-ra; pw:=1/(1+power(10,-diff/400.0));
  if m.sport='soccer' then ed:=greatest(0.17,0.31-abs(diff)/1500.0); eh:=(1-ed)*pw; ea:=(1-ed)*(1-pw);
  else ed:=0; eh:=pw; ea:=1-pw; end if;
  -- نموذج السجل (v0) كمرجع ثاني
  if m.home_rec ~ '^\d+(-\d+){1,2}$' and m.away_rec ~ '^\d+(-\d+){1,2}$' then
    sh:=hadaf_strength(m.home_rec); sa:=hadaf_strength(m.away_rec);
    if m.sport='soccer' then d0:=greatest(0.16,0.30-abs(sh+0.05-sa)*0.35); rest:=1-d0; hh:=least(greatest(rest*(0.5+(sh+0.05-sa)*0.6),0.12),rest-0.12);
    else d0:=0; hh:=least(0.92,greatest(0.08,1/(1+exp(-(2.6*(sh-sa)+0.28))))); rest:=1; end if;
  else d0:=ed; hh:=eh; rest:=1-ed; end if;
  -- كلما عندنا تاريخ Elo أكثر، كلما نثقو فيه أكثر
  wr:=least(0.75,(least(nh,na))/40.0);
  ph:=wr*eh+(1-wr)*hh; pd:=wr*ed+(1-wr)*d0; pa:=1-ph-pd;
  -- خبرة المستعملين
  select count(*),count(*) filter(where pick='home'),count(*) filter(where pick='draw'),count(*) filter(where pick='away')
    into crowd_n,ch,cd,ca from picks where match_id=m.eid and not coalesce(void,false);
  if crowd_n>0 then
    if m.sport='soccer' then ch:=(ch+1)/(crowd_n+3); cd:=(cd+1)/(crowd_n+3); ca:=(ca+1)/(crowd_n+3);
    else ch:=(ch+1)/(crowd_n+2); cd:=0; ca:=(ca+1)/(crowd_n+2); end if;
    select w_crowd into w from model_weights where league=coalesce(m.slug,'all');
    w:=coalesce(w,0.15)*least(1,crowd_n/10.0);
    ph:=(1-w)*ph+w*ch; pd:=(1-w)*pd+w*cd; pa:=1-ph-pd;
  end if;
end $$;

-- 3) الختم: قبل البداية بـ 10 حتى 45 دقيقة (باش يدخل رأي الجمهور)، للدوريات اللي ما يختمهاش الموقع القديم
create or replace function public.hadaf_seal() returns int
language plpgsql security definer set search_path=public as $$
declare m record; r record; n int:=0; pk text; top float;
begin
  for m in select * from matches x where x.state='pre' and x.kickoff between now()+interval '10 minutes' and now()+interval '45 minutes'
      and coalesce(x.slug,'') not in ('eng.1','esp.1','ger.1','ita.1','fra.1','uefa.champions','caf.champions','nba')
      and not exists(select 1 from predictions q where q.match_id=x.eid) loop
    begin
      select * into r from hadaf_probs(m.id);
      top:=greatest(r.ph,r.pd,r.pa); pk:=case when top=r.ph then 'home' when top=r.pa then 'away' else 'draw' end;
      insert into predictions(match_id,league,kickoff,home,away,p_home,p_draw,p_away,pick,likely,confidence,model_version,crowd_home,crowd_draw,crowd_away,crowd_n)
        values(m.eid,m.slug,m.kickoff,m.home,m.away,round(r.ph::numeric,3),round(r.pd::numeric,3),round(r.pa::numeric,3),pk,
          case pk when 'home' then '1-0' when 'away' then '0-1' else '1-1' end,
          case when top>=0.6 then 'high' when top>=0.45 then 'medium' else 'low' end,'v2-elo-crowd',
          case when r.crowd_n>0 then round(r.ch::numeric,3) end,case when r.crowd_n>0 then round(r.cd::numeric,3) end,
          case when r.crowd_n>0 then round(r.ca::numeric,3) end,r.crowd_n);
      n:=n+1;
    exception when others then insert into feed_log(what) values('seal '||m.eid||': '||sqlerrm);
    end;
  end loop;
  return n;
end $$;

-- 4) التعلّم من المستعملين: لكل دوري، أي وزن للجمهور يعطي أحسن Brier على آخر 180 يوم؟
create or replace function public.hadaf_tune() returns int
language plpgsql security definer set search_path=public as $$
declare l record; best float; bw float; w float; b float; n int:=0;
begin
  for l in select league, count(*) c from predictions where settled_at is not null and not void and crowd_n>=3 and outcome is not null
           and settled_at>now()-interval '180 days' group by league having count(*)>=15 loop
    best:=null; bw:=0;
    foreach w in array array[0,0.1,0.2,0.3,0.4,0.5,0.6] loop
      select avg(power((1-w)*p_home+w*crowd_home-(outcome='home')::int,2)+power((1-w)*coalesce(p_draw,0)+w*coalesce(crowd_draw,0)-(outcome='draw')::int,2)
                +power((1-w)*p_away+w*crowd_away-(outcome='away')::int,2)) into b
        from predictions where league=l.league and settled_at is not null and not void and crowd_n>=3 and outcome is not null and settled_at>now()-interval '180 days';
      if best is null or b<best then best:=b; bw:=w; end if;
    end loop;
    insert into model_weights(league,w_crowd,n,brier_blend,updated_at) values(l.league,bw,l.c,best,now())
      on conflict(league) do update set w_crowd=excluded.w_crowd,n=excluded.n,brier_blend=excluded.brier_blend,updated_at=now();
    n:=n+1;
  end loop;
  return n;
end $$;

-- 5) ذاكرة: نجيبو نتائج 120 يوم فاتت (يوم كل دقيقتين) باش Elo يبدا بخبرة
create or replace function public.hadaf_backfill() returns int
language plpgsql security definer set search_path=public as $$
declare d int;
begin
  select next_day into d from backfill_state where id=1;
  if d < -120 then return 0; end if;
  perform hadaf_fetch(array[d]);
  update backfill_state set next_day=d-1 where id=1;
  return d;
end $$;

select cron.schedule('hadaf-backfill','*/2 * * * *',$$select public.hadaf_backfill()$$);
select cron.schedule('hadaf-learn','*/10 * * * *',$$select public.hadaf_learn()$$);
select cron.schedule('hadaf-tune','23 3 * * *',$$select public.hadaf_tune()$$);
notify pgrst, 'reload schema';
select public.hadaf_learn() as learned;
