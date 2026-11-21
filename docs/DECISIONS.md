# Decisions

One line each: date · what · why.

- 2026-11-21 · Next.js 16 + Tailwind + shadcn/ui on Vercel · fastest path to a live demo link.
- 2026-11-21 · Placeholder name `bostonhacks-2026` and pages Home / Main app / About · idea not picked yet; rename later.
- 2026-11-21 · A Quest = one live MBTA accessibility alert (elevator, escalator, access), built automatically in `src/lib/mbta.ts` · real, verifiable, self-updating; no hand-kept challenge list.
- 2026-11-21 · `/api/quests` caches MBTA for 5 minutes and falls back to a saved snapshot (`src/lib/data/`) · demo must not depend on MBTA being up.
- 2026-11-21 · Every auto-built Quest is labelled `community_mission`, never official · we must not invent official MBTA comment requests.
