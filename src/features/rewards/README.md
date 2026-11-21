# Rewards

What: token balance, earning history and the pixel reward animation (Screen 5). Route `/rewards`.
Issue: see GitHub issues labelled `rewards`.
Owner: TBD. Only the owner edits this folder.

## Your island (knitted reward world)
`/rewards` shows a knitted island you can play with. It is **Yarn World by Kris Yang** (https://github.com/krisyangdev/yarn-world, MIT),
copied into `island/` (see `island/LICENSE-yarn-world`) and adapted to mount inside a page.
- `Rewards.tsx`: the page. Reads completed stops from `features/explore/progress.ts` and shows the progress card.
- `content.ts`: all text and `unlockTiers`: what each completed stop knits in (1 stop = first tier, 5 stops = everything).
- `RewardsLoader.tsx` / `IslandScene.tsx`: load the three.js scene in the browser only and clean it up when you leave.
- `island/`: the original scene. Our changes: `mount.js` (replaces `main.js`), `weave.js` + `world.js` (`isUnlocked` keeps locked pieces hidden),
  `guide.js`, `sound.js`, `ambience.js` (mount and dispose). Sounds are in `public/assets/rewards/sfx/` (CC0).
- The yarn ball and the quilt with its river are always there. The unlock set is read when the thread is pulled.
- "Preview the full island" shows everything without changing real progress (handy for the demo).
- Tokens, history and the reward claim are still to come; the island is the reward world they will feed.
