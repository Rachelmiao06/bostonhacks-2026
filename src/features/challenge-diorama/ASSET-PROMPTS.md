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
