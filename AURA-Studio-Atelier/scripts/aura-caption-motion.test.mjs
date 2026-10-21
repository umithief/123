import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAPTION_IN,
  CAPTION_LOOP,
  CAPTION_OUT,
  NO_MOTION,
  REST,
  entranceFrame,
  exitFrame,
  hasMotion,
  loopFrame,
  motionFrame,
  motionWindows,
  parseCaptionMotion,
  previewRound,
} from "../src/components/aura/caption-motion.ts";
import { DEFAULT_CAPTIONS, restoreCaptionOptions } from "../src/components/aura/captions.ts";

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const atRest = (f) => {
  near(f.alpha, 1);
  near(f.x, 0);
  near(f.y, 0);
  near(f.scale * f.scaleX, 1);
  near(f.scale * f.scaleY, 1);
  near(f.rotate, 0);
  near(f.skew, 0);
  near(f.blur, 0);
  near(f.reveal, 1);
};
const m = (patch) => ({ ...NO_MOTION, ...patch });

test("every preset id is unique and exits reverse a real entrance", () => {
  for (const list of [CAPTION_IN, CAPTION_OUT, CAPTION_LOOP])
    assert.equal(new Set(list.map((a) => a.id)).size, list.length);
  for (const out of CAPTION_OUT)
    assert.ok(
      CAPTION_IN.some((a) => a.id === out.via),
      out.id,
    );
  assert.ok(CAPTION_IN.length >= 18 && CAPTION_OUT.length >= 16 && CAPTION_LOOP.length >= 11);
});

test("every entrance ends at rest and every exit starts at rest", () => {
  for (const { id } of CAPTION_IN) atRest(entranceFrame(id, 1));
  for (const { id } of CAPTION_OUT) atRest(exitFrame(id, 0));
});

test("entrances start hidden or displaced", () => {
  for (const { id } of CAPTION_IN) {
    if (id === "none") continue;
    const f = entranceFrame(id, 0);
    const moved =
      f.alpha < 0.05 ||
      f.reveal < 0.05 ||
      Math.abs(f.x) + Math.abs(f.y) > 0.5 ||
      Math.abs(f.scale * f.scaleX - 1) > 0.3 ||
      Math.abs(f.scale * f.scaleY - 1) > 0.3;
    assert.ok(moved, id);
  }
});

test("exits play the matching entrance backwards", () => {
  const up = exitFrame("slide-up", 0.5),
    down = entranceFrame("slide-down", 0.5);
  assert.deepEqual(up, down);
  assert.ok(exitFrame("slide-up", 1).y < 0, "leaves upwards");
  assert.ok(exitFrame("zoom-in", 1).scale > 1, "grows away");
  assert.ok(exitFrame("zoom-out", 1).scale < 1, "shrinks away");
  near(exitFrame("fade", 1).alpha, 0);
});

test("loops start still, move, and never drift away", () => {
  for (const { id } of CAPTION_LOOP) {
    atRest(loopFrame(id, 0));
    for (let t = 0; t < 6; t += 0.37) {
      const f = loopFrame(id, t, 1.5, 1, 6);
      assert.ok(Math.abs(f.x) < 0.2 && Math.abs(f.y) < 0.3, `${id} offset at ${t}`);
      assert.ok(f.scale > 0.85 && f.scale < 1.2 && f.alpha > 0.4, `${id} at ${t}`);
    }
  }
  assert.ok(Math.abs(loopFrame("float", 0.8).y) > 0.05, "float moves");
  assert.ok(loopFrame("glow", 1.3).glow > 0, "glow glows");
});

test("windows fit the caption: each ≤ half, together leave 10 % at rest", () => {
  assert.deepEqual(motionWindows(m({ in: "fade", out: "fade" }), 5), { enter: 0.5, leave: 0.4 });
  const short = motionWindows(m({ in: "pop", inDuration: 2, out: "fade", outDuration: 2 }), 1);
  near(short.enter + short.leave, 0.9);
  near(short.enter, short.leave);
  assert.deepEqual(motionWindows(m({ in: "pop" }), 3), { enter: 0.5, leave: 0 });
});

test("a caption with In, Loop and Out is hidden at its edges and alive in between", () => {
  const motion = m({ in: "fade", out: "zoom-out", loop: "pulse" });
  near(motionFrame(motion, 0, 4).alpha, 0);
  assert.ok(motionFrame(motion, 4, 4).scale < 0.5, "shrunk away at the end");
  const mid = [1.2, 1.5, 1.8, 2.1].map((t) => motionFrame(motion, t, 4).scale);
  assert.ok(Math.max(...mid) - Math.min(...mid) > 0.01, "pulse moves in the middle");
  assert.equal(motionFrame(NO_MOTION, 1, 4), REST);
});

test("strength scales travel", () => {
  const soft = motionFrame(m({ in: "slide-up" }), 0.1, 4, 0.3).y,
    strong = motionFrame(m({ in: "slide-up" }), 0.1, 4, 1).y;
  assert.ok(strong > soft * 2);
});

test("stored motion is validated and old settings get none", () => {
  assert.equal(parseCaptionMotion(null), null);
  assert.equal(parseCaptionMotion("pop"), null);
  assert.deepEqual(parseCaptionMotion({ in: "zzz", inDuration: 99, out: "fade", loopSpeed: -1 }), {
    ...NO_MOTION,
    inDuration: 2,
    out: "fade",
    loopSpeed: 0.25,
  });
  assert.deepEqual(restoreCaptionOptions(JSON.stringify({ animation: "pop" })).motion, NO_MOTION);
  const saved = { ...DEFAULT_CAPTIONS, motion: m({ in: "bounce", loop: "jelly" }) };
  assert.deepEqual(restoreCaptionOptions(JSON.stringify(saved)).motion, saved.motion);
  assert.equal(hasMotion(DEFAULT_CAPTIONS.motion), false);
});

test("the panel preview gives the caption time to arrive, stay and leave", () => {
  const plain = previewRound(NO_MOTION);
  assert.ok(plain.start > 0, "an empty lead-in before the caption");
  assert.ok(plain.end - plain.start >= 2, "readable on screen");
  const slow = previewRound({
    ...NO_MOTION,
    in: "fade",
    inDuration: 2,
    out: "fade",
    outDuration: 2,
  });
  assert.equal(slow.enter, 2);
  assert.equal(slow.leave, 2);
  assert.ok(slow.hold >= 2, "long entrances and exits keep the hold");
  const { enter, leave } = motionWindows(
    { ...NO_MOTION, in: "fade", inDuration: 2, out: "fade", outDuration: 2 },
    slow.end - slow.start,
  );
  assert.equal(enter, 2, "the motion is not squeezed");
  assert.equal(leave, 2);
  assert.ok(slow.total > slow.end, "a pause before the next round");
  assert.ok(previewRound({ ...NO_MOTION, loop: "pulse" }).hold > plain.hold);
});
