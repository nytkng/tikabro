-- 1) نخلي الموقع يشوف الجداول الجداد
notify pgrst, 'reload schema';
-- 2) الختم يكتب عمود pick (وlikely وconfidence) كيما الموقع القديم
create or replace function public.hadaf_seal() returns int
language plpgsql security definer set search_path=public as $$
declare m record; sh float; sa float; diff float; dr float; rest float; hh float; ha float; z float; n int:=0; pk text; top float;
begin
  for m in select * from matches x where x.state='pre' and x.kickoff between now()+interval '10 minutes' and now()+interval '6 hours'
      and x.home_rec ~ '^\d+(-\d+){1,2}$' and x.away_rec ~ '^\d+(-\d+){1,2}$'
      and coalesce(x.slug,'') not in ('eng.1','esp.1','ger.1','ita.1','fra.1','uefa.champions','caf.champions','nba')
      and not exists(select 1 from predictions q where q.match_id=x.eid) loop
    begin
      sh:=hadaf_strength(m.home_rec); sa:=hadaf_strength(m.away_rec);
      if m.sport='soccer' then
        diff:=sh+0.05-sa; dr:=greatest(0.16,0.30-abs(diff)*0.35); rest:=1-dr;
        hh:=least(greatest(rest*(0.5+diff*0.6),0.12),rest-0.12); ha:=rest-hh;
      else
        z:=2.6*(sh-sa)+0.28; hh:=least(0.92,greatest(0.08,1/(1+exp(-z)))); dr:=0; ha:=1-hh;
      end if;
      top:=greatest(hh,dr,ha); pk:=case when top=hh then 'home' when top=ha then 'away' else 'draw' end;
      insert into predictions(match_id,league,kickoff,home,away,p_home,p_draw,p_away,pick,likely,confidence,model_version)
        values(m.eid,m.slug,m.kickoff,m.home,m.away,round(hh::numeric,3),round(dr::numeric,3),round(ha::numeric,3),pk,
          case pk when 'home' then '1-0' when 'away' then '0-1' else '1-1' end,
          case when top>=0.6 then 'high' when top>=0.45 then 'medium' else 'low' end,'v0-rec-sql');
      n:=n+1;
    exception when others then insert into feed_log(what) values('seal '||m.eid||': '||sqlerrm);
    end;
  end loop;
  return n;
end $$;
delete from feed_log;
select public.hadaf_seal() as sealed;
