# Team

| Page | Route | Folder | Owner |
|---|---|---|---|
| Home | `/` | `src/features/home/` | TBD |
| Explore (pixel map) | `/explore` | `src/features/explore/` | TBD |
| My World (the knitted island, whole screen) | `/world` | `src/features/island/` | Rachel |
| Challenge details + submit | `/challenges/[id]` (not created yet) | `src/features/challenge/` | TBD |
| About | `/about` | `src/features/about/` | TBD |

Fill in owners once you decide who does what. Add a page = add a row, a route and a folder (on its own PR).

## The feature loop (every page, both people)
1. Switch to `main` and pull.
2. New branch `<firstname>/<page>` from fresh main.
3. Build only inside your `features/<name>/` folder and its route. Shared file? Tell your teammate first.
4. Commit every time something works.
5. Check it at localhost (desktop and phone width).
6. Done: pull latest `main` into your branch; resolve conflicts together, never silently.
7. Push and open a PR from the template: what changed, screenshots, `Closes #<issue>`.
8. Wait for CI (green check) and the Vercel preview link on the PR.
9. Merge after a look at the preview. Then everyone pulls `main` into their branch.

## The six rules
1. Skeleton first, together second.
2. One page = one branch = one PR, merged within a few hours.
3. Shared files: say it before you change it.
4. Every new branch starts from freshly pulled `main`.
5. Secrets go in Vercel and a private message, never in GitHub.
6. Freeze `main` 30 minutes before the demo: small safe fixes only.
