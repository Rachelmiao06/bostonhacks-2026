# Challenge diorama (isolated test)

What: a living miniature station that reacts to the rider's answers in the mission. Test page: `/lab/diorama` (not linked, not indexed).
Status: rough test only. NOT in the real Challenge flow. The real flow (`features/missions/`) is untouched.

## What it shows
- The questions are the real mission wording and the real `Choice` / `Primary` buttons. The scene only reacts.
- Step 1 answer: sky (day or dusk) and the station appear. Step 2 answer: elevator light and movement (works / out / couldn't tell). Step 3: rider, and a note bubble as soon as there is text.
- Sharing: a dashed seal outline breathes while saving. The seal, frame and finish happen ONLY after the (simulated) server says saved. A failure keeps the outline, shows the error and offers "Try again".
- Reduced Motion: states appear in place, no travel, flicker or tilt. Light colour and the barrier still carry the meaning.

## Camera (2.5D)
Each question moves the camera in on its object (sky and station, the landmark, the rider). After the server confirms, the camera waits for the seal, then pulls back, tilts down and turns slowly around the whole scene. Layers sit at different depths (CSS 3D), so the turn shows parallax. It is not a real 3D scene: it cannot go behind objects. Reduced Motion gets the final angle as a still view.

## Files
- `Diorama.tsx`: the scene. GSAP timelines for the beats, a pointer-depth drift. Layers are listed in `LAYERS` (positions in a 420 x 400 stage).
- `DioramaLab.tsx`: the test page with switches (Reduced Motion, Slow-mo, server fails on next share).
- `ASSET-PROMPTS.md`: prompts for the art still missing.
- Art: `public/assets/challenge-diorama/*.webp`.
  - NEW generated pieces (cut out from white backgrounds): `base-tile`, `tower`, `door-a`, `lamp-*`, `rider`, `rider-walk`, `escalator`, `gate-open`, `gate-closed`, `bus`, `train`, `signpost`.
  - Still ROUGH, from the first sheet (different, softer look): `building`, `sky-day`, `sky-dusk`, `bubble-note`, `bubble-question`, `sign`, `seal`, `frame`, `puff-*`, `spark-*`. Replace file for file.
  - Unused for now: `lamp-off` (the tower's own dome shows instead).
- The lab has a Category switch (elevator, escalator, gate, shuttle bus, train, sign): one `LANDMARKS` entry per category in `Diorama.tsx`.

## To go into the real flow
Pass `when`, `status`, `rider`, `note` and the real save state into `<Diorama />` from `useMission`. The saved state must come only from the server's success. No rule moves into this folder.
