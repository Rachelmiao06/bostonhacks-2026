// Tiny synthesized sounds, so there are no audio files. Off by default; the test page has a switch.
// Browsers only allow audio after a tap, so the context is created on the first sound.

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, type: OscillatorType, f0: number, f1: number, dur: number, gain: number, at = 0) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function puff(c: AudioContext, dur: number, gain: number) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

export type Sound = "tick" | "ding" | "clunk" | "huh" | "stamp" | "plop";

export function play(kind: Sound) {
  const c = audio();
  if (!c) return;
  if (kind === "tick") tone(c, "sine", 1100, 700, 0.05, 0.05);
  if (kind === "plop") { tone(c, "sine", 320, 160, 0.14, 0.09); puff(c, 0.06, 0.05); }
  if (kind === "ding") { tone(c, "sine", 880, 880, 0.7, 0.1); tone(c, "sine", 1318, 1318, 0.9, 0.08, 0.12); }
  if (kind === "huh") { tone(c, "sine", 520, 520, 0.22, 0.07); tone(c, "sine", 392, 392, 0.34, 0.07, 0.16); }
  if (kind === "clunk") { tone(c, "triangle", 120, 38, 0.32, 0.25); puff(c, 0.14, 0.14); }
  if (kind === "stamp") { tone(c, "triangle", 170, 48, 0.22, 0.3); puff(c, 0.09, 0.16); tone(c, "sine", 1568, 1568, 0.5, 0.05, 0.12); }
}
