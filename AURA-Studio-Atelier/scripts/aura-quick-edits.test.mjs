import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loudestWindow,
  sectionClips,
  soundRanges,
  softEdges,
  transitionEverywhere,
  trimmedEdges,
  withoutSilences,
} from "../src/components/aura/quick-edits.ts";

const clip = (id, inn, out, extra = {}) => ({ id, in: inn, out, rate: 1, volume: 1, fadeIn: 0, fadeOut: 0, ...extra });
// 10 bars per second over `seconds`, loudness from a function of time.
const level = (seconds, f) => Array.from({ length: seconds * 10 }, (_, i) => f(i / 10));

test("the loudest stretch is found and starts on a beat", () => {
  const peaks = level(120, (t) => (t >= 60 && t < 90 ? 0.9 : 0.3));
  assert.equal(loudestWindow(peaks, 120, 30), 60);
  const beats = Array.from({ length: 240 }, (_, i) => 0.25 + i * 0.5);
  assert.equal(loudestWindow(peaks, 120, 30, beats), 59.75);
  assert.equal(loudestWindow(peaks, 120, 120), null);
});
test("a section becomes one clip with soft edges", () => {
  const [c] = sectionClips([clip("a", 0, 120, { rate: 2, transition: { id: "flash", duration: 0.5 } }), clip("b", 0, 5)], 60, 30);
  assert.deepEqual([c.id, c.in, c.out, c.rate, c.fadeIn, c.fadeOut, c.transition], ["a", 60, 90, 1, 0.6, 1.5, undefined]);
});
test("silences longer than the gap are removed, short pauses stay", () => {
  // sound 0–2, 1 s silence, sound 3–5, 0.3 s pause, sound 5.3–8, silence to 10
  const peaks = level(10, (t) => ((t >= 2 && t < 3) || (t >= 5 && t < 5.3) || t >= 8 ? 0.01 : 0.8));
  const ranges = soundRanges(peaks, 10);
  assert.deepEqual(ranges.map(([a, b]) => [+a.toFixed(2), +b.toFixed(2)]), [[0, 2.15], [2.85, 8.15]]);
  const { clips, removed } = withoutSilences([clip("a", 0, 10, { fadeIn: 1, fadeOut: 2 })], ranges);
  assert.deepEqual(clips.map((c) => [c.id === "a", +c.in.toFixed(2), +c.out.toFixed(2), c.fadeIn, c.fadeOut]), [
    [true, 0, 2.15, 1, 0],
    [false, 2.85, 8.15, 0, 2],
  ]);
  assert.equal(+removed.toFixed(2), 2.55);
});
test("silent sources and the clip limit leave clips whole", () => {
  assert.deepEqual(soundRanges(level(5, () => 0), 5), []);
  const ranges = [[0, 1], [2, 3], [4, 5]];
  const { clips } = withoutSilences([clip("a", 0, 5), clip("b", 0, 5)], ranges, 4);
  assert.deepEqual(clips.map((c) => [c.in, c.out]), [[0, 1], [2, 3], [4, 5], [0, 5]]);
});
test("edges are trimmed to the first and last sound", () => {
  const next = trimmedEdges([clip("a", 0, 4), clip("b", 4, 10)], [[1.2, 3], [5, 8.5]]);
  assert.deepEqual(next.map((c) => [c.in, c.out]), [[1.2, 4], [4, 8.5]]);
});
test("soft edges and transitions everywhere", () => {
  const clips = softEdges([clip("a", 0, 3), clip("b", 3, 30)]);
  assert.deepEqual(clips.map((c) => [c.fadeIn, c.fadeOut]), [[1, 0], [0, 2.5]]);
  const t = transitionEverywhere(clips, { id: "dissolve", duration: 0.4 });
  assert.deepEqual(t.map((c) => c.transition?.id), [undefined, "dissolve"]);
});
