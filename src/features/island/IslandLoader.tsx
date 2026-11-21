"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { content } from "./content";

/** While the 3D island loads: a knitted yarn ball that breathes a little (still for reduced motion). */
export function IslandLoading() {
  const still = useReducedMotion();
  return (
    <div className="grid place-items-center">
      <div className="grid justify-items-center gap-3">
        <motion.div
          style={{ transformOrigin: "68% 58%" }}
          animate={still ? undefined : { rotate: [-3, 3, -3], scale: [1, 1.04, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/assets/island/knitted-yarn-ball.webp" alt="" width={408} height={210} unoptimized className="h-auto w-44 select-none object-contain" draggable={false} />
        </motion.div>
        <p className="font-pixel text-[0.6rem] text-graphite">{content.loading}</p>
      </div>
    </div>
  );
}

// three.js needs the browser (WebGL, window), so the island never renders on the server.
export const IslandScene = dynamic(() => import("./IslandScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <IslandLoading />
    </div>
  ),
});
