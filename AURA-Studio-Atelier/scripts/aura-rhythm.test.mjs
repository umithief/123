import test from "node:test";
import assert from "node:assert/strict";
import { createRhythmState, updateRhythm } from "../src/components/aura/rhythm.ts";
import { restoreMusic } from "../src/components/aura/music.ts";
for (const fps of [30, 60, 144]) {
  for (const bpm of [60, 98, 140]) {
    test(`estimates ${bpm} BPM at ${fps} FPS`, () => {
      const rhythm = createRhythmState();
      const dt = 1 / fps;
      for (let frame = 0; frame < fps * 18; frame++) {
        const time = frame * dt;
        updateRhythm(rhythm, time % (60 / bpm) < 0.075 ? 0.8 : 0.02, time, dt, true);
      }
      assert.ok(Math.abs(rhythm.bpm - bpm) <= 2, `estimated ${rhythm.bpm}`);
    });
  }
}
test("continuous sustained bass produces no invented tempo", () => {
  const rhythm = createRhythmState();
  for (let frame = 0; frame < 1200; frame++) updateRhythm(rhythm, 0.7, frame / 60, 1 / 60, true);
  assert.equal(rhythm.bpm, null);
  assert.equal(rhythm.count, 1);
});
test("silence and pause clear the estimate", () => {
  const rhythm = createRhythmState();
  for (let frame = 0; frame < 600; frame++)
    updateRhythm(rhythm, (frame / 60) % 0.6 < 0.075 ? 0.8 : 0.02, frame / 60, 1 / 60, true);
  assert.equal(rhythm.bpm, 100);
  updateRhythm(rhythm, 0, 10, 1 / 60, false);
  assert.equal(rhythm.bpm, null);
  assert.equal(rhythm.intervals.length, 0);
});
test("irregular onsets are not presented as a stable BPM", () => {
  const rhythm = createRhythmState();
  let at = 0;
  for (const interval of [0.3, 1.1, 0.4, 0.9, 0.6, 1.3, 0.3, 0.7]) {
    for (let i = 0; i < Math.round(interval * 60); i++)
      updateRhythm(rhythm, i === 0 ? 0.8 : 0.02, at + i / 60, 1 / 60, true);
    at += interval;
  }
  assert.equal(rhythm.bpm, null);
});
test("stored audio settings are bounded and invalid values reset", () => {
  assert.deepEqual(restoreMusic('{"eq":true,"bass":300,"mid":-50,"treble":"10","volume":8}'), {
    eq: true,
    bass: 6,
    mid: -6,
    treble: 0,
    volume: 1,
    compressor: false,
    echo: 0,
    space: 0,
  });
  assert.equal(restoreMusic("invalid").eq, false);
  assert.equal(restoreMusic('{"echo":9,"space":-1}').echo, 0.4);
  assert.equal(restoreMusic('{"echo":9,"space":-1}').space, 0);
});
