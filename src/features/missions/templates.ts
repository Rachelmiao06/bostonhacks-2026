import type { Quest } from "@/lib/mbta";
import type { PixelName } from "./PixelIcon";

/**
 * One mission framework, many missions. Questions come from a template per kind of problem, filled with the
 * verified facts of the MBTA alert (station, unit, kind). Nothing here is invented by an AI.
 * A kind with no template of its own falls back to GENERIC, which asks only what a rider can safely say.
 */

export type StatusOption = {
  id: string;
  label: string;
  hint: string;
  /** ok = the problem looks gone, problem = it is still there, unsure = could not tell. Drives the verify answer. */
  tone: "ok" | "problem" | "unsure";
  /** How the answer reads in the update: "It is still out of service." */
  sentence: string;
  icon: PixelName;
};

export type MissionTemplate = {
  chip: string;
  icon: PixelName;
  /** The question on the map card and the overview. */
  title: string;
  /** One or two plain sentences. */
  description: string;
  /** The task in one line. */
  task: string;
  /** Step 2 heading. */
  statusQuestion: string;
  options: StatusOption[];
  notePlaceholder: string;
};

const unsure = (thing: string): StatusOption => ({
  id: "unsure",
  label: "I couldn’t tell",
  hint: `That’s fine, tell us what you could see`,
  tone: "unsure",
  sentence: `The rider could not tell ${thing}.`,
  icon: "question",
});

type Facts = Pick<Quest, "kind" | "stationName" | "mode">;

function working(thing: string, facts: Facts) {
  return facts.mode === "verify"
    ? `The MBTA says ${thing} at ${facts.stationName} is fixed. Help other riders check that it really works.`
    : `The MBTA lists ${thing} at ${facts.stationName} as out of service. Help other riders by checking the current status.`;
}

export function templateFor(quest: Facts): MissionTemplate {
  const verify = quest.mode === "verify";
  switch (quest.kind) {
    case "elevator":
    case "escalator": {
      const thing = quest.kind;
      return {
        chip: quest.kind === "elevator" ? "Accessibility issue" : "Escalator outage",
        icon: "elevator",
        title: verify ? `Is this ${thing} really working again?` : `Is this ${thing} working again?`,
        description: working(`this ${thing}`, quest),
        task: `Check whether the ${thing} is working.`,
        statusQuestion: `What did you observe about the ${thing}?`,
        options: [
          { id: "working", label: "It’s working", hint: "People can use it", tone: "ok", sentence: `It is working and people can use it.`, icon: "check" },
          { id: "out", label: "Still out of service", hint: "Sign or gate closed", tone: "problem", sentence: `It is still out of service.`, icon: "barrier" },
          unsure(`whether the ${thing} works`),
        ],
        notePlaceholder: `I saw an out-of-service sign next to the ${thing}.`,
      };
    }
    case "access":
      return {
        chip: "Accessibility issue",
        icon: "elevator",
        title: "Is this accessibility feature usable?",
        description: working("an accessibility feature", quest),
        task: "Check whether the feature can be used.",
        statusQuestion: "Could you use it?",
        options: [
          { id: "usable", label: "It’s usable", hint: "I could get through", tone: "ok", sentence: "It is usable.", icon: "check" },
          { id: "blocked", label: "Not usable", hint: "Blocked or closed", tone: "problem", sentence: "It is not usable.", icon: "barrier" },
          unsure("whether it can be used"),
        ],
        notePlaceholder: "The ramp was open, but the door button did not work.",
      };
    case "station":
      return {
        chip: "Station change",
        icon: "barrier",
        title: "Is access still blocked or restricted?",
        description: `The MBTA lists a change inside ${quest.stationName}. Help other riders by sharing what the station looks like now.`,
        task: "Check whether the way through is blocked or restricted.",
        statusQuestion: "What did you observe?",
        options: [
          { id: "open", label: "Open as normal", hint: "Nothing blocked", tone: "ok", sentence: "Access is open as normal.", icon: "check" },
          { id: "restricted", label: "Blocked or restricted", hint: "Closed off or detoured", tone: "problem", sentence: "Access is still blocked or restricted.", icon: "barrier" },
          unsure("whether access is blocked"),
        ],
        notePlaceholder: "The stairway to the platform is taped off.",
      };
    case "closure":
      return {
        chip: "Station closure",
        icon: "barrier",
        title: "Is this station still closed?",
        description: `The MBTA lists ${quest.stationName} as closed. Help other riders by sharing what you see.`,
        task: "Check whether the station is open to riders.",
        statusQuestion: "What did you observe?",
        options: [
          { id: "open", label: "It’s open", hint: "Riders can enter", tone: "ok", sentence: "The station is open.", icon: "check" },
          { id: "closed", label: "Still closed", hint: "Gates or doors shut", tone: "problem", sentence: "The station is still closed.", icon: "barrier" },
          unsure("whether the station is open"),
        ],
        notePlaceholder: "The entrance gates were locked.",
      };
    case "shuttle":
    case "suspension":
      return {
        chip: "Service change",
        icon: "train",
        title: quest.kind === "shuttle" ? "Are shuttle buses replacing trains?" : "Are trains running here?",
        description: `The MBTA lists a service change near ${quest.stationName}. Help other riders by sharing what you personally experienced.`,
        task: "Tell us what you experienced, and when.",
        statusQuestion: "What did you experience?",
        options:
          quest.kind === "shuttle"
            ? [
                { id: "trains", label: "Trains were running", hint: "No shuttle needed", tone: "ok", sentence: "Trains were running.", icon: "check" },
                { id: "shuttle", label: "Shuttle buses", hint: "Buses replaced trains", tone: "problem", sentence: "Shuttle buses were replacing trains.", icon: "barrier" },
                unsure("what was running"),
              ]
            : [
                { id: "running", label: "Trains were running", hint: "Service as normal", tone: "ok", sentence: "Trains were running.", icon: "check" },
                { id: "suspended", label: "No trains", hint: "Service stopped", tone: "problem", sentence: "No trains were running.", icon: "barrier" },
                unsure("whether trains were running"),
              ],
        notePlaceholder: "I waited 15 minutes and a shuttle bus took us to the next stop.",
      };
    default:
      return GENERIC(quest);
  }
}

/** Safe fallback for any kind we have no template for: facts from the alert, a plain observation, no assumptions. */
function GENERIC(quest: Facts): MissionTemplate {
  return {
    chip: "Community mission",
    icon: "spark",
    title: `What did you see at ${quest.stationName}?`,
    description: `The MBTA has posted an alert for ${quest.stationName}. Help other riders by sharing what you saw yourself.`,
    task: "Share what you observed.",
    statusQuestion: "What did you observe?",
    options: [
      { id: "fine", label: "Looked normal", hint: "Nothing wrong that I saw", tone: "ok", sentence: "It looked normal.", icon: "check" },
      { id: "problem", label: "Problem still there", hint: "It matches the alert", tone: "problem", sentence: "The problem described in the alert is still there.", icon: "barrier" },
      unsure("what was happening"),
    ],
    notePlaceholder: "What you saw, and where exactly.",
  };
}

/** "State Elevator 803 (Forest Hills platform to Washington Street, Milk Street)" -> unit and a short route. */
export function locationOf(quest: Quest): { primary: string; secondary: string | null } {
  const match = /(Elevator|Escalator)\s+(\d+)\s*(?:\((.*)\))?/i.exec(quest.facilityName);
  if (match) {
    const unit = `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} ${match[2]}`;
    const route = match[3]?.replace(/\s+to\s+/i, " ↔ ").replace(/,\s*/g, " / ").replace(/\bStreet\b/g, "St") ?? null;
    return { primary: `${quest.stationName} · ${unit}`, secondary: route };
  }
  const lines = quest.lines.length ? quest.lines.map((line) => `${line} Line`).join(" · ") : null;
  return { primary: quest.stationName, secondary: lines };
}
