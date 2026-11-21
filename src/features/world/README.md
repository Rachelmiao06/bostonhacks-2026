# My World

What: one page that replaces My Journey, Collection and the standalone island. Route `/world`.
Owner: Rachel. Only the owner edits this folder.

## What is on the page
- **Island** (`features/island`, `<Island>`): the whole screen. Opening My World is walking into it. It grows with the rider's stamps, exactly as before.
- **Panel**: two pills (My journey, Community) and a token chip float over the island; a pill opens a side panel (bottom sheet on phones) that closes with X or Esc.
- **Totals**: tokens, stamps, and like stamps received. All counted by the server (`/api/submissions`), never here.
- **My journey tab** (`Journey.tsx`): the rider's tickets: drafts, completed reports (with the like stamps other riders pressed), fixes checked.
- **Community tab** (`Community.tsx`, `useCommunity.ts`, `LikeStamp.tsx`): what other riders wrote on completed reports, newest first. Press a like stamp on one.

## Like stamps
- `GET /api/community?userId=`: completed reports that passed the AI check and have text. No rider id leaves the server; each author is a 4-letter anonymous handle.
- `POST /api/likes {submissionId, userId}`: one stamp per rider per report, never removed, never on your own report.
- The author earns `LIKE_REWARD_TOKENS` (1) per stamp. Tokens are counted from the `likes` table in `/api/submissions`, not stored.
- The `likes` table is in `src/lib/data/schema.sql`. Run `node --env-file=.env.local scripts/db-setup.mjs` once per database. Until then the app works and the Community tab says it is not set up.

## Old routes
`/my-challenges`, `/rewards` and `/island` redirect here (`next.config.ts`).
