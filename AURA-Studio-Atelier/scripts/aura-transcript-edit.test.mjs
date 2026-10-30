import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cutSourceRanges,
  isHesitation,
  keptWord,
  longPauses,
  rangesForWords,
  removedSeconds,
  transcriptWords,
} from "../src/components/aura/transcript-edit.ts";

const clip = (id, a, b, extra = {}) => ({
  id,
  in: a,
  out: b,
  rate: 1,
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
  ...extra,
});
const cues = [
  {
    id: "c1",
    text: "Merhaba ııı arkadaşlar",
    start: 1,
    end: 3,
    words: [
      { text: "Merhaba", start: 1, end: 1.5 },
      { text: "ııı", start: 1.6, end: 2.1 },
      { text: "arkadaşlar", start: 2.2, end: 3 },
    ],
  },
  { id: "c2", text: "bugün yeni bir video", start: 5, end: 7 },
];

test("words come with source times; captions without word times are estimated", () => {
  const words = transcriptWords(cues, 0.5);
  assert.deepEqual(
    words.map((w) => w.text),
    ["Merhaba", "ııı", "arkadaşlar", "bugün", "yeni", "bir", "video"],
  );
  assert.equal(words[0].start, 1.5, "caption delay applied");
  assert.ok(!words[0].approximate && words[3].approximate);
  const estimated = words.slice(3);
  assert.equal(estimated[0].start, 5.5);
  assert.ok(Math.abs(estimated.at(-1).end - 7.5) < 1e-9, "estimated words fill the caption");
  for (let i = 1; i < estimated.length; i++)
    assert.ok(estimated[i].start >= estimated[i - 1].end - 1e-9);
});

test("hesitations are recognised, real words are not", () => {
  for (const w of ["ııı", "Eee,", "hmm", "Şey", "um", "aah"]) assert.ok(isHesitation(w), w);
  for (const w of ["evet", "ama", "yani", "hiç", "Merhaba"]) assert.ok(!isHesitation(w), w);
});

test("deleting a word cuts up to the next word, not leaving a double pause", () => {
  const words = transcriptWords(cues);
  const ranges = rangesForWords(words, new Set([words[1].id]));
  assert.deepEqual(ranges, [[1.6, 2.2]]);
  const next = cutSourceRanges([clip("a", 0, 10)], ranges);
  assert.deepEqual(
    next.map((c) => [c.in, c.out]),
    [
      [0, 1.6],
      [2.2, 10],
    ],
  );
  assert.ok(!keptWord(words[1], next) && keptWord(words[0], next) && keptWord(words[2], next));
});

test("a run of words is one cut; the edit keeps its opening and ending", () => {
  const words = transcriptWords(cues);
  const ranges = rangesForWords(words, new Set([words[0].id, words[1].id]));
  assert.equal(ranges.length, 1);
  const motion = {
    in: { id: "zoom-in", duration: 1 },
    out: { id: "fade", duration: 1 },
    combo: { id: "none", duration: 1 },
    amount: 1,
  };
  const next = cutSourceRanges(
    [
      clip("a", 0, 10, {
        fadeIn: 0.5,
        fadeOut: 1,
        transition: { id: "dissolve", duration: 0.5 },
        motion,
      }),
    ],
    ranges,
  );
  assert.equal(next.length, 2);
  assert.equal(next[0].id, "a");
  assert.deepEqual(
    [next[0].fadeIn, next[0].fadeOut, next[1].fadeIn, next[1].fadeOut],
    [0.5, 0, 0, 1],
  );
  assert.equal(next[1].transition, undefined);
  assert.equal(next[0].motion.out.id, "none");
  assert.equal(next[1].motion.in.id, "none");
  assert.equal(next[1].motion.out.id, "fade");
});

test("long pauses between kept words shrink to a short breath", () => {
  const words = transcriptWords(cues);
  const pauses = longPauses(words, [clip("a", 0, 10)], 0.7, 0.25);
  // arkadaşlar ends at 3, bugün starts at 5.
  assert.equal(pauses.length, 1);
  assert.deepEqual(
    pauses[0].map((n) => Number(n.toFixed(3))),
    [3.125, 4.875],
  );
  assert.ok(Math.abs(removedSeconds([clip("a", 0, 10)], pauses) - 1.75) < 1e-6);
});

test("cuts spanning clips, an untouched edit and the clip limit", () => {
  const clips = [clip("a", 0, 4), clip("b", 6, 10)];
  assert.deepEqual(
    cutSourceRanges(clips, [[3, 7]]).map((c) => [c.in, c.out]),
    [
      [0, 3],
      [7, 10],
    ],
  );
  assert.equal(cutSourceRanges(clips, [[4.5, 5.5]]), clips, "nothing played there");
  const many = Array.from({ length: 40 }, (_, i) => [i * 0.2 + 0.05, i * 0.2 + 0.1]);
  assert.equal(cutSourceRanges([clip("a", 0, 10)], many, 30), null);
  assert.equal(cutSourceRanges([clip("a", 0, 10)], [[0, 10]]), null, "never an empty edit");
});
