# هدف — الرؤية / HADAF — Vision

## بالعربية

**هدف** ساحة توقعات رياضية **مجانية، مفتوحة المصدر 100%، وبلا رهان**. تختم توقعك قبل بداية المباراة، والذكاء الاصطناعي يختم احتمالاتو حتى هو ببصمة SHA-256 يقدر أي واحد يتحقق منها. ما تشوفش رأي الجمهور حتى تختار، ومن بعد تبان المقارنة: **أنت ضد الجمهور ضد الـ AI**.

ما كاين لا دراهم، لا جوائز مالية، لا كوطات ولا روابط تاع مراهنات. الهدف بسيط: نبيّنو بالأرقام شكون يفهم في الكورة صح، والـ AI حتى هو يتحاسب قدام الناس.

نبداو بالجمهور العربي وشمال إفريقيا، ومن بعد للعالم كامل. المؤسس صانع محتوى جزائري عندو قرابة مليون متابع، ويدير لايف كل يوم، لهذا أدوات اللايف والمشاركة عندنا أولوية.

## English

**HADAF** ("goal") is a **free, fully open-source sports forecasting arena with no betting**. You seal your pick before kickoff, and an AI seals its probabilities too, with a SHA-256 fingerprint anyone can verify. The crowd's split stays hidden until you pick. After that you see **You vs the Crowd vs the AI**. Everyone builds a public track record, and that includes the AI.

---

## Why HADAF is different

| Product | What it does well | What HADAF does differently |
|---|---|---|
| Forebet | Algorithmic predictions | Ours are **sealed before kickoff with a public fingerprint**, scored with Brier and calibration, and misses are shown too. No betting tie-ins |
| SofaScore / FotMob / 365Scores | Live scores and stats | HADAF has live data **plus** a skill game and an accountable AI. Scores are the context, not the product |
| Kooora | Arabic football news | Arabic-first like Kooora, but interactive, with measurable forecasting |
| Superbru | Prediction games with friends | Probabilistic AI opponent, crowd-learning model, all sports, open source |
| Metaculus | Rigorous forecasting and calibration | The same rigor (Brier, Wilson bounds) made **mass-market, mobile, Arabic and fun** |
| FiveThirtyEight | Transparent sports models | A model that **learns every day** from results and from the crowd, with a live public record |

No single competitor combines sealing + crowd-hidden-until-you-pick + an accountable learning AI + no gambling + open source + Arabic-first.

---

## The 12 signature features

| # | Feature | Status |
|---|---|---|
| 1 | Sealed picks before kickoff | Done |
| 2 | AI seals its probabilities, SHA-256 fingerprint shown | Done |
| 3 | Crowd hidden until you pick, then You vs Crowd vs AI | Done |
| 4 | Wilson-bound stars, which luck can't buy | Done |
| 5 | Public AI track record: hit rate, Brier, calibration | Done |
| 6 | Self-learning AI v2: Elo per team plus a crowd weight tuned per league | Done |
| 7 | All world soccer plus NBA/WNBA/college/NHL/NFL/MLB/rugby/volleyball/AFL, refreshed every 5 min | Done |
| 8 | Match centre (events, stats, lineups, H2H) and league standings | Done |
| 9 | Live overlay mode for TikTok streams, plus share cards | Done |
| 10 | Privacy-minimal Google sign-in (openid only, hashed) or a nickname with a recovery code | Done |
| 11 | Friend leagues | In progress |
| 12 | Tennis, golf, F1, UFC | In progress |

Next up (planned): FR/EN versions, a "call it" mode for streams, calibration charts per league, and a reproducible base schema.

---

## How the AI learns / كيفاش يتعلّم الـ AI

1. **From results.** Every finished match updates an **Elo rating** for both teams. The update accounts for home advantage and the margin of victory. A **120-day backfill** gave the model memory from day one.
2. **From the crowd.** Before sealing, which happens 10 to 45 minutes before kickoff, the AI mixes in what users picked. **Every night it tests how much weight the crowd deserves in each league** (from 0 to 60%) and keeps the weight with the lowest Brier score over the last 180 days. If a league's crowd is sharp, the AI listens to it more. If not, less.
3. **It stays honest.** After a seal, nothing changes. Every miss stays public on the AI record page.

**بالعربية:** الـ AI يتعلّم من النتائج (Elo لكل فريق) ومن خبرة الناس (وزن الجمهور يتعاير كل ليلة لكل دوري). وكي يختم، خلاص، ما يقدرش يبدّل حتى رقم.

---

## How to contribute / كيفاش تساهم

- Read `README.md` for setup and `docs/MASTER_PROMPT.md` for architecture, rules, the roadmap and the definition of done.
- Pick a [PLANNED] item and open an issue first, then make a small PR.
- Arabic copy should be simple and clear, easy for any Algerian to understand.
- The red lines are the same for everyone: no betting, no money, no odds.
- Not a coder? Translate (FR/EN), report bugs, or check what the AI says against the real results.
