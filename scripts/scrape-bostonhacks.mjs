// Scrapes the public BostonHacks 2026 site (tracks, schedule, prizes, FAQ, venue)
// into src/lib/data/bostonhacks.json. No dependencies. Run: node scripts/scrape-bostonhacks.mjs
// The site is a Next.js app: track, schedule and prize data sit in the page's
// embedded flight data; the FAQ lives in one client JS chunk.
import { writeFileSync } from "node:fs";

const BASE = "https://bostonhacks.org";
const get = async (u) => {
  const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`${u} -> ${r.status}`);
  return r.text();
};

const html = await get(BASE + "/");

// 1. Flight data: every self.__next_f.push([1,"..."]) string, joined.
const flight = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
  .map((m) => JSON.parse(m[1]))
  .join("");

// Read one balanced JSON object starting at index i.
function readObject(text, i) {
  let depth = 0, inStr = false, esc = false;
  for (let j = i; j < text.length; j++) {
    const c = text[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(text.slice(i, j + 1));
  }
  throw new Error("unbalanced object");
}

// 2. Tracks
const tracks = [...flight.matchAll(/"color":"(\w+)","title":"([^"]+)","subtitle":"([^"]*)","description":/g)].map(
  (m) => {
    const d = readObject(flight, m.index + m[0].length);
    return {
      title: m[2],
      direction: m[3], // Inbound / To Trains / Outbound
      color: m[1],
      paragraphs: d.paragraphs ?? [],
      prompt: d.prompt ?? null,
      questions: d.questions ?? [],
    };
  },
);

// 3. Schedule: rows are keyed "<day>-<time>-<title>"; day headings carry the date.
// (The coloured dots on the page are decoration, not a track link, so they are not saved.)
const days = [...flight.matchAll(/"children":"(Day (\d) — [^"]+)"/g)].map((m) => ({ n: m[2], label: m[1] }));
const schedule = days.map((d) => ({
  day: d.label,
  events: [...flight.matchAll(new RegExp(`\\["\\$","div","${d.n}-(\\d{1,2}:\\d{2} [ap]m)-([^"]+)",`, "g"))].map((m) => ({
    time: m[1],
    title: m[2],
  })),
}));

// 4. Prizes: list items keyed by prize name.
const prizesBlock = flight.slice(flight.indexOf('id":"prizes"'));
const prizes = [...prizesBlock.matchAll(/\["\$","li","([^"]+)",\{"children"/g)].map((m) => m[1]);

// 5. FAQ: one client chunk holds the question/answer array.
const chunkUrls = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]))];
let faq = [];
for (const u of chunkUrls) {
  const js = await get(BASE + u);
  if (!js.includes('question:"What is BostonHacks?"')) continue;
  const start = js.indexOf('[{question:"What is BostonHacks?"');
  const end = js.indexOf("];", start);
  // Plain-string answers only; rich answers (links) are handled by hand below.
  faq = [...js.slice(start, end).matchAll(/\{question:"([^"]+)",answer:"((?:[^"\\]|\\.)*)"\}/g)].map((m) => ({
    question: m[1],
    answer: JSON.parse(`"${m[2]}"`),
  }));
  faq.push(
    { question: "Are there any rules?", answer: "Read the MLH Code of Conduct: https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md" },
    { question: "MLH Code of Conduct", answer: "TL;DR. Be respectful. Harassment and abuse are never tolerated. Full MLH Code of Conduct: https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md" },
    { question: "What do I get if I win?", answer: "See the prizes list." },
  );
  break;
}

const venue = {
  name: "Boston University George Sherman Union (GSU)",
  address: "775 Commonwealth Ave, Boston, MA 02215",
  map: "https://www.google.com/maps/search/?api=1&query=George+Sherman+Union%2C+775+Commonwealth+Ave%2C+Boston%2C+MA+02215",
};

const out = {
  source: BASE + "/",
  scrapedAt: new Date().toISOString().slice(0, 10),
  theme: html.match(/This year's theme is[^B]*?(Boston Bound)/s)?.[1] ?? "Boston Bound",
  dates: "Nov 21–22, 2026 (24 hours, in person)",
  venue,
  tracks,
  schedule,
  prizes,
  faq,
};

writeFileSync(new URL("../src/lib/data/bostonhacks.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(
  `tracks ${tracks.length}, schedule ${schedule.map((d) => d.events.length).join("+")} events, prizes ${prizes.length}, faq ${faq.length}`,
);
