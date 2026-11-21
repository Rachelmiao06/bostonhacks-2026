// The "liquid glass" look for the small things that float over the island (tags, tips): a creamy base that is NOT
// fully see-through, a strong soft blur behind it, a bright thin rim, and a soft sheen along the top edge.
// Colours come only from the design tokens (ivory), never typed-in values.
export const glass =
  "relative overflow-hidden border border-ivory/90 bg-linear-to-b from-ivory/95 via-ivory/85 to-ivory/72 backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_var(--color-ivory),var(--shadow-float)] " +
  "before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-1/2 before:rounded-full before:bg-ivory/70 before:blur-md";
