# BostonHacks 2026 project

Hackathon project, Nov 21–22, 2026. Two people, one repo. Read `TEAM.md` for owners and the loop.
Also read `AGENTS.md` (Next.js 16 notes: check `node_modules/next/dist/docs/` before using an API).

## Stack
Next.js 16 (App Router, TypeScript), Tailwind v4, shadcn/ui. Deployed on Vercel from `main`.

## Folders
- `src/app/<route>/page.tsx`: thin routes. They import from `features/`, no feature logic.
- `src/features/<name>/`: one folder per feature. Component, `content.ts` (text and settings), README. One owner per folder.
- `src/components/ui/`: shadcn primitives. `src/components/shared/`: our reusable parts (nav, footer).
- `src/lib/`: one file per outside tool (`config.ts` now; `db.ts`, `ai.ts` when needed). Secret keys only in `src/app/api/`.
- `public/assets/<feature>/`: images and sounds per feature.
- `docs/DECISIONS.md`: one line per decision a later session might undo.

## Style rules
- Colours, fonts, radius only from tokens in `src/app/globals.css`. No typed-in colours.
- Reuse `components/ui` and `components/shared` before making a new component.
- A feature never edits another feature's folder.

## Shared files (say so before touching, tell the teammate)
`src/app/layout.tsx`, `src/app/globals.css`, `src/components/ui/*`, `src/components/shared/*`, `src/lib/*`,
`package.json`, `CLAUDE.md`, `TEAM.md`, `.github/*`.

## Standing rules
- After every meaningful change that works, commit with a descriptive message.
- Check which branch you are on before editing. Never build features directly on main.
- One feature = one folder in features/ = one branch = one PR. Say so before touching a shared file.
- When a task is done: pull main into the branch, push, open a PR from the template with screenshots and Closes #n, give the preview link. Never merge without the owner's yes.
- Never commit .env or any key. Keys go in .env.local and in Vercel → Settings → Environment Variables; names go in .env.example.
- Rachel does not use the terminal: run commands yourself and explain each step in one plain sentence.
