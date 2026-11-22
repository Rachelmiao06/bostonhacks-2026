# Tada

**Tell Boston what's broken in a minute. Watch your island grow.**

Tada turns live MBTA alerts and Boston 311 data into one-minute civic missions. Report a street problem, confirm an MBTA fix, see what the city did, and grow your own knitted island.

Built at **BostonHacks 2026** (Nov 21 to 22, Boston University) for the **Boundless Boston** track, merged with gamification.

- Live app: https://bostonhacks-2026.vercel.app
- Report demo mode (lets you photograph a picture on a screen): https://bostonhacks-2026.vercel.app/report?demo=1

## What it does

| Part | What you can do | Route |
|---|---|---|
| **Explore** | A real Boston map built from live MBTA alerts. Every pin is a mission. A pin turns green only when its source is named: the MBTA, or riders. | `/` and `/explore` |
| **Missions** | Answer three short questions about a problem. Gemini helps sharpen your note; it never invents facts. | `/challenges/[id]` and the map card |
| **Check a fix** | When the MBTA closes an elevator or escalator, riders confirm whether it really works. One answer per rider. | on the map |
| **Report** | Take a live photo of a street problem. Gemini judges whether Boston can fix it, picks the 311 category and drafts the report. We check Boston's open 311 data for the same problem nearby, then open the matching Boston 311 form with your description filled in. | `/report` |
| **My World** | Every finished mission knits a new piece into your own 3D island. No points counter, no leaderboard. | `/world` |
| **Stats** | How long MBTA elevators and escalators stay broken, from 26,000+ archived outages since 2019 (medians). | `/stats` |

**Try it in two minutes:** open the live app, tap the glowing pin, do one mission, visit My World, then open the Report demo link and photograph a picture of a pothole.

## How it works

**A mission.** The server turns live MBTA alerts into quests (cached 5 minutes, with a saved snapshot if the MBTA API is down). The rider answers three questions, so the note is built only from their own answers. Gemini scores it and the pass rule lives in our code. Completing saves one row per rider per quest, and My World unlocks the next island piece from that count.

**A report.** Live camera only, no gallery. Location is read at the shutter and must be inside Boston, accurate to 50 m. Gemini returns one of five verdicts (fixable, private, unclear, emergency, other authority). We look for an open 311 case of the same type within about 50 m. Tada cannot submit to Boston 311 for you, so it opens the category's own 311 form with the description pre-filled; you add the photo and the place and submit. We say "Fixed" only when the city's closing note names a repair.

**The data pipeline.** A 5-minute GitHub Actions job (`.github/workflows/sync.yml`) loads `/api/quests` so the server can compare each MBTA fetch with the last. A fix is an open outage missing from a successful live fetch; snapshots and empty fetches never count. Stats are computed from the database on request, using medians.

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| App | Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4, shadcn/ui | Pages, API routes and UI, deployed on Vercel from `main` |
| Map | MapLibre GL, react-map-gl, GSAP | The Boston map and animated navigation |
| 3D world | three.js, three-mesh-bvh | The knitted island |
| AI | Google Gemini API (lite model first, fallback second) | Mission review, photo judging, report drafting, "Ask Tada" and the trolley chat. Server-side only |
| Database | Tiger Data (PostgreSQL with TimescaleDB), `pg` | Submissions, verifications, outage history, AI-check log |
| Transit data | MBTA V3 API and the MBTA public alert archive | Live alerts, stations, trains, history |
| City data | Analyze Boston "311 Service Requests" (CKAN API) | Duplicate detection, case status, closing notes |
| Places | OpenStreetMap (optional Google Places key) | Nearby cafés and bakeries for the island gift, shown without any offer |
| CI | GitHub Actions | Lint, type-check and production build on every pull request |

More detail on how each service is used is in [`docs/TECH-PARAGRAPHS.md`](docs/TECH-PARAGRAPHS.md).

## Data security and privacy

We started from one rule: collect as little as possible.

- **No accounts, names or emails.** A rider is a random id made in their own browser.
- **Photos are never stored.** They are shrunk and re-encoded in the browser, which strips EXIF and GPS tags. The server holds a photo in memory for one request, forwards it to Gemini, and discards it. The database keeps only a yes/no `has_photo`.
- **Exact location is never written to our database.** Saved Report cases keep their location in the rider's own browser. In Explore, location stays on the device.
- **Secrets stay on the server.** Every API key is read only in server code and sent in request headers. `.env*` is git-ignored and only `.env.example` (names, no values) is tracked.
- **The AI cannot grant rewards.** Only `/api/review` can record an AI result, the pass rule is in code, and database constraints allow one reward per rider per mission.
- **AI output is untrusted.** Gemini must answer in a fixed JSON schema, every field is re-validated, and the check fails closed: if the model is down, nothing is sent or marked reviewed. Text in photos and rider notes is treated as data, never instructions.
- **Safe queries.** Our database queries are parameterized. The one place we build a query string goes to Boston's public API, after allowlisting the category and validating coordinates and ids.
- **Abuse limits.** The AI review is capped per rider and per network address per hour, stored in the database; the address is kept only as a hash.
- **Browser protections.** Every response sends HSTS, no-sniff and no-framing headers, a Permissions-Policy (camera and location only for our own pages) and a partial Content-Security-Policy (`next.config.ts`).

**Known limits (we log them in [`docs/DECISIONS.md`](docs/DECISIONS.md)):** riders are pseudonymous, not anonymous (a persistent browser id, typed text, ordinary host logs). With no login, ids can be invented to farm rewards. Face and screen detection is a model judgment. Two Report rate limits are in memory and reset on restart. The Content-Security-Policy sets no `script-src` yet, and there is no "delete my data" button. This was a code review, not a penetration test.

## Honesty rules

- Sending a report to Boston 311 or the MBTA is **not** automated. Neither offers apps a submission route, so Tada opens the right Boston 311 form with your text filled in and you submit it.
- In demo mode (`?demo=1`) "Save demo report" creates a **simulated** case, always labelled "Demo case: not sent to the city".
- The island gift is a labelled demo with no real partner. Sample numbers are always labelled "Sample data".
- The app never claims the city received, reviewed or accepted something it did not.

## Run it locally

Node 24 (the version CI uses).

```bash
npm ci
cp .env.example .env.local   # then fill in the values you have
npm run dev                  # http://localhost:3000
```

| Variable | Needed for |
|---|---|
| `MBTA_API_KEY` | Optional. Raises the MBTA rate limit (20 requests a minute per address without it) |
| `GEMINI_API_KEY` | AI features (mission review, Report photo check, Ask Tada, trolley chat) |
| `DATABASE_URL` | Tiger Data / Postgres connection string: submissions, verifications, stats |
| `GOOGLE_PLACES_API_KEY` | Optional. Place photos; without it My World uses the OpenStreetMap snapshot |

Create the tables once: `node --env-file=.env.local scripts/db-setup.mjs`. To load the archived outage history (optional; needs `pip install duckdb`): download MBTA's `LAMP_RT_ALERTS.parquet` alert archive, run `python3 scripts/export-history.py LAMP_RT_ALERTS.parquet history.json`, then `node --env-file=.env.local scripts/db-import-history.mjs history.json`.

Without keys the map and live MBTA missions still work (with a saved snapshot as fallback). Features that need a key or the database return a clear "not configured" error or a labelled fallback, never made-up data.

Checks run in CI on every pull request: `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`.

## Repository map

| Path | What is in it |
|---|---|
| `src/app/` | Thin routes and `api/` route handlers. Routes import from `features/` |
| `src/features/<name>/` | One folder per feature: component, `content.ts` (all text), a README. Explore, challenge, missions, report, island, passport, stats, coach, trolley-chat, landmarks |
| `src/components/` | `ui/` shadcn primitives and `shared/` reusable parts |
| `src/lib/` | One file per outside tool: `db.ts`, `ai.ts`, `mbta.ts`, `places.ts`, `map.ts`; plus `data/` (schema, stations, snapshots) |
| `public/assets/` | Images and sounds per feature |
| `scripts/` | Database setup, history import, asset builders |
| `docs/` | [`DECISIONS.md`](docs/DECISIONS.md) (one line per decision), [`SPEC.md`](docs/SPEC.md), [`PRD-report.md`](docs/PRD-report.md), [`TECH-PARAGRAPHS.md`](docs/TECH-PARAGRAPHS.md), and design references. See [`docs/README.md`](docs/README.md) |
| `graphics/` | Source art for the map landmarks |
| `.github/` | CI, the 5-minute data sync, pull request and issue templates |

Each feature's README says what it does and what is not done. Report's edge cases are in [`src/features/report/EDGE-CASES.md`](src/features/report/EDGE-CASES.md).

## How we work

One feature, one folder, one branch, one pull request. Every pull request runs CI and gets a Vercel preview. Shared files (layout, tokens, `package.json`) are announced before anyone touches them. See [`TEAM.md`](TEAM.md) and [`CLAUDE.md`](CLAUDE.md). We built with Claude Code as a pair programmer.

## Credits and licences

- **Yarn World** by Kris Yang (MIT): the starting scene of the knitted island, adapted in `src/features/island/yarn-world/` (see `LICENSE-yarn-world`).
- **MBTA** V3 API and public alert archive; **Analyze Boston** 311 Service Requests (City of Boston open data); **OpenStreetMap** contributors (ODbL).
- **Google Gemini API** for AI features and **Tiger Data** for the database.
- Island sounds are CC0 (`public/assets/island/sfx/SOURCES.txt`). Fonts come from Google Fonts through `next/font`.
- This project is unofficial and not affiliated with the MBTA or the City of Boston.

**Team:** Rachel, Louie and Kelsey. **Licence:** not chosen yet; all rights reserved until the team decides.
