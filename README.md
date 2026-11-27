# هدف — HADAF

**توقعات رياضية مختومة، مجانية ومفتوحة المصدر، بلا رهان.** اختم توقعك قبل الماتش، شوف واش قال الجمهور وواش قال الـ AI، وابني سجلّك قدام الناس. لا دراهم، لا جوائز مالية، لا كوطات.

HADAF is a free, open-source, **no-betting** sports forecasting arena. Users seal picks before kickoff. An AI seals its probabilities with a verifiable SHA-256 fingerprint. After you pick, you see **You vs Crowd vs AI**.

- Vision: [`docs/VISION.md`](docs/VISION.md)
- Architecture, rules and roadmap for contributors and AI agents: [`docs/MASTER_PROMPT.md`](docs/MASTER_PROMPT.md)

## Features

**Done**
- Sealed picks before kickoff. The crowd split stays hidden until you pick.
- The AI seals home/draw/away probabilities, with the SHA-256 fingerprint text shown on the match page.
- Public AI track record (`/ai`) with hit rate, Brier score and calibration.
- AI v2 learns inside Postgres: Elo per team, a 120-day backfill, and a crowd weight per league tuned nightly by Brier.
- Stars based on the Wilson lower bound, a leaderboard and public profiles.
- All ESPN-covered world soccer plus NBA, WNBA, college, NHL, NFL, MLB, rugby, volleyball and AFL, ingested every 5 minutes.
- Match centre (events, stats, lineups, H2H) and league standings.
- Live overlay (`/live/[id]`) for TikTok streams, plus share cards.
- Google sign-in (`openid` scope only, hashed ID), or a nickname with a recovery code. Cloudflare Turnstile protection.

**In progress:** friend leagues, and tennis, golf, F1 and UFC.
**Planned:** FR/EN, stream "call it" mode, calibration charts per league, observability. See the roadmap.

## Stack
- Next.js 16 (App Router, React 19) and Tailwind 4, on **Cloudflare Workers** through OpenNext (free plan)
- **Supabase Postgres** (free tier) with `pg_cron` and `pg_net`. Ingestion, parsing, rating, sealing and tuning all run in SQL.
- GitHub

## Setup

```bash
npm install
npm run dev          # local
npm run typecheck
npm run cf:build     # Cloudflare build
npm run cf:deploy    # deploy (or: npx wrangler deploy)
```

### Environment variables (names only — never commit values)
| Name | Use |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service key. **Server-only** |
| `CRON_SECRET` | Protects `/api/settle` |
| `GOOGLE_CLIENT_ID` | Google OIDC |
| `GOOGLE_CLIENT_SECRET` | Google OIDC. Server-only |
| `PLAYER_SECRET` | Salt/HMAC for player cookies and the hashed Google ID |
| `TURNSTILE_SECRET` | Cloudflare Turnstile verification. Server-only |
| `NEXT_PUBLIC_TURNSTILE_SITEKEY` | Turnstile widget (public) |

Put them in `.env.local` for development and in Cloudflare secrets (`npx wrangler secret put NAME`) in production.

### Database
1. Create a Supabase project and enable the **pg_cron** and **pg_net** extensions.
2. Apply the files in `sql/` **in order** in the SQL editor:
   `001_matches_feed.sql` → `002_seal_fix.sql` → `003_ai_learning.sql` → `004_all_sports.sql` → `005_learn_fix.sql`
3. The cron jobs (fetch every 5 min, parse every minute, learn, backfill, nightly tune) are created by these files.

> Note: the base tables `predictions`, `picks` and `players`, and RPCs such as `make_pick`, `settle_picks` and `leaderboard`, are not yet exported into `sql/`. A `000_base.sql` is planned. Until it lands, a fresh setup needs those objects created by hand.

## Data sources and attribution
- Match data comes from **ESPN's public site API**. These endpoints are **unofficial and undocumented**. They can change or stop working without notice, and HADAF has no affiliation with ESPN.
- Team, league and competition logos and names are **trademarks of their respective owners**, shown only to identify them.
- HADAF does not show betting odds and does not link to bookmakers.

## Contributing
- Read [`docs/MASTER_PROMPT.md`](docs/MASTER_PROMPT.md): principles, file ownership, quality bars and the definition of done.
- Open an issue before a large change, and keep each PR to one thing.
- Do not commit secrets. SQL migrations must be new, numbered and idempotent files.
- Arabic UI copy should be simple Arabic that's easy for Algerians to read. RTL and mobile come first.
- Red lines: no stakes, no cash prizes, no odds or bookmaker affiliates.

## License
License: GNU AGPL-3.0 (see LICENSE). Open data under CC BY 4.0. The name «هدف / HADAF» and its logo are not covered by the code license..
