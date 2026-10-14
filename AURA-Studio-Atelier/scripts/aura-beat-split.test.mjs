import { test } from "node:test";
import assert from "node:assert/strict";
import { beatGrid, beatCutTimes, splitAtTimes } from "../src/components/aura/timeline.ts";

const clip = (id, inn, out, rate = 1) => ({ id, in: inn, out, rate, volume: 1, fadeIn: 0, fadeOut: 0 });

test("a steady grid and tempo come out of noisy onsets", () => {
  // 120 BPM from 0.25 s with offbeat hats, a few missing kicks and jitter.
  const onsets = [];
  for (let i = 0; i < 60; i++) {
    if (i % 7 !== 3) onsets.push(0.25 + i * 0.5 + ((i * 37) % 5 - 2) * 0.004);
    if (i % 2) onsets.push(0.5 + i * 0.5);
  }
  onsets.sort((a, b) => a - b);
  const { beats, bpm } = beatGrid(onsets, 30);
  assert.equal(bpm, 120);
  assert.ok(Math.abs(beats[0] - 0.25) < 0.02 || Math.abs(beats[0] - 0.5) < 0.02, `first ${beats[0]}`);
  for (let i = 1; i < beats.length; i++) assert.ok(Math.abs(beats[i] - beats[i - 1] - 0.5) < 0.03);
  assert.ok(beats.length >= 58 && beats.length <= 60, `count ${beats.length}`);
});
test("a slightly faster song does not drift from its onsets", () => {
  const onsets = Array.from({ length: 400 }, (_, i) => 0.1 + i * 0.4987);
  const { beats } = beatGrid(onsets, 200);
  assert.ok(beats.some((b) => Math.abs(b - onsets.at(-1)) < 0.01), "last onset is on the grid");
  assert.equal(beats.filter((b) => b <= onsets.at(-1) + 0.01).length, 400);
});
test("too few onsets are used as they are", () => {
  assert.deepEqual(beatGrid([1, 2, 3], 10), { beats: [1, 2, 3], bpm: null });
});
test("cuts fall on every n-th beat, away from existing cuts and edges", () => {
  const beats = Array.from({ length: 20 }, (_, i) => i * 0.5);
  const clips = [clip("a", 0, 5), clip("b", 5, 10)];
  assert.deepEqual(beatCutTimes(beats, clips, 2, 0, 10), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.deepEqual(beatCutTimes(beats, clips, 4, 0, 10), [2, 4, 6, 8]);
  assert.deepEqual(beatCutTimes(beats, clips, 4, 5, 10), [7, 9]);
  // A 2x clip doubles the timeline density of its beats.
  assert.deepEqual(beatCutTimes(beats, [clip("c", 0, 4, 2)], 1, 0, 2), [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75]);
});
test("splitting stops at the clip limit and marks only the new cuts with a transition", () => {
  const clips = [clip("a", 0, 10)];
  clips[0].transition = { id: "flash", duration: 0.5 };
  const result = splitAtTimes(clips, [2, 4, 6, 8], 3, { id: "dissolve", duration: 0.3 });
  assert.equal(result.added, 2);
  assert.equal(result.skipped, 2);
  assert.deepEqual(result.clips.map((c) => [c.in, c.out, c.transition?.id]), [
    [0, 2, "flash"],
    [2, 4, "dissolve"],
    [4, 10, "dissolve"],
  ]);
  assert.deepEqual(splitAtTimes(clips, [3], 60).clips.map((c) => c.transition?.id), ["flash", undefined]);
});
