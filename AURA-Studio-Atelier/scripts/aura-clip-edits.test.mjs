import { test } from "node:test";
import assert from "node:assert/strict";
import { clipDuration } from "../src/components/aura/editor.ts";
import {
  orderedSpan,
  extractRange,
  keepRange,
  trimToPlayhead,
} from "../src/components/aura/clip-edits.ts";

const clip = (id, inn, out, extra = {}) => ({
  id,
  in: inn,
  out,
  rate: 1,
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
  ...extra,
});
const total = (clips) => clips.reduce((n, c) => n + clipDuration(c), 0);
const spans = (clips) => {
  const out = [];
  let at = 0;
  for (const c of clips) {
    out.push([Number(at.toFixed(3)), Number((at + clipDuration(c)).toFixed(3))]);
    at += clipDuration(c);
  }
  return out;
};

test("orderedSpan sorts, clamps and rejects tiny spans", () => {
  assert.deepEqual(orderedSpan(8, 3, 30), [3, 8]);
  assert.deepEqual(orderedSpan(-2, 40, 30), [0, 30]);
  assert.equal(orderedSpan(5, 5.05, 30), null);
});

test("extractRange removes the middle and ripples the tail left", () => {
  const clips = [clip("a", 0, 30)];
  const next = extractRange(clips, 10, 20);
  // 30s source minus the 10s span, as two clips joined with no gap.
  assert.equal(Number(total(next).toFixed(3)), 20);
  assert.deepEqual(spans(next), [
    [0, 10],
    [10, 20],
  ]);
  assert.deepEqual(
    next.map((c) => [c.in, c.out]),
    [
      [0, 10],
      [20, 30],
    ],
  );
});

test("extractRange spanning a whole clip drops just that clip", () => {
  const clips = [clip("a", 0, 10), clip("b", 10, 20), clip("c", 20, 30)];
  const next = extractRange(clips, 10, 20);
  assert.deepEqual(
    next.map((c) => c.id),
    ["a", "c"],
  );
  assert.equal(total(next), 20);
});

test("extractRange never empties the project and no-ops on an empty span", () => {
  const clips = [clip("a", 0, 30)];
  assert.equal(extractRange(clips, 0, 30), clips);
  assert.equal(extractRange(clips, 5, 5.05), clips);
});

test("keepRange crops to the span and clears the leading transition", () => {
  const clips = [clip("a", 0, 30, { transition: { id: "fade", duration: 0.3 } })];
  const next = keepRange(clips, 10, 20);
  assert.equal(total(next), 10);
  assert.deepEqual(
    next.map((c) => [c.in, c.out]),
    [[10, 20]],
  );
  assert.equal(next[0].transition, undefined);
});

test("keepRange across clips keeps only the covered ones", () => {
  const clips = [clip("a", 0, 10), clip("b", 10, 20), clip("c", 20, 30)];
  const next = keepRange(clips, 10, 20);
  assert.deepEqual(
    next.map((c) => c.id),
    ["b"],
  );
});

test("trimToPlayhead pulls the in edge to the playhead and ripples", () => {
  const clips = [clip("a", 0, 10), clip("b", 10, 20)];
  // Playhead at timeline 4s sits inside clip a; its start moves to 4s.
  const next = trimToPlayhead(clips, "a", "in", 4);
  assert.deepEqual(
    next.map((c) => [c.in, c.out]),
    [
      [4, 10],
      [10, 20],
    ],
  );
  assert.equal(total(next), 16);
});

test("trimToPlayhead pulls the out edge in", () => {
  const clips = [clip("a", 0, 10), clip("b", 10, 20)];
  // Playhead at timeline 16s is inside clip b (10..20 → source 10..20); out → 16.
  const next = trimToPlayhead(clips, "b", "out", 16);
  assert.deepEqual(
    next.map((c) => [c.in, c.out]),
    [
      [0, 10],
      [10, 16],
    ],
  );
});

test("trimToPlayhead honours the clip rate", () => {
  const clips = [clip("a", 0, 20, { rate: 2 })]; // 10s on the timeline
  const next = trimToPlayhead(clips, "a", "out", 4); // source = 0 + 4*2 = 8
  assert.deepEqual(
    next.map((c) => [c.in, c.out]),
    [[0, 8]],
  );
});

test("trimToPlayhead refuses a playhead outside the clip or too close to an edge", () => {
  const clips = [clip("a", 0, 10), clip("b", 10, 20)];
  assert.equal(trimToPlayhead(clips, "a", "in", 15), clips); // outside clip a
  assert.equal(trimToPlayhead(clips, "a", "in", 0.05), clips); // no room at the start
  assert.equal(trimToPlayhead(clips, "a", "out", 9.98), clips); // no room at the end
  assert.equal(trimToPlayhead(clips, "zzz", "in", 4), clips); // unknown clip
});
