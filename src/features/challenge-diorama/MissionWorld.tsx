"use client";

import { createPortal } from "react-dom";
import type { QuestKind } from "@/lib/mbta";
import { Diorama, type CamView, type Landmark, type Status, type When } from "./Diorama";

export type WorldStep = "overview" | "when" | "status" | "note" | "review" | "done";

/** Which little landmark stands for each kind of problem. Anything without its own picture gets the sign post. */
const LANDMARK_OF: Record<QuestKind, Landmark> = {
  elevator: "elevator",
  escalator: "escalator",
  access: "signpost",
  station: "gate",
  closure: "gate",
  shuttle: "bus",
  suspension: "train",
};

const STATUS_OF = { ok: "working", problem: "out", unsure: "unsure" } as const satisfies Record<string, Status>;
const VIEW_OF: Record<WorldStep, CamView> = { overview: "overview", when: "when", status: "status", note: "note", review: "note", done: "final" };

const DAY = "linear-gradient(180deg, color-mix(in oklab, var(--sky) 42%, var(--ivory)) 0%, color-mix(in oklab, var(--sky) 14%, var(--ivory)) 55%, var(--ivory) 100%)";
const DUSK = "linear-gradient(180deg, color-mix(in oklab, var(--cherry) 22%, var(--sun) 38%) 0%, color-mix(in oklab, var(--sun) 30%, var(--ivory)) 60%, var(--ivory) 100%)";

type Props = {
  kind: QuestKind;
  step: WorldStep;
  /** The rider's answer to "when did you check", or null. Only first-hand answers draw anything. */
  when: "now" | "earlier" | "not_yet" | null;
  /** The tone of the chosen status answer, or null. The scene only ever shows what the rider chose. */
  tone: "ok" | "problem" | "unsure" | null;
  hasNote: boolean;
  /** The save call is in flight. */
  saving: boolean;
  /** The save call failed. */
  failed: boolean;
  /** True ONLY once the server said saved (or it was already saved on an earlier visit). */
  confirmed: boolean;
  reduced: boolean;
  /** Height of the question card at the bottom, so the world stays centred in the space above it. */
  bottomInset: number;
};

/**
 * The whole screen as a miniature station, behind the mission's glass card. It only DRAWS the rider's answers and the
 * server's result; it decides nothing, saves nothing and rewards nothing. Rendered into the page body so it can fill
 * the screen while the mission panel floats over it. Not read by screen readers: the card says everything in words.
 */
export default function MissionWorld(p: Props) {
  const when: When | null = p.when === "now" || p.when === "earlier" ? p.when : null;
  const status: Status | null = p.tone ? STATUS_OF[p.tone] : null;
  const dusk = when === "earlier";
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" style={{ background: DAY }}>
      <div className="absolute inset-0" style={{ background: DUSK, opacity: dusk ? 1 : 0, transition: p.reduced ? "none" : "opacity 0.9s" }} />
      <div className="absolute inset-0 pt-4 pb-[var(--bi)] sm:pr-[28.5rem] sm:pb-0" style={{ "--bi": `${p.bottomInset}px` } as React.CSSProperties}>
        <div className="relative size-full" style={{ containerType: "size" }}>
          <div className="absolute inset-0 grid place-items-center">
            <div style={{ width: "min(100cqw, 170cqh)" }}>
              <Diorama
                bare
                view={VIEW_OF[p.step]}
                landmark={LANDMARK_OF[p.kind]}
                when={when}
                status={status}
                rider={p.step === "note" || p.step === "review" || p.step === "done"}
                note={p.hasNote}
                saving={p.saving}
                failed={p.failed && !p.confirmed}
                confirmed={p.confirmed}
                reduced={p.reduced}
                slow={1}
                sound={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
