# Prompts for the missing diorama art

Attach the existing `Knitted Transit Station Asset Sheet-5.png` to every request as the style reference, and say:
"Match this sheet exactly: same knitted/felt material, same colors, same camera, same lighting, same scale."

## 0. Master block (paste first, every time)

```text
Use the attached asset sheet as the strict style reference. Generate new pieces for the same miniature
isometric transit-station diorama set: knitted wool / felt / crochet material with visible yarn stitches and
soft fuzzy edges, rounded chunky shapes, warm soft studio lighting from the upper left, soft contact shadow only
under each object, matte (no glossy plastic).
Palette: same as the sheet: sky blue, cream/ivory, warm beige stone, brick-brown, deep navy blue, mustard yellow,
cherry red, leaf green, olive green, steel gray. No new colors.
Camera: the EXACT same isometric 3/4 view as the elevator tower and station building on the sheet
(about 35 degrees down, rotated 45 degrees, orthographic, no perspective distortion).
Scale: every piece must be the same scale as the elevator tower and the rider on the sheet
(the rider is about 40% as tall as the elevator tower).
Each object on a plain pure-white background, centered, a lot of empty space around it, no cropping,
one object per image, no text, no letters, no logos, no real MBTA branding.
Output as a high-resolution image, at least 2048 px on the long side.
```

## 1. Priority A: needed to finish the elevator scene

| File | Prompt (append after the master block) |
|---|---|
| `tower-empty.png` | "The same knitted glass elevator tower as on the sheet, but with the elevator doorway EMPTY and the lamp dome on top completely OFF: no doors, no car, no interior furniture, just the open dark-wood shaft interior seen through the doorway, and a plain stone-gray dome where the lamp goes. Same size and same angle as the tower on the sheet." |
| `car.png` | "The knitted glass elevator cabin on its own, to slide up and down inside the tower shaft: cream-and-wood frame, blue glass sides, a tiny warm ceiling light, open front facing the same direction as the tower doorway, floor included. Fits inside the empty tower on the same scale." |
| `door-left.png` and `door-right.png` | "A single knitted steel-gray sliding door leaf with a thin wood-brown frame edge, flat, facing the same direction as the tower doorway, same angle and perspective as the tower. Left leaf and right leaf as two separate images, each exactly half the doorway width." |
| `lamp-off.png`, `lamp-green.png`, `lamp-red.png`, `lamp-amber.png` | "The small knitted dome status lamp from the sheet (stone-gray base, round glass dome). Four separate images: lamp OFF (dull gray-brown glass), lamp GREEN (glowing leaf green), lamp RED (glowing cherry red), lamp AMBER (glowing warm mustard yellow). Identical shape, size and angle in all four." |
| `rider-walk.png` | "The same knitted boy from the sheet (brown bowl hair, red jacket, navy trousers, cream shoes, yellow backpack), mid-step, walking toward the right, same scale and same angle." |
| `rider-shrug.png` | "The same knitted boy from the sheet, standing with both hands slightly raised in a gentle shrug, head tilted a little, same scale and same angle." |
| `base-tile-clean.png` | "The same knitted base tile as on the sheet, but viewed at the SAME angle as the building and tower (the sheet's tile looks from slightly higher). Empty top, with the yellow tactile strip and the steel rail." |

## 2. Priority B: landmarks for other challenge categories

Each landmark needs a "lamp" slot, a sign slot and a spot for the rider at its front, all on the same tile scale.
Render each on its own, then I place it on the tile.

| File | Prompt |
|---|---|
| `escalator.png` | "A knitted escalator going up diagonally: dark gray moving steps with cream edges, chunky yarn handrails, a small stone-gray lamp dome at the top landing with the lamp OFF. Fits on the same tile scale." |
| `gate.png` | "A knitted station fare gate or barrier: two chunky beige posts and one horizontal bar in raised (open) position, a small stone-gray lamp dome on one post, lamp OFF. A second image `gate-closed.png` with the bar lowered and striped red and cream." |
| `bus.png` | "A small knitted yellow-and-cream replacement shuttle bus, side-front isometric view, rounded, windows with soft blue glass, a small stone-gray lamp dome on the roof, lamp OFF. Fits on the same tile scale." |
| `train.png` | "A small knitted blue-and-cream train car stopped on the steel rail, rounded, windows lit warm, a tall knitted signal post next to it with a stone-gray signal head, lamp OFF. Fits on the same tile scale." |
| `signpost.png` | "A knitted station sign post: one pole, one rounded blue board with a plain cream bar on it (NO text), a small stone-gray lamp dome on top, lamp OFF. For any category without its own landmark." |
| `ribbon-fixed.png` | "A small knitted green ribbon tag with a tiny cream checkmark and a tiny question mark next to it (NO text), meaning 'reported fixed, please check'." |

## 3. Priority C: nice to have

| File | Prompt |
|---|---|
| `pin-note.png` | "A small knitted pinned paper note, cream with a little red pin, blank, no text. Shown when a photo is attached (the photo itself is never shown)." |
| `world-tile-fly.png` | "The same knitted base tile with a small knitted tuft of grass and two tiny flowers on top, slightly tilted as if flying, with a soft trail of cream puffs behind it. Used for the hand-off into My Little World." |
| `confetti.png` | "Eight tiny knitted confetti pieces in cherry red, mustard yellow, leaf green and sky blue, each a different small shape, scattered on one image." |

## 4. Export checklist (what makes the pieces usable)

- **Transparent background** for every piece (PNG or WebP with alpha). If you can only export on white, tell me: I cut
  them out, but cream and ivory parts then get a rough edge.
- **Same canvas size and same alignment** if you can: render each piece centered on the same 2048 x 2048 canvas
  at the same camera, so I can drop it in without measuring.
- Lamp, doors and cabin must keep the **same angle as the tower**, or the doors will not sit in the doorway.
- No text anywhere. I draw all words in code.
- One variant per file name. Keep the names above.
- Drop them in `public/assets/challenge-diorama/` or tell me the folder on the desktop and I will copy and compress them.

---

# Round 2: redo the old pieces in the NEW look

The first sheet's pieces (building, sky, bubbles, barrier sign, seal, frame, puffs, sparks) are softer and fuzzier than
the new generated batch (tower, lamps, rider, bus, train, signpost). Redo them so everything matches.

Attach as style references: `Isometric Knitted Glass Elevator Tower.png`, `Cozy Knitted Signpost with Dome Light.png`,
`Knitted Boy Walking with Backpack.png` and `Knitted Dome Indicator Lamp.png`.

## Master block 2 (paste first, every time)

```text
Use the attached images as the strict style reference: chunky crochet / knitted wool with clearly visible, evenly
sized yarn stitches (crisp stitch definition, not fuzzy felt), rounded plump shapes, slightly glossy-matte yarn
sheen, soft warm studio lighting from the upper left, a small soft contact shadow only directly under the object.
Palette (no other colors): cream/ivory, warm beige, sky blue, deep navy blue, mustard yellow, cherry red,
leaf green, olive green, steel gray, brick brown.
Same isometric 3/4 camera as the attached elevator tower (about 35 degrees down, rotated 45 degrees, orthographic).
Same scale family as the attached pieces (the boy is about 40% as tall as the elevator tower).
One object per image, centered, on a plain pure-white background, generous empty space around it, nothing cropped,
no text, no letters, no numbers, no logos, no real MBTA branding. At least 2048 px on the long side.
```

## Pieces

| File | Prompt (after master block 2) |
|---|---|
| `building` | "A small knitted transit station building, deep-navy knitted walls, a cream knitted roof overhang with a dark navy roof slab on top, five small warmly lit mustard-yellow windows, a cream arched entrance canopy and a dark wood doorway. Same navy, cream and wood tones as the elevator tower so they look like the same station. Sits on a thin cream plinth. About 1.6 times as wide as the elevator tower." |
| `sky-day` | "A soft knitted cloud-shaped backdrop patch (a flat rounded cloud silhouette, like a stitched patch): pale sky blue gradient, a small round mustard-yellow sun with a crochet texture, two tiny fluffy cream cloud puffs. Flat, front view, no ground." |
| `sky-dusk` | "The same knitted cloud-shaped backdrop patch, same silhouette and size, but at dusk: dusty lavender at the top fading to peach and pale gold, a low half-sun on the bottom edge, three tiny star shapes in mustard yellow, one cream cloud puff. Flat, front view." |
| `bubble-note` | "A small chunky knitted speech bubble, cream yarn with a thin deep-navy knitted outline, a little pointed tail at the bottom left, inside it two short gray knitted lines and one olive-green knitted check mark. No letters." |
| `bubble-question` | "The same chunky knitted speech bubble (same size, outline and tail), but inside it one large olive-green knitted question mark. No other marks." |
| `sign` (barrier) | "A small standing A-frame barrier sign, knitted: brick-brown wooden-looking frame legs, a cherry-red knitted panel with a cream knitted X. Chunky crochet look matching the signpost. Free-standing, facing the same direction as the elevator tower doorway." |
| `seal` | "A round knitted wax-seal-style badge: olive-green crochet disc with a scalloped edge, a cream knitted check mark in the center, a slightly raised rim. Viewed straight on, slightly tilted." |
| `frame` | "A rectangular knitted rope frame for a card, 4:3.8 landscape ratio, flat straight view, rounded corners, a cream plump rope border of uniform thickness (about 6 percent of the width), a mustard-yellow knitted button in each corner, a thin olive-green leaf wrap around each corner stud. The inside is completely EMPTY and transparent-ready. Straight, symmetrical, with plain uniform edges (so it can be stretched along the sides)." |
| `puffs` | "Three separate small cream knitted pom-pom smoke puffs of different sizes, each a clump of loops, soft and round, light gray-cream. Three separate objects on one image." |
| `sparks` | "Four separate small knitted four-point star sparkles in mustard yellow, different sizes, crochet texture, flat front view. Four separate objects on one image." |

## Export checklist (same as before, plus)

- Transparent background if you can; otherwise pure white, I cut them out.
- Keep every piece centered with plenty of empty margin, and keep each file separate (no sheet), so the camera and scale
  stay consistent.
- The two sky patches must have the SAME silhouette and size, so I can swap them without the shape jumping.
- The two bubbles must have the SAME size, outline and tail.
- The frame must be symmetrical with a plain uniform border (I stretch its sides).
