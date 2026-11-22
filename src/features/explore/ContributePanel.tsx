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
 * A mission over the map: a glass card on the right on wide screens, at the bottom on phones. The screen behind it is
 * the mission's little world (drawn by MissionFlow), so the popup itself is transparent and tapping outside does not close it. The steps live in features/missions (one framework for every kind of problem).
 */
export function ContributePanel({ quest, onClose }: Props) {
  return (
    <Dialog.Root open={quest !== null} onOpenChange={(open) => !open && onClose()} disablePointerDismissal>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-graphite/20 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 sm:bg-graphite/5" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-graphite outline-none",
            "transition-transform duration-300 ease-out data-ending-style:translate-y-full data-starting-style:translate-y-full",
            "sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-[28.5rem]",
            "sm:data-ending-style:translate-x-[110%] sm:data-ending-style:translate-y-0 sm:data-starting-style:translate-x-[110%] sm:data-starting-style:translate-y-0",
          )}
        >
          {quest && <MissionFlow key={quest.id} quest={quest} onClose={onClose} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
