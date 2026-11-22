"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { play } from "./sound";

// The little station. Layers are positioned in a 420 x 400 stage, in percent, so it scales with its card.
// ART: batch A (tower, doors, lamps, rider, tile) and batch B (escalator, gate, bus, train, signpost) are the new
// generated pieces. The building, sky, bubbles, sign, seal and frame are still ROUGH cut-outs from the first sheet.
const SW = 420;
const SH = 400;
const A = "/assets/challenge-diorama";

export type Status = "working" | "unsure" | "out";
export type When = "now" | "earlier";
export type CamView = "overview" | "when" | "status" | "note" | "final";
export type Landmark = "elevator" | "escalator" | "gate" | "bus" | "train" | "signpost";

type L = { src: string; w: number; h: number; x: number; y: number; dw: number };
const L = (src: string, w: number, h: number, x: number, y: number, dw: number): L => ({ src: `${A}/${src}.webp`, w, h, x, y, dw });
const pos = (l: Pick<L, "x" | "y" | "dw" | "w" | "h">) => ({ left: `${(l.x / SW) * 100}%`, top: `${(l.y / SH) * 100}%`, width: `${(l.dw / SW) * 100}%`, aspectRatio: `${l.w} / ${l.h}` });

type LM = {
  label: string;
  base: L;
  /** Gate only: the closed state (the base is the open state). */
  alt?: L;
  /** Where the glowing dome lamp sits (null: the landmark has no dome, only the glow shows). */
  lamp: { x: number; y: number; dw: number } | null;
  glow: { x: number; y: number; r: number };
  sign: { x: number; y: number; dw: number };
  bubble: { x: number; y: number };
  smoke: { x: number; y: number };
  /** Elevator only: the lift opening where the door leaves slide. */
  opening?: { x: number; y: number; w: number; h: number };
  /** Bus and train roll in when they are fine. */
  rollsIn?: boolean;
};

export const LANDMARKS: Record<Landmark, LM> = {
  elevator: {
    label: "elevator", base: L("tower", 880, 1352, 262, 90, 118), lamp: { x: 293, y: 80, dw: 56 }, glow: { x: 321, y: 104, r: 46 },
    sign: { x: 318, y: 238, dw: 46 }, bubble: { x: 348, y: 64 }, smoke: { x: 300, y: 76 }, opening: { x: 328, y: 176, w: 31, h: 63 },
  },
  escalator: {
    label: "escalator", base: L("escalator", 640, 661, 230, 106, 150), lamp: { x: 336, y: 100, dw: 30 }, glow: { x: 351, y: 112, r: 26 },
    sign: { x: 290, y: 238, dw: 46 }, bubble: { x: 352, y: 70 }, smoke: { x: 310, y: 94 },
  },
  gate: {
    label: "gate", base: L("gate-open", 640, 642, 232, 134, 128), alt: L("gate-closed", 640, 515, 232, 159, 128), lamp: { x: 251, y: 162, dw: 18 }, glow: { x: 259, y: 170, r: 20 },
    sign: { x: 310, y: 232, dw: 46 }, bubble: { x: 352, y: 100 }, smoke: { x: 278, y: 144 },
  },
  bus: {
    label: "shuttle bus", base: L("bus", 640, 538, 224, 134, 144), lamp: { x: 296, y: 140, dw: 26 }, glow: { x: 309, y: 150, r: 26 },
    sign: { x: 204, y: 236, dw: 46 }, bubble: { x: 352, y: 100 }, smoke: { x: 278, y: 130 }, rollsIn: true,
  },
  train: {
    label: "train", base: L("train", 700, 563, 214, 128, 164), lamp: null, glow: { x: 362, y: 146, r: 20 },
    sign: { x: 200, y: 238, dw: 46 }, bubble: { x: 352, y: 96 }, smoke: { x: 270, y: 124 }, rollsIn: true,
  },
  signpost: {
    label: "sign", base: L("signpost", 340, 597, 286, 158, 56), lamp: { x: 303, y: 156, dw: 22 }, glow: { x: 314, y: 165, r: 20 },
    sign: { x: 240, y: 236, dw: 46 }, bubble: { x: 352, y: 104 }, smoke: { x: 296, y: 142 },
  },
};

export type DioramaProps = {
  when: When | null;
  status: Status | null;
  landmark: Landmark;
  /** Where the camera looks: each question zooms to its object; the end pulls back and turns. */
  view: CamView;
  rider: boolean;
  note: boolean;
  /** Saving: the seal is a dashed outline that breathes. Failed: it shakes and stays an outline. */
  saving: boolean;
  failed: boolean;
  /** Only ever true after the server said saved. */
  confirmed: boolean;
  reduced: boolean;
  slow: number;
  /** Optional synthesized sounds (off by default). */
  sound: boolean;
  /** No card around the scene: it is the whole world behind the page. */
  bare?: boolean;
};

const FIXED = {
  skyDay: L("sky-day", 1200, 782, 40, 0, 340),
  skyDusk: L("sky-dusk", 1200, 777, 40, 0, 340),
  tile: L("base-tile", 1300, 974, 20, 110, 380),
  building: L("building", 1000, 788, 6, 96, 205),
  sign: L("sign", 520, 544, 0, 0, 40),
  rider: L("rider", 520, 849, 170, 212, 46),
  note: L("bubble-note", 600, 462, 150, 148, 84),
  question: L("bubble-question", 600, 479, 0, 0, 62),
  seal: L("seal", 520, 542, 322, 290, 74),
  puff1: L("puff-1", 320, 258, 0, 0, 46),
  puff2: L("puff-2", 200, 181, 0, 0, 28),
  puff3: L("puff-3", 240, 205, 0, 0, 32),
  spark1: L("spark-1", 150, 155, 0, 0, 22),
  spark2: L("spark-2", 200, 204, 0, 0, 32),
  spark3: L("spark-3", 150, 155, 0, 0, 26),
  spark4: L("spark-4", 150, 157, 0, 0, 20),
};
const LAMP_IMG: Record<Status, { src: string; w: number; h: number }> = {
  working: { src: `${A}/lamp-green.webp`, w: 340, h: 328 },
  out: { src: `${A}/lamp-red.webp`, w: 340, h: 328 },
  unsure: { src: `${A}/lamp-amber.webp`, w: 340, h: 327 },
};
const LIGHT: Record<Status, string> = { working: "var(--leaf)", out: "var(--cherry)", unsure: "var(--sun)" };

const PERSPECTIVE = 1100;

type Cam = { xp: number; yp: number; s: number; rx: number; ry: number };
/** Where the camera sits for each moment. (fx, fy) is the point of the 420 x 400 stage to bring to the middle. */
function camTarget(view: CamView, lm: LM): Cam {
  const at = (fx: number, fy: number, s: number, rx: number, ry: number): Cam => ({ xp: (((SW / 2 - fx) * s) / SW) * 100, yp: (((SH / 2 - fy) * s) / SH) * 100, s, rx, ry });
  if (view === "when") return at(150, 156, 1.45, 3, 7);
  if (view === "status") {
    const h = (lm.base.dw * lm.base.h) / lm.base.w;
    const s = Math.min(2, 250 / lm.base.dw, 230 / h);
    return at(lm.base.x + lm.base.dw / 2, lm.base.y + h / 2, s, 4, -9);
  }
  if (view === "note") return at(193, 250, 2.1, 2, 6);
  if (view === "final") return at(210, 214, 0.94, 15, -20);
  return at(210, 205, 1, 0, 0);
}

export function Diorama(p: DioramaProps) {
  const lm = LANDMARKS[p.landmark];
  const el = useRef<Record<string, HTMLElement | null>>({});
  const reg = (id: string) => (n: HTMLElement | null) => { el.current[id] = n; };
  const e = (id: string) => el.current[id];
  const prev = useRef<{ vis: Record<string, boolean>; status: Status | null; confirmed: boolean; landmark: Landmark } | null>(null);
  const loops = useRef<gsap.core.Animation[]>([]);
  const timelines = useRef<gsap.core.Timeline[]>([]);
  const camTween = useRef<gsap.core.Animation[]>([]);
  const camFirst = useRef(true);
  const sealFirst = useRef(true);

  const killLoops = () => { loops.current.forEach((t) => t.kill()); loops.current = []; };
  const run = (tl: gsap.core.Timeline) => { tl.timeScale(1 / p.slow); timelines.current.push(tl); return tl; };
  const walk = (on: boolean) => { gsap.set(e("riderWalk"), { autoAlpha: on ? 1 : 0 }); gsap.set(e("riderStand"), { autoAlpha: on ? 0 : 1 }); };

  // 1. Layers appear as answers arrive. A soft drop with a small squash, like felt landing on a table.
  useEffect(() => {
    const vis: Record<string, boolean> = {
      sky: p.when === "now", skyDusk: p.when === "earlier", building: p.when !== null, tower: p.status !== null, rider: p.rider, note: p.note,
      ghostBuilding: p.when === null, ghostTower: p.status === null,
    };
    const before = prev.current?.vis;
    const lmChanged = !!prev.current && prev.current.landmark !== p.landmark;
    for (const [id, on] of Object.entries(vis)) {
      const n = e(id);
      if (!n) continue;
      const was = lmChanged && (id === "tower" || id === "ghostTower") ? false : before?.[id];
      if (was === undefined || p.reduced) { gsap.set(n, { autoAlpha: on ? 1 : 0, y: 0, x: 0, scale: 1 }); if (id === "rider") walk(false); continue; }
      if (on && !was) {
        if (id.startsWith("ghost") || id.startsWith("sky")) gsap.to(n, { autoAlpha: 1, duration: id.startsWith("sky") ? 0.7 : 0.3 });
        else if (id === "rider") {
          const tl = run(gsap.timeline());
          walk(true);
          tl.fromTo(n, { autoAlpha: 0, x: -70, y: 0, scale: 1, transformOrigin: "50% 100%" }, { autoAlpha: 1, x: 0, duration: 0.9, ease: "power2.out" })
            .to(e("riderWalk"), { y: -3, duration: 0.15, yoyo: true, repeat: 5, ease: "sine.inOut" }, 0)
            .add(() => walk(false))
            .to(n, { scaleY: 0.95, scaleX: 1.03, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" });
        } else {
          const tl = run(gsap.timeline());
          tl.fromTo(n, { autoAlpha: 0, y: -44, x: 0, scale: 0.88, transformOrigin: "50% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.75, ease: "back.out(1.6)" })
            .to(n, { scaleY: 0.95, scaleX: 1.025, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" }, ">-0.18");
        }
      } else if (!on && was) gsap.to(n, { autoAlpha: 0, duration: p.reduced ? 0 : 0.25 });
    }
    prev.current = { vis, status: prev.current?.status ?? null, confirmed: prev.current?.confirmed ?? false, landmark: p.landmark };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.when, p.status, p.rider, p.note, p.reduced, p.landmark]);

  // 2. The landmark answers: light, movement, and what happens around it.
  useEffect(() => {
    const status = p.status;
    const before = prev.current?.status ?? null;
    if (prev.current) prev.current.status = status;
    killLoops();
    const lamps = { working: e("lampGreen"), out: e("lampRed"), unsure: e("lampAmber") };
    const glow = e("glow");
    const doors = [e("doorL"), e("doorR")].filter(Boolean) as HTMLElement[];
    const sign = e("sign"), q = e("question"), grp = e("towerGroup");
    const gOpen = e("gateOpen"), gClosed = e("gateClosed");
    const fx = ["puff1", "puff2", "puff3", "spark1", "spark2", "spark3", "spark4"].map(e).filter(Boolean) as HTMLElement[];
    const puffs = fx.slice(0, 3), sparks = fx.slice(3);
    gsap.killTweensOf([...doors, sign, q, grp, glow, gOpen, gClosed, ...fx].filter(Boolean));
    (Object.keys(lamps) as Status[]).forEach((k) => lamps[k] && gsap.to(lamps[k], { autoAlpha: k === status ? 1 : 0, duration: p.reduced ? 0 : 0.25 }));
    if (gOpen && gClosed) { gsap.set(gOpen, { autoAlpha: status === "out" ? 0 : 1 }); gsap.set(gClosed, { autoAlpha: status === "out" ? 1 : 0 }); }
    gsap.set(grp, { x: 0, y: 0 });
    if (!status) { gsap.set([sign, q, glow, ...fx].filter(Boolean), { autoAlpha: 0 }); gsap.set(doors, { xPercent: 0 }); return; }
    if (glow) glow.style.background = `radial-gradient(circle, color-mix(in oklab, ${LIGHT[status]} 75%, transparent) 0%, transparent 68%)`;
    const doorX = status === "working" ? 62 : status === "unsure" ? 14 : 0;
    const wait = before === null ? 0.55 : 0;
    gsap.set([sign, q], { autoAlpha: 0 });
    gsap.set(fx, { autoAlpha: 0 });

    if (p.reduced) {
      if (doors[0]) { gsap.set(doors[0], { xPercent: -doorX }); gsap.set(doors[1], { xPercent: doorX }); }
      gsap.set(glow, { autoAlpha: 0.7, scale: 1 });
      if (status === "out") gsap.set(sign, { autoAlpha: 1, y: 0 });
      if (status === "unsure") gsap.set(q, { autoAlpha: 1, scale: 1 });
      return;
    }
    const tl = run(gsap.timeline({ delay: wait }));
    if (doors[0]) { gsap.set(doors, { xPercent: 0 }); }
    if (status === "working") {
      tl.call(() => { if (p.sound) play("plop"); }, [], 0)
        .fromTo(glow, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 0.85, scale: 1.15, duration: 0.35, ease: "power2.out" })
        .to(glow, { autoAlpha: 0.55, scale: 1, duration: 0.7, ease: "sine.inOut" });
      if (lm.rollsIn) tl.fromTo(grp, { x: -64 }, { x: 0, duration: 1.0, ease: "power3.out" }, 0.1);
      if (doors[0]) {
        tl.call(() => { if (p.sound) play("ding"); }, [], "<-0.45")
          .to(doors[0], { xPercent: -doorX, duration: 0.75, ease: "power3.out" }, "<")
          .to(doors[1], { xPercent: doorX, duration: 0.75, ease: "power3.out" }, "<")
          .to(grp, { y: -3, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out" }, "<");
      } else if (!lm.rollsIn) {
        tl.call(() => { if (p.sound) play("ding"); }, [], 0.1)
          .to(grp, { y: -4, duration: 0.14, yoyo: true, repeat: 1, ease: "power1.out" }, 0.1);
      }
      loops.current.push(gsap.to(glow, { autoAlpha: 0.4, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: wait + 1.2 }));
    } else if (status === "out") {
      tl.call(() => { if (p.sound) play("clunk"); }, [], 0)
        .to(grp, { keyframes: [{ x: -3, duration: 0.05 }, { x: 3, duration: 0.06 }, { x: -2, duration: 0.06 }, { x: 2, duration: 0.06 }, { x: 0, duration: 0.08 }], ease: "none" }, 0)
        .fromTo(glow, { autoAlpha: 0, scale: 0.7 }, { keyframes: [{ autoAlpha: 0.9, duration: 0.05 }, { autoAlpha: 0.1, duration: 0.06 }, { autoAlpha: 0.8, duration: 0.05 }, { autoAlpha: 0.15, duration: 0.08 }, { autoAlpha: 0.7, scale: 1, duration: 0.12 }] }, "<")
        .fromTo(sign, { autoAlpha: 1, y: -70, rotation: -10, transformOrigin: "50% 100%" }, { y: 0, rotation: 0, duration: 0.75, ease: "bounce.out" }, "<0.1")
        .fromTo(puffs, { autoAlpha: 0.95, y: 0, scale: 0.6 }, { autoAlpha: 0, y: -34, scale: 1.5, duration: 1.3, ease: "power1.out", stagger: 0.14 }, "<0.1")
        .fromTo(sparks, { autoAlpha: 1, scale: 0.2, rotation: 0 }, { autoAlpha: 0, scale: 1.3, rotation: 90, duration: 0.7, ease: "power2.out", stagger: 0.05 }, "<0.05");
      if (gClosed) tl.fromTo(gClosed, { scaleY: 0.9, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.4, ease: "back.out(3)" }, 0);
      loops.current.push(gsap.to(glow, { keyframes: [{ autoAlpha: 0.15, duration: 0.06 }, { autoAlpha: 0.8, duration: 0.05 }, { autoAlpha: 0.2, duration: 0.08 }, { autoAlpha: 0.65, duration: 0.2 }], repeat: -1, repeatDelay: 2.4, delay: wait + 2.2 }));
    } else {
      tl.call(() => { if (p.sound) play("huh"); }, [], 0)
        .fromTo(glow, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 0.75, scale: 1.05, duration: 0.4, ease: "power2.out" });
      if (doors[0]) {
        tl.to(doors[0], { xPercent: -doorX, duration: 0.5, ease: "power2.out" }, "<")
          .to(doors[1], { xPercent: doorX, duration: 0.5, ease: "power2.out" }, "<");
      }
      tl.fromTo(q, { autoAlpha: 1, scale: 0, transformOrigin: "10% 100%" }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, "<0.15");
      loops.current.push(gsap.to(glow, { autoAlpha: 0.2, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: wait + 0.5 }));
      loops.current.push(gsap.to(q, { y: -4, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut", delay: wait + 1 }));
    }
    for (const l of loops.current) l.timeScale(1 / p.slow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.status, p.reduced, p.slow, p.landmark]);

  // 3. The seal. A dashed outline while saving; it only becomes a seal after the server confirms.
  useEffect(() => {
    const seal = e("seal"), frame = e("frame"), ring = e("ring"), root = e("root"), shadow = e("shadow"), rider = e("rider");
    const was = prev.current?.confirmed ?? false;
    if (prev.current) prev.current.confirmed = p.confirmed;
    const ringOn = (p.saving || p.failed) && !p.confirmed;
    gsap.killTweensOf([seal, frame, ring, root, shadow]);
    if (!p.confirmed) {
      sealFirst.current = false;
      gsap.set([seal, frame], { autoAlpha: 0 });
      gsap.set(root, { y: 0 });
      gsap.set(shadow, { scale: 1, opacity: 0.22 });
      if (rider && was) { gsap.killTweensOf(rider); gsap.set(rider, { x: 0, y: 0, scale: 1, autoAlpha: p.rider ? 1 : 0 }); walk(false); }
      gsap.to(ring, { autoAlpha: ringOn ? 1 : 0, duration: p.reduced ? 0 : 0.2 });
      if (ringOn && !p.reduced && p.saving) loops.current.push(gsap.to(ring, { scale: 1.08, duration: 0.6, yoyo: true, repeat: -1, ease: "sine.inOut" }));
      if (p.failed && !p.reduced) gsap.fromTo(ring, { xPercent: 0 }, { keyframes: [{ xPercent: -8, duration: 0.05 }, { xPercent: 8, duration: 0.07 }, { xPercent: -6, duration: 0.07 }, { xPercent: 6, duration: 0.07 }, { xPercent: 0, duration: 0.08 }], ease: "none" });
      return;
    }
    gsap.set(ring, { autoAlpha: 0 });
    const instant = sealFirst.current;
    sealFirst.current = false;
    if (p.reduced || was || instant) { gsap.set([seal, frame], { autoAlpha: 1, scale: 1, rotation: 0 }); gsap.set(seal, { rotation: -6 }); return; }
    const sparks = ["spark1", "spark2", "spark3", "spark4"].map(e).filter(Boolean) as HTMLElement[];
    const tl = run(gsap.timeline());
    tl.call(() => { if (p.sound) play("stamp"); }, [], 0.3)
      .fromTo(seal, { autoAlpha: 0, scale: 2.6, rotation: -26, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.4, ease: "back.out(2.2)" })
      .to(root, { y: 4, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" }, "<0.32")
      .fromTo(sparks, { autoAlpha: 1, scale: 0.2, rotation: 0 }, { autoAlpha: 0, scale: 1.4, rotation: 80, duration: 0.8, ease: "power2.out", stagger: 0.06 }, "<")
      .fromTo(frame, { autoAlpha: 0, scale: 1.05 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out" }, "<0.2")
      .to(root, { y: -8, duration: 0.6, ease: "power2.out" }, ">-0.1")
      .to(shadow, { scale: 0.9, opacity: 0.14, duration: 0.6, ease: "power2.out" }, "<");
    if (rider) {
      if (p.landmark === "elevator" && p.status === "working") {
        // The rider walks to the lift and gets in.
        tl.add(() => walk(true), 0.5)
          .to(rider, { x: 138, y: -46, scale: 0.8, transformOrigin: "50% 100%", duration: 1.6, ease: "power1.inOut" }, 0.5)
          .to(e("riderWalk"), { y: -3, duration: 0.15, yoyo: true, repeat: 9, ease: "sine.inOut" }, 0.5)
          .to(rider, { autoAlpha: 0, duration: 0.25 }, ">-0.2")
          .to(e("note"), { autoAlpha: 0, duration: 0.4 }, 0.6);
      } else tl.to(rider, { y: -14, duration: 0.17, yoyo: true, repeat: 1, ease: "power2.out" }, 0.35);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.confirmed, p.saving, p.failed, p.reduced]);

  // 4. Glass-like depth: layers drift a few pixels against each other as the pointer moves. Not under Reduced Motion.
  useEffect(() => {
    const card = e("card");
    const groups = [e("gBack"), e("gMid"), e("gFront")];
    if (!card || p.reduced || !window.matchMedia("(hover: hover)").matches) return;
    const target = (p.bare ? window : card) as HTMLElement;
    const amt = [3, 7, 13];
    const qx = groups.map((g, i) => [gsap.quickTo(g!, "x", { duration: 0.7, ease: "power3.out" }), gsap.quickTo(g!, "y", { duration: 0.7, ease: "power3.out" }), amt[i]] as const);
    const move = (ev: PointerEvent) => {
      const r = p.bare ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } : card.getBoundingClientRect();
      const nx = ((ev.clientX - r.left) / r.width) * 2 - 1, ny = ((ev.clientY - r.top) / r.height) * 2 - 1;
      for (const [x, y, a] of qx) { x(-nx * a); y(-ny * a * 0.6); }
    };
    const leave = () => { for (const [x, y] of qx) { x(0); y(0); } };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerleave", leave);
    return () => { target.removeEventListener("pointermove", move); target.removeEventListener("pointerleave", leave); gsap.set(groups, { x: 0, y: 0 }); };
  }, [p.reduced, p.bare]);

  // 5. Small life, never required: the rider breathes, and tapping him or the lamp gives a little reaction.
  useEffect(() => {
    const rider = e("rider");
    const body = e("riderStand");
    const lamps = ["lampGreen", "lampRed", "lampAmber"].map(e).filter(Boolean) as HTMLElement[];
    if (!rider || !body) return;
    const hop = () => {
      if (!p.reduced) gsap.fromTo(rider, { y: 0 }, { y: -14, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", overwrite: "auto" });
      if (p.sound) play("tick");
    };
    const blink = () => {
      const glow = e("glow");
      if (!p.reduced && glow) gsap.fromTo(glow, { autoAlpha: 0.15 }, { autoAlpha: 0.85, duration: 0.45, ease: "power2.out", overwrite: "auto" });
      if (p.sound) play(p.status === "working" ? "ding" : "tick");
    };
    rider.style.cursor = "pointer";
    rider.addEventListener("click", hop);
    lamps.forEach((l) => { l.style.cursor = "pointer"; l.addEventListener("click", blink); });
    const breath = p.reduced ? null : gsap.to(body, { scaleY: 1.014, transformOrigin: "50% 100%", duration: 1.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    return () => { rider.removeEventListener("click", hop); lamps.forEach((l) => l.removeEventListener("click", blink)); breath?.kill(); gsap.set(body, { scaleY: 1 }); };
  }, [p.reduced, p.sound, p.status, p.landmark]);

  // 6. Depth: the three groups sit at different distances, so when the camera turns they slide against each other.
  useEffect(() => {
    const spec: [string, number][] = [["gBack", -80], ["gMid", 0], ["gFront", 40]];
    for (const [id, z] of spec) gsap.set(e(id), { z, scale: (PERSPECTIVE - z) / PERSPECTIVE, transformOrigin: "50% 50%" });
  }, []);

  // 7. The camera. Each question moves in on its object. After the server confirms, it pulls back, tilts down and turns slowly.
  useEffect(() => {
    const cam = e("cam");
    if (!cam) return;
    camTween.current.forEach((t) => t.kill());
    camTween.current = [];
    const t = camTarget(p.view, lm);
    const to = { xPercent: t.xp, yPercent: t.yp, scale: t.s, rotationX: t.rx, rotationY: t.ry };
    if (p.reduced || camFirst.current) { camFirst.current = false; gsap.set(cam, { ...to, transformOrigin: "50% 50%" }); return; }
    const final = p.view === "final";
    const tw = gsap.to(cam, { ...to, duration: final ? 2 : 1.15, delay: final ? 1.5 : 0, ease: "power3.inOut", overwrite: true, onComplete: () => {
      if (!final) return;
      camTween.current.push(gsap.fromTo(cam, { rotationY: t.ry }, { rotationY: -t.ry, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut" }).timeScale(1 / p.slow));
    } });
    tw.timeScale(1 / p.slow);
    camTween.current.push(tw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.view, p.landmark, p.reduced, p.slow]);

  useEffect(() => () => {
    killLoops();
    camTween.current.forEach((t) => t.kill());
    timelines.current.forEach((t) => t.kill());
    gsap.killTweensOf(Object.values(el.current).filter(Boolean));
  }, []);

  const dusk = p.when === "earlier";
  const img = (l: Pick<L, "src" | "x" | "y" | "dw" | "w" | "h">, id: string, extra?: React.CSSProperties) => (
    <div key={id} ref={reg(id)} className="absolute" style={{ ...pos(l), ...extra }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={l.src} alt="" draggable={false} className="block size-full select-none" />
    </div>
  );
  const ghost: React.CSSProperties = { filter: "grayscale(1) brightness(1.6) contrast(0.55)", opacity: 0, visibility: "hidden" };
  const hidden: React.CSSProperties = { opacity: 0, visibility: "hidden" };
  const warm: React.CSSProperties = { filter: "sepia(0.18) saturate(1.1) brightness(0.96) hue-rotate(-6deg)", transition: p.reduced ? "none" : "filter 0.9s" };
  const cool: React.CSSProperties = { filter: "none", transition: p.reduced ? "none" : "filter 0.9s" };
  const tint = dusk ? warm : cool;
  const at = (l: L, x: number, y: number, dw: number): L => ({ ...l, x, y, dw });
  const label = [
    `Miniature station with a ${lm.label}.`,
    p.when ? (dusk ? "Dusk sky." : "Daytime sky.") : "",
    p.status ? { working: `The ${lm.label} works: green light.`, out: `The ${lm.label} is out of service: red light, barrier up.`, unsure: "Couldn’t tell: amber light, a question mark." }[p.status] : "",
    p.confirmed ? "Shared and sealed." : "",
  ].filter(Boolean).join(" ");
  const gr = lm.glow.r * 2.6;

  return (
    <div ref={reg("card")} className={p.bare ? "relative" : "relative overflow-hidden rounded-[1.6rem] border border-ivory/80 shadow-float"} style={p.bare ? undefined : { background: "linear-gradient(180deg, color-mix(in oklab, var(--sky) 20%, var(--ivory)) 0%, var(--ivory) 70%)" }}>
      {!p.bare && <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--cherry) 20%, var(--sun) 40%) 0%, color-mix(in oklab, var(--sun) 24%, var(--ivory)) 70%)", opacity: dusk ? 1 : 0, transition: p.reduced ? "none" : "opacity 0.9s" }} />}
      <div ref={reg("root")} role="img" aria-label={label} className="relative w-full" style={{ aspectRatio: `${SW} / ${SH}`, perspective: PERSPECTIVE }}>
        <div ref={reg("cam")} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <div ref={reg("gBack")} className="absolute inset-0">
          {img(FIXED.skyDay, "sky", hidden)}
          {img(FIXED.skyDusk, "skyDusk", hidden)}
        </div>
        <div ref={reg("gMid")} className="absolute inset-0">
          <div ref={reg("shadow")} aria-hidden className="absolute rounded-[50%] bg-graphite" style={{ left: "10%", width: "80%", top: "88%", height: "7%", opacity: 0.22, filter: "blur(10px)" }} />
          <div style={tint} className="absolute inset-0">
            {img(FIXED.tile, "tile")}
            {img(FIXED.building, "ghostBuilding", ghost)}
            {img(lm.base, "ghostTower", ghost)}
            {img(FIXED.building, "building", hidden)}
            <div ref={reg("towerGroup")} className="absolute inset-0">
              <div key={p.landmark} ref={reg("tower")} className="absolute inset-0" style={hidden}>
                {img(lm.base, lm.alt ? "gateOpen" : "lmBase")}
                {lm.alt && img(lm.alt, "gateClosed", hidden)}
                {lm.opening && (
                  <div className="absolute overflow-hidden" style={{ left: `${(lm.opening.x / SW) * 100}%`, top: `${(lm.opening.y / SH) * 100}%`, width: `${(lm.opening.w / SW) * 100}%`, height: `${(lm.opening.h / SH) * 100}%`, clipPath: "polygon(0 13%, 100% 0, 100% 83%, 0 100%)" }}>
                    <div ref={reg("doorL")} className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${A}/door-a.webp`} alt="" draggable={false} className="size-full select-none object-fill" />
                    </div>
                    <div ref={reg("doorR")} className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${A}/door-a.webp`} alt="" draggable={false} className="size-full select-none object-fill" />
                    </div>
                  </div>
                )}
                {lm.lamp && (["working", "out", "unsure"] as Status[]).map((s) => img({ ...LAMP_IMG[s], ...lm.lamp! }, { working: "lampGreen", out: "lampRed", unsure: "lampAmber" }[s], hidden))}
              </div>
            </div>
          </div>
          <div ref={reg("glow")} aria-hidden className="pointer-events-none absolute rounded-full mix-blend-screen" style={{ left: `${((lm.glow.x - gr / 2) / SW) * 100}%`, top: `${((lm.glow.y - gr / 2) / SH) * 100}%`, width: `${(gr / SW) * 100}%`, aspectRatio: "1", ...hidden }} />
          {img(at(FIXED.puff1, lm.smoke.x - 12, lm.smoke.y - 6, 46), "puff1", hidden)}
          {img(at(FIXED.puff2, lm.smoke.x + 30, lm.smoke.y - 18, 28), "puff2", hidden)}
          {img(at(FIXED.puff3, lm.smoke.x + 10, lm.smoke.y - 32, 26), "puff3", hidden)}
        </div>
        <div ref={reg("gFront")} className="absolute inset-0">
          <div style={tint} className="absolute inset-0">
            {img(at(FIXED.sign, lm.sign.x, lm.sign.y, lm.sign.dw), "sign", hidden)}
            <div ref={reg("rider")} className="absolute" style={{ ...pos(FIXED.rider), ...hidden }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={reg("riderStand")} src={`${A}/rider.webp`} alt="" draggable={false} className="absolute inset-0 block size-full select-none" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={reg("riderWalk")} src={`${A}/rider-walk.webp`} alt="" draggable={false} className="absolute inset-0 block size-full select-none" style={hidden} />
            </div>
          </div>
          {img(FIXED.note, "note", hidden)}
          {img(at(FIXED.question, lm.bubble.x, lm.bubble.y, 62), "question", hidden)}
          <div ref={reg("ring")} aria-hidden className="absolute rounded-full border-2 border-dashed border-graphite/50" style={{ ...pos(FIXED.seal), ...hidden }} />
          {img(FIXED.seal, "seal", hidden)}
          {img(at(FIXED.spark1, lm.glow.x + 24, lm.glow.y - 8, 22), "spark1", hidden)}
          {img(at(FIXED.spark2, lm.glow.x - 50, lm.glow.y - 14, 32), "spark2", hidden)}
          {img(at(FIXED.spark3, lm.glow.x + 30, lm.glow.y + 36, 24), "spark3", hidden)}
          {img(at(FIXED.spark4, lm.glow.x - 16, lm.glow.y - 36, 22), "spark4", hidden)}
        </div>
        </div>
        <div ref={reg("frame")} aria-hidden className="pointer-events-none absolute inset-0" style={p.bare ? { ...hidden, display: "none" } : hidden}>
          <div className="size-full" style={{ borderStyle: "solid", borderWidth: 26, borderImage: `url(${A}/frame.webp) 62 / 26px stretch`, borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}
