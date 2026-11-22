# Report

What: the Report tab (route `/report`). Take a live photo of a city problem, have AI check it (Gemini), send it to Boston 311, and see who fixed it.
Issue: see GitHub issues labelled `report`.
Owner: TBD. Only the owner edits this folder.
Status: v1 loop built (see docs/PRD-report.md). Send is simulated; duplicates, case status and closure wording use real Boston 311 data. Edge cases live in `EDGE-CASES.md`; log new ones there.
Code: `Report.tsx` (journey state machine, entry, photo, analyzing, errors), `Camera.tsx`, `Result.tsx` (Boston 311 result: new issue, existing case, pick a category), `Verdicts.tsx` (private/unclear, emergency, other authority), `Prepare.tsx` (guided action), `Activity.tsx` + `CaseRow.tsx` (following and saved demos), `AskTada.tsx`, `closure.ts`, `ui.tsx`, `CameraMark.tsx`, `store.ts`, `demo-case.ts`, `api.ts`; server in `src/app/api/report/` (check, nearby, status, send, ask).

## Core value
Reporting to a city usually feels like shouting into a void. Report promises that the city answers and you see it.
Capture is the fast front door (under a minute). Tracking is where people come back. Design every step from that.

## The loop (build this first)
photo → AI check → editable draft → send → status

## Functions
1. **Capture**: live camera only (no gallery). One photo. Use / Retake.
2. **Locate**: read the position at the shutter press. Needs good accuracy and a spot inside Boston.
3. **Judge**: Claude returns one of `fixable`, `private`, `unclear`, `emergency`, with a plain-language reason. Never sends anything itself.
4. **Draft**: map to Boston 311 service names (`service_name` in the data). The user edits category and description. The pin stays where the photo was taken.
5. **Duplicate check**: open case (`case_status` not Closed) of the same `service_name` within about 50 m. Follow it instead of filing. The user may say "not the same" and file anyway.
6. **Send**: Tada cannot submit for the person. The main action opens Boston 311 on the matching category with the description filled in by the link (`bostonFormUrl` in `categories.ts`); the person adds the photo and the place and submits. In demo mode (`?demo=1`) the main action is the simulated "Save demo report" instead.
7. **Track**: from Boston's real 311 data. Three stages only: Sent, In progress, Closed.
8. **Notify**: in-app badge and a closure card with the team (`assigned_team`) and the city's own words (`closure_comments`). Say "Fixed by" only when the note says it was fixed.
9. **Reward**: leaves only for an accepted report, a followed duplicate, or a fix. Once per case id.

## Rules
- Nothing reaches 311 unless it passes every check. A rejected report never goes out and costs the user nothing.
- Every rejection gives a reason and a next step.
- If a check cannot run (AI down, data down, no location), do not send unchecked. Save the draft.
- "Not the city's job" cannot be overridden. A wrong verdict can be reported with "I think this is wrong"; that is logged, not obeyed.
- Emergencies (fire, injury, gas smell) are never filed. Show "Call 911".

## Data (Analyze Boston, "311 Service Requests – NEW SYSTEM", checked 2026-11-21)
Fields: `case_id`, `open_date`, `service_name`, `assigned_department`, `assigned_team`, `case_status`, `closure_reason`, `closure_comments`, `close_date`, `latitude`, `longitude`, `report_source`.
Statuses seen: In progress, Closed (rare: Submit, Create, Needs Reallocation, Error).
`submitted_photo` and `closed_photo` exist but are empty, so match on place and category only.
Query through the datastore API (`datastore_search_sql`; cast `latitude`/`longitude` to float).

## Open decisions
- Sending: simulate, or open the official 311 page with the draft? (An outside-app submission route was not found; Open311 returned 503.)
- Demo: seed one case that flips to a closure note on cue.
- Stages: three (matches the data) rather than four.

## Knitted art
Transparent WebP cut-outs in `public/assets/report/`, resized to about 2x their display size. The wool look is used as a hero or an accent; every label is still real HTML text. `Knitted.tsx` holds the sprites; `ui.tsx` holds the button plates. Motion is off for reduced motion.

| Art | Where |
|---|---|
| Camera (high resolution), floating | Entry hero |
| Blank wool plates (files kept, **not used**) | Tried behind button text with `border-image`; the stretched stitches looked pixelated, so buttons are flat again |
| Shutter, close, back discs | Camera screen; "Back" on Prepare and Activity |
| Ring, half ring, solid check markers | Case timeline (half = where the case is now) |
| Yarn ball, six frames | Analyzing (frames cycle; breathing scale). Frame 1 only for reduced motion |
| Landscape strips (files and `KnittedHills` kept, **not used**) | Removed from Entry and Analyzing: they read as a big green block, not a decoration |
| Success badge | "Saved" and "Following" screen |
| Mascot | Ask Tada header |
| Generic building | "Belongs to someone else" when the authority is not the MBTA |
| Category badges (pothole, street light, litter, graffiti, fallen tree, rat) | Result photo corner and the pick-a-category list; other types show nothing |
| Icon discs (camera, location, bank), flowers | Permission note, "Who can help", empty Activity |

Not used yet: thread strands, the plates, the landscape strips, and these sheets that have not been generated: result-page illustrations (emergency, private, unclear), the nine icon discs, and empty/error/offline art. Those screens keep their line icons. Originals are in `docs/knit-assets/incoming/`; an overview is `docs/knit-assets/album.png`.
