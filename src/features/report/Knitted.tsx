"use client";

// The knitted wool look, used sparingly: one hero per screen, never as text. Files are transparent WebP crops in
// public/assets/report/, resized to about 2x their display size so they stay sharp without being heavy.
// Motion is switched off for people who ask for reduced motion.
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const DIR = "/assets/report/";

type Sprite = { src: string; w: number; h: number };
const SPRITES = {
  camera: { src: "knitted-camera-hd.webp", w: 640, h: 525 },
  hills: { src: "knitted-landscape-hills.webp", w: 800, h: 232 },
  river: { src: "knitted-landscape-river.webp", w: 800, h: 150 },
  meadow: { src: "knitted-landscape-flowers.webp", w: 800, h: 162 },
  flowerYellow: { src: "knitted-flower-yellow.webp", w: 116, h: 109 },
  flowerWhite: { src: "knitted-flower-white.webp", w: 143, h: 127 },
  iconCamera: { src: "knitted-icon-camera.webp", w: 130, h: 130 },
  iconLocation: { src: "knitted-icon-location.webp", w: 127, h: 130 },
  iconBank: { src: "knitted-icon-bank.webp", w: 132, h: 130 },
  shutter: { src: "knitted-shutter.webp", w: 192, h: 192 },
  close: { src: "knitted-close.webp", w: 128, h: 129 },
  back: { src: "knitted-back.webp", w: 128, h: 128 },
  markerEmpty: { src: "knitted-marker-empty.webp", w: 112, h: 113 },
  markerHalf: { src: "knitted-marker-half.webp", w: 112, h: 112 },
  markerDone: { src: "knitted-marker-done.webp", w: 112, h: 112 },
  success: { src: "knitted-success-badge.webp", w: 480, h: 495 },
  mascot: { src: "knitted-mascot.webp", w: 192, h: 194 },
  building: { src: "knitted-building.webp", w: 320, h: 335 },
  pothole: { src: "knitted-category-pothole.webp", w: 192, h: 193 },
  streetlight: { src: "knitted-category-streetlight.webp", w: 192, h: 194 },
  litter: { src: "knitted-category-litter.webp", w: 192, h: 194 },
  graffiti: { src: "knitted-category-graffiti.webp", w: 192, h: 194 },
  fallenTree: { src: "knitted-category-fallen-tree.webp", w: 192, h: 193 },
  rat: { src: "knitted-category-rat.webp", w: 192, h: 194 },
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

const FRAMES = 6;

/**
 * The analysing visual: a red yarn ball that rolls through six drawn frames, and breathes a little.
 * All six images are stacked and only the opacity changes, so nothing flickers while they load. Reduced motion: frame 1 only.
 */
export function YarnBall({ className }: { className?: string }) {
  const still = useReducedMotion();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 170);
    return () => clearInterval(t);
  }, [still]);
  return (
    <motion.div className={cn("relative aspect-[420/220]", className)} animate={still ? undefined : { scale: [1, 1.03, 1] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
      {Array.from({ length: FRAMES }, (_, i) => (
        <Image
          key={i}
          src={`${DIR}knitted-yarn-frame-${i + 1}.webp`}
          alt=""
          width={420}
          height={220}
          unoptimized
          priority={i === 0}
          draggable={false}
          className={cn("absolute inset-0 h-full w-full select-none object-contain", i === frame ? "opacity-100" : "opacity-0")}
        />
      ))}
    </motion.div>
  );
}

/** A quiet bottom-of-screen decoration. The hills are mirrored so their flower stays clear of the floating chat button. */
export function KnittedHills({ variant = "hills", className }: { variant?: "hills" | "river" | "meadow"; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      <Sprite name={variant} className={cn("mx-auto w-full max-w-[26rem]", variant === "hills" && "-scale-x-100")} />
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

/** Camera screen controls. These sit inside a real button that carries the label. */
export function KnittedControl({ name, className }: { name: "shutter" | "close" | "back"; className?: string }) {
  return <Sprite name={name} className={className} />;
}

/** Case progress marker: ring (not reached), half (where it is now), solid with a check (done). */
export function KnittedMarker({ state, className }: { state: "empty" | "half" | "done"; className?: string }) {
  return <Sprite name={state === "empty" ? "markerEmpty" : state === "half" ? "markerHalf" : "markerDone"} className={className} />;
}

export function KnittedSuccess({ className }: { className?: string }) {
  return <Sprite name="success" className={className} />;
}

export function KnittedMascot({ className }: { className?: string }) {
  return <Sprite name="mascot" className={className} />;
}

export function KnittedBuilding({ className }: { className?: string }) {
  return <Sprite name="building" className={className} />;
}

const CATEGORY_ART: Record<string, Name> = {
  Pothole: "pothole",
  "Street Light Outage": "streetlight",
  "Litter & Debris": "litter",
  "Illegal Graffiti": "graffiti",
  "Fallen Tree or Branches": "fallenTree",
  "Rat Activity": "rat",
};

/** A knitted badge for the six most common Boston 311 types. Other types have no badge (and show nothing). */
export function CategoryBadge({ service, className }: { service: string; className?: string }) {
  const name = CATEGORY_ART[service];
  return name ? <Sprite name={name} className={className} /> : null;
}
export const hasCategoryBadge = (service: string) => service in CATEGORY_ART;
