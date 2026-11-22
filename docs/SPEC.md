> **Note:** this is the original day-one spec. The product has changed since (a real map instead of a pixel-art one, My World, Report, Tiger Data). Where they differ, the [README](../README.md) and [DECISIONS.md](DECISIONS.md) are current.

# Spec: Tada ("Make every ride count")

Tada turns feedback on Boston's public transit into a game. College students and everyday MBTA riders explore a pixel-art map of the T, find challenges (real transit issues), write feedback with text, a photo, or both, get coaching from an AI reviewer, and earn tokens.

Demo: Sunday Nov 22. Freeze `main` 30 minutes before. The demo script is 2 minutes or less and does not depend on live MBTA data.

## Flow
Explore, discover a challenge, submit feedback, AI review, complete, track, earn rewards. Build one full loop first.

## Screens (see the feature folders)
1. Explore: pixel map, MBTA line colours, challenge markers. `features/explore`
2. Challenge details: background, source, station, instructions, deadline, token reward. `features/challenge`
3. Submit feedback: one form for every challenge (text, one photo, or both), "Check with AI", revise and re-check. `features/challenge`
4. My World (replaces My Challenges and Rewards): the knitted island as the whole screen; contributions grow it; a small gift can wait on it. `features/island`

## Two kinds of challenge, always labelled
- Official Opportunity: a real, verifiable MBTA request for public input.
- Community Mission: created by Tada around a real problem. Must say it is unofficial.

## Honesty rules
- The AI improves quality. It never confirms facts and never says a photo proves anything.
- "Completed in app" never means the MBTA received it. Clicking an external link never marks anything as officially submitted.
- Never invent official campaigns, deadlines or submission channels. Demo photos are labelled as samples.
- Editing text or photo invalidates the previous AI check. Tokens are awarded once per challenge.
- Reduced Motion: show a static reward message instead of the animation.

## Non-goals
Auto-submitting to the MBTA, official ticket tracking, replacing official channels, full MBTA coverage, real rewards, accounts and social features, native apps, boss battles.

## Data model
Types live in `src/lib/types.ts`: Station, Challenge, Submission, Photo, UserState, RewardEvent.
Seed data: 3-4 hand-curated challenges as JSON. User state in localStorage. Photo files in IndexedDB, not localStorage.

## Stack
Next.js 16 (App Router), Tailwind v4, shadcn/ui, Vercel. The original draft said React + Vite; the team repo is Next.js, so we keep it. Planned: PixiJS (map), Motion (animation), a multimodal AI model (TBD, called only from `src/app/api/`).

## Open decisions
- Are both Official Opportunities and Community Missions in the MVP?
- Which AI model reads text and images?
- When exactly are tokens awarded?
- Photo size limit and storage.
- Which 3-4 real MBTA issues to use.
- Owners and timeline for each folder.
- Pixel map visual style and references.
