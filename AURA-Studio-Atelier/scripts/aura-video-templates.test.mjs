import { test } from "node:test";
import assert from "node:assert/strict";
import { VIDEO_TEMPLATES, templateAdjust, templateClips } from "../src/components/aura/video-templates.ts";
import { MODES, THEMES } from "../src/components/aura/palette.ts";
import { CAPTION_TEMPLATES } from "../src/components/aura/caption-templates.ts";
import { SCENE_TRANSITIONS } from "../src/components/aura/scene-transitions.ts";
import { DEFAULT_ADJUST, VIDEO_EFFECTS } from "../src/components/aura/editor.ts";
import { VIDEO_FORMATS } from "../src/components/aura/studio.ts";

const clip = (id, inn, out) => ({ id, in: inn, out, rate: 1, volume: 1, fadeIn: 0, fadeOut: 0 });

test("every template points at real scenes, colours, captions and effects", () => {
  assert.equal(VIDEO_TEMPLATES.length, 12);
  assert.equal(new Set(VIDEO_TEMPLATES.map((t) => t.id)).size, 12);
  for (const t of VIDEO_TEMPLATES) {
    assert.ok(MODES.some((m) => m.id === t.mode), `${t.id} mode`);
    assert.ok(THEMES.some((m) => m.id === t.theme), `${t.id} theme`);
    assert.ok(CAPTION_TEMPLATES.some((c) => c.id === t.caption), `${t.id} caption`);
    assert.ok(VIDEO_FORMATS.some((f) => f.id === t.format), `${t.id} format`);
    if (t.edit.transition) assert.ok(SCENE_TRANSITIONS.some((s) => s.id === t.edit.transition), `${t.id} transition`);
    if (t.adjust.effect) assert.ok(VIDEO_EFFECTS.some((e) => e.id === t.adjust.effect), `${t.id} effect`);
    if (t.adjust.filter) assert.ok(["none", "mono", "sepia", "vintage", "cool", "vivid"].includes(t.adjust.filter));
  }
});
test("a template's look replaces the old look but keeps rotation and zoom", () => {
  const current = { ...DEFAULT_ADJUST, rotation: 90, zoom: 1.4, flipX: true, effect: "grain", warmth: 0.8 };
  const noir = VIDEO_TEMPLATES.find((t) => t.id === "noir");
  const next = templateAdjust(noir, current);
  assert.deepEqual([next.rotation, next.zoom, next.flipX], [90, 1.4, true]);
  assert.deepEqual([next.filter, next.effect, next.warmth], ["mono", "grain", 0]);
});
test("a social template keeps the strongest 30 s and cuts it on the bars", () => {
  const peaks = Array.from({ length: 1200 }, (_, i) => (i >= 400 && i < 700 ? 0.9 : 0.2)); // loud 40–70 s of 120 s
  const beats = Array.from({ length: 240 }, (_, i) => i * 0.5);
  const reels = VIDEO_TEMPLATES.find((t) => t.id === "reels-energy");
  const clips = templateClips(reels, [clip("a", 0, 120)], 120, peaks, beats);
  assert.equal(clips[0].in, 40);
  assert.equal(clips.length, 15); // a cut every 4 beats = 2 s
  assert.ok(clips.slice(1).every((c) => c.transition?.id === "flash"));
  const total = clips.reduce((n, c) => n + (c.out - c.in), 0);
  assert.ok(Math.abs(total - 30) < 1e-6);
});
test("without analysis only the soft edges apply; a short song stays whole", () => {
  const reels = VIDEO_TEMPLATES.find((t) => t.id === "reels-energy");
  assert.deepEqual(templateClips(reels, [clip("a", 0, 20)], 20, [], []), [clip("a", 0, 20)]);
  const story = VIDEO_TEMPLATES.find((t) => t.id === "story-calm");
  const [c] = templateClips(story, [clip("a", 0, 10)], 10, Array(100).fill(0.5), []);
  assert.deepEqual([c.in, c.out, c.fadeIn > 0, c.fadeOut > 0], [0, 10, true, true]);
});
