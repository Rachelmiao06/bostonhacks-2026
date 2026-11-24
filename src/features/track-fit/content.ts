import data from "@/lib/data/bostonhacks.json";

export type Fit = "covered" | "partly" | "gap";

/** One answer per Transit Gamification question, in the same order as the official list.
 *  Status is our honest self-assessment; evidence only names things the app really has
 *  (see docs/DECISIONS.md). Update `fit` and `next` as we build; they are the team's to correct. */
const answers: { fit: Fit; evidence: string; next: string }[] = [
  {
    fit: "covered",
    evidence: "Every pin on the Explore map is a challenge, and finishing missions grows your island in My World.",
    next: "Make the first minute feel like a game: show the first challenge before any explanation.",
  },
  {
    fit: "partly",
    evidence: "Landmarks and a nearby-places snapshot around each stop give a visitor something to look for.",
    next: "A visitor-first start (no account, 'I'm new to Boston') with a short landmark route.",
  },
  {
    fit: "partly",
    evidence: "Riders can verify what others reported, so the map is built by riders, not only by us.",
    next: "Show a rider's help to the community (reports verified, a shared stat) on the Stats page.",
  },
  {
    fit: "partly",
    evidence: "It runs in the browser on phones with a guided first-visit tour, so there is nothing to install.",
    next: "Check text size, contrast and keyboard use; add the plain-language labels to every icon.",
  },
  {
    fit: "partly",
    evidence: "Gifts unlock at journey steps, but the offers are labelled demos with no real partner yet.",
    next: "Say it plainly in the pitch: demo offers now, local shops as the real incentive next.",
  },
  {
    fit: "covered",
    evidence: "Live MBTA alerts become small, concrete missions for any rider; it prepares riders and does not replace the MBTA's feedback channels.",
    next: "Keep the honest line in the pitch: we motivate and prepare, the MBTA decides.",
  },
];

const track = data.tracks.find((t) => t.title === "Transit Gamification")!;

export const content = {
  title: "How we answer the track",
  intro: "Transit Gamification asks six questions. Here is where we honestly stand on each one.",
  trackName: track.title,
  prompt: track.prompt as string,
  items: track.questions.map((question, i) => ({ question, ...answers[i] })),
  labels: { covered: "Covered", partly: "Partly", gap: "Gap" } satisfies Record<Fit, string>,
  nextLabel: "Next",
};
