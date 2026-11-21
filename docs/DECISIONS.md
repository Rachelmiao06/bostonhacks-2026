# Decisions

One line each: date · what · why.

- 2026-11-21 · Next.js 16 + Tailwind + shadcn/ui on Vercel · fastest path to a live demo link.
- 2026-11-21 · Placeholder name `bostonhacks-2026` and pages Home / Main app / About · idea not picked yet; rename later.
- 2026-11-21 · A Quest = one live MBTA accessibility alert (elevator, escalator, access), built automatically in `src/lib/mbta.ts` · real, verifiable, self-updating; no hand-kept challenge list.
- 2026-11-21 · `/api/quests` caches MBTA for 5 minutes and falls back to a saved snapshot (`src/lib/data/`) · demo must not depend on MBTA being up.
- 2026-11-21 · Every auto-built Quest is labelled `community_mission`, never official · we must not invent official MBTA comment requests.
- 2026-11-21 · Shared database on Tiger Data (Postgres), tables in `src/lib/data/schema.sql` · localStorage cannot produce KPIs or show feedback to anyone else.
- 2026-11-21 · A fix = an open outage missing from a successful live MBTA fetch; snapshot or empty fetches never resolve anything · an MBTA hiccup must not fake fixes.
- 2026-11-21 · Tokens are counted from completed submissions (one per rider per quest), not stored · double rewards impossible.
- 2026-11-21 · Photos are not stored on the server, only `has_photo` · avoids keeping faces and locations.
- 2026-11-21 · AI check uses Gemini, lite model first with fallbacks (`src/lib/ai.ts`) · bigger models were overloaded (503) on demo weekend; lite answered in about 1 s.
- 2026-11-21 · Pass rule (every score 3 or more out of 5) is in code, and only `/api/review` can write an AI result · the model and the browser cannot grant a pass.
- 2026-11-21 · Editing a report after a check resets it to not checked; completion needs the exact checked report · spec: changes must be re-checked.
- 2026-11-21 · Loaded 26,300 closed outages (2019 onward) from MBTA's public LAMP alert archive, marked `source = 'archive'` · time-to-fix needs history; our own sync only started today.
- 2026-11-21 · Archive rows with no close time are skipped · in the archive that does not reliably mean still open.
- 2026-11-21 · `/api/stats` computes every KPI from the database on request, medians not averages · a few multi-year outages would distort an average.
