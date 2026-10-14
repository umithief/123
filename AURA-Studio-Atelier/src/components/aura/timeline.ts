import type { EditClip } from "./editor";
import type { CaptionCue } from "./captions";

export function trimmedClip(
  clip: EditClip,
  edge: "in" | "out",
  delta: number,
  duration: number,
): EditClip {
  const value = clip[edge] + delta;
  return {
    ...clip,
    [edge]:
      edge === "in"
        ? Math.max(0, Math.min(clip.out - 0.1, value))
        : Math.min(duration, Math.max(clip.in + 0.1, value)),
  };
}

// Caption timestamps refer to the source; display each retained occurrence in output time.
export function captionSegments(cues: CaptionCue[], clips: EditClip[], offset: number) {
  const segments: { id: string; cue: string; text: string; start: number; end: number }[] = [];
  let at = 0;
  for (const clip of clips) {
    for (const cue of cues) {
      const start = Math.max(clip.in, cue.start + offset),
        end = Math.min(clip.out, cue.end + offset);
      if (end > start)
        segments.push({
          id: `${clip.id}-${cue.id}`,
          cue: cue.id,
          text: cue.text,
          start: at + (start - clip.in) / clip.rate,
          end: at + (end - clip.in) / clip.rate,
        });
    }
    at += (clip.out - clip.in) / clip.rate;
  }
  return segments;
}

/** Source-time onsets (seconds) of a mono signal: rises in short-time energy
 *  that stand out from their surroundings, at most one per 0.18 s. */
export function detectBeats(samples: Float32Array, sampleRate: number, limit = 4000): number[] {
  const hop = Math.max(1, Math.round(sampleRate * 0.01)),
    frames = Math.floor(samples.length / hop);
  if (frames < 3) return [];
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const from = f * hop,
      to = Math.min(samples.length, from + hop * 2);
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    energy[f] = Math.log1p((sum / Math.max(1, to - from)) * 1000);
  }
  const flux = new Float32Array(frames);
  for (let f = 1; f < frames; f++) flux[f] = Math.max(0, energy[f] - energy[f - 1]);
  // Running mean over ±0.5 s for an adaptive threshold.
  const reach = 50,
    prefix = new Float64Array(frames + 1);
  for (let f = 0; f < frames; f++) prefix[f + 1] = prefix[f] + flux[f];
  let peak = 0;
  for (let f = 0; f < frames; f++) peak = Math.max(peak, flux[f]);
  const floor = peak * 0.2,
    gap = Math.round(0.18 / 0.01),
    beats: number[] = [];
  let last = -gap;
  for (let f = 1; f < frames - 1 && beats.length < limit; f++) {
    const a = Math.max(0, f - reach),
      b = Math.min(frames, f + reach + 1),
      mean = (prefix[b] - prefix[a]) / (b - a);
    const value = flux[f];
    if (value < floor || value < mean * 1.6) continue;
    let local = true;
    for (let k = Math.max(0, f - 4); k <= Math.min(frames - 1, f + 4); k++)
      if (flux[k] > value || (flux[k] === value && k < f)) local = false;
    if (!local || f - last < gap) continue;
    beats.push(Number(((f * hop) / sampleRate).toFixed(3)));
    last = f;
  }
  return beats;
}

/** Positions of source-time marks inside the cut timeline (repeated cuts repeat them). */
export function timelineMarks(marks: number[], clips: EditClip[]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const clip of clips) {
    for (const mark of marks)
      if (mark >= clip.in && mark < clip.out) out.push(at + (mark - clip.in) / clip.rate);
    at += (clip.out - clip.in) / clip.rate;
  }
  return out.sort((a, b) => a - b);
}

/** Nearest target within `threshold`, or null. */
export function snapTo(value: number, targets: number[], threshold: number): number | null {
  let best: number | null = null,
    distance = threshold;
  for (const target of targets) {
    const d = Math.abs(target - value);
    if (d <= distance) {
      best = target;
      distance = d;
    }
  }
  return best;
}

type Span = { start: number; end: number };
export type TimelineItemKind = "media" | "layer" | "sound";
export type ItemDrag = "move" | "start" | "end";

/** Moves or resizes a timeline item by `delta` seconds, keeping its content in
 *  place: a trimmed start advances the source offset, a moved text layer
 *  carries its keyframes along. */
export function draggedItem<
  T extends Span & {
    offset?: number;
    rate?: number;
    kind?: string;
    keyframes?: { time: number }[];
  },
>(item: T, kind: TimelineItemKind, mode: ItemDrag, delta: number, total: number): T {
  const length = item.end - item.start;
  if (mode === "move") {
    const start = Math.max(0, Math.min(Math.max(0, total - 0.1), item.start + delta)),
      d = start - item.start;
    const next = { ...item, start, end: start + length };
    if (kind === "layer" && item.keyframes)
      next.keyframes = item.keyframes.map((f) => ({ ...f, time: Math.max(0, f.time + d) }));
    return next;
  }
  if (mode === "end") {
    // The handle sits at the visible end; an item running past the video ends there.
    const limit = Math.max(total, item.start + 0.1),
      end = Math.min(item.end, limit) + delta;
    return { ...item, end: Math.max(item.start + 0.1, Math.min(limit, end)) };
  }
  // Trimming the start: the source may not be rewound before its beginning.
  const rate = kind === "media" ? (item.kind === "video" ? item.rate || 1 : 0) : kind === "sound" ? 1 : 0;
  let start = Math.max(0, Math.min(item.end - 0.1, item.start + delta));
  if (rate > 0) start = Math.max(start, item.start - (item.offset || 0) / rate);
  const next = { ...item, start };
  if (rate > 0) next.offset = Math.max(0, (item.offset || 0) + (start - item.start) * rate);
  return next;
}
