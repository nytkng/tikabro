# HADAF — Open-source upgrade plan (master prompt)

Use this file as the prompt for any agent working on HADAF. It lists only what is still missing, using real, free, open sources that fit the current stack (Next.js 16 on Cloudflare Workers free tier, Supabase Postgres + pg_cron + pg_net, no paid APIs, no betting).

## Hard rules
- Free forever, zero spend. No Stripe, no odds, no betting logs, no bookmaker data.
- Every prediction is sealed before kickoff in the hash-chained ledger. Never edit a sealed row.
- Arabic first, then French and English. Every new string goes in `lib/i18n.ts` in all three.
- Workers limits: 10 ms CPU, 50 subrequests per request. Heavy work runs in Postgres (pg_cron) or offline in GitHub, never in a page request.
- Secrets stay server-side. New SQL files go in `sql/NNN_name.sql`, grant to `service_role`, end with `notify pgrst,'reload schema'`.
- No player photos, no club logos we host ourselves (we only link the source's URL).

## Open sources to use (all verified on GitHub)
| Source | What it gives | License | Use in HADAF |
|---|---|---|---|
| github.com/openfootball/football.json | Fixtures and results for top European leagues, many seasons, JSON | Public domain (CC0) | Backfill seasons of results so Elo and Dixon-Coles start with history, not 120 days |
| github.com/openfootball/leagues, /world-cup.json, /euro | Cups, Champions League, World Cups, Euros | CC0 | History for international and cup models |
| github.com/statsbomb/open-data | Shot-level event data with x/y | Free, non-commercial, credit StatsBomb | Train an open xG model offline (logistic regression on distance + angle + body part + situation) |
| github.com/ML-KULeuven/soccer_xg | xG training pipeline (Python) | Open source | Reference for the xG pipeline |
| github.com/martineastwood/penaltyblog | Dixon-Coles, Bivariate Poisson, pi-ratings, RPS, Massey/Colley (MIT) | MIT | Validate our DC numbers offline; port RPS and pi-rating formulas |
| football-data.co.uk CSVs (via penaltyblog scrapers) | 25+ seasons of results for ~22 leagues | Free | Long backtests and calibration per league |

## Missing features, in build order

### 1. Long history backfill (biggest accuracy gain)
- GitHub Action (weekly, free) downloads openfootball JSON, normalises team names to ESPN ids via a mapping table `team_alias(source, name, espn_id)`, and writes `sql/seed_history.csv`.
- Postgres function `hadaf_import_history()` loads the CSV into `history_results` and replays Elo from the oldest season.
- Done when: team pages show "Elo since 2015", and Brier on the backtest is reported in /changelog.

### 2. Ranked Probability Score (RPS) next to Brier
- RPS is the standard score for ordered 3-way football forecasts (home/draw/away). Add it to `rpc/ai_summary` and the /ai page, per league and per model version.
- Done when: /ai shows Brier, Log loss and RPS, each with a one-line Darja explanation.

### 3. Open xG model
- Offline in a GitHub Action: train logistic xG on StatsBomb open data, export coefficients to `lib/xg.json` (a few numbers, no data copied).
- ESPN match summaries include shot coordinates for big leagues; compute match xG in the Worker from those coefficients (cheap: one multiply per shot).
- Show "xG 1.8 – 0.6" on finished matches and in the post-mortem card ("the AI was wrong, but xG agrees it should have won").
- Credit StatsBomb on /data as their terms require.

### 4. Pi-rating as a second team-strength model
- Pi-ratings (Constantinou & Fenton) separate home and away strength. Add `pi_home`, `pi_away` to `team_ratings`, update in `hadaf_learn`.
- Blend Elo + pi + crowd; tune weights nightly by Brier like the crowd weight today.

### 5. Calendar heatmap of AI accuracy
- GitHub-style grid: one square per day, colour = hit rate, size of sample in the tooltip. Pure SVG, server-rendered, on /ai.

### 6. Alert rules
- "Notify me when the AI is above 70% in a league I follow". Table `push_rules(endpoint, league, min_prob)`; `hadaf_seal` inserts into `push_queue` when a sealed prediction matches a rule. Reuses the Web Push pipeline already live.

### 7. Follow a team
- Same as follow-a-match, but `push_follows` gets a `team_key`; the trigger matches `home_id`/`away_id`.

### 8. Full history export
- `/api/v1/history.csv` streams every sealed + settled prediction with its ledger hash. CC BY 4.0. Paginated by month to stay under Workers limits.

### 9. New sports from ESPN (free)
- Cricket and Formula 1 have ESPN endpoints; add them to `ind_paths` / `feed_paths` only after checking the JSON shape, and give them Elo (cricket) or a finishing-order model (F1).

### 10. Professional polish
- Skeleton loaders on slow pages (team, league, AI).
- Error boundary per section: one failing widget never breaks the page.
- Keyboard and screen-reader pass on filters and tabs; never colour alone for right/wrong (icon + word).
- hreflang + locale URLs (/fr, /en) for SEO.
- Lighthouse 95+ on mobile 3G in low-data mode.

## What we deliberately do not build
- Paid tiers, Stripe, odds, betting slips, ROI against bookmakers.
- Rewriting the stack (React+Vite, D1). The current stack already does more, for free.
- Fake or "mock" predictions of any kind. If there is not enough data, the card says "no prediction".
