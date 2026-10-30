import { test } from "node:test";
import assert from "node:assert/strict";
import { describeCaptions, describeEdit } from "../src/components/aura/history-describe.ts";
import { emptyProject, makeClip } from "../src/components/aura/editor.ts";

const base = () => ({ ...emptyProject(), clips: [{ ...makeClip(10), id: "a" }] });
const name = (step) => (step.detail ? `${step.text}: ${step.detail}` : step.text);

test("clip steps are named by what they did", () => {
  const one = base();
  const split = {
    ...one,
    clips: [
      { ...one.clips[0], out: 4 },
      { ...one.clips[0], id: "b", in: 4 },
    ],
  };
  assert.equal(name(describeEdit(one, split)), "Klip bölündü");
  assert.equal(name(describeEdit(split, { ...split, clips: [split.clips[0]] })), "Klip silindi");
  const dup = { ...split, clips: [...split.clips, { ...split.clips[1], id: "c" }] };
  assert.equal(name(describeEdit(split, dup)), "Klip çoğaltıldı");
  const cut = {
    ...one,
    clips: [
      { ...one.clips[0], out: 6 },
      { ...one.clips[0], id: "b", in: 8 },
    ],
  };
  assert.equal(name(describeEdit(one, cut)), "Kurgu kısaldı: −2,0 sn");
});

test("transitions, animations, speed and effects carry their names", () => {
  const two = {
    ...base(),
    clips: [
      { ...makeClip(10), id: "a", out: 5 },
      { ...makeClip(10), id: "b", in: 5 },
    ],
  };
  const cube = {
    ...two,
    clips: [two.clips[0], { ...two.clips[1], transition: { id: "pro-cube", duration: 0.6 } }],
  };
  assert.equal(name(describeEdit(two, cube)), "Geçiş: 3D Küp");
  assert.equal(name(describeEdit(cube, two)), "Geçiş kaldırıldı");
  const motion = {
    in: { id: "pro-warp", duration: 0.8 },
    out: { id: "none", duration: 0.8 },
    combo: { id: "none", duration: 1.6 },
    amount: 1,
  };
  const all = { ...two, clips: two.clips.map((c) => ({ ...c, motion })) };
  assert.equal(name(describeEdit(two, all)), "Animasyon tüm kliplere: Hız Bükülmesi");
  const fast = { ...two, clips: [{ ...two.clips[0], rate: 2 }, two.clips[1]] };
  assert.equal(name(describeEdit(two, fast)), "Hız: 2×");
  const look = { ...two, adjust: { ...two.adjust, effect: "pro-neon" } };
  assert.equal(name(describeEdit(two, look)), "Efekt: Neon Rüya");
});

test("layer steps", () => {
  const one = base();
  const text = {
    id: "t",
    kind: "text",
    text: "Merhaba",
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    opacity: 1,
    start: 0,
    end: 5,
    keyframes: [],
  };
  const withText = { ...one, layers: [text] };
  assert.equal(name(describeEdit(one, withText)), "Yazı eklendi");
  assert.equal(
    name(describeEdit(withText, { ...one, layers: [{ ...text, scale: 2, rotation: 45 }] })),
    "Katman büyütüldü ya da döndürüldü",
  );
  assert.equal(
    name(describeEdit(withText, { ...one, layers: [{ ...text, x: 0.3 }] })),
    "Katman taşındı",
  );
  assert.equal(name(describeEdit(withText, one)), "Katman silindi");
});

test("caption steps", () => {
  const cue = { id: "c", text: "Merhaba", start: 1, end: 2 };
  assert.equal(
    name(describeCaptions({ cues: [], pos: null }, { cues: [cue], pos: null })),
    "Altyazılar eklendi",
  );
  assert.equal(
    name(describeCaptions({ cues: [cue], pos: null }, { cues: [cue], pos: { x: 0.5, y: 0.3 } })),
    "Altyazı konumu değişti",
  );
  assert.equal(
    name(
      describeCaptions(
        { cues: [cue], pos: null },
        { cues: [{ ...cue, text: "Selam" }], pos: null },
      ),
    ),
    "Altyazı metni düzenlendi",
  );
  assert.equal(
    name(
      describeCaptions({ cues: [cue], pos: null }, { cues: [{ ...cue, start: 1.5 }], pos: null }),
    ),
    "Altyazı zamanı değişti",
  );
});
