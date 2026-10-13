import { test } from "node:test";
import assert from "node:assert/strict";
import { captionSegments, trimmedClip } from "../src/components/aura/timeline.ts";
const clip = { id: "a", in: 1, out: 9, rate: 2, volume: 0.8, fadeIn: 0.2, fadeOut: 0.5 };
const cue = (id, text, start, end) => ({ id, text, start, end, words: [] });
test("source captions are clipped to retained cuts and scaled to output time", () => {
  assert.deepEqual(captionSegments([cue("c", "Bu sözler aynen kalır", 4, 10)], [clip], 0), [
    { id: "a-c", cue: "c", text: "Bu sözler aynen kalır", start: 1.5, end: 4 },
  ]);
});
test("reordering and duplicating cuts repeats captions only in those retained sections", () => {
  const cuts = [
    { ...clip, id: "b", in: 6, out: 8, rate: 1 },
    { ...clip, in: 1, out: 3, rate: 1 },
    { ...clip, id: "copy", in: 1, out: 3, rate: 0.5 },
  ];
  assert.deepEqual(
    captionSegments(
      [cue("c", "Tekrar söylenen söz", 1, 2), cue("d", "İlk bölüm", 6, 7)],
      cuts,
      0,
    ).map(({ text, start, end }) => ({ text, start, end })),
    [
      { text: "İlk bölüm", start: 0, end: 1 },
      { text: "Tekrar söylenen söz", start: 2, end: 3 },
      { text: "Tekrar söylenen söz", start: 4, end: 6 },
    ],
  );
});
test("caption offset is applied once before mapping into the timeline", () => {
  assert.deepEqual(
    captionSegments([cue("c", "Kaydırılmış söz", 0, 2)], [clip], 2).map(({ start, end }) => [
      start,
      end,
    ]),
    [[0.5, 1.5]],
  );
  assert.equal(captionSegments([cue("c", "Kesilen bölüm", 9, 10)], [clip], 0).length, 0);
});
test("drag trim cannot leave the source or collapse a clip and preserves audio settings", () => {
  const left = trimmedClip(clip, "in", -100, 10),
    right = trimmedClip(clip, "out", 100, 10),
    min = trimmedClip(clip, "in", 100, 10);
  assert.equal(left.in, 0);
  assert.equal(right.out, 10);
  assert.ok(Math.abs(min.out - min.in - 0.1) < 0.000001);
  for (const next of [left, right, min]) {
    assert.equal(next.rate, 2);
    assert.equal(next.volume, 0.8);
    assert.equal(next.fadeOut, 0.5);
  }
  assert.equal(clip.in, 1);
});
