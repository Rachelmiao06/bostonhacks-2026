# Challenge diorama (isolated test)

What: a living miniature station that reacts to the rider's answers in the mission. Test page: `/lab/diorama` (not linked, not indexed).
Status: rough test only. NOT in the real Challenge flow. The real flow (`features/missions/`) is untouched.

## What it shows
- The questions are the real mission wording and the real `Choice` / `Primary` buttons. The scene only reacts.
- Step 1 answer: sky (day or dusk) and the station appear. Step 2 answer: elevator light and movement (works / out / couldn't tell). Step 3: rider, and a note bubble as soon as there is text.
- Sharing: a dashed seal outline breathes while saving. The seal, frame and finish happen ONLY after the (simulated) server says saved. A failure keeps the outline, shows the error and offers "Try again".
- Reduced Motion: states appear in place, no travel, flicker or tilt. Light colour and the barrier still carry the meaning.

## Files
- `Diorama.tsx`: the scene. GSAP timelines for the beats, a pointer-depth drift. Layers are listed in `LAYERS` (positions in a 420 x 400 stage).
- `DioramaLab.tsx`: the test page with switches (Reduced Motion, Slow-mo, server fails on next share).
- `ASSET-PROMPTS.md`: prompts for the art still missing.
- Art: `public/assets/challenge-diorama/*.webp`, ROUGH cut-outs of the desktop sheet. Replace file for file with the final layers.

## To go into the real flow
Pass `when`, `status`, `rider`, `note` and the real save state into `<Diorama />` from `useMission`. The saved state must come only from the server's success. No rule moves into this folder.
