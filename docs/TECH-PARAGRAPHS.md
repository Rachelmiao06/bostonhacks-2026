# How we use each technology

Short paragraphs for the README, Devpost, prize forms and talking. Each one only says what the code does today. Where something is not used, it says so.

## Google Gemini API

Gemini is the part of Tada that reads what people write and photograph, and it is used in four server routes: the mission review (`src/lib/ai.ts`), the Report photo check (`src/app/api/report/check`), "Ask Tada" (`src/app/api/report/ask`) and the trolley chat (`src/app/api/trolley-chat`). It is multimodal: for a Report it looks at the photo and the rider's note, and returns one of five verdicts (fixable, private, unclear, emergency, other authority), a Boston 311 category from a fixed list, and a drafted description. Every call asks for a fixed JSON schema, and we re-validate every field on the server. A lite model runs first with a fallback, because the larger models returned 503 during the hackathon weekend. The key stays on the server. Gemini helps with language and classification, while deterministic code and database rules decide approvals, rewards and state. If the model is down or returns junk, the check fails closed: nothing is sent and nothing is marked reviewed. Text inside photos and notes is treated as data, never as instructions.

**Say it in 30 seconds:** "Gemini reads the photo and the note, decides whether Boston can fix it, picks the 311 category and drafts the report. It never confirms facts and never grants a reward, our code does."

## Tiger Data (PostgreSQL with TimescaleDB)

Tiger Data is our database (`src/lib/db.ts`, `src/lib/data/schema.sql`). `outage_observations` is a TimescaleDB hypertable partitioned by `observed_at`: a 5-minute job appends a snapshot of every live MBTA outage, and by comparing each successful fetch with the last we detect when an elevator or escalator is fixed. The same database holds `submissions`, `verifications`, `likes` and `review_calls`. Unique constraints enforce one reward per rider per mission, and the AI-review rate limit lives in the database so it survives restarts (the network address is stored only as a hash). Stats are computed on request in SQL with medians, over 26,000+ archived MBTA outages loaded from the public alert archive. Photos and exact coordinates are never stored. We use plain PostgreSQL and the hypertable; we have not used Tiger's agentic or database-fork features.

**Say it in 30 seconds:** "Tiger Data holds our outage history as a TimescaleDB hypertable, so we can see when the MBTA actually fixes something. The same database enforces one reward per rider per mission."

## MBTA and Boston open data

The MBTA V3 API turns live alerts into quests (cached 5 minutes, with a saved snapshot if the API is down) and supplies stations and train positions. The MBTA public alert archive gives the history behind Stats. Boston's open 311 data (Analyze Boston, CKAN API) is used read-only for duplicate detection within about 50 m, real case status and the city's own closing notes. We say "Fixed" only when the closing note names a repair, because the city also closes cases as "Noted" or "Transitioned". Boston 311's own site accepts a link that opens a category's form with the description filled in, which is how the Report hand-off works.

## Vercel and GitHub Actions

Vercel deploys `main` and gives every pull request a preview link. GitHub Actions runs lint, type-check and a production build on every pull request, and a 5-minute job loads the live quests endpoint so the outage history keeps growing when nobody has the app open.

## Claude Code

We built Tada with Claude Code as a pair programmer, in short branches: one feature, one folder, one pull request. Decisions someone might undo are logged one line each in `docs/DECISIONS.md`.

## Technologies we do not use

- **GoDaddy:** not used. The app is served from `bostonhacks-2026.vercel.app`; there is no custom domain, hosting or other GoDaddy service in this project, so we should not claim it.
- **Accounts or sign-in:** none. A rider is a random id made in the browser.
- **Stored photos or stored exact location:** none. See the security section of the README.
