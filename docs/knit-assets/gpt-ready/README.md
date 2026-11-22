# Upload kit for ChatGPT (one folder = one image)

ChatGPT cannot read file paths on your computer. It only sees images you upload and text you paste. So each folder here has everything for ONE generation:

1. Open a **new chat** for each folder (so styles do not mix).
2. Drag the numbered images (`1-...`, `2-...`) into the message, in one go.
3. Open `00-PASTE-THIS-PROMPT.txt`, copy everything **below the line of equals signs**, paste it in the same message, send.
4. Download the PNG. Save it with the name given in STEP 3 of the text file, into `../incoming/`.
5. Tell Claude: "assets are in <the incoming folder path>".

Notes
- ChatGPT's image size is about 1024x1024, 1536x1024 or 1024x1536, so each item is smaller than the target in `../PROMPTS.md`. That is fine for icons and badges. For the sheets with three items (A05, A09), if the result is soft, generate them one item at a time.
- Ask for "transparent background". If it gives a fake checkerboard or a coloured background, reply once: "Use a perfectly flat #FF00FF magenta background instead." Claude removes it.
- If the yarn looks smooth, plastic or painted, reply: "Match image 1 exactly: thicker yarn, larger visible stitches, fuzzy fibres." If it still drifts, start a new chat.
- Do the folders in order. Send A01 to A11 first.
