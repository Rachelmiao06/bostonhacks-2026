import { Accessibility, BadgeCheck, Construction, TrainFront, type LucideIcon } from "lucide-react";
import type { Quest } from "@/lib/mbta";
import { categories, categoryOfKind, type CategoryId } from "./content";

/** Icon and colour classes per category. Class names are written out in full so Tailwind can see them. */
export const categoryStyle: Record<CategoryId, { icon: LucideIcon; text: string; bg: string; border: string; fill: string; soft: string }> = {
  service: { icon: TrainFront, text: "text-cat-service", bg: "bg-cat-service", border: "border-cat-service", fill: "fill-cat-service", soft: "bg-cat-service/10" },
  access: { icon: Accessibility, text: "text-cat-access", bg: "bg-cat-access", border: "border-cat-access", fill: "fill-cat-access", soft: "bg-cat-access/10" },
  station: { icon: Construction, text: "text-cat-station", bg: "bg-cat-station", border: "border-cat-station", fill: "fill-cat-station", soft: "bg-cat-station/10" },
  verify: { icon: BadgeCheck, text: "text-cat-verify", bg: "bg-cat-verify", border: "border-cat-verify", fill: "fill-cat-verify", soft: "bg-cat-verify/10" },
};

export function categoryOf(quest: Pick<Quest, "mode" | "kind">): CategoryId {
  return quest.mode === "verify" ? "verify" : categoryOfKind[quest.kind];
}

export function categoryInfo(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

/** Lower is more urgent. */
export const priorityOf = (id: CategoryId) => categories.findIndex((c) => c.id === id);
