"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { play } from "./sound";

// The little station. Layers are positioned in a 420 x 400 stage, in percent, so it scales with its card.
// ROUGH TEST ART: cut from the hand-made sheet on the desktop. The final layers will replace these files in
// public/assets/challenge-diorama/ one for one.
const SW = 420;
const SH = 400;
const A = "/assets/challenge-diorama";

export type Status = "working" | "unsure" | "out";
export type When = "now" | "earlier";

export type DioramaProps = {
  when: When | null;
  status: Status | null;
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
};

type L = { src: string; w: number; h: number; x: number; y: number; dw: number };
const L = (src: string, w: number, h: number, x: number, y: number, dw: number): L => ({ src: `${A}/${src}.webp`, w, h, x, y, dw });

const LAYERS = {
  skyDay: L("sky-day", 448, 263, 34, 4, 352),
  skyDusk: L("sky-dusk", 443, 268, 34, 4, 352),
  tile: L("base-tile", 432, 295, 22, 128, 376),
  building: L("building", 386, 342, 30, 104, 190),
  tower: L("tower", 247, 385, 262, 90, 120),
  lampGreen: L("lamp-green", 150, 127, 296, 104, 50),
  lampRed: L("lamp-red", 151, 127, 296, 104, 50),
  lampAmber: L("lamp-amber", 150, 127, 296, 104, 50),
  sign: L("sign", 165, 171, 266, 236, 52),
  rider: L("rider", 135, 244, 176, 204, 54),
  note: L("bubble-note", 204, 165, 142, 160, 92),
  question: L("bubble-question", 160, 163, 342, 60, 68),
  seal: L("seal", 197, 198, 326, 292, 68),
  puff1: L("puff-1", 120, 98, 292, 70, 46),
  puff2: L("puff-2", 80, 75, 334, 58, 28),
  puff3: L("puff-3", 75, 71, 312, 44, 26),
  spark1: L("spark-1", 58, 62, 344, 104, 22),
  spark2: L("spark-2", 88, 79, 270, 96, 34),
  spark3: L("spark-3", 75, 65, 352, 146, 24),
  spark4: L("spark-4", 61, 66, 300, 76, 22),
} as const;

const pos = (l: L) => ({ left: `${(l.x / SW) * 100}%`, top: `${(l.y / SH) * 100}%`, width: `${(l.dw / SW) * 100}%`, aspectRatio: `${l.w} / ${l.h}` });

// The lift opening on the tower, where the two door leaves sit.
const OPENING = { x: 313, y: 168, w: 42, h: 78 };
const GLOW = { x: 321, y: 127 };
const LIGHT: Record<Status, string> = { working: "var(--leaf)", out: "var(--cherry)", unsure: "var(--sun)" };

export function Diorama(p: DioramaProps) {
  const el = useRef<Record<string, HTMLElement | null>>({});
  const reg = (id: string) => (n: HTMLElement | null) => { el.current[id] = n; };
  const e = (id: string) => el.current[id];
  const prev = useRef<{ vis: Record<string, boolean>; status: Status | null; confirmed: boolean } | null>(null);
  const loops = useRef<gsap.core.Animation[]>([]);
  const timelines = useRef<gsap.core.Timeline[]>([]);

  const killLoops = () => { loops.current.forEach((t) => t.kill()); loops.current = []; };
  const run = (tl: gsap.core.Timeline) => { tl.timeScale(1 / p.slow); timelines.current.push(tl); return tl; };

  // 1. Layers appear as answers arrive. A soft drop with a small squash, like felt landing on a table.
  useEffect(() => {
    const vis: Record<string, boolean> = {
      sky: p.when === "now", skyDusk: p.when === "earlier", building: p.when !== null, tower: p.status !== null, rider: p.rider, note: p.note,
      ghostBuilding: p.when === null, ghostTower: p.status === null,
    };
    const before = prev.current?.vis;
    for (const [id, on] of Object.entries(vis)) {
      const n = e(id);
      if (!n) continue;
      const was = before?.[id];
      if (was === undefined || p.reduced) { gsap.set(n, { autoAlpha: on ? 1 : 0, y: 0, scale: 1 }); continue; }
      if (on && !was) {
        if (id.startsWith("ghost") || id.startsWith("sky")) gsap.to(n, { autoAlpha: 1, duration: id.startsWith("sky") ? 0.7 : 0.3 });
        else {
          const tl = run(gsap.timeline());
          tl.fromTo(n, { autoAlpha: 0, y: id === "rider" ? 0 : -44, x: id === "rider" ? -40 : 0, scale: 0.88, transformOrigin: "50% 100%" }, { autoAlpha: 1, y: 0, x: 0, scale: 1, duration: id === "rider" ? 0.6 : 0.75, ease: id === "rider" ? "power3.out" : "back.out(1.6)" })
            .to(n, { scaleY: 0.95, scaleX: 1.025, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" }, id === "rider" ? ">-0.1" : ">-0.18");
        }
      } else if (!on && was) gsap.to(n, { autoAlpha: 0, duration: p.reduced ? 0 : 0.25 });
    }
    prev.current = { vis, status: prev.current?.status ?? null, confirmed: prev.current?.confirmed ?? false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.when, p.status, p.rider, p.note, p.reduced]);

  // 2. The elevator answers: light, doors, and what happens around it.
  useEffect(() => {
    const status = p.status;
    const before = prev.current?.status ?? null;
    if (prev.current) prev.current.status = status;
    killLoops();
    const lamps = { working: e("lampGreen"), out: e("lampRed"), unsure: e("lampAmber") };
    const glow = e("glow");
    const doors = [e("doorL"), e("doorR")].filter(Boolean) as HTMLElement[];
    const sign = e("sign"), q = e("question"), tower = e("towerGroup");
    const fx = ["puff1", "puff2", "puff3", "spark1", "spark2", "spark3", "spark4"].map(e).filter(Boolean) as HTMLElement[];
    const puffs = fx.slice(0, 3), sparks = fx.slice(3);
    gsap.killTweensOf([...doors, sign, q, tower, glow, ...fx]);
    (Object.keys(lamps) as Status[]).forEach((k) => lamps[k] && gsap.to(lamps[k], { autoAlpha: k === status ? 1 : 0, duration: p.reduced ? 0 : 0.25 }));
    if (!status) { gsap.set([sign, q, glow, ...fx], { autoAlpha: 0 }); gsap.set(doors, { xPercent: 0 }); return; }
    if (glow) glow.style.background = `radial-gradient(circle, color-mix(in oklab, ${LIGHT[status]} 75%, transparent) 0%, transparent 68%)`;
    const doorX = status === "working" ? 62 : status === "unsure" ? 14 : 0;
    const wait = before === null ? 0.55 : 0;
    gsap.set([sign, q], { autoAlpha: 0 });
    gsap.set(fx, { autoAlpha: 0 });

    if (p.reduced) {
      gsap.set(doors[0], { xPercent: -doorX }); gsap.set(doors[1], { xPercent: doorX });
      gsap.set(glow, { autoAlpha: 0.7, scale: 1 });
      if (status === "out") gsap.set(sign, { autoAlpha: 1, y: 0 });
      if (status === "unsure") gsap.set(q, { autoAlpha: 1, scale: 1 });
      return;
    }
    const tl = run(gsap.timeline({ delay: wait }));
    gsap.to(doors[0], { xPercent: 0, duration: 0 });
    if (status === "working") {
      tl.call(() => { if (p.sound) play("plop"); }, [], 0)
        .fromTo(glow, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 0.85, scale: 1.15, duration: 0.35, ease: "power2.out" })
        .to(glow, { autoAlpha: 0.55, scale: 1, duration: 0.7, ease: "sine.inOut" })
        .call(() => { if (p.sound) play("ding"); }, [], "<-0.45")
        .to(doors[0], { xPercent: -doorX, duration: 0.75, ease: "power3.out" }, "<")
        .to(doors[1], { xPercent: doorX, duration: 0.75, ease: "power3.out" }, "<")
        .to(tower, { y: -3, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out" }, "<");
      loops.current.push(gsap.to(glow, { autoAlpha: 0.4, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: wait + 1.2 }));
    } else if (status === "out") {
      tl.call(() => { if (p.sound) play("clunk"); }, [], 0)
        .to(tower, { keyframes: [{ x: -3, duration: 0.05 }, { x: 3, duration: 0.06 }, { x: -2, duration: 0.06 }, { x: 2, duration: 0.06 }, { x: 0, duration: 0.08 }], ease: "none" })
        .fromTo(glow, { autoAlpha: 0, scale: 0.7 }, { keyframes: [{ autoAlpha: 0.9, duration: 0.05 }, { autoAlpha: 0.1, duration: 0.06 }, { autoAlpha: 0.8, duration: 0.05 }, { autoAlpha: 0.15, duration: 0.08 }, { autoAlpha: 0.7, scale: 1, duration: 0.12 }] }, "<")
        .fromTo(sign, { autoAlpha: 1, y: -70, rotation: -10, transformOrigin: "50% 100%" }, { y: 0, rotation: 0, duration: 0.75, ease: "bounce.out" }, "<0.1")
        .fromTo(puffs, { autoAlpha: 0.95, y: 0, scale: 0.6 }, { autoAlpha: 0, y: -34, scale: 1.5, duration: 1.3, ease: "power1.out", stagger: 0.14 }, "<0.1")
        .fromTo(sparks, { autoAlpha: 1, scale: 0.2, rotation: 0 }, { autoAlpha: 0, scale: 1.3, rotation: 90, duration: 0.7, ease: "power2.out", stagger: 0.05 }, "<0.05");
      loops.current.push(gsap.to(glow, { keyframes: [{ autoAlpha: 0.15, duration: 0.06 }, { autoAlpha: 0.8, duration: 0.05 }, { autoAlpha: 0.2, duration: 0.08 }, { autoAlpha: 0.65, duration: 0.2 }], repeat: -1, repeatDelay: 2.4, delay: wait + 2.2 }));
    } else {
      tl.call(() => { if (p.sound) play("huh"); }, [], 0)
        .fromTo(glow, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 0.75, scale: 1.05, duration: 0.4, ease: "power2.out" })
        .to(doors[0], { xPercent: -doorX, duration: 0.5, ease: "power2.out" }, "<")
        .to(doors[1], { xPercent: doorX, duration: 0.5, ease: "power2.out" }, "<")
        .fromTo(q, { autoAlpha: 1, scale: 0, transformOrigin: "10% 100%" }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, "<0.15");
      loops.current.push(gsap.to(glow, { autoAlpha: 0.2, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: wait + 0.5 }));
      loops.current.push(gsap.to(q, { y: -4, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut", delay: wait + 1 }));
    }
    for (const l of loops.current) l.timeScale(1 / p.slow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.status, p.reduced, p.slow]);

  // 3. The seal. A dashed outline while saving; it only becomes a seal after the server confirms.
  useEffect(() => {
    const seal = e("seal"), frame = e("frame"), ring = e("ring"), root = e("root"), shadow = e("shadow"), rider = e("rider");
    const was = prev.current?.confirmed ?? false;
    if (prev.current) prev.current.confirmed = p.confirmed;
    const ringOn = (p.saving || p.failed) && !p.confirmed;
    gsap.killTweensOf([seal, frame, ring, root, shadow]);
    if (!p.confirmed) {
      gsap.set([seal, frame], { autoAlpha: 0 });
      gsap.set(root, { y: 0 });
      gsap.set(shadow, { scale: 1, opacity: 0.22 });
      gsap.to(ring, { autoAlpha: ringOn ? 1 : 0, duration: p.reduced ? 0 : 0.2 });
      if (ringOn && !p.reduced && p.saving) loops.current.push(gsap.to(ring, { scale: 1.08, duration: 0.6, yoyo: true, repeat: -1, ease: "sine.inOut" }));
      if (p.failed && !p.reduced) gsap.fromTo(ring, { xPercent: 0 }, { keyframes: [{ xPercent: -8, duration: 0.05 }, { xPercent: 8, duration: 0.07 }, { xPercent: -6, duration: 0.07 }, { xPercent: 6, duration: 0.07 }, { xPercent: 0, duration: 0.08 }], ease: "none" });
      return;
    }
    gsap.set(ring, { autoAlpha: 0 });
    if (p.reduced || !was === false) { gsap.set([seal, frame], { autoAlpha: 1, scale: 1, rotation: 0 }); gsap.set(seal, { rotation: -6 }); return; }
    const sparks = ["spark1", "spark2", "spark3", "spark4"].map(e).filter(Boolean) as HTMLElement[];
    const tl = run(gsap.timeline());
    tl.call(() => { if (p.sound) play("stamp"); }, [], 0.3)
      .fromTo(seal, { autoAlpha: 0, scale: 2.6, rotation: -26, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, rotation: -6, duration: 0.4, ease: "back.out(2.2)" })
      .to(root, { y: 4, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" }, "<0.32")
      .fromTo(sparks, { autoAlpha: 1, scale: 0.2, rotation: 0 }, { autoAlpha: 0, scale: 1.4, rotation: 80, duration: 0.8, ease: "power2.out", stagger: 0.06 }, "<")
      .to(rider, { y: -14, duration: 0.17, yoyo: true, repeat: 1, ease: "power2.out" }, "<0.05")
      .fromTo(frame, { autoAlpha: 0, scale: 1.05 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out" }, "<0.2")
      .to(root, { y: -8, duration: 0.6, ease: "power2.out" }, ">-0.1")
      .to(shadow, { scale: 0.9, opacity: 0.14, duration: 0.6, ease: "power2.out" }, "<");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.confirmed, p.saving, p.failed, p.reduced]);

  // 4. Glass-like depth: layers drift a few pixels against each other as the pointer moves. Not under Reduced Motion.
  useEffect(() => {
    const card = e("card");
    const groups = [e("gBack"), e("gMid"), e("gFront")];
    if (!card || p.reduced || !window.matchMedia("(hover: hover)").matches) return;
    const amt = [3, 7, 13];
    const qx = groups.map((g, i) => gsap.quickTo(g!, "x", { duration: 0.7, ease: "power3.out" }) && [gsap.quickTo(g!, "x", { duration: 0.7, ease: "power3.out" }), gsap.quickTo(g!, "y", { duration: 0.7, ease: "power3.out" }), amt[i]] as const);
    const move = (ev: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const nx = ((ev.clientX - r.left) / r.width) * 2 - 1, ny = ((ev.clientY - r.top) / r.height) * 2 - 1;
      for (const [x, y, a] of qx) { x(-nx * a); y(-ny * a * 0.6); }
    };
    const leave = () => { for (const [x, y] of qx) { x(0); y(0); } };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    return () => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); gsap.set(groups, { x: 0, y: 0 }); };
  }, [p.reduced]);

  // 5. Small life, never required: the rider breathes, and tapping him or the lamp gives a little reaction.
  useEffect(() => {
    const rider = e("rider");
    const body = rider?.firstElementChild as HTMLElement | null;
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
  }, [p.reduced, p.sound, p.status]);

  useEffect(() => () => {
    killLoops();
    timelines.current.forEach((t) => t.kill());
    gsap.killTweensOf(Object.values(el.current).filter(Boolean));
  }, []);

  const dusk = p.when === "earlier";
  const img = (l: L, id: string, extra?: React.CSSProperties, cls = "") => (
    <div key={id} ref={reg(id)} className={`absolute ${cls}`} style={{ ...pos(l), ...extra }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={l.src} alt="" draggable={false} className="block size-full select-none" />
    </div>
  );
  const ghost: React.CSSProperties = { filter: "grayscale(1) brightness(1.6) contrast(0.55)", opacity: 0, visibility: "hidden" };
  const hidden: React.CSSProperties = { opacity: 0, visibility: "hidden" };
  const warm: React.CSSProperties = { filter: "sepia(0.18) saturate(1.1) brightness(0.96) hue-rotate(-6deg)", transition: p.reduced ? "none" : "filter 0.9s" };
  const cool: React.CSSProperties = { filter: "none", transition: p.reduced ? "none" : "filter 0.9s" };
  const tint = dusk ? warm : cool;
  const label = [
    "Miniature station.",
    p.when ? (dusk ? "Dusk sky." : "Daytime sky.") : "",
    p.status ? { working: "The elevator works: green light, doors open.", out: "The elevator is out of service: red light, doors shut, barrier up.", unsure: "Couldn’t tell: amber light, a question mark." }[p.status] : "",
    p.confirmed ? "Shared and sealed." : "",
  ].filter(Boolean).join(" ");

  return (
    <div ref={reg("card")} className="relative overflow-hidden rounded-[1.6rem] border border-ivory/80 shadow-float" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--sky) 20%, var(--ivory)) 0%, var(--ivory) 70%)" }}>
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--cherry) 20%, var(--sun) 40%) 0%, color-mix(in oklab, var(--sun) 24%, var(--ivory)) 70%)", opacity: dusk ? 1 : 0, transition: p.reduced ? "none" : "opacity 0.9s" }} />
      <div ref={reg("root")} role="img" aria-label={label} className="relative w-full" style={{ aspectRatio: `${SW} / ${SH}` }}>
        <div ref={reg("gBack")} className="absolute inset-0">
          {img(LAYERS.skyDay, "sky", hidden)}
          {img(LAYERS.skyDusk, "skyDusk", hidden)}
        </div>
        <div ref={reg("gMid")} className="absolute inset-0">
          <div ref={reg("shadow")} aria-hidden className="absolute rounded-[50%] bg-graphite" style={{ left: "10%", width: "80%", top: "88%", height: "7%", opacity: 0.22, filter: "blur(10px)" }} />
          <div style={tint} className="absolute inset-0">
            {img(LAYERS.tile, "tile")}
            {img(LAYERS.building, "ghostBuilding", ghost)}
            {img(LAYERS.tower, "ghostTower", ghost)}
            {img(LAYERS.building, "building", hidden)}
            <div ref={reg("towerGroup")} className="absolute inset-0">
              <div ref={reg("tower")} className="absolute inset-0" style={hidden}>
                {img(LAYERS.tower, "towerImg")}
                <div className="absolute overflow-hidden" style={{ left: `${(OPENING.x / SW) * 100}%`, top: `${(OPENING.y / SH) * 100}%`, width: `${(OPENING.w / SW) * 100}%`, height: `${(OPENING.h / SH) * 100}%`, clipPath: "polygon(0 6%, 100% 0, 100% 92%, 0 100%)" }}>
                  <div ref={reg("doorL")} className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${A}/door-a.webp`} alt="" draggable={false} className="size-full select-none object-fill" />
                  </div>
                  <div ref={reg("doorR")} className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${A}/door-a.webp`} alt="" draggable={false} className="size-full select-none object-fill" />
                  </div>
                </div>
                {img(LAYERS.lampGreen, "lampGreen", hidden)}
                {img(LAYERS.lampRed, "lampRed", hidden)}
                {img(LAYERS.lampAmber, "lampAmber", hidden)}
              </div>
            </div>
          </div>
          <div ref={reg("glow")} aria-hidden className="pointer-events-none absolute rounded-full mix-blend-screen" style={{ left: `${((GLOW.x - 60) / SW) * 100}%`, top: `${((GLOW.y - 60) / SH) * 100}%`, width: `${(120 / SW) * 100}%`, aspectRatio: "1", ...hidden }} />
          {img(LAYERS.puff1, "puff1", hidden)}
          {img(LAYERS.puff2, "puff2", hidden)}
          {img(LAYERS.puff3, "puff3", hidden)}
        </div>
        <div ref={reg("gFront")} className="absolute inset-0">
          <div style={tint} className="absolute inset-0">
            {img(LAYERS.sign, "sign", hidden)}
            {img(LAYERS.rider, "rider", hidden)}
          </div>
          {img(LAYERS.note, "note", hidden)}
          {img(LAYERS.question, "question", hidden)}
          <div ref={reg("ring")} aria-hidden className="absolute rounded-full border-2 border-dashed border-graphite/50" style={{ ...pos(LAYERS.seal), ...hidden }} />
          {img(LAYERS.seal, "seal", hidden)}
          {img(LAYERS.spark1, "spark1", hidden)}
          {img(LAYERS.spark2, "spark2", hidden)}
          {img(LAYERS.spark3, "spark3", hidden)}
          {img(LAYERS.spark4, "spark4", hidden)}
        </div>
        <div ref={reg("frame")} aria-hidden className="pointer-events-none absolute inset-0" style={hidden}>
          <div className="size-full" style={{ borderStyle: "solid", borderWidth: 26, borderImage: `url(${A}/frame.webp) 62 / 26px stretch`, borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}
