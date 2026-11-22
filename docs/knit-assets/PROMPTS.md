# Tada knitted art: image-generation handoff

Everything needed to generate the rest of the knitted wool art for the Report experience, in one place.

## 0. The three steps

1. **Generate** each sheet below. For every sheet, attach **two kinds of images** to the generator (paths in section 1):
   - the **style anchor** (always the same one), and
   - the **page reference(s)** listed for that sheet: a screenshot of the app screen with the asset's slot outlined in magenta and labelled (A1, A2, ...).
   Then paste **REFERENCE BLOCK + STYLE BLOCK + that sheet's prompt**.
2. **Save** each result in the drop folder (section 1) using the exact filename given for the sheet.
3. **Tell me**: "assets are in `<path>`". I crop each item, clean the edges, save web-ready files into `public/assets/`, wire them into the screens, test desktop and mobile, and update the PR.

Do the sheets in order (A1 to A13). Send me **A1 to A11 first**; A12 and A13 can wait until you have seen the first result.

## 1. Folders and paths

Base folder (the project's working copy):

```
/Users/mac/dev/bostonhacks-2026/.claude/worktrees/t-party-redesign-first-pass-d65a15/docs/knit-assets
```

| What | Path (inside the base folder) |
|---|---|
| **Style anchor** (attach to every generation) | `reference/00-style-anchor.jpg` |
| **Page references** (slot outlined and labelled) | `reference/pages/*.png` (listed per sheet below) |
| Same screens without markings | `reference/raw/` and `../report-screens/` |
| **Drop folder: save your generated images here** | `incoming/` |

Full drop-folder path:

```
/Users/mac/dev/bostonhacks-2026/.claude/worktrees/t-party-redesign-first-pass-d65a15/docs/knit-assets/incoming
```

If it is easier to save elsewhere (for example the Desktop), that is fine: just give me that folder path instead.

## 2. The two blocks (paste before every sheet prompt)

**REFERENCE BLOCK**

```
REFERENCE IMAGES: I attached two kinds of images.
Image 1 is the STYLE reference. Copy it exactly: the chunky knit and crochet look, the yarn thickness, the stitch size, the colours, the soft top-left lighting, the puffy stuffed volume.
The other image(s) are screenshots of the app screen where each item will be placed. Magenta dashed boxes mark the slots; each label (A1, A2, ...) is the item ID. Use them ONLY to judge the size, proportion and placement of each item. Do NOT draw the screen, the interface, the magenta boxes, the labels or any text. Output only the knitted items.
```

**STYLE BLOCK**

```
STYLE: chunky hand-knitted and crocheted wool objects, clearly visible stitches, soft fuzzy fibres, slightly puffy stuffed volume, macro studio-render look, soft diffused light from the top-left, gentle shading only on the object itself. Palette only: cream yarn #F3EAD3, olive green #4A7A3A, light sage green #A9C57A, tomato red #E4573D, mustard yellow #F0B429, sky blue #8CC3D9, dark brown yarn #4A3B2A for stitched line icons. The same yarn thickness and stitch size across every item. Flat front view unless told otherwise.

OUTPUT: PNG with a TRANSPARENT background (alpha). If transparency is not possible, use a perfectly flat solid #FF00FF magenta background with no gradient, no vignette, no glow and no floor shadow.

HARD RULES: no text, no letters, no numbers, no logos, no watermark, no baked drop shadow on the background, no glow or bokeh behind objects, no extra props, no hands, no people, no photo background. Each item sits fully inside its own grid cell with at least 15 percent empty margin on every side; items never touch or overlap.
```

## 3. Index

| ID | Save as (in `incoming/`) | Canvas | Used for | Page references to attach (`reference/pages/`) | Priority |
|---|---|---|---|---|---|
| A1 | `a01-camera-hero.png` | 2400 x 2000 | Entry hero, high-resolution redo | `01-entry-mobile.png`, `03-entry-desktop.png` | 1 |
| A2 | `a02-button-plates.png` | 1600 x 1700 | Blank button plates (the code puts the text on top) | `01-entry-mobile.png`, `05-photo-confirm-desktop.png`, `08-result-mobile.png`, `14-prepare-mobile.png` | 1 |
| A3 | `a03-camera-controls.png` | 1536 x 512 | Shutter, close, back | `04-camera-mobile.png` | 1 |
| A4 | `a04-stage-markers.png` | 1200 x 1000 | Case progress markers and connectors | `19-activity-timeline-mobile.png` | 1 |
| A5 | `a05-verdict-illustrations.png` | 2400 x 800 | Emergency, private property, unclear photo | `12-verdict-emergency-mobile.png`, `11-verdict-private-mobile.png`, `13-verdict-unclear-mobile.png` | 1 |
| A6 | `a06-success-badge.png` | 1200 x 1200 | "Saved" and "Following" screen | `15-saved-success-mobile.png` | 1 |
| A7 | `a07-icon-discs.png` | 1200 x 1200 | Small icon discs | `06-permissions-mobile.png`, `08-result-mobile.png` | 2 |
| A8 | `a08-mascot.png` | 1000 x 1000 | Ask Tada avatar | `18-ask-tada-mobile.png` | 2 |
| A9 | `a09-empty-error-states.png` | 2400 x 800 | Empty and error states | `16-activity-empty-mobile.png`, `17-error-mobile.png` | 2 |
| A10 | `a10-other-authority-building.png` | 1200 x 1200 | "Belongs to someone else" | `10-other-authority-mobile.png` | 2 |
| A11 | `a11-landscape-strips.png` | 1700 x 1800 | Bottom-of-screen landscapes | `02-entry-bottom-mobile.png`, `07-analyzing-mobile.png`, `03-entry-desktop.png` | 2 |
| A12 | `a12-category-icons.png` | 1800 x 1200 | Boston 311 category badges (6 most common) | `08-result-mobile.png`, `09-pick-category-mobile.png` | 3 |
| A13 | `a13-yarn-ball-frames.png` | 3600 x 600 | Rolling yarn ball animation frames | `07-analyzing-mobile.png`, `20-island-loading-mobile.png` | 3 |

## 4. Sheet prompts

### A1: Camera hero (high resolution)
Attach: style anchor + `01-entry-mobile.png` + `03-entry-desktop.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A1. Single item, centered: a knitted cream camera, front view, rounded rectangle body about 4 : 3.2 ratio, a small olive-green knitted viewfinder bump on the top left, a small mustard-yellow knitted flash button on the upper left of the front, a large lens made of an olive-green knitted ring around a cream ring around a small olive-green knitted centre disc. Three short mustard-yellow knitted dash-shaped sparkle rays at the upper right, slightly separated from the camera. No strap, no text.
Canvas 2400 x 2000 px. The item fills about 75 percent of the width.
Keep the same design as the camera in the style reference, but with finer detail because this is a higher-resolution redo.
```

### A2: Blank button plates (four)
Attach: style anchor + `01-entry-mobile.png` + `05-photo-confirm-desktop.png` + `08-result-mobile.png` + `14-prepare-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A2. Four BLANK pill-shaped knitted button plates, stacked vertically with large gaps, each centered:
1) large olive-green pill, 1200 x 300 px
2) large cream pill, 1200 x 300 px
3) small olive-green pill, 720 x 200 px
4) small cream pill, 720 x 200 px
Every pill: perfectly horizontal, semicircular left and right caps, a raised stitched border running all the way around, a smooth flat knitted centre area with NOTHING on it: no icon, no text, no arrow, no highlight spot. The top and bottom edges use an even repeating stitch pattern so the middle can be stretched horizontally without visible distortion. Slightly puffy, softly raised.
Canvas 1600 x 1700 px.
```

### A3: Camera controls (three discs)
Attach: style anchor + `04-camera-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A3. Three round knitted discs on a 3 column x 1 row grid, each in a 512 x 512 px cell:
1) camera shutter button: a thick cream knitted ring around a plain cream knitted centre disc, no icon
2) close button: a cream knitted disc with a dark brown yarn "X" stitched on it
3) back button: a cream knitted disc with a dark brown yarn left-pointing arrow stitched on it
Canvas 1536 x 512 px.
```

### A4: Case progress markers
Attach: style anchor + `19-activity-timeline-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A4. Three round knitted progress markers on a 3 column x 1 row grid, each in a 384 x 384 px cell:
1) empty: a thin cream knitted ring with a hollow centre
2) in progress: the same ring, half filled with olive-green yarn on the left half and cream on the right half
3) done: a solid olive-green knitted disc with a cream yarn check mark stitched on it
Below them, on a separate row: one straight horizontal strand of plain cream yarn 800 x 64 px, and one straight vertical strand 64 x 800 px (plain, no knots), for timeline connectors.
Canvas 1200 x 1000 px.
```

### A5: Result-page illustrations (three)
Attach: style anchor + `12-verdict-emergency-mobile.png` + `11-verdict-private-mobile.png` + `13-verdict-unclear-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A5. Three illustrations on a 3 column x 1 row grid, each in an 800 x 800 px cell. Each is one knitted object with a small mustard-yellow dash accent:
1) emergency: a knitted tomato-red warning triangle with a cream knitted exclamation mark (a bar and a dot), slightly tilted
2) private property: a short section of knitted cream picket fence with a small knitted tomato-red circle-with-a-diagonal-slash "no entry" sign hanging on it. The sign has no text.
3) unclear photo: a knitted cream camera with a large mustard-yellow knitted question mark floating above it. Keep all stitches sharp and in focus.
Canvas 2400 x 800 px.
```

### A6: Success badge
Attach: style anchor + `15-saved-success-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A6. Single item, centered: a knitted olive-green round badge with a thick cream yarn check mark, a small cream knitted daisy and a small mustard knitted flower attached at the upper right, and three tiny mustard dash sparkles.
Canvas 1200 x 1200 px. The item fills about 70 percent of the canvas.
```

### A7: Icon discs (nine)
Attach: style anchor + `06-permissions-mobile.png` + `08-result-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A7. Nine round cream knitted discs on a 3 column x 3 row grid, each in a 400 x 400 px cell, each with a simple icon stitched in dark brown yarn. Same stroke thickness and same disc size for all nine:
1) magnifying glass  2) check mark  3) warning triangle with an exclamation mark
4) telephone handset  5) chevron pointing right  6) circular retake arrow
7) shield  8) bookmark  9) speech bubble
Canvas 1200 x 1200 px.
```

### A8: Ask Tada mascot
Attach: style anchor + `18-ask-tada-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A8. Single item, centered: a small friendly knitted mascot. A round tomato-red yarn ball body with two tiny cream knitted eyes (two small ovals, each with a dark brown dot) and a small mustard knitted flower on top. A short red yarn tail curls at the bottom left. A smiling mouth made of one short dark brown yarn stitch.
Canvas 1000 x 1000 px.
```

### A9: Empty and error states (three)
Attach: style anchor + `16-activity-empty-mobile.png` + `17-error-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A9. Three illustrations on a 3 column x 1 row grid, each in an 800 x 800 px cell:
1) no results: a knitted cream magnifying glass with an olive-green rim and an empty lens
2) error: a tomato-red yarn ball that has rolled off a cream knitted patch, with a loose loop of red yarn
3) offline: a cream knitted cloud with a single loose thread hanging down from it
Canvas 2400 x 800 px.
```

### A10: Belongs to someone else (generic building)
Attach: style anchor + `10-other-authority-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A10. Single item, centered: a small generic knitted cream building with a flat roof, three simple olive-green knitted windows and a mustard-yellow door, with a tiny olive-green knitted flag on the roof. The flag is plain: no emblem, no letters, no real organisation's logo.
Canvas 1200 x 1200 px.
```

### A11: Landscape strips (three)
Attach: style anchor + `02-entry-bottom-mobile.png` + `07-analyzing-mobile.png` + `03-entry-desktop.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A11. Three wide knitted landscape strips stacked vertically with large gaps, each 1600 x 520 px, flat front view, flat bottom edge, each with a different wave shape:
1) gentle rolling olive-green hills with a white knitted daisy and a mustard knitted flower on stems
2) low sage-green hills with a thin sky-blue knitted river winding through and two tiny red knitted flowers
3) one smooth olive-green hill with three small mustard knitted flowers in a row
Canvas 1700 x 1800 px.
```

### A12: Category icons (six most common Boston 311 types)
Attach: style anchor + `08-result-mobile.png` + `09-pick-category-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A12. Six knitted objects on a 3 column x 2 row grid, each in a 600 x 600 px cell, each sitting on a small round cream knitted patch of identical size:
1) pothole: a dark grey knitted road patch with a round hole in it
2) street light: a knitted cream street lamp with a mustard knitted glowing bulb
3) litter: a small knitted cream paper cup lying on its side with two crumpled knitted paper balls
4) graffiti: a knitted cream wall segment with a tomato-red knitted spiral scribble
5) fallen tree: an olive-green knitted tree lying on its side
6) rat: a small grey knitted rat with a pink knitted tail (cute, not realistic)
Canvas 1800 x 1200 px.
```

### A13: Rolling yarn ball (6 animation frames)
Attach: style anchor + `07-analyzing-mobile.png` + `20-island-loading-mobile.png`

```
[REFERENCE BLOCK]
[STYLE BLOCK]
ITEM A13. One tomato-red knitted yarn ball with a trailing red yarn strand, shown as 6 sequential animation frames on a 6 column x 1 row grid, each in a 600 x 600 px cell. The ball rolls to the right across the 6 frames, rotating about 60 degrees per frame, the trailing strand waving smoothly. Keep the ball size, stitch pattern and lighting identical in every frame so it loops seamlessly (frame 6 leads into frame 1).
Canvas 3600 x 600 px.
```

## 5. Check before you send (30 seconds)

- [ ] Background is transparent (or flat magenta #FF00FF).
- [ ] **No text, letters or numbers** anywhere, and no magenta boxes or labels copied from the page references.
- [ ] Same yarn thickness and the same colours as the style anchor; nothing smooth, plastic or painted-looking.
- [ ] Every item is complete, inside its own cell, with empty space around it.
- [ ] Canvas size matches the sheet. Do not downscale.
- [ ] If one sheet drifted in style, regenerate that sheet. Do not send a mixed set.

## 6. What happens after you send the path

1. I open every file and check it against this list.
2. I cut each item out, clean the edges (no coloured fringe), and save web-ready WebP files in `public/assets/report/`.
3. I put them into the screens (blank plates under real HTML text, the shutter, markers, illustrations, empty states) without changing any behaviour.
4. I check desktop and mobile, the production build, and reduced motion, then update PR #36 with screenshots.

Nothing is merged without your say-so.

## Notes

- The shared top navigation is not part of this set; changing it needs your teammate's OK first.
- Knitted art is used as a hero or an accent. Small icons are only used at 40 px and up, where the stitching still reads.
- Never put real organisation logos (for example the MBTA's) in generated art.
