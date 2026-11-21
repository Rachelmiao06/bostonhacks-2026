# Stats

What: the numbers page. How long MBTA elevators and escalators stay broken, repeat offenders, busiest stations, and what riders are doing. Route `/stats`.
Issue: see GitHub issues labelled `stats`.
Owner: TBD. Only the owner edits this folder.

## How it works
- `useStats.ts`: loads `/api/stats` (the teammate's route, `src/app/api/stats/route.ts`). All the "what if it is not available" rules live here:
  - 200 with the expected shape: live data.
  - 404 (route not in this build) or 503 (database not connected): clearly labelled SAMPLE numbers from `sample.ts`.
  - Any other failure: an error with a Try again button. Sample numbers never cover up a real failure.
- `types.ts`: mirrors the API response. If the route changes, change this file.
- `Stats.tsx`: presentation only. Cards, text-first bars, no chart library. `format.ts` holds the number and date formatting.
- `content.ts`: all text, including the honesty notes.

## Rules (docs/SPEC.md)
- Sample numbers are invented and must always show the "Sample data" banner.
- "Resolved after a report" is timing, never a claim that T Party caused the fix.
- Opening the official MBTA form is not proof a report was sent. The AI does not verify facts.
- Not linked from the nav on purpose (`src/lib/config.ts` is a shared file). Add `{ href: "/stats", label: "Stats" }` there once the team agrees.
