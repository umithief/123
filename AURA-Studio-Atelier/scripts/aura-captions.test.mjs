import test from "node:test";
import assert from "node:assert/strict";
import {
  cuesFromWords,
  activeCaption,
  importSrt,
  exportSrt,
  restoreCaptionOptions,
  timedCaptionWords,
  DEFAULT_CAPTIONS,
} from "../src/components/aura/captions.ts";
import { CAPTION_TEMPLATES, matchingCaptionTemplate } from "../src/components/aura/caption-templates.ts";
test("word cues keep timestamps and split at vocal gaps", () => {
  const cues = cuesFromWords(
    [
      { text: " Bir", timestamp: [1, 1.4] },
      { text: " şarkı.", timestamp: [1.4, 2] },
      { text: " Yeniden", timestamp: [4, 4.6] },
      { text: " başlar", timestamp: [4.6, null] },
    ],
    6,
  );
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, "Bir şarkı.");
  assert.equal(cues[0].words[1].start, 1.4);
  assert.ok(Math.abs(cues[1].end - 5.4) < 0.000001);
  assert.equal(activeCaption(cues, 2), null);
  assert.equal(activeCaption(cues, 3), null);
});
test("offset is applied to playback and SRT exactly once", () => {
  const cues = [{ id: "a", start: 1, end: 3, text: "Merhaba dünya" }];
  assert.equal(activeCaption(cues, 1.2, 0.5), null);
  assert.equal(activeCaption(cues, 1.5, 0.5)?.id, "a");
  assert.equal(activeCaption(cues, 3.5, 0.5), null);
  assert.equal(activeCaption(cues, 0.5, -0.5)?.id, "a");
  assert.match(exportSrt(cues, 0.5), /00:00:01,500 --> 00:00:03,500/);
});
test("SRT roundtrip preserves Unicode and millisecond timing", () => {
  const cues = importSrt(
    "\uFEFF1\r\n00:00:01,125 --> 00:00:03,850\r\nİstanbul'da bir şarkı\r\n\r\n2\r\n00:00:05,000 --> 00:00:07,000\r\n<b>İkinci</b> satır",
    10,
  );
  assert.deepEqual(
    cues.map((c) => [c.text, c.start, c.end]),
    [
      ["İstanbul'da bir şarkı", 1.125, 3.85],
      ["İkinci satır", 5, 7],
    ],
  );
  assert.deepEqual(importSrt(exportSrt(cues), 10), cues);
});
test("invalid timestamps and out-of-track captions are excluded", () => {
  assert.throws(() => importSrt("no timestamps", 10));
  assert.equal(
    cuesFromWords(
      [
        { text: "bad", timestamp: [null, 2] },
        { text: "outside", timestamp: [12, 14] },
        { text: "last", timestamp: [9, 14] },
      ],
      10,
    )[0].end,
    10,
  );
  const cues = importSrt(
    "1\n00:00:09,000 --> 00:00:12,000\nSon söz\n\n2\n00:00:14,000 --> 00:00:15,000\nDışarı",
    10,
  );
  assert.equal(cues.length, 1);
  assert.equal(cues[0].end, 10);
});
test("stored appearance has safe bounds", () => {
  const v = restoreCaptionOptions('{"style":"bad","place":"bad","size":500,"offset":-90}');
  assert.equal(v.style, "karaoke");
  assert.equal(v.place, "bottom");
  assert.equal(v.size, 48);
  assert.equal(v.offset, -5);
});
test("animation options migrate old settings and bound imported values", () => {
  assert.equal(restoreCaptionOptions('{"style":"minimal"}').animation, "fade");
  const options = restoreCaptionOptions('{"animation":"bounce","speed":99,"intensity":-1}');
  assert.equal(options.animation, "bounce");
  assert.equal(options.speed, 2);
  assert.equal(options.intensity, 0.2);
  assert.equal(restoreCaptionOptions('{"animation":"unknown"}').animation, "fade");
});
test("manual word timing covers the cue while preserving authoritative ASR gaps", () => {
  const cue = { id: "a", text: "Bir şarkı", start: 2, end: 6 };
  const words = timedCaptionWords(cue);
  assert.equal(words[0].start, 2);
  assert.equal(words.at(-1).end, 6);
  assert.ok(words[0].end < words[1].end);
  assert.equal(words[0].end, words[1].start);
  const timed = [
    { text: "Bir", start: 2, end: 2.4 },
    { text: "şarkı", start: 3, end: 4 },
  ];
  assert.deepEqual(timedCaptionWords({ ...cue, words: timed }), timed);
});
test("appearance imports sanitize fonts, colors and drawing bounds", () => {
  const options = restoreCaptionOptions('{"font":"injected","textColor":"url(bad)","highlightColor":"red","outline":99,"glow":-4,"weight":999,"background":"bad"}');
  assert.equal(options.font, "sans");
  assert.equal(options.textColor, "#fff9ee");
  assert.equal(options.highlightColor, "theme");
  assert.equal(options.outline, 8);
  assert.equal(options.glow, 0);
  assert.equal(options.weight, 600);
  assert.equal(options.background, "auto");
});
test("all templates round-trip, reset previous appearance and preserve timing", () => {
  assert.equal(CAPTION_TEMPLATES.length, 26);
  assert.equal(new Set(CAPTION_TEMPLATES.map((p) => p.id)).size, 26);
  let current = { ...DEFAULT_CAPTIONS, offset: 1.5, enabled: false, place: "top" };
  for (const preset of CAPTION_TEMPLATES) {
    current = { ...current, ...preset.options };
    assert.equal(current.offset, 1.5);
    assert.equal(current.enabled, false);
    assert.equal(current.place, "top");
    assert.deepEqual(restoreCaptionOptions(JSON.stringify(current)), current);
    assert.equal(matchingCaptionTemplate(current)?.id, preset.id);
  }
  assert.equal(matchingCaptionTemplate({ ...current, textColor: "#123456" }), undefined);
});
