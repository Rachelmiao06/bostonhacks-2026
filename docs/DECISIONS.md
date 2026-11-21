# Decisions

One line each: date · what · why.

- 2026-11-21 · Next.js 16 + Tailwind + shadcn/ui on Vercel · fastest path to a live demo link.
- 2026-11-21 · Placeholder name `bostonhacks-2026` and pages Home / Main app / About · idea not picked yet; rename later.
- 2026-11-21 · Board-game look: one dark "game table" theme (no light/dark toggle), Fredoka + Press Start 2P fonts, 3D feel from solid navy offset shadows and CSS 3D dice · matches the cover-art and toy-piece reference photos; all colours live as tokens in `globals.css`.
- 2026-11-21 · Idea picked: T Party (gamified MBTA feedback) · see docs/SPEC.md.
- 2026-11-21 · Keep Next.js instead of the spec's React + Vite · the repo, CI and Vercel setup already exist on Next.js.
- 2026-11-21 · Renamed `main-app` to `explore`, route `/app` to `/explore`, and added `my-challenges`, `rewards`, `challenge` folders · they match the five screens in the spec.
- 2026-11-21 · No `/challenges/[id]` route yet · Cache Components needs `generateStaticParams` or Suspense for dynamic routes; the challenge owner decides how.
