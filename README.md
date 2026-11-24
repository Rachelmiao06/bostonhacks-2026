# Tada

**Live demo: https://bostonhacks-2026.vercel.app** · Built for BostonHacks 2026

Your elevator is out again. You tell nobody, because you don't know who to tell. The MBTA posts an alert, the city has a 311 site, and a rider's note usually lives in neither. Tada puts all of it on one map and turns a quick report into something you can see, check and feel good about.

You open a pixel map of the T, find a real problem near you, report it, check whether it's fixed, and watch a small knitted world grow with every real thing you do.

![Tada mission, desktop](docs/screenshots/missions/after-desktop-2-overview.jpg)

## What Tada does

Tada has three parts that work as one loop: **Explore** finds the problem, **Reports and missions** let you act on it, and **My Little World** is what you get back.

### Explore: one map for what is broken right now
- A pixel map of the T in line colours. Every pin is a real MBTA alert: elevator, escalator, station issue, closure, shuttle or suspension.
- Filter chips by kind, a **Near me** chip that flies to your block, and a 3D world view.
- Pixel landmarks and local food around Boston University. Tap one for a short intro and a link.
- **Trolley chat**: ask a question in the corner and get an answer about finding missions, writing reports and rewards.
- **Coach**: the first time you open the app, a short guide explains the four kinds of problem and points a ring and a dotted line at the nearest pin.

### Reports: take a photo, get it written up, send it to Boston 311
1. **Take a photo.** The camera is live, one photo only, and Tada reads your location when you press the shutter. It has to be a spot inside Boston.
2. **Tada checks it.** The AI sorts the photo into fixable, private, unclear or emergency, and gives a plain reason. A photo of a screen or a printed picture is judged by what it shows, not turned away. Fire, injury or a gas smell is never filed: you see "Call 911".
3. **Edit the draft.** Tada picks a Boston 311 category and writes a description. You can change both. The pin stays where you took the photo.
4. **Check for duplicates.** If an open case of the same kind is within about 50 metres, you can follow it instead of filing again. If you think it's a different problem, you can still file.
5. **Send it yourself.** Tada opens the right Boston 311 form with your description already filled in. You add the photo and place, and submit.
6. **Follow it.** Progress comes from Boston's real 311 data in three stages: Sent, In progress, Closed. When a case closes, you see the team and the city's own words. Tada says "Fixed by" only when the note says it was fixed.

If any check can't run (the AI is down, the 311 data is down, no location), nothing is sent unchecked. Tada saves your draft instead.

### Missions: help with a problem that is already there
Tap a pin and take a short three-step mission: when you saw it, what you saw, and an optional note and photo. The questions change by kind of alert. For an elevator it asks whether it works, is out, or you couldn't tell. You can also do a quick "check it's working again" for elevators and escalators the MBTA closed in the last day.
- The text Tada saves is built only from your answers and the verified alert, so nothing can be invented.
- "Done" appears only after the server confirms it saved.
- Behind the question card, a miniature station reacts to your answers: the sky changes, the elevator light turns on or off, a rider appears, and a seal stamps when it's saved.
- Each rider can complete a mission once.

### My Little World: what you get back
Every real action adds a piece to a knitted island. The island has 12 steps: a bare quilt at the start, then grass and flowers, a tree, pines, stones, a cottage, a sheep, a flock, a bridge, a kite and laundry, and clouds. When you finish a mission, you see the new piece float in and then choose to visit your world or do more.
- Pull the loose thread to knit the island in. There is a keyboard option for people who can't drag.
- A journal keeps your reports and checks, with a month calendar and stickers on the days you did something.
- Small local gifts can wait on the island.
- Sounds are soft and optional, and Reduced Motion is respected.

The look is warm and soft on purpose, so it feels like thanking you, not like a form.

### Stats: what the city is doing
A numbers page shows how long MBTA elevators and escalators stay broken, repeat offenders and busiest stations. It uses medians, so a few outages that last years don't distort the numbers. Sample numbers are always labelled as samples.

## What is real and what is not

- The MBTA alerts and the Boston 311 history are real data.
- "Completed in Tada" does **not** mean the MBTA or the city received anything. Tada never submits a report for you. It opens the official form and you send it.
- Missions made by Tada are labelled unofficial. We never invent official campaigns or deadlines.
- The AI helps you write a clearer report. It never says a photo proves a fact.
- Demo mode (`?demo=1`) uses a fixed Boston spot and a sample case, and saves a demo report instead of opening 311, so the demo works without live data.
- Photos are not stored on our server. We keep only a note that a photo existed.

## How we built it

**MBTA API.** Live alerts become the pins on the map. We cache them for 5 minutes and fall back to a saved snapshot, so the demo never depends on the MBTA being up. A scheduled job (`.github/workflows/sync.yml`) refreshes every 5 minutes so fix times stay accurate when nobody is using the app.

**Boston 311 open data (data.boston.gov).** We query past 311 reports near a spot to warn about duplicates and to follow a case to its closure note, and we open the 311 form with your description filled in. If the check can't run, the screen says so and never claims there are no duplicates.

**Gemini.** One model reads your photo and text and returns scores. A report passes when every score is 3 out of 5 or more. That rule lives in the server code, and only the review route can save an AI result, so neither the browser nor the model can grant a pass. We try a fast lite model first and fall back to bigger ones. Checks are capped at 20 per rider and 60 per network address per hour (the address is stored only as a hash). Gemini also powers the trolley chat, which falls back to a built-in guide if it's unavailable.

**Tiger Data (Postgres).** Reports, verifications and the MBTA alert history live in one shared database. Rewards are counted from completed missions, not stored, so a rider can't earn the same one twice. We loaded 26,300 closed outages from the MBTA's public alert archive to measure time-to-fix.

**MapLibre and Three.js.** MapLibre draws the pixel map and the 3D world view, including Boston University landmarks. Three.js draws My Little World, adapted from [Yarn World by Kris Yang](https://github.com/krisyangdev/yarn-world) (MIT). We load the 3D code in parallel and the sounds after the island appears, cache assets for a day, and stop rebuilding the scene on every visit so it stays fast on phones. The trolley chat adapts parts of [LEGATO](https://github.com/Feegoat06/LEGATO) (MIT).

**Next.js on Vercel.** The app and its server routes. API keys live only in server routes and in Vercel's settings. Every response carries security headers.

## Run it on your laptop

```bash
npm install
npm run dev
```

Open http://localhost:3000. Copy `.env.example` to `.env.local` and fill in the keys you have. Only the database and Gemini keys are needed for the full flow. The MBTA key and the Google Places key are optional.

## Where things are

- `docs/SPEC.md`: what Tada is and is not.
- `docs/DECISIONS.md`: one line per decision, with the reason.
- `src/features/<name>/`: one folder per feature, each with its own README.
- `TEAM.md` and `CLAUDE.md`: how we worked together.
