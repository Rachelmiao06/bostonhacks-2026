# Journey

What: the flow layer for a home screen with **no buttons, no tabs and no words**. The map is the whole interface: the rider sees a problem, taps it, writes or photographs what they see, and a reward appears; then the map points at the next problem. Nothing changes page.
Owner: Louie. Status: **SCAFFOLD.** Nothing outside this folder imports it. The preview is at `/journey` (a placeholder look on live quests).

## The idea in one picture
```
 explore ──tap a problem──▶ focus ──type / photo──▶ drafting ──pause──▶ reviewing ─┬─ passed ─────▶ ready ──hold──▶ sending ──▶ reward ──(by itself)──▶ explore
    ▲                         │                        ▲                           ├─ needs work ─▶ revising ─edit─▶ drafting                              (next problem
    └──── swipe down / Esc ───┴────────────────────────┘                           └─ failed ─────▶ drafting (draft kept, tap the ring to retry)            is highlighted)
```
- **No Check button:** the AI check starts by itself when the rider pauses typing.
- **No Send button:** press and hold the ring (about 0.7 s). A deliberate hold means a stray tap cannot send anything.
- **No Close button:** swipe the sheet down, press Escape, or tap empty map. Walking away mid-draft parks the draft (a dashed mark on that problem); tapping it brings the draft back.
- **No Next button:** after the reward the map takes over by itself and pulses the best next problem.
- A verify (is it fixed?) is one gesture: the sheet collapses to its glyph row and a hold confirms.

## Three layers, one surface
`JourneySurface` is the only layout: the **map** (always there), a **sheet** that rises from the bottom, and a short **reward** overlay. `layersFor(state)` says which layers show and how (`sheet: hidden | peek | open`, which gestures are live, one status). The surface sets data attributes (`data-stage`, `data-sheet`, `data-status`, `data-layer`) and nothing about looks, so any design can restyle it from CSS.

## The no-words rule
Everything visible is **icons, colour, shape and gesture**. The only words in the feature are in `content.ts`, and they are for screen readers: accessible names, hints and a polite live announcement per stage. Removing visible text never removes the way in for someone who cannot see the screen. Every gesture has a keyboard path (Enter sends, Escape closes) and Reduced Motion turns the movement off.

How a quest is drawn comes from `vocab.ts` (`glyphsFor(quest)`), never from a screen: category tone (the same four the map uses: service, access, station, verify), kind icon, line dots, urgency (0 to 3), coins, done stamp. Change the look in one place and every screen still says the same thing.

## Files
| File | What it is |
|---|---|
| `machine.ts` | The journey as a pure reducer: stages, events, rules. No React, no words, no styling. |
| `layers.ts` | `layersFor(state)`: what is visible and which gestures are live per stage. |
| `policy.ts` | Every tunable number (pause before auto-check, hold time, swipe distance), the auto-check rule, `suggestNext`. |
| `vocab.ts` | The wordless vocabulary: quest to glyphs. |
| `content.ts` | The only words: screen-reader names and announcements. |
| `useJourney.ts` | The reducer as a React hook (stable action functions). |
| `gestures.ts` | `usePressHold` (hold to send) and `useDismiss` (swipe or Escape), headless. |
| `JourneySurface.tsx` | The layout contract. |
| `demo/` | PLACEHOLDER visuals for `/journey`. Replace, do not extend. |
| `check.mjs` | Dev check (no test runner needed): `node --no-warnings src/features/journey/check.mjs`. 17 scenarios plus a fuzz of 4,000 random journeys that hunts for impossible states. |

## How it maps onto the map that exists today (`features/explore`)
| Journey | Today |
|---|---|
| `select(questId, mode)` | tapping a pin in `ProblemMarker` / the ticket |
| `layers.sheet` | `ContributePanel` open or closed (its `quest` prop) |
| `drafting` / `reviewing` / `revising` / `ready` | the steps of `ReportFlow` (`useReport` from `features/challenge`) |
| verify + `commit` | `VerifyFlow` |
| `reward` | `Celebration` |
| `done` ids | `progress.ts` (from `/api/submissions`) |
| `parkedQuestId` | a quiet mark on the pin |

## Wiring real data
The check and the save are stand-ins in the demo. In the real app:
- every change in the writing area: `draft(hasText || hasPhoto)`
- `useReport`'s check starting: `reviewStarted()`; its answer: `reviewResult("passed" | "needs_work" | "failed")`
- the hold completing: `commit()`; after `/api/submissions` (or `/api/verifications`) answers ok: `completed(tokens)`; on an error: `sendFailed()`
- `policy.shouldAutoReview(...)` decides when the pause is long enough to start the check by itself.

The report rules (what counts as a pass, tokens, one reward per quest) stay on the server and in `features/challenge`. This machine only mirrors their outcomes, and ignores any event that makes no sense in the current stage (a late answer, a double tap), returning the same state.

## Adopting it
1. Owner of `src/app/page.tsx`: render `<JourneySurface journey={useJourney()} map={<the real map />} sheet={<the sheet />} overlay={<the reward />} />` in place of what is there. One file.
2. Replace `demo/Field`, `Sheet`, `Reward` with real visuals. Keep the wiring above.
3. Move any screen text into `content.ts` (screen-reader only) and take icons and colours from `vocab.ts`.

## Conflict policy (why this does not collide with other work)
- This folder and `src/app/journey/page.tsx` are **new files only**. It edits no shared file: not `layout.tsx`, `globals.css`, `page.tsx`, the nav, `config.ts`, `package.json`, `TEAM.md` or `docs/DECISIONS.md`. Decisions are listed below instead, for that reason.
- It imports only the `Quest` type from `@/lib/mbta`. It does not import `features/explore` or `features/challenge`, so neither can break it, and it cannot break them. The mapping above is by contract, not by import.
- Colours in the demo use semantic and `cat-*` tokens only. If the palette changes, the demo looks different; nothing else is affected.
- To adopt it in `features/explore`, add to it (swap what drives the panel) instead of rewriting it, and tell its owner.

## Decisions made here (not in `docs/DECISIONS.md`, to avoid a shared-file conflict)
- The flow is a pure state machine, so any look can sit on it and the rules stay in one place.
- Visible UI has no words; words live only in `content.ts` for assistive technology.
- Hold to send, swipe or Escape to close, tap the ring to retry. Each has a keyboard path.
- The AI check starts by itself after a pause (`policy.autoReviewIdleMs`, `autoReviewMinChars`).
- Dismissing a draft parks it instead of discarding it.

## Open questions for the team
- **Auto-check cost:** a check per pause means more Gemini calls than a button. The minimum-length rule and "only after a change" limit it; confirm the limit with the data owner.
- **Verify has two answers** (works / still broken) but one gesture. The demo only confirms "works". Candidates: hold to confirm "works", a short flick sideways for "still broken".
- **What replaces My Journey and Collection** when there are no tabs? The done stamps on the map are the natural home; a pull-down view of the stamps is the other option.
- **First-run hint:** one gentle pulse on a problem, then none. Needs a design.
- **The map's own labels** (street names) are drawn inside the map image, so a "no text" map needs a label-free style.

## Not done
- The map is a placeholder; the real one is Rachel's.
- The check and the save are stand-ins; the real ones are `useReport` and `/api/submissions`.
- No automated tests run in CI (there is no test runner on `main` yet; see PR #13). `check.mjs` covers the logic until then, and its cases move into a `*.test.ts` as they are.
- Checked in a desktop browser and an emulated phone, not on a real phone.
- `screenshots/` holds the PR screenshots only; safe to delete after merge.
