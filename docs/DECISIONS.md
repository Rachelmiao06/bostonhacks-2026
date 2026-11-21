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
