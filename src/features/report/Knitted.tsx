"use client";

// The knitted wool look, used sparingly: one hero per screen, never on functional buttons.
// Files are transparent WebP crops in public/assets/report/. Sizes keep the original proportions and are never upscaled
// past about 1.6x, so nothing goes blurry. Motion is switched off for people who ask for reduced motion.
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const DIR = "/assets/report/";

type Sprite = { src: string; w: number; h: number };
const SPRITES = {
  camera: { src: "knitted-camera.webp", w: 328, h: 261 },
  yarn: { src: "red-yarn-ball.webp", w: 408, h: 210 },
  hills: { src: "knitted-hills-flowers.webp", w: 536, h: 178 },
  flowerYellow: { src: "knitted-flower-yellow.webp", w: 116, h: 109 },
  flowerWhite: { src: "knitted-flower-white.webp", w: 143, h: 127 },
  iconCamera: { src: "knitted-icon-camera.webp", w: 130, h: 130 },
  iconLocation: { src: "knitted-icon-location.webp", w: 127, h: 130 },
  iconBank: { src: "knitted-icon-bank.webp", w: 132, h: 130 },
} satisfies Record<string, Sprite>;

type Name = keyof typeof SPRITES;

/** A decorative sprite. Empty alt: it never carries meaning, the text next to it does. */
function Sprite({ name, className }: { name: Name; className?: string }) {
  const s = SPRITES[name];
  return <Image src={DIR + s.src} alt="" width={s.w} height={s.h} unoptimized className={cn("h-auto select-none object-contain", className)} draggable={false} />;
}

/** The entry hero: the knitted camera, gently floating. */
export function KnittedCamera({ className }: { className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div className={className} animate={still ? undefined : { y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
      <Sprite name="camera" className="w-full" />
    </motion.div>
  );
}

/** The analysing visual: the red yarn ball breathes and rolls a little. It turns about the ball, not the thread. */
export function YarnBall({ className }: { className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ transformOrigin: "68% 58%" }}
      animate={still ? undefined : { rotate: [-3, 3, -3], scale: [1, 1.04, 1] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <Sprite name="yarn" className="w-full" />
    </motion.div>
  );
}

/** A quiet bottom-of-screen decoration. */
export function KnittedHills({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      <Sprite name="hills" className="mx-auto w-full max-w-[26rem] -scale-x-100" />
    </div>
  );
}

export function KnittedFlower({ tone = "yellow", className }: { tone?: "yellow" | "white"; className?: string }) {
  return <Sprite name={tone === "yellow" ? "flowerYellow" : "flowerWhite"} className={className} />;
}

/** A wool disc with a drawn icon. Only used at 40 px and up, where the stitching still reads. */
export function KnittedIcon({ name, className }: { name: "camera" | "location" | "bank"; className?: string }) {
  return <Sprite name={name === "camera" ? "iconCamera" : name === "location" ? "iconLocation" : "iconBank"} className={className} />;
}
