# BU places

Pixel sprites for historic spots and local food around Boston University, floating on the explore map.
Tap one: a card shows its name, a short intro and a link.

- `content.ts`: every name, intro, link, position and the zoom each kind appears at. Edit text and links here only.
- `BuMarkers.tsx`: the markers and the card. `ExploreMap.tsx` renders `<BuMarkers zoom={zoom} />` in atlas mode.
- Sprites: `public/assets/bu/<id>.webp`, one per place, transparent background. Replace a file to change its art.
- Research and sources: `docs/BU-PLACES.md`. Art prompt: `docs/bu-pixel-reference/PROMPT.md`.

Rules: food spots are real businesses, so never add an offer or discount to them. Food sprites on Commonwealth Ave sit at nudged positions so they do not overlap.
