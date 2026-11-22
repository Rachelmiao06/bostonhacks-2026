"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { Quest } from "@/lib/mbta";
import { MissionFlow } from "@/features/missions/MissionFlow";
import { cn } from "@/lib/utils";

type Props = {
  quest: Quest | null;
  onClose: () => void;
};

/**
 * A mission over the map: a panel on the right on wide screens, a bottom sheet on phones.
 * The map stays visible behind it. The steps live in features/missions (one framework for every kind of problem).
 */
export function ContributePanel({ quest, onClose }: Props) {
  return (
    <Dialog.Root open={quest !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-graphite/20 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 sm:bg-graphite/5" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-ivory/90 bg-linear-to-b from-ivory/95 via-ivory/90 to-ivory/80 text-graphite shadow-ticket outline-none backdrop-blur-2xl backdrop-saturate-150",
            "transition-transform duration-300 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full",
            "sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-3 sm:max-h-none sm:w-[27rem] sm:rounded-3xl",
            "sm:data-ending-style:translate-x-[110%] sm:data-ending-style:translate-y-0 sm:data-starting-style:translate-x-[110%] sm:data-starting-style:translate-y-0",
          )}
        >
          {quest && <MissionFlow key={quest.id} quest={quest} onClose={onClose} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
