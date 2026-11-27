# HADAF v2 — Master plan (starts at 0% on top of v1)

v1 status at 2026-11-27: about 65% of the original vision is live (see "Audit" below). v2 is a new plan that builds on v1, it does not rewrite it.

## Rules (unchanged)
Free forever, zero spend, no betting, no odds. Arabic first + FR + EN. Every prediction sealed before kickoff. Workers free tier limits. Heavy work in Postgres or GitHub Actions. No player photos.

## Audit of v1 (backup check)
Works: ESPN ingestion for 30+ sports paths, Elo + Dixon-Coles + crowd blend that tunes itself nightly, hash-chained ledger with daily roots and OpenTimestamps, Google login (hashed), crowd vs AI, stars from Wilson lower bound, groups, polls, creator/live mode, team pages, search, trust map, calibration, heatmap, RPS, post-mortems, low-data mode, Web Push, 3 languages, CSP and security headers, `npm audit` = 0 vulnerabilities.

Needs fixing:
1. CSP still allows `'unsafe-inline'` scripts. Move to nonces.
2. No automated security scanning in GitHub.
3. No automated tests or uptime checks; regressions are found by the user on his phone.
4. Old site (hadaf-ai.codewords.run) still seals the top leagues. Cut over and switch the old cron off.
5. No `sql/000_base.sql`: the database cannot be rebuilt from the repo alone.
6. Turnstile and PLAYER_SECRET not set (bot protection and stronger cookies).
7. Model history is only 120 days.

## Open-source references (GitHub)
| Project | Why it matters for HADAF |
|---|---|
| Metaculus (open source, rewritten for contributors) | Best-in-class scoring: peer score, baseline score, tournaments, track record pages |
| Metaculus/forecasting-tools (MIT) | Framework for AI forecasting bots; ideas for a bot league |
| Manifold (open source monorepo) | Leagues system, following forecasters, reputation, play money |
| Metaforecast (QURI) | Aggregating forecasts from many sources into one searchable view |
| penaltyblog (MIT) | Dixon-Coles, Bivariate Poisson, pi-ratings, RPS, Massey/Colley |
| openfootball (CC0) | Seasons of results for backfill |
| StatsBomb open-data | xG model training (credit StatsBomb) |
| Tremor (free, 300+ blocks) / shadcn charts / Recharts | Dashboard patterns: KPI rows, bar lists, trackers, spark charts |
| Semgrep CE, Gitleaks, OSV-Scanner, OWASP ZAP baseline, Dependabot | Free security pipeline |

## v2 workstreams

### A. Forecasting core (Metaculus-grade scoring) — 25%
1. Peer score: each player's log score minus the average log score of everyone who predicted the same match. Rewards beating the crowd, not just picking favourites.
2. Baseline score vs a uniform guess, per player and for the AI.
3. Probability picks: players can give a percentage (slider), not only home/draw/away. Scored with Brier and log score.
4. Track-record page per player: calibration chart, Brier, peer score, best leagues, streaks.
5. Stars v2: based on peer score with a Wilson-style confidence bound, plus badges (Calibrated, Upset hunter, 100 seals, League specialist).
6. Seasons and leagues (Manifold style): monthly divisions Bronze → Diamond, promotion and relegation by peer score.

### B. AI that learns more — 20%
1. Backfill 10+ seasons from openfootball; replay Elo from the start.
2. Pi-rating model and Bivariate Poisson; nightly weight tuning by RPS across Elo, pi, DC and crowd.
3. Open xG model from StatsBomb coefficients; xG shown on finished matches and used as a team-form signal.
4. AI bot league: several model versions predict in public; the best one by RPS becomes "the AI" each month.
5. Model card page: data, features, last retrain, scores, known weaknesses.

### C. Premium dashboard and style — 20%
Style "Pitch Ledger": dark graphite, one gold accent kept for sealed things only, semantic win/draw/loss colours, tabular numbers, 1px strokes, three surface levels. Borrow patterns, not code, from Tremor blocks.
1. Home KPI row: today's matches, live now, AI hit rate 30d, players active.
2. Tracker bars (Tremor-style) for AI form: 30 small blocks, one per day.
3. Bar lists for leagues by accuracy; spark charts on every team row.
4. Player dashboard (/me): my picks, my calibration, my peer score trend, my followed teams.
5. Skeleton loaders, error boundaries per widget, light theme option.

### D. Social and growth — 15%
1. Follow players; feed of their sealed picks after kickoff.
2. Group leagues with invite links and weekly winner card for TikTok/Instagram.
3. Embeddable widget: "HADAF AI vs crowd" for a match, for streamers and blogs.
4. Public API v1 with rate limits and CC BY 4.0 data.

### E. Security and reliability — 20%
1. GitHub Actions: Semgrep CE (p/security-audit, p/owasp-top-ten), Gitleaks, OSV-Scanner or `npm audit`, Dependabot weekly.
2. OWASP ZAP baseline scan of the live site weekly (passive, no attacks).
3. CSP with nonces; remove `'unsafe-inline'` scripts.
4. Turnstile on register, comments and polls; PLAYER_SECRET set.
5. UptimeRobot free on /api/health; Playwright smoke tests in CI on 5 key pages.
6. `sql/000_base.sql` full rebuild + weekly logical backup of key tables to a private GitHub release.

## Order of work
E1–E3 → B1 → A1–A4 → C1–C4 → B2–B3 → A5–A6 → D1–D4 → rest.

## What needs Tikabro
- Permission to add GitHub Actions workflows (security scans only, no database access).
- Cloudflare secrets: PLAYER_SECRET, Turnstile keys.
- A free UptimeRobot account.
