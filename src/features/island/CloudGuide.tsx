"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, Gift, Sprout } from "lucide-react";
import { content } from "./content";
import { glass } from "./glass";
import { readCloudSeen, writeCloudSeen } from "./seen";

const icons = { unlock: Sprout, "gift-0": Gift, journal: BookOpen } as const;

/** A soft knitted-looking cloud with a face. Drawn from circles so it stays crisp at any size; colours are tokens only. */
function Cloud({ happy }: { happy: boolean }) {
  return (
    <svg viewBox="0 0 120 76" aria-hidden className="h-auto w-20 drop-shadow-[0_6px_8px_var(--shade-soft)] sm:w-24">
      <g className="fill-ivory stroke-hairline" strokeWidth="1.5">
        <circle cx="34" cy="48" r="18" />
        <circle cx="58" cy="34" r="25" />
        <circle cx="87" cy="44" r="20" />
        <rect x="22" y="46" width="82" height="24" rx="12" />
      </g>
      <g className="fill-ivory">
        <circle cx="34" cy="48" r="16.5" />
        <circle cx="58" cy="34" r="23.5" />
        <circle cx="87" cy="44" r="18.5" />
        <rect x="23.5" y="47.5" width="79" height="21" rx="10.5" />
      </g>
      <g className="fill-cat-service" opacity=".28">
        <circle cx="45" cy="55" r="4.5" />
        <circle cx="77" cy="55" r="4.5" />
      </g>
      <g className="fill-graphite">
        <ellipse cx="50" cy="51" rx="2.6" ry={happy ? 1.2 : 3} />
        <ellipse cx="72" cy="51" rx="2.6" ry={happy ? 1.2 : 3} />
      </g>
      <path d={happy ? "M55 57 Q61 64 67 57" : "M56 58 Q61 62 66 58"} className="fill-none stroke-graphite" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A little cloud that drops down from the top of My World and then hangs at the top left for good, bobbing gently.
 * Tap it and it puffs open into a three-line summary of what My World is; each line flies the camera to that part.
 * It opens by itself the first time, then stays tucked until tapped. Reduced Motion: no drop, bob or wiggle.
 */
export function CloudGuide({ onPick, hidden }: { onPick: (id: string) => void; hidden?: boolean }) {
  const still = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const c = content.cloud;

  // The very first time, once the cloud has landed, it opens itself so a new rider is told what this place is.
  useEffect(() => {
    if (readCloudSeen()) return;
    const id = window.setTimeout(() => {
      setOpen(true);
      writeCloudSeen();
    }, still ? 400 : 1500);
    return () => window.clearTimeout(id);
  }, [still]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <motion.div
      initial={still ? false : { y: -220, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 11, mass: 1.1, delay: 0.3 }}
      className={`pointer-events-none absolute top-[7.75rem] left-2 z-20 items-start gap-2 sm:left-4 ${hidden ? "hidden" : "flex"}`}
    >
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-expanded={open}
        aria-label={open ? c.close : c.open}
        animate={still ? undefined : { y: [0, -5, 0], rotate: hover ? [-4, 4, -4] : 0 }}
        transition={hover ? { duration: 0.5, repeat: Infinity } : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        whileTap={still ? undefined : { scale: 0.88 }}
        className="pointer-events-auto flex cursor-pointer flex-col items-center rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-graphite/25"
      >
        <Cloud happy={hover || open} />
        {!open && <span className={`-mt-2 rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium text-graphite ${glass}`}><span className="relative">{c.hint}</span></span>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="region"
            aria-label={c.title}
            initial={still ? false : { opacity: 0, scale: 0.6, x: -24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={still ? undefined : { opacity: 0, scale: 0.7, x: -16 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            style={{ transformOrigin: "0% 20%" }}
            className={`pointer-events-auto mt-2 w-[min(19rem,calc(100vw-7.5rem))] rounded-3xl p-3.5 font-ui text-graphite ${glass}`}
          >
            <div className="relative">
              <h2 className="font-serif text-lg leading-tight font-semibold">{c.title}</h2>
              <p className="mt-0.5 text-xs text-taupe">{c.intro}</p>
              <ul className="mt-2.5 space-y-1.5">
                {c.points.map((p) => {
                  const Icon = icons[p.id as keyof typeof icons];
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onPick(p.id);
                        }}
                        className="flex w-full cursor-pointer items-start gap-2.5 rounded-2xl bg-ivory/70 p-2 text-left outline-none transition-colors hover:bg-ivory focus-visible:ring-2 focus-visible:ring-graphite/40"
                      >
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-graphite text-ivory">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">{p.title}</span>
                          <span className="block text-[0.72rem] leading-snug text-taupe">{p.body}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" onClick={() => setOpen(false)} className="mt-2.5 cursor-pointer text-[0.72rem] text-taupe underline underline-offset-2 outline-none hover:text-graphite focus-visible:ring-2 focus-visible:ring-graphite/30">
                {c.close}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
