import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SCENE_TRANSITIONS,
  parseSceneTransition,
} from "../src/components/aura/scene-transitions.ts";
import {
  COUTURE_TRANSITIONS,
  isCoutureTransition,
} from "../src/components/aura/pro-couture-transitions.ts";
import {
  VIDEO_MOTIONS,
  identityMotion,
  motionDefaults,
  motionEffect,
  motionIsActive,
  parseVideoMotion,
  videoMotionAt,
} from "../src/components/aura/video-motion.ts";
import { isPro } from "../src/components/aura/pro-paint.ts";
import {
  COUTURE_CAPTION_ANIMATIONS,
  COUTURE_FINISHES,
} from "../src/components/aura/pro-couture-captions.ts";
import { CAPTION_FINISHES } from "../src/components/aura/caption-signatures.ts";
import {
  CAPTION_ANIMATIONS,
  DEFAULT_CAPTIONS,
  captionAnimationGroup,
  restoreCaptionOptions,
} from "../src/components/aura/captions.ts";
import {
  CAPTION_TEMPLATES,
  matchingCaptionTemplate,
} from "../src/components/aura/caption-templates.ts";
import {
  COUTURE_SPECTRA,
  LUXURY_MODES,
  MODES,
  isCoutureSpectrum,
  isLuxuryMode,
} from "../src/components/aura/palette.ts";
import { parseSnapshot } from "../src/components/aura/studio.ts";

const MOTIONS = [
  "pro-bokeh",
  "pro-neon",
  "pro-kaleido",
  "pro-fold",
  "pro-echo",
  "pro-ripple",
  "pro-holo",
  "pro-triptych",
];

test("Couture adds eight Pro transitions that lead the gallery and survive a project round trip", () => {
  assert.equal(COUTURE_TRANSITIONS.length, 8);
  assert.equal(new Set(COUTURE_TRANSITIONS.map((t) => t.id)).size, 8);
  assert.deepEqual(
    SCENE_TRANSITIONS.slice(1, 9).map((t) => t.id),
    COUTURE_TRANSITIONS.map((t) => t.id),
  );
  for (const t of COUTURE_TRANSITIONS) {
    assert.ok(isPro(t.id) && isCoutureTransition(t.id), t.id);
    assert.ok(t.label && t.description.length > 20, t.id);
    assert.equal(SCENE_TRANSITIONS.find((s) => s.id === t.id).group, "Pro");
    assert.deepEqual(parseSceneTransition({ id: t.id, duration: 1.2 }), {
      id: t.id,
      duration: 1.2,
    });
  }
  assert.equal(new Set(SCENE_TRANSITIONS.map((t) => t.id)).size, SCENE_TRANSITIONS.length);
});

test("every Couture animation works in, out and as a loop, and settles to the untouched picture", () => {
  const motions = VIDEO_MOTIONS.filter((m) => MOTIONS.includes(m.id));
  assert.equal(motions.length, 8);
  // They lead the Pro collection.
  assert.deepEqual(
    VIDEO_MOTIONS.filter((m) => isPro(m.id))
      .slice(0, 8)
      .map((m) => m.id),
    MOTIONS,
  );
  for (const { id, label, description, group } of motions) {
    assert.equal(group, "Pro");
    assert.ok(label && description.length > 20, id);
    for (const section of ["in", "out", "combo"]) {
      const frame = motionEffect(id, section, section === "in" ? 0.2 : 0.6, 1);
      assert.ok(motionIsActive(frame), `${id} ${section}`);
      for (const value of Object.values(frame))
        if (typeof value === "number") assert.ok(Number.isFinite(value), `${id} ${section}`);
    }
    assert.ok(!motionIsActive(motionEffect(id, "in", 1, 1)), `${id} settles`);
    assert.ok(!motionIsActive(motionEffect(id, "out", 0, 1)), `${id} starts untouched`);
    const loop = { ...motionDefaults(), combo: { id, duration: 1 } };
    assert.deepEqual(videoMotionAt(loop, 0, 3), identityMotion(), id);
    assert.deepEqual(parseVideoMotion({ in: { id, duration: 0.9 } }).in, { id, duration: 0.9 });
  }
});

test("Couture animations drive their own picture controls", () => {
  const at = (id, section = "in") => motionEffect(id, section, 0, 1);
  assert.ok(at("pro-bokeh").bokeh > 0.5 && at("pro-bokeh").blur > 5);
  assert.ok(at("pro-neon").neon > 0.5);
  assert.ok(at("pro-kaleido").kaleido > 0.5);
  assert.ok(at("pro-fold").fold > 0.5);
  assert.ok(at("pro-ripple").ripple > 0.5);
  assert.ok(at("pro-holo").holo > 0.5 && at("pro-holo").perspective > 0.1);
  assert.ok(at("pro-triptych").panels > 0.5);
  // Echoes fill the way back to the picture's place, entering and leaving.
  const entering = at("pro-echo"),
    leaving = motionEffect("pro-echo", "out", 1, 1);
  assert.ok(entering.echo > 0.5 && entering.x > 0 && entering.echoX < 0);
  assert.ok(leaving.echo > 0.5 && leaving.x > 0 && leaving.echoX < 0);
  // Loops: echoes grow outwards, panels drift together.
  const echoLoop = motionEffect("pro-echo", "combo", 0.5, 1),
    panelLoop = motionEffect("pro-triptych", "combo", 0.5, 1);
  assert.ok(echoLoop.echoZoom > 0 && echoLoop.echoX === 0);
  assert.ok(panelLoop.panelDrift > 0 && panelLoop.panels === 0 && panelLoop.scale > 1);
  // An entrance and a loop combine.
  const mixed = videoMotionAt(
    parseVideoMotion({
      in: { id: "pro-neon", duration: 0.8 },
      combo: { id: "pro-bokeh", duration: 1 },
    }),
    0.2,
    4,
  );
  assert.ok(mixed.neon > 0 && mixed.bokeh > 0);
});

test("eight Pro caption templates, each with its own finish and its own motion", () => {
  const pro = CAPTION_TEMPLATES.filter((p) => p.category === "Pro");
  assert.equal(pro.length, 8);
  assert.deepEqual(CAPTION_TEMPLATES.slice(0, 8), pro, "Pro templates come first");
  assert.equal(new Set(pro.map((p) => p.options.textEffect)).size, 8);
  assert.equal(new Set(pro.map((p) => p.options.animation)).size, 8);
  assert.equal(COUTURE_FINISHES.length, 8);
  assert.equal(COUTURE_CAPTION_ANIMATIONS.length, 8);
  assert.equal(new Set(CAPTION_ANIMATIONS.map((a) => a.id)).size, CAPTION_ANIMATIONS.length);
  assert.equal(new Set(CAPTION_FINISHES.map((f) => f.id)).size, CAPTION_FINISHES.length);
  for (const p of pro) {
    assert.ok(
      COUTURE_FINISHES.some((f) => f.id === p.options.textEffect),
      p.id,
    );
    assert.ok(
      COUTURE_CAPTION_ANIMATIONS.some((a) => a.id === p.options.animation),
      p.id,
    );
    assert.equal(captionAnimationGroup(p.options.animation), "Giriş");
    const options = { ...DEFAULT_CAPTIONS, offset: 0.5, place: "top", ...p.options };
    const restored = restoreCaptionOptions(JSON.stringify(options));
    assert.deepEqual(restored, options);
    assert.equal(matchingCaptionTemplate(restored)?.id, p.id);
  }
  // Finishes and motions can also be picked on their own, in any pair.
  for (const effect of COUTURE_FINISHES)
    for (const animation of COUTURE_CAPTION_ANIMATIONS) {
      const v = restoreCaptionOptions(
        JSON.stringify({ textEffect: effect.id, animation: animation.id }),
      );
      assert.equal(v.textEffect, effect.id);
      assert.equal(v.animation, animation.id);
    }
});

test("eight Pro spectra lead the gallery, join the luxury set and survive settings restore", () => {
  assert.equal(COUTURE_SPECTRA.length, 8);
  assert.deepEqual(
    MODES.slice(0, 8).map((m) => m.id),
    [...COUTURE_SPECTRA],
  );
  assert.equal(new Set(MODES.map((m) => m.id)).size, MODES.length);
  assert.equal(new Set(MODES.map((m) => m.label)).size, MODES.length, "unique names");
  for (const mode of COUTURE_SPECTRA) {
    assert.ok(isCoutureSpectrum(mode) && isLuxuryMode(mode) && LUXURY_MODES.includes(mode));
    const settings = parseSnapshot(
      JSON.stringify({ version: 1, mode, theme: "buz", format: "portrait" }),
    );
    assert.equal(settings.mode, mode);
  }
  assert.equal(isCoutureSpectrum("ring"), false);
});
