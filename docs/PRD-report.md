# PRD: Report (Tada)

Status: v1 for the Nov 22 demo. Owner: TBD. Spec details live in `src/features/report/README.md`; every edge case is logged in `src/features/report/EDGE-CASES.md`.

## 1. Problem
Reporting a problem to the city (pothole, broken light, litter) feels like shouting into a void: you file it and never learn who acted. People stop reporting. Boston's 311 data is public, but nobody shows a resident what happened to *their* report.

## 2. Promise
**Get a problem in your neighbourhood to the right city team in under a minute, then see who fixed it.**
The answer coming back is the value. Capture is the fast front door; tracking is the reason to return.

## 3. Users
- College students and residents who notice small problems while walking (the hackathon prompt: "popular complaints about living in Boston").
- They have a phone, a few minutes, and low patience. No account, no form.

## 4. Goals and non-goals
Goals
- Photo to sent in under 60 seconds.
- Only real, current, city-fixable reports are sent.
- The user can always see what the city did, in the city's own words.
- Duplicates are followed, not re-filed.

Non-goals (v1)
- Accounts or login (cases are kept on the device).
- Push notifications (in-app badge and card only).
- Photo upload from the gallery.
- Editing someone else's case; chat with the city.
- Leaves/stamps awards (waits on the open "leaves vs tokens" decision; the case state exposes the events a reward would hook into).

## 5. Core flow
1. **Capture**: live camera, one photo. Location is read at the shutter press.
2. **Check (AI)**: verdict `fixable | private | unclear | emergency`, a reason, a 311 category, and a draft description.
3. **Duplicate check**: open 311 case of the same category within about 50 m. Follow it, or say "not the same".
4. **Edit and send**: editable category and description; fixed pin; shows the team it goes to; anonymous.
5. **Track**: three stages (Submitted, In progress, Closed) from the city's data. Cases whose stage changed since you last looked float to the top with an "Update" mark.
6. **Closure card**: team, the city's own note, and the closure reason verbatim. Say "Closed by <team>" by default. Say "Fixed by <team>" only when the closure reason is `Resolved` AND the note names a repair (see `closure.ts`). Closed is not the same as Fixed.

## 6. Requirements

| # | Requirement | Priority |
|---|---|---|
| R1 | Live camera only; no file input anywhere in the flow | Must |
| R2 | Location read at shutter; require accuracy of about 50 m or better, and a point inside Boston | Must |
| R3 | AI verdict with a reason; private/unclear/emergency never reach 311 and cannot be overridden | Must |
| R4 | Emergency shows "Call 911" and is never filed | Must |
| R5 | Category must be one of Boston's real `service_name` values; never invented | Must |
| R6 | Duplicate check against Analyze Boston (same category, about 50 m, not Closed) | Must |
| R7 | Editable draft; pin and photo are not editable | Must |
| R8 | Send is idempotent, and "Sent" is shown only when it was | Must |
| R9 | Case list stored on the device; status refreshed from 311 data | Must |
| R10 | Closure card uses the city's words; "Fixed" only when reason is `Resolved` and the note names a repair; otherwise "Closed" | Must |
| R11 | If any check cannot run, nothing is sent and the draft is kept | Must |
| R12 | Rate limit repeated tries per device | Should |
| R13 | Warn when the description contains a phone number or email | Should |
| R14 | Leaves awards | Later |

## 6b. Experience (photo-first, AI-guided)
Journey: Entry, Camera, Photo, Analyzing, Result (or a safety state), Guided action, Activity.

- **Entry:** one headline, one line, one primary action. "Your activity (n)" appears only when there is something to show.
- **Permissions** are explained before they are requested, and never on page load.
- **Analyzing** is a plain "Looking at your photo..." with no fake progress.
- **Result** chooses its layout from the real backend answer:
  A. Boston 311 matter, no nearby case: Boston 311 is the channel; primary action "Prepare my report".
  B. A similar open case is nearby: primary action "Follow existing case". Shown as "possibly the same": place and type cannot prove two reports are one problem.
  C. Belongs to another authority: MBTA has a verified channel (MBTA customer support). Any other authority is shown as an unverified guess with a plain limitation and a pointer to Boston 311. We never invent a destination.
  D. Private property or unusable photo: reason, nothing sent, "Take another photo".
  E. Emergency: "Call 911", nothing filed.
  F. AI unsure: the closest categories as simple choices; the person must choose before continuing.
  G. Location or service error: a recoverable message, nothing sent.
- **Guided action:** prefilled, editable. The main action is "Copy & open Boston 311" (Tada cannot submit). "Save demo report" is separate, local, and labelled.
- **Activity:** "Following" (real Boston 311 cases, real statuses) and "Saved demos" (local, simulated). The two are never mixed, and a simulated status is never presented as a city update.
- **Ask Tada:** a small bottom sheet that sees only what the photo analysis found and verified nearby cases. It answers from that or says it has no verified information and points to a verified official page. It never states live station status.
- The AI only suggests; likely teams are guesses; nothing is saved until the person says so.

## 7. Data (verified 2026-11-21)
Source: Analyze Boston, "311 Service Requests – NEW SYSTEM", datastore API.
- Fields used: `case_id`, `open_date`, `close_date`, `service_name`, `assigned_team`, `case_status`, `closure_reason`, `closure_comments`, `latitude`, `longitude`.
- `case_status`: In progress, Closed (rare: Submit, Create, Needs Reallocation, Error). Public data has no "in review/approved".
- `closure_reason` on recent closed cases: Resolved, Noted, Transitioned, or empty. Only Resolved is "fixed". Noted means the city acknowledged it; Transitioned means it moved to another process.
- `submitted_photo` / `closed_photo` are always empty, so duplicates match on place and category only.
- Latitude and longitude are text: cast to float in SQL.

## 8. Honesty and privacy
- **Sending is simulated in v1.** No outside-app submission route to Boston 311 was found (Open311 returned 503). A simulated case is labelled "Demo case: not sent to the city". Real data is used for duplicates, for the status of followed real cases, and for the wording of closures.
- Location is sent to our server to look up nearby cases (this reverses the old "never sent" rule; logged in `DECISIONS.md`). Tada does not store it; the host may keep ordinary request logs. The photo is sent to Google's Gemini API for the check and is not saved by Tada. Saved cases (with their location and a small thumbnail) live in the browser only.
- Reports are anonymous: photo, location, description only.
- The app never claims the city received, reviewed or accepted something it did not.

## 9. Demo plan
- Happy path: photo of a pothole or litter, verdict `fixable`, a real duplicate nearby (follow it), and a simulated case that moves Sent, In progress, Closed in about a minute with a real-style note.
- Negative path: a selfie (`unclear`) and a parking-lot photo (`private`), both explained, nothing sent.

## 10. Success measures (demo)
- A first-time user completes photo to sent in under 60 seconds.
- Every rejection shows a reason and a next step.
- A closure card appears with a team and a note.

## 11. Open decisions
1. Real submission route (needs a Boston 311 partner or an official channel).
2. Leaves vs tokens and when they are awarded.
3. Seeded demo case timing.
