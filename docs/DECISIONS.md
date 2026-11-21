# Decisions

One line each: date · what · why.

- 2026-11-21 · Next.js 16 + Tailwind + shadcn/ui on Vercel · fastest path to a live demo link.
- 2026-11-21 · Placeholder name `bostonhacks-2026` and pages Home / Main app / About · idea not picked yet; rename later.
- 2026-11-21 · Board-game look: one dark "game table" theme (no light/dark toggle), Fredoka + Press Start 2P fonts, 3D feel from solid navy offset shadows and CSS 3D dice · matches the cover-art and toy-piece reference photos; all colours live as tokens in `globals.css`.
- 2026-11-21 · Idea picked: T Party (gamified MBTA feedback) · see docs/SPEC.md.
- 2026-11-21 · Keep Next.js instead of the spec's React + Vite · the repo, CI and Vercel setup already exist on Next.js.
- 2026-11-21 · Renamed `main-app` to `explore`, route `/app` to `/explore`, and added `my-challenges`, `rewards`, `challenge` folders · they match the five screens in the spec.
- 2026-11-21 · No `/challenges/[id]` route yet · Cache Components needs `generateStaticParams` or Suspense for dynamic routes; the challenge owner decides how.
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
- 2026-11-21 · MBTA's API drops closed alerts, so exact close times exist only in the archive; our own detected fixes carry a window (`last_seen_at` to `resolved_at`) and count toward time-to-fix only if that window is 30 minutes or less · fix times must not depend on our traffic.
- 2026-11-21 · `.github/workflows/sync.yml` loads `/api/quests` on the live site every 5 minutes · keeps detection windows small when nobody is using the app.
- 2026-11-21 · AI check capped at 20 per rider and 60 per network address per hour (address stored only as a hash) · protects the Gemini quota; does not stop invented user ids from earning tokens.
- 2026-11-21 · Quests widened from accessibility only to station issues, station closures, shuttles and suspensions on the subway; delays and bus alerts left out · delays vanish in minutes, bus stops are not on the map.
- 2026-11-21 · Alerts that have not started yet are not quests · nothing to see at the station; also keeps planned work out of "open now".
- 2026-11-21 · Verify quests: elevators and escalators MBTA closed in the last 24 h; one answer per rider (`verifications` table), 5 tokens, no AI check · gives riders a role MBTA cannot fill itself, and is quick enough for a platform wait.
- 2026-11-21 · Stations (`src/lib/data/stations.json`, real lat/lon and route order) saved once from MBTA; live trains from `/api/trains` (15 s cache, no fallback) · the map needs positions; train positions cannot be faked from a saved copy.
- 2026-11-21 · `MBTA_API_KEY` is effectively required on shared networks · without it MBTA allows 20 requests a minute per address, shared with everyone on that address (we hit this on the hackathon WiFi).
- 2026-11-21 · `/challenges/[id]` reads params inside `<Suspense>`, no `generateStaticParams`, and sets `instant = false` · quest ids are live (Cache Components rejects an empty list), and the shared nav's `usePathname()` outside Suspense fails the build on dynamic routes until it is wrapped.
- 2026-11-21 · The map is the home page (`/`); the landing page with four cards and Press Start (`features/home`) is removed · the map is the product; a menu page in front of it added a click and no information.
- 2026-11-21 · Look: atlas tokens (ivory, stone, sage, graphite, hairline, four category colours) plus Fraunces/Geist fonts; pages use the stone background; pixel font only for small accents · one coherent look with the map; the retro board-game tokens stay for older components until they are restyled.
- 2026-11-21 · Problem categories are built only from MBTA alert kinds (Service changes, Accessibility, Escalators & station, Check it's fixed); no cleanliness or crowding · there is no data for those, and the map must not show invented problems.
- 2026-11-21 · Contributing happens in a panel on the map that calls `features/challenge` (`useReport`, `api.ts`); `/challenges/[id]` stays as the shareable full page · one set of rules, no copy of the form logic.
- 2026-11-21 · /island shows Yarn World (krisyangdev/yarn-world, MIT) copied into `features/island/yarn-world/`; each stamp knits in one tier of pieces (`unlockTiers`) · a reward world that grows with real stamps; credited on the page. Added `three` and `three-mesh-bvh` to package.json.
- 2026-11-21 · The island opens by dragging the loose thread (progress = how far the hand moves away from the ball), with a "Knit it for me" button as the no-drag alternative · reuses Yarn World's own rope and knit-in instead of a Start button; the timed intro stays for replay.
