"use client";

import { useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Which of the 9 grid cells hold a pip for each face value.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Where each value sits on the cube. Opposite faces add up to 7.
const FACES = [
  { value: 1, transform: "rotateY(0deg)" },
  { value: 6, transform: "rotateY(180deg)" },
  { value: 3, transform: "rotateY(90deg)" },
  { value: 4, transform: "rotateY(-90deg)" },
  { value: 2, transform: "rotateX(90deg)" },
  { value: 5, transform: "rotateX(-90deg)" },
];

// Cube rotation [x, y] that brings each value to the front.
const TO_FRONT: Record<number, [number, number]> = {
  1: [0, 0],
  6: [0, 180],
  3: [0, -90],
  4: [0, 90],
  2: [-90, 0],
  5: [90, 0],
};

type DiceProps = {
  size?: number;
  className?: string;
  onRoll?: (value: number) => void;
};

/** A red 3D dice. Tap or press it to roll. */
export function Dice({ size = 96, className, onRoll }: DiceProps) {
  const [value, setValue] = useState(6);
  const [spins, setSpins] = useState(0);
  const hopRef = useRef<HTMLSpanElement>(null);

  function roll() {
    const next = Math.floor(Math.random() * 6) + 1;
    setValue(next);
    setSpins((n) => n + 1);
    onRoll?.(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      hopRef.current?.animate(
        [
          { transform: "translateY(0)" },
          { transform: `translateY(-${size * 0.4}px)`, offset: 0.4 },
          { transform: "translateY(0)" },
        ],
        { duration: 900, easing: "ease-out" },
      );
    }
  }

  const [x, y] = TO_FRONT[value];
  const extra = spins * 720;
  const cube: CSSProperties = {
    transform: `rotateX(${x + extra}deg) rotateY(${y + extra}deg)`,
    transformStyle: "preserve-3d",
  };

  return (
    <button
      type="button"
      onClick={roll}
      aria-label="Roll the dice"
      className={cn(
        "group relative inline-block cursor-pointer rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-sky/60",
        className,
      )}
      style={{ width: size, height: size, perspective: size * 6 }}
    >
      <span className="sr-only" aria-live="polite">
        Rolled a {value}
      </span>
      {/* floor shadow */}
      <span
        aria-hidden
        className="absolute inset-x-1 -bottom-3 h-3 rounded-full bg-[var(--shade)] blur-sm"
      />
      <span ref={hopRef} className="absolute inset-0 block">
        <span
          aria-hidden
          className="absolute inset-0 block"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(-24deg) rotateY(-32deg)" }}
        >
          <span
            className="absolute inset-0 block transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-105 motion-reduce:transition-none"
            style={cube}
          >
            {FACES.map((face) => (
              <span
                key={face.value}
                className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[6%] rounded-[18%] border-2 border-ink bg-cherry p-[14%] shadow-[inset_0_-6px_0_0_var(--shade)]"
                style={{ transform: `${face.transform} translateZ(${size / 2}px)` }}
              >
                {Array.from({ length: 9 }, (_, cell) => (
                  <span
                    key={cell}
                    className={cn(
                      "place-self-center rounded-full",
                      PIPS[face.value].includes(cell) && "size-[85%] bg-paper",
                    )}
                  />
                ))}
              </span>
            ))}
          </span>
        </span>
      </span>
    </button>
  );
}
