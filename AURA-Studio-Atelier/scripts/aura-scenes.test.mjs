import { test } from "node:test";
import assert from "node:assert/strict";
import { describeSceneFrame, findSceneCuts, splitSourceScenes } from "../src/components/aura/scene-detection.ts";
import { clipDuration } from "../src/components/aura/editor.ts";
import { captionSegments } from "../src/components/aura/timeline.ts";
const frame = (time, colour) => {
  const data = new Uint8ClampedArray(96 * 54 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([...colour, 255], i);
  return describeSceneFrame(data, 96, 54, time);
};
test("hard scene changes are detected at the first new frame", () => {
  const frames = Array.from({ length: 49 }, (_, i) => frame(i / 8, i < 16 ? [180, 30, 40] : i < 32 ? [20, 50, 190] : [30, 180, 80]));
  assert.deepEqual(findSceneCuts(frames, "normal", .5).map((c) => c.time), [2, 4]);
});
test("a one-frame flash and its return do not split a continuous shot", () => {
  const frames = Array.from({ length: 33 }, (_, i) => frame(i / 8, i === 16 ? [255, 255, 255] : [50, 80, 90]));
  assert.deepEqual(findSceneCuts(frames, "normal", .5), []);
});
test("small exposure noise across colour bins does not create cuts", () => {
  const frames = Array.from({ length: 33 }, (_, i) => frame(i / 8, [31 + i % 2, 63 + i % 2, 127 + i % 2]));
  assert.deepEqual(findSceneCuts(frames, "high", .25), []);
});
test("a slow dissolve yields one nearby boundary", () => {
  const frames = Array.from({ length: 49 }, (_, i) => {
    const mix = Math.max(0, Math.min(1, (i / 8 - 2) / .75));
    return frame(i / 8, [180 * (1 - mix) + 20 * mix, 30 + 20 * mix, 40 * (1 - mix) + 190 * mix]);
  });
  const cuts = findSceneCuts(frames, "normal", 1);
  assert.equal(cuts.length, 1);
  assert.ok(cuts[0].time >= 2 && cuts[0].time <= 2.75);
});
const clip = (id, from, to, rate = 1) => ({ id, in: from, out: to, rate, volume: .8, fadeIn: .2, fadeOut: .3,
  motion: { in: { id: "fade", duration: .4, amount: .5 }, out: { id: "zoom-out", duration: .5, amount: .6 }, loop: { id: "none", duration: 1, amount: .5 } } });
test("splitting reordered and repeated source spans preserves duration, gain and caption timing", () => {
  const clips = [clip("a", 4, 6, 2), clip("b", 0, 4, .5), clip("c", 0, 4)];
  const cues = [{ id: "cue", start: 1, end: 3, text: "Aynı söz", words: [] }];
  const next = splitSourceScenes(clips, [2, 5, 2, NaN, 99]);
  assert.equal(next.length, 6);
  assert.equal(next.reduce((n, c) => n + clipDuration(c), 0), clips.reduce((n, c) => n + clipDuration(c), 0));
  assert.equal(next.every((c) => c.volume === .8), true);
  assert.equal(new Set(next.map((c) => c.id)).size, next.length);
  assert.equal(next[0].motion.in.id, "fade");
  assert.equal(next[0].motion.out.id, "none");
  assert.equal(next[1].motion.in.id, "none");
  assert.equal(next[1].motion.out.id, "zoom-out");
  assert.equal(next[0].fadeOut, 0); assert.equal(next[1].fadeIn, 0);
  const before = captionSegments(cues, clips, 0), after = captionSegments(cues, next, 0);
  assert.equal(before.reduce((n, c) => n + c.end - c.start, 0), after.reduce((n, c) => n + c.end - c.start, 0));
  assert.equal(after.every((c) => c.text === "Aynı söz"), true);
  assert.equal(splitSourceScenes(next, [2, 5]), next);
  assert.deepEqual(clips.map((c) => c.in), [4, 0, 0]);
});
