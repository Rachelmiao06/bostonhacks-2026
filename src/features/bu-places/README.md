# BU places

Pixel sprites for historic spots and local food around Boston University, floating on the explore map.
Tap one: a card shows its name, a short intro and a link.

- `content.ts`: every name, intro, link, position and sprite size. Edit text and links here only. The order of `buPlaces` is the priority order.
- `BuMarkers.tsx`: the markers and the card. `ExploreMap.tsx` renders `<BuMarkers zoom={zoom} />` in atlas mode.
- Sprites: `public/assets/bu/<id>.webp`, one per place, transparent background. Replace a file to change its art.
- Research and sources: `docs/BU-PLACES.md`. Art prompt: `docs/bu-pixel-reference/PROMPT.md`.

No overlap: on the flat map a sprite is drawn only if it would not cover one already drawn (or an older landmark like Fenway), so the map thins out when zoomed out and fills in as you zoom in. In the 3D view all places inside the little world show.

Rules: food spots are real businesses, so never add an offer or discount to them. Food sprites on Commonwealth Ave sit at nudged positions so they do not overlap.
