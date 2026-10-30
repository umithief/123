// Edit the video by its words. The captions carry the spoken words with
// their times in the source; deleting words removes those stretches of the
// source from every clip that plays them. Captions follow the source, so the
// remaining words stay in sync without any further work.
import { createId } from "./id.ts";
import type { CaptionCue } from "./captions.ts";
import type { EditClip } from "./editor.ts";

export type TranscriptWord = {
  /** `${cue id}:${index}` — stable while the captions do not change. */
  id: string;
  cue: string;
  text: string;
  /** Source seconds (the caption delay already applied). */
  start: number;
  end: number;
  /** True when the caption had no word times and they were estimated. */
  approximate: boolean;
};

/** Every spoken word in source order. `offset` is the caption delay. */
export function transcriptWords(cues: CaptionCue[], offset = 0): TranscriptWord[] {
  const words: TranscriptWord[] = [];
  for (const cue of [...cues].sort((a, b) => a.start - b.start)) {
    const timed = cue.words?.filter((w) => w.text.trim() && w.end > w.start) ?? [];
    if (timed.length) {
      timed.forEach((w, i) =>
        words.push({
          id: `${cue.id}:${i}`,
          cue: cue.id,
          text: w.text.trim(),
          start: w.start + offset,
          end: w.end + offset,
          approximate: false,
        }),
      );
      continue;
    }
    // Without word times, words share the caption's time by their length.
    const parts = cue.text.split(/\s+/).filter(Boolean),
      weight = parts.reduce((n, p) => n + p.length + 1, 0),
      span = cue.end - cue.start;
    let at = cue.start;
    parts.forEach((text, i) => {
      const length = (span * (text.length + 1)) / Math.max(1, weight);
      words.push({
        id: `${cue.id}:${i}`,
        cue: cue.id,
        text,
        start: at + offset,
        end: at + length + offset,
        approximate: true,
      });
      at += length;
    });
  }
  return words;
}

/** Hesitations that are safe to cut: "ııı", "eee", "hmm", "şey", "um"… */
export function isHesitation(text: string): boolean {
  const word = text
    .toLocaleLowerCase("tr")
    .replace(/[^\p{L}]+/gu, "")
    .trim();
  return /^(ı{1,}m*|i{2,}|e{2,}h*|eh|a{2,}h*|ah|ö{2,}|hı+m*|hm+|ım+|um+|uh+|er+m*|şey)$/u.test(
    word,
  );
}

/** Whether the edit still plays the middle of `word`. */
export function keptWord(word: TranscriptWord, clips: EditClip[]): boolean {
  const middle = (word.start + word.end) / 2;
  return clips.some((c) => middle >= c.in && middle <= c.out);
}

/**
 * The source stretches to remove for the selected words. Each run of
 * selected words is cut from its first word's start up to the next kept
 * word (so no double pause is left behind), but never more than a breath
 * past the last selected word.
 */
export function rangesForWords(
  words: TranscriptWord[],
  selected: Set<string>,
): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < words.length; i++) {
    if (!selected.has(words[i].id)) continue;
    let j = i;
    while (j + 1 < words.length && selected.has(words[j + 1].id)) j++;
    const next = words[j + 1],
      end = next ? Math.min(next.start, words[j].end + 0.25) : words[j].end;
    ranges.push([words[i].start, Math.max(words[j].end, end)]);
    i = j;
  }
  return ranges;
}

/**
 * Long pauses between kept words, shortened to `keep` seconds: the part to
 * remove for every gap longer than `longer`.
 */
export function longPauses(
  words: TranscriptWord[],
  clips: EditClip[],
  longer = 0.7,
  keep = 0.25,
): Array<[number, number]> {
  const kept = words.filter((w) => keptWord(w, clips));
  const ranges: Array<[number, number]> = [];
  for (let i = 1; i < kept.length; i++) {
    const gap = kept[i].start - kept[i - 1].end;
    if (gap > longer) ranges.push([kept[i - 1].end + keep / 2, kept[i].start - keep / 2]);
  }
  return ranges;
}

const MIN = 0.08;

/**
 * Removes source stretches from every clip, keeping the timeline gap-free.
 * A clip cut into pieces keeps its opening (transition, fade-in, entrance
 * animation) on the first piece and its ending on the last. Returns null
 * when the result would pass `limit` clips; the same list when nothing
 * changes.
 */
export function cutSourceRanges(
  clips: EditClip[],
  ranges: Array<[number, number]>,
  limit = 60,
): EditClip[] | null {
  const cuts = ranges
    .filter(([a, b]) => b - a > 0.02)
    .sort((x, y) => x[0] - y[0])
    .reduce<Array<[number, number]>>((merged, [a, b]) => {
      const last = merged.at(-1);
      if (last && a <= last[1] + 0.01) last[1] = Math.max(last[1], b);
      else merged.push([a, b]);
      return merged;
    }, []);
  if (!cuts.length) return clips;
  const out: EditClip[] = [];
  let changed = false;
  for (const clip of clips) {
    const pieces: Array<[number, number]> = [];
    let at = clip.in;
    for (const [a, b] of cuts) {
      if (b <= at || a >= clip.out) continue;
      if (a > at) pieces.push([at, Math.min(a, clip.out)]);
      at = Math.max(at, b);
    }
    if (at < clip.out) pieces.push([at, clip.out]);
    const kept = pieces.filter(([a, b]) => b - a >= MIN);
    if (kept.length === 1 && kept[0][0] === clip.in && kept[0][1] === clip.out) {
      out.push(clip);
      continue;
    }
    changed = true;
    kept.forEach(([a, b], i) => {
      const first = i === 0,
        last = i === kept.length - 1;
      const motion = clip.motion && {
        ...clip.motion,
        ...(first ? {} : { in: { ...clip.motion.in, id: "none" as const } }),
        ...(last ? {} : { out: { ...clip.motion.out, id: "none" as const } }),
      };
      out.push({
        ...clip,
        id: first ? clip.id : createId(),
        in: Number(a.toFixed(3)),
        out: Number(b.toFixed(3)),
        fadeIn: first ? clip.fadeIn : 0,
        fadeOut: last ? clip.fadeOut : 0,
        transition: first ? clip.transition : undefined,
        motion,
      });
    });
  }
  if (!changed) return clips;
  if (!out.length || out.length > limit) return null;
  return out;
}

/** Seconds of the edit that `ranges` would remove (overlaps counted once). */
export function removedSeconds(clips: EditClip[], ranges: Array<[number, number]>): number {
  const next = cutSourceRanges(clips, ranges, Infinity);
  if (!next) return 0;
  const length = (list: EditClip[]) => list.reduce((n, c) => n + (c.out - c.in) / c.rate, 0);
  return Math.max(0, length(clips) - length(next));
}
