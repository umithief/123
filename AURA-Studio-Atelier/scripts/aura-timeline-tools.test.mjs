import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectBeats,
  draggedItem,
  snapTo,
  timelineMarks,
  retimedCue,
  retimedCues,
} from "../src/components/aura/timeline.ts";

test("beats are found at the attacks of a pulsed signal", () => {
  const rate = 8000,
    samples = new Float32Array(rate * 4);
  // A short decaying click every 0.5 s over a quiet hum.
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate,
      phase = (t + 0.25) % 0.5;
    samples[i] = 0.02 * Math.sin(2 * Math.PI * 110 * t) + (phase < 0.06 ? Math.exp(-phase * 60) * Math.sin(2 * Math.PI * 220 * t) : 0);
  }
  const beats = detectBeats(samples, rate);
  assert.equal(beats.length, 8);
  beats.forEach((beat, i) => assert.ok(Math.abs(beat - (0.25 + i * 0.5)) < 0.03, `beat ${i} at ${beat}`));
});
test("silence and very short input give no beats", () => {
  assert.deepEqual(detectBeats(new Float32Array(8000), 8000), []);
  assert.deepEqual(detectBeats(new Float32Array(10), 8000), []);
});
test("source marks follow cuts, speed and repeats", () => {
  const clips = [
    { id: "a", in: 4, out: 6, rate: 2, volume: 1, fadeIn: 0, fadeOut: 0 },
    { id: "b", in: 0, out: 2, rate: 1, volume: 1, fadeIn: 0, fadeOut: 0 },
    { id: "c", in: 1, out: 5, rate: 1, volume: 1, fadeIn: 0, fadeOut: 0 },
  ];
  assert.deepEqual(timelineMarks([1, 5, 7], clips), [0.5, 2, 3]);
});
test("snapping picks the nearest target within the threshold", () => {
  assert.equal(snapTo(2.04, [0, 2, 2.1], 0.1), 2);
  assert.equal(snapTo(2.5, [0, 2, 3], 0.1), null);
});
test("moving a text layer carries its keyframes and stays on the timeline", () => {
  const layer = { start: 2, end: 4, keyframes: [{ time: 2.5 }, { time: 3 }] };
  assert.deepEqual(draggedItem(layer, "layer", "move", 1.5, 10), {
    start: 3.5,
    end: 5.5,
    keyframes: [{ time: 4 }, { time: 4.5 }],
  });
  assert.equal(draggedItem(layer, "layer", "move", -5, 10).start, 0);
  assert.equal(draggedItem(layer, "layer", "move", 20, 10).start, 9.9);
});
test("trimming a start advances the source offset and never rewinds past it", () => {
  const sound = { start: 2, end: 6, offset: 1 };
  assert.deepEqual(draggedItem(sound, "sound", "start", 1, 10), { start: 3, end: 6, offset: 2 });
  assert.deepEqual(draggedItem(sound, "sound", "start", -3, 10), { start: 1, end: 6, offset: 0 });
  const video = { start: 2, end: 6, offset: 1, rate: 2, kind: "video" };
  assert.deepEqual(draggedItem(video, "media", "start", -3, 10), { ...video, start: 1.5, offset: 0 });
  const image = { start: 2, end: 6, offset: 0, rate: 1, kind: "image" };
  assert.equal(draggedItem(image, "media", "start", -3, 10).start, 0);
  assert.equal(draggedItem(image, "media", "start", 9, 10).start, 5.9);
  assert.equal(draggedItem(image, "media", "end", -9, 10).end, 2.1);
  assert.equal(draggedItem(image, "media", "end", 9, 10).end, 10);
  assert.equal(draggedItem({ ...image, end: 14 }, "media", "end", -1, 10).end, 9);
});
test("kicks are found under a sustained, wavering chord and noise", () => {
  const sr = 8000,
    x = new Float32Array(sr * 8);
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < x.length; i++) {
    const t = i / sr,
      k = t % 0.5,
      h = (t + 0.25) % 0.5;
    x[i] =
      0.25 * Math.sin(2 * Math.PI * 220 * t) * (0.8 + 0.2 * Math.sin(t * 3)) +
      0.15 * Math.sin(2 * Math.PI * 277 * t) +
      0.05 * rnd() +
      (k < 0.15 ? 0.9 * Math.exp(-k * 30) * Math.sin(2 * Math.PI * (60 + 80 * Math.exp(-k * 40)) * k) : 0) +
      (h < 0.03 ? 0.2 * Math.exp(-h * 150) * rnd() : 0);
  }
  const beats = detectBeats(x, sr);
  assert.equal(beats.length, 15);
  beats.forEach((beat, i) => assert.ok(Math.abs(beat - (0.5 + i * 0.5)) < 0.03));
});
test("moving a caption shifts its words; resizing stretches them", () => {
  const cue = {
    id: "c",
    text: "iki kelime",
    start: 2,
    end: 4,
    words: [
      { text: "iki", start: 2, end: 3 },
      { text: "kelime", start: 3, end: 4 },
    ],
  };
  assert.deepEqual(retimedCue(cue, "move", 1.5, 10), {
    ...cue,
    start: 3.5,
    end: 5.5,
    words: [
      { text: "iki", start: 3.5, end: 4.5 },
      { text: "kelime", start: 4.5, end: 5.5 },
    ],
  });
  assert.equal(retimedCue(cue, "move", 20, 10).end, 10);
  assert.equal(retimedCue(cue, "move", -5, 10).start, 0);
  const longer = retimedCue(cue, "end", 2, 10);
  assert.deepEqual(longer.words.map((w) => [w.start, w.end]), [[2, 4], [4, 6]]);
  const later = retimedCue(cue, "start", 1, 10);
  assert.deepEqual(later.words.map((w) => [w.start, w.end]), [[3, 3.5], [3.5, 4]]);
  assert.equal(retimedCue(cue, "start", 5, 10).start, 3.9);
  assert.equal(retimedCue({ ...cue, words: undefined }, "end", 9, 10).end, 10);
  assert.equal("words" in retimedCue({ id: "x", text: "a", start: 0, end: 1 }, "move", 1, 10), false);
});
test("a caption pushed into its neighbour shortens it, down to 0.3 s", () => {
  const a = { id: "a", text: "a", start: 0, end: 2 },
    b = { id: "b", text: "b", start: 2, end: 4 },
    c = { id: "c", text: "c", start: 4, end: 6 },
    all = [c, a, b];
  const spans = (list) => list.map((x) => [x.id, x.start, x.end]);
  assert.deepEqual(spans(retimedCues(all, "b", "move", 1, 10)), [["a", 0, 2], ["b", 3, 5], ["c", 5, 6]]);
  assert.deepEqual(spans(retimedCues(all, "b", "move", 9, 10)), [["a", 0, 2], ["b", 3.7, 5.7], ["c", 5.7, 6]]);
  assert.deepEqual(spans(retimedCues(all, "b", "move", -1, 10)), [["a", 0, 1], ["b", 1, 3], ["c", 4, 6]]);
  assert.deepEqual(spans(retimedCues(all, "b", "start", -5, 10)), [["a", 0, 0.3], ["b", 0.3, 4], ["c", 4, 6]]);
  assert.deepEqual(spans(retimedCues(all, "b", "end", 1, 10)), [["a", 0, 2], ["b", 2, 5], ["c", 5, 6]]);
  assert.deepEqual(spans(retimedCues(all, "c", "end", 9, 10)), [["a", 0, 2], ["b", 2, 4], ["c", 4, 10]]);
  assert.deepEqual(spans(retimedCues(all, "a", "move", -1, 10)), [["a", 0, 2], ["b", 2, 4], ["c", 4, 6]]);
});
