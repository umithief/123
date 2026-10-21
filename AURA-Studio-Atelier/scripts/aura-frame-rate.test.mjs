import { test } from "node:test";
import assert from "node:assert/strict";
import { frameSlot, videoBitrate } from "../src/components/aura/frame-rate.ts";
import { parseSnapshot } from "../src/components/aura/studio.ts";

test("frames sit on an even 1/fps grid, a quarter slot early still counts", () => {
  assert.equal(frameSlot(0, 60), 0);
  assert.equal(frameSlot(1 / 60 - 0.003, 60), 1 / 60, "a refresh 3 ms early fills the slot");
  assert.equal(frameSlot(1 / 60 - 0.006, 60), 0, "but not one half a frame early");
  assert.equal(frameSlot(1.0, 30), 1);
});

test("60 Hz refreshes with jitter fill every 60 fps slot and every other one at 30 fps", () => {
  for (const fps of [60, 30]) {
    let last = -1,
      written = 0;
    for (let i = 0; i < 600; i++) {
      const now = i * (1 / 60) + (i % 3 === 0 ? -0.002 : 0.0015);
      const slot = frameSlot(now, fps);
      if (slot > last + 1e-9) {
        last = slot;
        written++;
      }
    }
    assert.ok(Math.abs(written - fps * 10) <= 1, `${fps} fps: ${written} frames in 10 s`);
  }
});

test("60 fps gets more bitrate than 30 fps; 30 fps keeps the very-high level", () => {
  const b30 = videoBitrate(1080, 1920, 30),
    b60 = videoBitrate(1080, 1920, 60);
  assert.ok(b30 > 10_000_000 && b30 < 13_000_000, String(b30));
  assert.ok(b60 > b30 * 1.55);
  assert.ok(videoBitrate(720, 1280, 60) < b60);
});

test("projects remember the frame rate; anything else is 30", () => {
  const base = { version: 1, mode: "ring", theme: "kor" };
  assert.equal(parseSnapshot(JSON.stringify({ ...base, fps: 60 })).fps, 60);
  assert.equal(parseSnapshot(JSON.stringify({ ...base, fps: 120 })).fps, 30);
  assert.equal(parseSnapshot(JSON.stringify(base)).fps, 30);
});
