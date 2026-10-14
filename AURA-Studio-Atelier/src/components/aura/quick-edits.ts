// One-tap edits. Each returns a new clip list; the caller commits it as one
// undo step. `peaks` is the source loudness: `peaks.length` equal bars over
// `duration` seconds of the source.
import { createId } from "./id.ts";
import type { EditClip } from "./editor.ts";
import type { SceneTransition } from "./scene-transitions.ts";

const length = (c: EditClip) => (c.out - c.in) / c.rate;

/** Start (source seconds) of the loudest `span`-second stretch, preferring
 *  starts on a beat; null when the source is not longer than `span`. */
export function loudestWindow(
  peaks: number[],
  duration: number,
  span: number,
  beats: number[] = [],
): number | null {
  if (!peaks.length || span >= duration - 0.05) return null;
  const bar = duration / peaks.length,
    sums = new Float64Array(peaks.length + 1);
  for (let i = 0; i < peaks.length; i++) sums[i + 1] = sums[i] + peaks[i] * peaks[i];
  const energy = (start: number) => {
    const a = Math.max(0, Math.floor(start / bar)),
      b = Math.min(peaks.length, Math.ceil((start + span) / bar));
    return (sums[b] - sums[a]) / Math.max(1, b - a);
  };
  let starts = beats.filter((b) => b >= 0 && b + span <= duration);
  if (!starts.length)
    starts = Array.from({ length: Math.floor((duration - span) / 0.5) + 1 }, (_, i) => i * 0.5);
  let best = starts[0],
    score = -1;
  for (const start of starts) {
    const value = energy(start);
    if (value > score + 1e-9) {
      score = value;
      best = start;
    }
  }
  return best;
}

/** Keeps only the chosen stretch of the source, with a soft start and end. */
export function sectionClips(clips: EditClip[], start: number, span: number): EditClip[] {
  const base = clips[0];
  if (!base) return clips;
  return [
    {
      ...base,
      in: start,
      out: Number((start + span).toFixed(3)),
      rate: 1,
      fadeIn: Math.min(0.6, span / 6),
      fadeOut: Math.min(1.5, span / 6),
      transition: undefined,
    },
  ];
}

/** Audible stretches of the source as [start, end] pairs. A part counts as
 *  silent when it stays below `threshold` × the loud level for `minGap` s. */
export function soundRanges(
  peaks: number[],
  duration: number,
  { threshold = 0.08, minGap = 0.6, pad = 0.15 } = {},
): [number, number][] {
  if (!peaks.length || duration <= 0) return [];
  const sorted = [...peaks].sort((a, b) => a - b),
    loud = sorted[Math.floor(sorted.length * 0.95)] || 0;
  if (loud <= 0) return [];
  const bar = duration / peaks.length,
    floor = loud * threshold,
    silent: [number, number][] = [];
  let from = -1;
  for (let i = 0; i <= peaks.length; i++) {
    const quiet = i < peaks.length && peaks[i] < floor;
    if (quiet && from < 0) from = i;
    if (!quiet && from >= 0) {
      const start = from * bar,
        end = i * bar;
      // Silence at the very start or end counts whatever its length.
      if (end - start >= minGap || from === 0 || i === peaks.length) silent.push([start, end]);
      from = -1;
    }
  }
  const ranges: [number, number][] = [];
  let at = 0;
  for (const [start, end] of silent) {
    if (start > at) ranges.push([at, start]);
    at = end;
  }
  if (at < duration) ranges.push([at, duration]);
  return ranges
    .map(([a, b]): [number, number] => [Math.max(0, a - pad), Math.min(duration, b + pad)])
    .filter(([a, b]) => b - a >= 0.15);
}

/** Cuts every clip down to the audible ranges (at most `limit` clips). */
export function withoutSilences(
  clips: EditClip[],
  ranges: [number, number][],
  limit = 60,
): { clips: EditClip[]; removed: number } {
  const out: EditClip[] = [];
  clips.forEach((clip, index) => {
    const pieces = ranges
      .map(([a, b]): [number, number] => [Math.max(a, clip.in), Math.min(b, clip.out)])
      .filter(([a, b]) => b - a >= 0.15 * clip.rate);
    // Keep the clip whole when it has no sound at all or the limit is reached.
    const remaining = clips.length - index - 1;
    if (!pieces.length || out.length + pieces.length + remaining > limit) {
      out.push(clip);
      return;
    }
    pieces.forEach(([a, b], i) =>
      out.push({
        ...clip,
        id: i ? createId() : clip.id,
        in: a,
        out: b,
        ...(i ? { transition: undefined, fadeIn: 0 } : {}),
        ...(i < pieces.length - 1 ? { fadeOut: 0 } : {}),
      }),
    );
  });
  const before = clips.reduce((n, c) => n + length(c), 0),
    after = out.reduce((n, c) => n + length(c), 0);
  return { clips: out, removed: Math.max(0, before - after) };
}

/** Trims silence before the first sound and after the last one. */
export function trimmedEdges(clips: EditClip[], ranges: [number, number][]): EditClip[] {
  if (!clips.length || !ranges.length) return clips;
  const first = ranges[0][0],
    last = ranges.at(-1)![1];
  const next = clips.map((c) => ({ ...c }));
  const head = next[0],
    tail = next.at(-1)!;
  if (first > head.in && first < head.out - 0.1) head.in = first;
  if (last < tail.out && last > tail.in + 0.1) tail.out = last;
  return next;
}

/** A soft start on the first clip and a soft ending on the last. */
export function softEdges(clips: EditClip[]): EditClip[] {
  if (!clips.length) return clips;
  return clips.map((c, i) => ({
    ...c,
    ...(i === 0 ? { fadeIn: Number(Math.min(1.5, length(c) / 3).toFixed(2)) } : {}),
    ...(i === clips.length - 1 ? { fadeOut: Number(Math.min(2.5, length(c) / 3).toFixed(2)) } : {}),
  }));
}

/** The same transition on every cut. */
export function transitionEverywhere(clips: EditClip[], transition: SceneTransition): EditClip[] {
  return clips.map((c, i) => (i ? { ...c, transition: { ...transition } } : c));
}
