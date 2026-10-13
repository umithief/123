import test from "node:test";
import assert from "node:assert/strict";
import { videoSize, parseSnapshot, restoreLooks } from "../src/components/aura/studio.ts";
import { LUXURY_MODES, isLuxuryMode, MODES, THEMES } from "../src/components/aura/palette.ts";

test("luxury scenes and palettes survive settings restore alongside older looks", () => {
  assert.equal(new Set(MODES.map((m) => m.id)).size, MODES.length);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length);
  for (const mode of LUXURY_MODES) {
    assert.ok(isLuxuryMode(mode));
    const settings = parseSnapshot(
      JSON.stringify({ version: 1, mode, theme: "champagne", format: "portrait" }),
    );
    assert.equal(parseSnapshot(JSON.stringify(settings)).mode, mode);
  }
  for (const theme of ["champagne", "platinum", "rose-gold", "kor", "altin"])
    assert.equal(parseSnapshot(JSON.stringify({ version: 1, mode: "ring", theme })).theme, theme);
  assert.equal(isLuxuryMode("ring"), false);
  assert.equal(isLuxuryMode("bad"), false);
});

test("video outputs have exact even dimensions for both resolutions", () => {
  for (const resolution of ["720", "1080"])
    for (const format of ["landscape", "portrait", "square", "feed"]) {
      const size = videoSize(format, resolution);
      assert.equal(size.width % 2, 0);
      assert.equal(size.height % 2, 0);
      assert.equal(Math.min(size.width, size.height), Number(resolution));
    }
  assert.deepEqual(videoSize("portrait", "1080"), { width: 1080, height: 1920 });
  assert.deepEqual(videoSize("feed", "720"), { width: 720, height: 900 });
});

test("settings imports reject unsupported schemas and safely bound all numeric controls", () => {
  assert.throws(() => parseSnapshot("{"), /Geçerli/);
  assert.throws(() => parseSnapshot('{"version":2}'), /desteklenen/);
  assert.throws(() => parseSnapshot(JSON.stringify({ version: 1, mode: "unknown", theme: "kor" })));
  const settings = parseSnapshot(
    JSON.stringify({
      version: 1,
      mode: "prism",
      theme: "buz",
      title: "a".repeat(100),
      sensitivity: 99,
      music: { volume: 200, bass: -99 },
      effects: { speed: -10 },
      captions: { offset: 50 },
      format: "bad",
    }),
  );
  assert.equal(settings.title.length, 64);
  assert.equal(settings.sensitivity, 3);
  assert.equal(settings.effects.speed, 0.25);
  assert.equal(settings.music.volume, 1);
  assert.equal(settings.music.bass, -6);
  assert.equal(settings.captions.offset, 5);
  assert.equal(settings.format, "landscape");
  assert.deepEqual(parseSnapshot(JSON.stringify(settings)), settings);
});

test("saved looks isolate corrupt entries and limit restored list size", () => {
  const settings = parseSnapshot(JSON.stringify({ version: 1, mode: "ring", theme: "kor" }));
  const valid = { id: "1", name: "Gece", savedAt: "2026-10-04", settings };
  assert.deepEqual(restoreLooks("invalid"), []);
  assert.deepEqual(restoreLooks("{}"), []);
  assert.equal(restoreLooks(JSON.stringify([{ id: "bad", settings: {} }, valid])).length, 1);
  assert.equal(restoreLooks(JSON.stringify(Array.from({ length: 20 }, () => valid))).length, 8);
});
