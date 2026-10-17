import { test } from "node:test";
import assert from "node:assert/strict";
import { clipDuration } from "../src/components/aura/editor.ts";
import { AUTO_EDITS, autoEdit, findDrop } from "../src/components/aura/auto-edits.ts";

// A 60 s song at 120 BPM: quiet intro, build-up from 20 s, drop at 30 s, outro from 50 s.
const duration = 60;
const peaks = Array.from({ length: 600 }, (_, i) => {
  const t = i / 10;
  return t < 20 ? 0.2 : t < 30 ? 0.35 : t < 50 ? 0.9 : 0.3;
});
const beats = Array.from({ length: 119 }, (_, i) => 0.5 + i * 0.5);
const base = { id: "a", in: 0, out: 60, rate: 1, volume: 0.8, fadeIn: 0, fadeOut: 0 };
const run = (id) => autoEdit(id, base, duration, peaks, beats);
const onBeat = (t) => beats.some((b) => Math.abs(b - t) < 1e-6) || t === 0 || t === duration;

test("the drop is found where the music jumps up", () => {
  assert.equal(findDrop(peaks, duration, beats), 30);
  assert.equal(findDrop([], duration, beats), null);
});

test("every recipe hits its length, keeps the volume and stays inside the song", () => {
  for (const r of AUTO_EDITS) {
    const edit = run(r.id);
    assert.ok(edit, r.id);
    assert.ok(Math.abs(edit.length - r.length) < 0.75, `${r.id}: ${edit.length} vs ${r.length}`);
    assert.ok(edit.clips.length >= 2 && edit.clips.length <= 60, r.id);
    for (const c of edit.clips) {
      assert.ok(c.in >= 0 && c.out <= duration && c.out - c.in >= 0.15, r.id);
      assert.equal(c.volume, 0.8);
      assert.equal(c.rate, 1, "music speed is never changed");
    }
  }
});

test("cuts land on beats", () => {
  for (const id of ["drop", "rhythm", "trailer", "loop"]) {
    const { clips } = run(id);
    for (const c of clips.slice(1)) assert.ok(onBeat(c.in), `${id} cut at ${c.in}`);
  }
});

test("Drop Anı builds up, flashes on the drop and cuts every two beats after it", () => {
  const { clips } = run("drop");
  const hit = clips.find((c) => c.in === 30);
  assert.ok(hit, "a cut on the drop");
  assert.equal(hit.transition.id, "flash");
  assert.equal(hit.motion.in.id, "impact");
  const after = clips.filter((c) => c.in > 30);
  assert.ok(after.every((c) => Math.abs(clipDuration(c) - 1) < 1e-6 || c === clips.at(-1)));
  assert.ok(clips[0].fadeIn > 0 && clips.at(-1).fadeOut > 0);
});

test("Kancalı Reel opens on the drop, then plays the build-up", () => {
  const { clips } = run("hook");
  assert.ok(clips[0].in >= 30 && clips[0].in < 50, "teaser comes from the loud part");
  assert.ok(clips[1].in < 30, "then the build-up");
  assert.equal(clips[1].transition.id, "flash");
});

test("Hızlı Tanıtım picks separate strong moments in song order", () => {
  const { clips } = run("teaser");
  assert.equal(clips.length, 5);
  for (let i = 1; i < clips.length; i++) assert.ok(clips[i].in > clips[i - 1].out - 1e-6);
  assert.ok(
    clips.every((c) => c.in >= 29 && c.in < 50),
    "all from the strong section",
  );
});

test("Ritim Montajı and Sinematik Fragman cut at different paces", () => {
  const rhythm = run("rhythm").clips,
    trailer = run("trailer").clips;
  assert.ok(rhythm.length > trailer.length * 2);
  assert.ok(rhythm.slice(1).every((c) => c.motion?.in.id && c.motion.in.id !== "none"));
  assert.ok(
    trailer.slice(1, -1).every((c) => ["dissolve", "fade-black"].includes(c.transition.id)),
  );
  assert.equal(trailer.at(-1).transition.id, "flash");
  assert.ok(trailer[0].fadeIn >= 1 && trailer.at(-1).fadeOut >= 2);
});

test("Kusursuz Döngü is exactly eight bars from a downbeat, with no fades", () => {
  const { clips, length, from } = run("loop");
  assert.ok(Math.abs(length - 16) < 1e-6);
  assert.equal(beats.indexOf(from) % 4, 0);
  assert.ok(clips.every((c) => !c.fadeIn && !c.fadeOut));
});

test("short songs use what they have; no sound means no edit", () => {
  const short = autoEdit(
    "rhythm",
    { ...base, out: 12 },
    12,
    peaks.slice(0, 120),
    beats.slice(0, 23),
  );
  assert.ok(short && short.length <= 12 + 1e-6);
  assert.equal(autoEdit("drop", base, duration, [], beats), null);
});
