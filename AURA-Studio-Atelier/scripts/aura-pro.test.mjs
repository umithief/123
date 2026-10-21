import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCENE_TRANSITIONS,
  parseSceneTransition,
} from "../src/components/aura/scene-transitions.ts";
import { PRO_TRANSITIONS } from "../src/components/aura/pro-transitions.ts";
import {
  VIDEO_MOTIONS,
  motionEffect,
  motionIsActive,
  parseVideoMotion,
  videoMotionAt,
} from "../src/components/aura/video-motion.ts";
import { VIDEO_EFFECTS, parseEditorProject } from "../src/components/aura/editor.ts";
import { isPro } from "../src/components/aura/pro-paint.ts";

const pro = (list) => list.filter((item) => isPro(item.id));

test("AURA Pro has 12 transitions, 9 animations and 8 effects, all with names and descriptions", () => {
  assert.equal(pro(SCENE_TRANSITIONS).length, 12);
  assert.equal(pro(VIDEO_MOTIONS).length, 9);
  assert.equal(pro(VIDEO_EFFECTS).length, 8);
  for (const item of [...pro(SCENE_TRANSITIONS), ...pro(VIDEO_MOTIONS), ...pro(VIDEO_EFFECTS)]) {
    assert.ok(item.label && item.description, item.id);
  }
  const ids = [...SCENE_TRANSITIONS, ...VIDEO_MOTIONS, ...VIDEO_EFFECTS].map((i) => i.id);
  assert.equal(new Set(pro(SCENE_TRANSITIONS).map((t) => t.id)).size, 12, "unique ids");
  assert.ok(ids.filter((id) => !isPro(id)).every((id) => !id.startsWith("pro-")));
});

test("Pro transitions lead the list, in their own collection, and survive a project round trip", () => {
  assert.equal(SCENE_TRANSITIONS[0].id, "none");
  assert.deepEqual(
    SCENE_TRANSITIONS.slice(1, 13).map((t) => t.id),
    PRO_TRANSITIONS.map((t) => t.id),
  );
  assert.ok(pro(SCENE_TRANSITIONS).every((t) => t.group === "Pro"));
  assert.deepEqual(parseSceneTransition({ id: "pro-cube", duration: 0.8 }), {
    id: "pro-cube",
    duration: 0.8,
  });
  assert.equal(parseSceneTransition({ id: "pro-unknown" }).id, "none");
});

test("every Pro animation moves the picture in, out and as a combo", () => {
  for (const { id } of pro(VIDEO_MOTIONS)) {
    for (const section of ["in", "out", "combo"]) {
      const frame = motionEffect(id, section, section === "in" ? 0.2 : 0.6, 1);
      assert.ok(motionIsActive(frame), `${id} ${section}`);
    }
    // At rest (end of an entrance) the picture is untouched.
    assert.ok(!motionIsActive(motionEffect(id, "in", 1, 1)), `${id} settles`);
  }
});

test("Pro animations use the new lens and light controls", () => {
  const at = (id) => motionEffect(id, "in", 0, 1);
  assert.ok(at("pro-warp").zoomBlur > 0.5);
  assert.ok(at("pro-whip").streakX > 0.3);
  assert.ok(at("pro-vortex").spinBlur > 0.5);
  assert.ok(at("pro-prism").chroma > 0.5);
  assert.ok(at("pro-bloom").bloom > 0.5);
  assert.ok(at("pro-burn").burn > 0.5);
  assert.ok(at("pro-flare").flare > 0.5);
  const motion = parseVideoMotion({
    in: { id: "pro-warp", duration: 0.8 },
    combo: { id: "pro-pulse", duration: 1 },
  });
  assert.equal(motion.in.id, "pro-warp");
  const mixed = videoMotionAt(motion, 0.2, 4);
  assert.ok(mixed.zoomBlur > 0 && mixed.bloom > 0, "entrance and combo combine");
});

test("Pro effects are kept in saved projects", () => {
  const raw = JSON.stringify({
    version: 1,
    clips: [{ id: "a", in: 0, out: 5, rate: 1, volume: 1, fadeIn: 0, fadeOut: 0 }],
    media: [],
    layers: [],
    sounds: [],
    adjust: { effect: "pro-anamorphic", effectAmount: 0.7 },
  });
  const project = parseEditorProject(raw, 5);
  assert.equal(project.adjust.effect, "pro-anamorphic");
  assert.equal(project.adjust.effectAmount, 0.7);
});
