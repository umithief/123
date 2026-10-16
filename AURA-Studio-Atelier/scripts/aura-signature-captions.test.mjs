import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPTION_FINISHES,
  SIGNATURE_ANIMATIONS,
} from "../src/components/aura/caption-signatures.ts";
import {
  DEFAULT_CAPTIONS,
  CAPTION_ANIMATIONS,
  restoreCaptionOptions,
  exportSrt,
} from "../src/components/aura/captions.ts";
import {
  CAPTION_TEMPLATES,
  matchingCaptionTemplate,
} from "../src/components/aura/caption-templates.ts";
import { packProject, unpackProject } from "../src/components/aura/project-archive.ts";
const collection = CAPTION_TEMPLATES.filter((p) => p.category === "İmza");
test("ten signature templates each have their own selectable motion and finish", () => {
  assert.equal(collection.length, 10);
  assert.equal(new Set(collection.map((p) => p.options.animation)).size, 10);
  assert.equal(new Set(collection.map((p) => p.options.textEffect)).size, 10);
  assert.equal(SIGNATURE_ANIMATIONS.length, 10);
  assert.equal(CAPTION_FINISHES.length, 11);
  assert.equal(new Set(CAPTION_ANIMATIONS.map((a) => a.id)).size, CAPTION_ANIMATIONS.length);
  for (const p of collection) {
    assert.ok(SIGNATURE_ANIMATIONS.some((a) => a.id === p.options.animation));
    assert.ok(CAPTION_ANIMATIONS.some((a) => a.id === p.options.animation));
    assert.ok(CAPTION_FINISHES.some((f) => f.id === p.options.textEffect));
  }
});
test("old project files default to the original finish and invalid finishes are rejected", () => {
  assert.equal(restoreCaptionOptions("{}").textEffect, "none");
  assert.equal(restoreCaptionOptions('{"textEffect":"unknown"}').textEffect, "none");
  assert.equal(restoreCaptionOptions('{"textEffect":42}').textEffect, "none");
  assert.equal(
    restoreCaptionOptions('{"animation":"foil-reveal","textEffect":"gold-foil"}').animation,
    "foil-reveal",
  );
});
test("every signature survives an archive roundtrip without changing text or timing", async () => {
  const cues = [
    {
      id: "tr",
      start: 1.25,
      end: 4.75,
      text: "İçimde şarkılar, özgürce.",
      words: [
        { text: "İçimde", start: 1.25, end: 2 },
        { text: "şarkılar,", start: 2.1, end: 3.4 },
        { text: "özgürce.", start: 3.5, end: 4.75 },
      ],
    },
  ];
  const srt = exportSrt(cues, 0.4);
  for (const p of collection) {
    const captions = {
      ...DEFAULT_CAPTIONS,
      offset: 0.4,
      place: "top",
      enabled: false,
      ...p.options,
    };
    const zip = await packProject([
      { name: "source", blob: new Blob(["test-audio"]) },
      { name: "project.json", blob: new Blob([JSON.stringify({ captions, cues })]) },
    ]);
    const files = await unpackProject(zip),
      saved = JSON.parse(await files.get("project.json").text());
    assert.deepEqual(saved.cues, cues);
    assert.equal(exportSrt(saved.cues, saved.captions.offset), srt);
    const restored = restoreCaptionOptions(JSON.stringify(saved.captions));
    assert.deepEqual(restored, captions);
    assert.equal(matchingCaptionTemplate(restored)?.id, p.id);
    assert.equal(restored.place, "top");
    assert.equal(restored.enabled, false);
  }
});
test("new effects and motions can be mixed independently and old templates reset the finish", () => {
  for (const effect of CAPTION_FINISHES)
    for (const animation of SIGNATURE_ANIMATIONS) {
      const v = restoreCaptionOptions(
        JSON.stringify({ ...DEFAULT_CAPTIONS, textEffect: effect.id, animation: animation.id }),
      );
      assert.equal(v.textEffect, effect.id);
      assert.equal(v.animation, animation.id);
    }
  const old = CAPTION_TEMPLATES.find((p) => p.category !== "İmza");
  const options = { ...DEFAULT_CAPTIONS, ...collection[0].options, ...old.options };
  assert.equal(options.textEffect, "none");
  assert.equal(matchingCaptionTemplate(options)?.id, old.id);
});
