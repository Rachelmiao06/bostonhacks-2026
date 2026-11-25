// Dev check for the journey logic. No test runner needed (CI has none on main yet):
//
//   node --no-warnings src/features/journey/check.mjs
//
// It exercises the pure files (machine, layers, policy, vocab) with scenarios and a random-sequence fuzz that
// hunts for impossible states. When Vitest lands (PR #13), these cases move into a *.test.ts as they are.
import assert from "node:assert/strict";
import { reduce, initialState } from "./machine.ts";
import { layersFor } from "./layers.ts";

const run = (events, from = initialState) => events.reduce((s, e) => reduce(s, e), from);
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("ok  " + name); };

ok("happy path: report from map to reward and back", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }]); assert.equal(s.stage, "focus");
  s = run([{ type: "draft", hasContent: true }], s); assert.equal(s.stage, "drafting");
  s = run([{ type: "review_started" }], s); assert.equal(s.stage, "reviewing");
  s = run([{ type: "review_result", result: "passed" }], s); assert.equal(s.stage, "ready");
  s = run([{ type: "commit" }], s); assert.equal(s.stage, "sending");
  s = run([{ type: "completed", tokens: 10 }], s); assert.equal(s.stage, "reward"); assert.deepEqual(s.reward, { questId: "q1", tokens: 10 });
  s = run([{ type: "next" }], s); assert.deepEqual(s, initialState);
});
ok("needs work goes to revising; any edit returns to drafting", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "review_started" }, { type: "review_result", result: "needs_work" }]);
  assert.equal(s.stage, "revising");
  s = run([{ type: "draft", hasContent: true }], s); assert.equal(s.stage, "drafting");
});
ok("a failed check keeps the draft and flags it; editing clears the flag", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "review_started" }, { type: "review_result", result: "failed" }]);
  assert.equal(s.stage, "drafting"); assert.equal(s.reviewFailed, true);
  assert.equal(layersFor(s).status, "failed");
  s = run([{ type: "review_started" }], s); assert.equal(s.reviewFailed, false);
});
ok("a check answer that arrives after an edit is ignored", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "review_started" }, { type: "draft", hasContent: true }]);
  assert.equal(s.stage, "drafting");
  const after = reduce(s, { type: "review_result", result: "passed" }); assert.equal(after, s);
});
ok("an edit after the check passed makes it out of date (back to drafting, cannot send)", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "review_started" }, { type: "review_result", result: "passed" }, { type: "draft", hasContent: true }]);
  assert.equal(s.stage, "drafting"); assert.equal(layersFor(s).gestures.commit, false);
  assert.equal(reduce(s, { type: "commit" }), s);
});
ok("emptying the draft returns to focus", () => {
  const s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "draft", hasContent: false }]);
  assert.equal(s.stage, "focus");
});
ok("dismissing a draft parks it; dismissing a bare focus does not", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "dismiss" }]);
  assert.equal(s.stage, "explore"); assert.equal(s.parkedQuestId, "q1");
  s = run([{ type: "select", questId: "q2", mode: "report" }, { type: "dismiss" }], s);
  assert.equal(s.parkedQuestId, "q1");
});
ok("opening another quest parks the draft; coming back un-parks it", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "select", questId: "q2", mode: "report" }]);
  assert.equal(s.questId, "q2"); assert.equal(s.parkedQuestId, "q1");
  s = run([{ type: "select", questId: "q1", mode: "report" }], s); assert.equal(s.parkedQuestId, null);
});
ok("cannot dismiss or switch while the check runs or while sending", () => {
  let s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "review_started" }]);
  assert.equal(reduce(s, { type: "dismiss" }), s); assert.equal(reduce(s, { type: "select", questId: "q2", mode: "report" }), s);
  s = run([{ type: "review_result", result: "passed" }, { type: "commit" }], s);
  assert.equal(reduce(s, { type: "dismiss" }), s); assert.equal(reduce(s, { type: "commit" }), s); assert.equal(reduce(s, { type: "select", questId: "q2", mode: "report" }), s);
});
ok("verify: one gesture, no draft, failure returns to focus", () => {
  let s = run([{ type: "select", questId: "v1", mode: "verify" }]);
  assert.equal(reduce(s, { type: "draft", hasContent: true }), s);
  assert.equal(layersFor(s).gestures.commit, true);
  s = run([{ type: "commit" }, { type: "send_failed" }], s); assert.equal(s.stage, "focus");
  s = run([{ type: "commit" }, { type: "completed", tokens: 5 }], s); assert.equal(s.stage, "reward");
});
ok("send failure on a report returns to ready", () => {
  const s = run([{ type: "select", questId: "q1", mode: "report" }, { type: "draft", hasContent: true }, { type: "review_started" }, { type: "review_result", result: "passed" }, { type: "commit" }, { type: "send_failed" }]);
  assert.equal(s.stage, "ready");
});
ok("completed and next outside their stage are ignored", () => {
  assert.equal(reduce(initialState, { type: "completed", tokens: 10 }), initialState);
  const f = run([{ type: "select", questId: "q1", mode: "report" }]);
  assert.equal(reduce(f, { type: "completed", tokens: 10 }), f); assert.equal(reduce(f, { type: "next" }), f);
});
ok("from the reward the rider can pick another quest straight away", () => {
  let s = run([{ type: "select", questId: "v1", mode: "verify" }, { type: "commit" }, { type: "completed", tokens: 5 }, { type: "select", questId: "q2", mode: "report" }]);
  assert.equal(s.stage, "focus"); assert.equal(s.reward, null);
});
ok("layers: map always present, overlay only in reward, input only when it makes sense", () => {
  const stages = ["explore", "focus", "drafting", "reviewing", "revising", "ready", "sending", "reward"];
  for (const mode of ["report", "verify"]) for (const stage of stages) {
    const L = layersFor({ ...initialState, stage, mode, questId: "x" });
    assert.ok(L.map === "full" || L.map === "dimmed");
    assert.equal(L.overlay === "reward", stage === "reward");
    if (stage === "explore") assert.equal(L.sheet, "hidden");
    if (stage === "reviewing" || stage === "sending") assert.equal(L.gestures.dismiss, false);
    if (L.gestures.commit) assert.ok(stage === "ready" || (stage === "focus" && mode === "verify"));
  }
});


import { policy, shouldAutoReview, suggestNext } from "./policy.ts";
import { glyphsFor, urgencyOf } from "./vocab.ts";

const base = { stage: "drafting", chars: 40, hasPhoto: false, changedSinceCheck: true, idleMs: policy.autoReviewIdleMs };
ok("auto check: only after a pause, only when something changed, only with enough to check", () => {
  assert.equal(shouldAutoReview(base), true);
  assert.equal(shouldAutoReview({ ...base, idleMs: policy.autoReviewIdleMs - 1 }), false);
  assert.equal(shouldAutoReview({ ...base, changedSinceCheck: false }), false, "no loop after a failed check");
  assert.equal(shouldAutoReview({ ...base, chars: policy.autoReviewMinChars - 1 }), false);
  assert.equal(shouldAutoReview({ ...base, chars: 0, hasPhoto: true }), true, "a photo alone is enough");
  for (const stage of ["explore", "focus", "reviewing", "revising", "ready", "sending", "reward"]) assert.equal(shouldAutoReview({ ...base, stage }), false);
});

const quest = (o) => ({ id: "x", kind: "elevator", mode: "report", stationId: "s1", stationName: "S", lines: ["Red"], daysOpen: 3, rewardTokens: 10, activeNow: true, ...o });
ok("next problem: nearby and similar first, never a done or current one, stable on ties", () => {
  const qs = [quest({ id: "a", stationId: "s9", lines: ["Blue"], kind: "access" }), quest({ id: "b", stationId: "s1" }), quest({ id: "c", stationId: "s2", lines: ["Red"] })];
  assert.equal(suggestNext(qs, new Set(), { stationId: "s1", lines: ["Red"], kind: "elevator" }, "zz"), "b");
  assert.equal(suggestNext(qs, new Set(["b"]), { stationId: "s1", lines: ["Red"], kind: "elevator" }), "c");
  assert.equal(suggestNext(qs, new Set(["a", "b", "c"])), null);
  assert.equal(suggestNext([quest({ id: "q2", activeNow: false })], new Set()), null, "an inactive alert is never suggested");
  assert.equal(suggestNext([quest({ id: "b2" }), quest({ id: "a2" })], new Set()), "a2", "ties break by id");
});

ok("vocabulary: same four tones the map uses, urgency bands, lines normalised", () => {
  assert.equal(glyphsFor(quest({ kind: "elevator" })).tone, "access");
  assert.equal(glyphsFor(quest({ kind: "escalator" })).tone, "station");
  assert.equal(glyphsFor(quest({ kind: "shuttle" })).tone, "service");
  const v = glyphsFor(quest({ mode: "verify", daysOpen: 90 }));
  assert.equal(v.tone, "verify"); assert.equal(v.icon, "verify"); assert.equal(v.urgency, 0);
  assert.deepEqual([0, 0.5, 1, 6, 7, 29, 30, 400].map(urgencyOf), [0, 0, 1, 1, 2, 2, 3, 3]);
  assert.deepEqual(glyphsFor(quest({ lines: ["Green", "green", "Nowhere", "Red"] })).lines, ["green", "red"]);
  assert.equal(glyphsFor(quest({}), { done: true }).done, true);
});

// Fuzz: whatever order events arrive in, the state is never impossible.
const events = () => [
  { type: "select", questId: "a", mode: "report" }, { type: "select", questId: "b", mode: "report" }, { type: "select", questId: "v", mode: "verify" },
  { type: "dismiss" }, { type: "draft", hasContent: true }, { type: "draft", hasContent: false }, { type: "review_started" },
  { type: "review_result", result: "passed" }, { type: "review_result", result: "needs_work" }, { type: "review_result", result: "failed" },
  { type: "commit" }, { type: "completed", tokens: 10 }, { type: "send_failed" }, { type: "next" }, { type: "reset" },
];
let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
let checked = 0;
for (let run_ = 0; run_ < 4000; run_++) {
  let s = initialState; const E = events();
  for (let i = 0; i < 40; i++) {
    const e = E[Math.floor(rnd() * E.length)]; const next = reduce(s, e);
    if (next === s) { s = next; continue; }
    s = next; checked++;
    const writing = ["drafting", "reviewing", "revising", "ready"].includes(s.stage);
    if (writing) { assert.equal(s.mode, "report", "writing only happens in report mode"); assert.ok(s.questId); }
    if (s.stage === "explore") { assert.equal(s.questId, null); assert.equal(s.reward, null); }
    if (s.stage === "focus") assert.ok(s.questId && s.mode);
    if (s.stage === "reward") { assert.ok(s.reward && s.reward.questId === s.questId); }
    if (s.stage !== "reward") assert.equal(s.reward, null);
    if (s.stage === "sending") assert.ok(s.returnTo);
    assert.notEqual(s.parkedQuestId, s.questId && s.stage !== "explore" ? s.questId : "__none__", "a quest is never parked while it is the open one");
    const L = layersFor(s); assert.ok(L.sheet && L.map && L.overlay);
  }
}
console.log(`ok  fuzz: 4000 random journeys, ${checked} transitions, no impossible state`);
console.log(`\n${n} scenario checks + fuzz passed`);
