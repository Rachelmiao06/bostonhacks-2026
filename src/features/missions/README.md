# Missions

What: the guided "community mission" that replaces the old report form. Opens from the map card ("View mission").
Owner: Rachel. Only the owner edits this folder.

## The flow
Map card -> Overview -> Step 1 (when) -> Step 2 (what you observed) -> Step 3 (note + photo, optional) -> Review -> Done.
One purpose and one main button per screen. Back never loses an answer (answers are kept per quest in
localStorage `tada:mission:<id>`; the photo stays in memory only).

## Files
- `templates.ts`: one template per alert kind (elevator, escalator, access, station, closure, shuttle, suspension) with a
  safe `GENERIC` fallback. Questions, answer options and wording live here. Add a kind = add a case.
- `compose.ts`: turns the answers into the summary and into the text sent to the existing routes. Built ONLY from the
  rider's answers and the verified alert, so no date, observation or photo can be invented.
- `useMission.ts`: the rules. Calls the existing routes through `features/challenge/api.ts`:
  `/api/review` (AI safety check, report missions only) then `/api/submissions` (or `/api/verifications` for "check it's working again").
  "Done" is shown only after the server says it saved. "I haven't checked it yet" can never reach a submit.
- `MissionFlow.tsx` + `Parts.tsx`: the screens. `PixelIcon.tsx`: 8x8 pixel badges (icons only, never scenery).
- `content.ts`: all the words.

## Rules that must stay true
- It is a Tada community observation, never an official MBTA report. Nothing is sent to the MBTA.
- The AI only checks and tidies what the rider wrote. A short answer is never a failure; at most ONE follow-up question is asked.
- Progress on the done screen is the real count from `useMyProgress` (`stampCount`); nothing is invented.

## The world behind the card
Each mission now sits over a little miniature station that fills the screen (`features/challenge-diorama/`, loaded only when a
mission opens). `MissionFlow.tsx` passes it the rider's answers and nothing else: kind -> landmark, "when" -> day or dusk,
status tone -> light and movement, a note -> a speech bubble, and `done` -> the seal. It only DRAWS. It decides, saves and
rewards nothing: `confirmed` is true only when `useMission` says the server saved (or it was saved on an earlier visit), so
a failed save never shows a seal. The question card is glass over the world. `ContributePanel.tsx` (explore) was made
transparent for this and no longer closes when you tap outside it (the screen behind is now the main picture).

