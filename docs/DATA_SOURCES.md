# HADAF data sources

Checked on 2026-11-27. Every fetch runs inside Postgres (pg_net + pg_cron). Each source has its own jobs table, so one parser never takes another source's responses.

## 1. ESPN site API (main source), sql/001, 004, 006
- URL: `https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard?dates=YYYYMMDD`
- Coverage: soccer (`soccer/all`), NBA, WNBA, NCAA, G League, NBL, NHL, PWHL, NFL, college football, MLB, NCAA women's volleyball, about 10 rugby competitions, rugby league and AFL. Live scores, clocks, team logos and team records.
- Limits: none published. No key needed.
- Terms: **unofficial and undocumented.** It is ESPN's internal API, which can change or block us at any time without notice. ESPN data and logos belong to ESPN and the leagues. Do not resell the raw data. Keep the request rate low.
- Gaps: EuroLeague, EuroCup, ACB, Turkish BSL, Arab basketball leagues, handball, volleyball outside US college, and many small soccer leagues.
- eid: about 9 digits, starting with 4 or 6.

## 2. TheSportsDB (second source), sql/011_more_sources.sql
- URL: `https://www.thesportsdb.com/api/v1/json/{key}/eventsday.php?d=YYYY-MM-DD&s={Sport}`
- Sports in `tsdb_sports`: Basketball, Soccer, Handball, Volleyball, Ice_Hockey, Rugby, American_Football, Baseball.
- The free key is `123`. We checked the free tier against the docs and a live call:
  - Rate limit: 30 requests/min. Going over returns HTTP 429, and requests work again after about a minute. Our job sends 8 sports × 2 days = 16 requests every 15 minutes.
  - **eventsday returns only 3 events per call on the free key** (premium returns 1500). The live call for Basketball on 2026-11-27 returned exactly 3 events, all from the FIBA World Cup qualifiers. On the free key this source is a sample, not real coverage.
  - **Livescores are premium only** (v2 endpoints). Free data can show scores late.
- To get real coverage, buy a premium key (Patreon supporter, a few USD a month) and run `update tsdb_conf set api_key='...'`. You don't need to change any code.
- Terms: community-built, crowd-sourced data, so names, times and statuses can be wrong or late. Badges are user-uploaded artwork. Credit TheSportsDB on the site ("Data: TheSportsDB.com"). Read their Terms of Use before any commercial use.
- Mapping: eid = `'9' || lpad(idEvent, 9, '0')`. That is 10 or more digits starting with 9, so it can never collide with ESPN ids. Other fields: slug `ts-{idLeague}`, league_id `ts{idLeague}`, home_id/away_id `ts{idTeam}`. The kickoff time comes from strTimestamp (UTC), or else from dateEvent + strTime.
- Duplicate check: an event is skipped when an ESPN row exists with the same sport, a kickoff within ±3 h, and matching home and away names. Names are compared after `hadaf_norm()`, which lowercases, removes accents, drops filler words (FC, BC, Basketball...) and drops symbols. Two names match when they are equal or one contains the other. A swapped home/away pair also counts.

## 3. Other free sources we evaluated
| Source | Key? | Notes |
|---|---|---|
| openfootball (`raw.githubusercontent.com/openfootball/football.json/master/2025-26/en.1.json`) | No | Public domain (CC0). Season fixture files for the big European leagues, with fields round/date/time/team1/team2/score (ft/ht). The score format is not the same in every file. Updated by hand, not live, so it fits only fixtures and archive data. Fetching it once a day would be enough. |
| football-data.org | **Free key (sign-up)** | Free tier: about 12 soccer competitions, 10 requests/min, delayed scores. Good for top-league standings. |
| API-Football (api-sports.io) | Free key | 100 requests/day on free, and the free tier only covers some seasons. Same company also runs API-Basketball, API-Handball and API-Volleyball, with the same free limits. |
| Sofascore / FlashScore | — | Unofficial private APIs, against their terms, and they block bots. **Do not use.** |

## Recommended next steps
1. Buy the TheSportsDB premium key. It is the cheapest way to get handball, volleyball and European/Arab basketball, and it unlocks livescores.
2. Add football-data.org with a free key for standings and as a second check on top soccer leagues.
3. Use openfootball once a day for fixtures and historical results, which can serve as AI training data.
4. Add a "source" column later if the UI should show per-source credits. For now, TheSportsDB rows can be told apart because their slug starts with `ts-`.
