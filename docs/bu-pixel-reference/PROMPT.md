# BU pixel landmarks: image generation prompt

Goal: 12 new pixel sprites (11 below plus Fenway, which already exists) in the SAME style as the seven pixel landmarks already on the map.

## How to use

1. Open your image generator (ChatGPT image, Gemini, Midjourney or similar).
2. Attach **Image 1** every time: `docs/bu-pixel-reference/00-style-anchor-existing-pixel.png` (the seven existing sprites, rendered from `src/features/explore/PixelLandmark.tsx`).
3. Attach **Image 2** per sprite: a real photo of that place (Google Maps street view screenshot or the official site). It is only for the shape of the building. Name the file in the prompt.
4. Paste: **REFERENCE BLOCK + STYLE BLOCK + one ITEM block**. One sprite per generation. Do not ask for a sheet, pixel grids drift when many sprites share one image.
5. Save each result as `<id>.png` in `docs/bu-pixel-reference/incoming/`. The ids are in `docs/BU-PLACES.md`.
6. Tell the building session the folder. It will turn each picture into a character grid (the repo format), snap it to the palette and add it to the map.

If the generator cannot hold the grid, skip it: hand the ITEM block to Claude Code instead and it will draw the character grid directly, which is how the existing sprites were made.

## REFERENCE BLOCK

```
REFERENCE IMAGES: I attached two images.
Image 1 is the STYLE reference: seven small pixel-art buildings from our map. Copy it exactly: the 1 pixel dark outline, the flat colours with no gradients, the chunky pixel size, the way a darker side face shows on the right, the white windows with blue glass, the orange roof or awning strip and the gold pixel on top.
Image 2 is a photo of the real place. Use it ONLY to get the shape, the roof line, the main colours and the one thing that makes the place recognisable. Do NOT copy its photo details, lighting, background, people, cars or signage text.
Output only the single pixel building.
```

## STYLE BLOCK

```
STYLE: small pixel art building sprite, native grid about 26 pixels wide by 18 to 24 pixels tall, then enlarged with nearest neighbour so every pixel is a crisp square block (about 16 x 16 screen pixels each). No anti-aliasing, no blur, no soft edges, no gradients, no dithering, no glow.
Front view, flat, like a tiny board game piece. The building has a front face and a darker side face on the right edge (1 to 3 pixels wide), as in Image 1.
Every shape has a continuous 1 pixel dark graphite outline. Inside, only flat colour fills.
Shading is only two steps: the base colour and one darker shade for the right side and under the roof. No highlights except a gold or white pixel accent.
Windows are white (cream) squares, often with a blue glass pixel inside. Doors are dark graphite. One small orange strip as roof, awning or base. At most one gold (yellow) pixel accent at the top, like a flag tip, finial or star.
PALETTE ONLY (same as Image 1):
- outline and doors: dark graphite #2B2825
- brick red #D9453B, darker red (side face) #8A2F2C
- mint green #2F9D6B, deep green #17503B
- glass blue #2A7FD0
- window and ivory white #FAF8F2
- roof orange #E9732A
- gold accent #F5D22E
No other colours. No text, no letters, no numbers, no logos, no signs with writing.
OUTPUT: PNG with a TRANSPARENT background. If transparency is not possible use a flat #FF00FF magenta background with nothing on it. No ground, no shadow under the building, no grass, no sky, no props, no people, no trees. The sprite is centred and fills about 80 percent of the canvas, square canvas 512 x 512.
```

## ITEM blocks (paste one after the two blocks above)

### gsu, George Sherman Union (Image 2: `gsu.jpg`)
```
ITEM gsu. The George Sherman Union, the Boston University student centre. A wide, low, civic brick building in brick red with a deeper red right side. A central entrance with a dark graphite door and a small portico of two or three white columns. Two rows of white windows with blue glass pixels. An orange strip as the base. Add one gold pixel flag on the roof. Canvas 512 x 512, native grid 27 wide by 18 tall.
```

### marsh-chapel, Marsh Chapel (Image 2: `marsh-chapel.jpg`)
```
ITEM marsh-chapel. Marsh Chapel at BU, a stone chapel with a tall narrow steeple. Use ivory white and a darker red-brown (#8A2F2C) for the stone, a deep green (#17503B) steeple roof, one gold pixel cross at the very top. A pointed arched front door in dark graphite, two tall narrow windows in blue glass. Tall and thin: native grid 20 wide by 26 tall.
```

### citgo-sign, the Citgo sign over Kenmore (Image 2: `citgo.jpg`)
```
ITEM citgo-sign. The big triangle sign on a roof above Kenmore Square. Draw a small brick red rooftop block at the bottom, with a tall steel frame in dark graphite rising from it holding a large TRIANGLE shape. The triangle is outlined in dark graphite and filled with brick red and white and glass blue in three simple bands. NO letters, NO logo, NO text of any kind. A gold pixel at the top corner. Native grid 24 wide by 24 tall.
```

### esplanade, Charles River Esplanade and BU Bridge (Image 2: `esplanade.jpg`)
```
ITEM esplanade. A short stretch of the BU Bridge over the Charles River. A flat steel bridge deck in dark graphite with white railing posts and two short piers going down into three rows of glass blue water pixels. On the left one mint green tree (a round blob with a short brown-red trunk, use #8A2F2C). One orange strip along the bridge deck. Wide and low: native grid 28 wide by 16 tall.
```

### mapparium, Mapparium (Image 2: `mapparium.jpg`)
```
ITEM mapparium. A stained-glass globe building. A round globe in the middle, made of glass blue, mint green and ivory patches like continents, outlined in dark graphite. It sits in a short cradle on top of a brick red base with a dark graphite door and two white windows. One gold pixel at the top of the globe. Native grid 24 wide by 22 tall.
```

### nud-pob, Nud Pob (Thai) (Image 2: `nud-pob.jpg`)
```
ITEM nud-pob. A small narrow restaurant storefront seen from the front. Brick red wall, one big white window with blue glass, a dark graphite door, an orange and ivory striped awning. On the roof, one small pixel icon of a bowl of noodles (ivory bowl, gold noodles). Native grid 22 wide by 20 tall.
```

### crispy-crepes, Crispy Crêpes Café (Image 2: `crispy-crepes.jpg`)
```
ITEM crispy-crepes. A small cafe storefront with a mint green awning and a deep green wall. White window with blue glass, dark graphite door. On the roof, one small pixel icon of a folded crêpe (a gold triangle with one red pixel strawberry). Native grid 22 wide by 20 tall.
```

### university-grill, University Grill and Pizza (Image 2: `university-grill.jpg`)
```
ITEM university-grill. A small pizza and Greek restaurant storefront. Glass blue and ivory wall, an orange awning, dark graphite door. On the roof, one pixel icon of a pizza slice (a gold triangle with two brick red pepperoni pixels). Native grid 22 wide by 20 tall.
```

### pavement-coffee, Pavement Coffeehouse (Image 2: `pavement.jpg`)
```
ITEM pavement-coffee. A small coffee shop storefront. Dark graphite and ivory wall, a deep green awning, big white window with a blue glass pixel, small door. On the roof, one pixel icon of a coffee cup (ivory cup with an orange rim and two tiny steam pixels). Native grid 22 wide by 20 tall.
```

### cafe-472, Cafe 472 (use only if Pavement is closed) (Image 2: `cafe-472.jpg`)
```
ITEM cafe-472. A small corner cafe. Brick red wall, ivory window frames with blue glass, a mustard-gold awning (use #F5D22E), dark graphite door. On the roof, one pixel icon of a plate with a fork. NO numbers or text. Native grid 22 wide by 20 tall.
```

### sausage-guy, The Sausage Guy (Image 2: `sausage-guy.jpg`)
```
ITEM sausage-guy. A tiny street food cart by a ballpark. A small orange-roofed cart on two dark graphite wheels, brick red body, white counter. On top, one big pixel hot dog (a brick red sausage in an ivory bun, one gold pixel of mustard). Native grid 22 wide by 18 tall.
```

### loco-taqueria, Loco Taqueria and Oyster Bar (Image 2: `loco.jpg`)
```
ITEM loco-taqueria. A small bar-restaurant storefront near Fenway. Mint green and brick red wall, orange awning, white window with blue glass, dark graphite door. On the roof, one pixel icon of an oyster shell (an ivory open shell with a gold pixel pearl) next to a tiny taco (gold half-circle). Native grid 24 wide by 20 tall.
```

### fenway-park
Already exists in `src/features/explore/PixelLandmark.tsx`. Skip it.

## If the first result is off

Paste one of these, with the same two images attached:

- Too soft or blurry: `Same building, but every pixel must be a hard-edged square block with no smoothing. Redraw it on a 27 x 20 grid.`
- Wrong colours: `Use only the eleven colours in the palette. Replace every other colour with the nearest one.`
- Looks 3D or has a shadow: `Flatten it. Front view only, no perspective, no ground shadow, transparent background.`
- Has text: `Remove all letters and logos and leave that area as plain ivory or graphite.`
- Not recognisable: `Make the one thing that makes this place recognisable twice as large. Keep the outline and palette.`
