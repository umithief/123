import { test } from "node:test";
import assert from "node:assert/strict";
import { VIDEO_MOTIONS, motionDefaults, parseVideoMotion, motionWindows, videoMotionAt, motionEffect, identityMotion } from "../src/components/aura/video-motion.ts";
import { makeClip, splitClip, locateTime, clipDuration, emptyProject, parseEditorProject } from "../src/components/aura/editor.ts";

test("all motion presets stay finite, deterministic and neutral at combo boundaries", () => {
  for (const { id } of VIDEO_MOTIONS) {
    for (const section of ["in", "out", "combo"]) {
      for (const p of [0, 0.2, 0.5, 0.99, 1]) {
        const frame = motionEffect(id, section, p, 1);
        assert.deepEqual(frame, motionEffect(id, section, p, 1));
        for (const value of Object.values(frame)) if (typeof value === "number") assert.ok(Number.isFinite(value), `${id}: ${value}`);
        assert.ok(frame.sx > 0 && frame.sy > 0 && frame.scale > 0, id);
        assert.ok(frame.opacity >= 0 && frame.opacity <= 1, id);
      }
    }
    const m = { ...motionDefaults(), combo: { id, duration: 1 } };
    assert.deepEqual(videoMotionAt(m, 0, 3), identityMotion(), id);
    assert.deepEqual(videoMotionAt(m, 3, 3), identityMotion(), id);
  }
});
test("short clips proportionally bound entrances and exits without overlapping", () => {
  const m = { ...motionDefaults(), in: { id: "fade", duration: 2 }, out: { id: "fade", duration: 1 } };
  const windows = motionWindows(m, 0.3);
  assert.ok(Math.abs(windows.in + windows.out - 0.3) < 1e-8);
  assert.ok(Math.abs(windows.in / windows.out - 2) < 1e-8);
  assert.equal(videoMotionAt(m, 0, 0.3).opacity, 0);
  assert.ok(Math.abs(videoMotionAt(m, 0.2, 0.3).opacity - 1) < 1e-8);
  assert.equal(videoMotionAt(m, 0.3, 0.3).opacity, 0);
  assert.deepEqual(motionWindows({ ...m, out: { ...m.out, id: "none" } }, 0.3), { in: 0.3, out: 0 });
});
test("clip motion uses output seconds after trim, speed and reorder", () => {
  const m = { ...motionDefaults(), in: { id: "fade", duration: 0.8 } };
  const clip = { ...makeClip(8), in: 2, out: 8, rate: 2, motion: m };
  const found = locateTime([makeClip(1), clip], 1.4);
  assert.ok(Math.abs(found.local - 0.4) < 1e-8);
  assert.ok(Math.abs(found.source - 2.8) < 1e-8);
  assert.ok(Math.abs(videoMotionAt(found.clip.motion, found.local, clipDuration(clip)).opacity - 0.875) < 1e-8);
});
test("none, zero intensity and reduced motion preserve the original frame", () => {
  const m = { ...motionDefaults(), in: { id: "impact", duration: 1 }, combo: { id: "red-lens", duration: 1 } };
  assert.deepEqual(videoMotionAt(m, 0.2, 3, true), identityMotion());
  assert.deepEqual(videoMotionAt({ ...m, amount: 0 }, 0.2, 3), identityMotion());
  assert.deepEqual(videoMotionAt(motionDefaults(), 0.2, 3), identityMotion());
});
test("splitting retains only outer entrance/exit and preserves the combo", () => {
  const motion = { ...motionDefaults(), in: { id: "impact", duration: 0.8 }, out: { id: "iris", duration: 0.7 }, combo: { id: "orbit", duration: 2 } };
  const clip = { ...makeClip(4), motion };
  const [a, b] = splitClip([clip], 2);
  assert.equal(a.motion.in.id, "impact"); assert.equal(a.motion.out.id, "none");
  assert.equal(b.motion.in.id, "none"); assert.equal(b.motion.out.id, "iris");
  assert.deepEqual(a.motion.combo, motion.combo); assert.deepEqual(b.motion.combo, motion.combo);
  assert.equal(clip.motion.in.id, "impact"); assert.equal(clip.motion.out.id, "iris");
});
test("motion settings migrate older projects, reject unsafe values and round-trip", () => {
  const invalid = parseVideoMotion({ in: { id: "unsupported", duration: -10 }, out: { id: "iris", duration: 90 }, combo: { id: "glitch", duration: Infinity }, amount: 15 });
  assert.deepEqual(invalid.in, { id: "none", duration: 0.1 });
  assert.equal(invalid.out.duration, 3); assert.equal(invalid.combo.duration, 1.6); assert.equal(invalid.amount, 1);
  const p = emptyProject(); p.clips = [{ ...makeClip(4), motion: invalid }];
  p.media = [{ id: "m", asset: "image", name: "photo.jpg", kind: "image", start: 0, end: 3, motion: { ...motionDefaults(), combo: { id: "light-sweep", duration: 2.4 } } }];
  const restored = parseEditorProject(JSON.stringify(p), 4);
  assert.deepEqual(restored.clips[0].motion, invalid);
  assert.deepEqual(restored.media[0].motion, p.media[0].motion);
  delete p.clips[0].motion; delete p.media[0].motion;
  const legacy = parseEditorProject(JSON.stringify(p), 4);
  assert.deepEqual(legacy.clips[0].motion, motionDefaults());
  assert.deepEqual(legacy.media[0].motion, motionDefaults());
});
