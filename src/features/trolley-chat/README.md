# Trolley chat

The root layout mounts one `<TrolleyChat />`. It starts closed. Clicking the trolley opens a conversation. Closing it or navigating within the app retains the conversation; reloading starts a new one. Enter sends and Shift+Enter adds a line.

## Placement

The default is the lower-right corner, inset to clear Explore’s zoom controls. To move it left, pass `placement="bottom-left"`. To let another component own the position, move the single mount into a toolbar or overlay and pass `placement="inline"`. The inline launcher follows normal layout and its panel opens above it, aligned to its right edge.

A host can pass a `className` or set inherited CSS properties on the host container. For example:

```css
.rider-tools {
  --trolley-chat-edge: 4rem;
  --trolley-chat-bottom: 1.5rem;
  --trolley-chat-size: 3rem;
  --trolley-chat-width: 20rem;
  --trolley-chat-layer: 45;
}
```

## Replies

`POST /api/trolley-chat` accepts a bounded conversation and returns an answer with its source. Set the existing server-side `GEMINI_API_KEY` for free-form conversations. The first entry in `GEMINI_MODELS` can select the model. Without a key, the UI labels replies as the built-in rider guide, which covers finding missions, writing reports and rewards. Provider failures let the rider retry or edit the question. Chat has no access to location, live service data or submissions.

The drawer, keyboard composer, bounded history, retry and server-side reply handling adapt LEGATO’s [tutor-chat.js](https://github.com/Feegoat06/LEGATO/blob/848fe752db25dde8adc44ab1f53bba0a5f59473d/js/ui/tutor-chat.js) and [coach.js](https://github.com/Feegoat06/LEGATO/blob/848fe752db25dde8adc44ab1f53bba0a5f59473d/api/coach.js). The original MIT notice is in [LEGATO-LICENSE](./LEGATO-LICENSE).
