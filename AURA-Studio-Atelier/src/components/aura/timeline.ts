import { splitClip, type EditClip, type MediaClip } from "./editor.ts";
import { createId } from "./id.ts";
import type { SceneTransition } from "./scene-transitions.ts";
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
  const rate =
    kind === "media" ? (item.kind === "video" ? item.rate || 1 : 0) : kind === "sound" ? 1 : 0;
  let start = Math.max(0, Math.min(item.end - 0.1, item.start + delta));
  if (rate > 0) start = Math.max(start, item.start - (item.offset || 0) / rate);
  const next = { ...item, start };
  if (rate > 0) next.offset = Math.max(0, (item.offset || 0) + (start - item.start) * rate);
  return next;
}

/** Moves or resizes a caption in source time; word timings follow the new
 *  span proportionally so karaoke highlighting stays in step. */
export function retimedCue(
  cue: CaptionCue,
  mode: ItemDrag,
  delta: number,
  duration: number,
  min = 0,
  max = Infinity,
): CaptionCue {
  max = Math.max(cue.end, Math.min(max, Math.max(duration, cue.end)));
  min = Math.min(cue.start, min);
  const length = cue.end - cue.start;
  let start = cue.start,
    end = cue.end;
  if (mode === "move") {
    start = Math.max(min, Math.min(Math.max(min, max - length), cue.start + delta));
    end = start + length;
  } else if (mode === "start") start = Math.max(min, Math.min(cue.end - 0.1, cue.start + delta));
  else end = Math.min(max, Math.max(cue.start + 0.1, cue.end + delta));
  const ratio = (end - start) / Math.max(0.001, length),
    at = (t: number) => Number((start + (t - cue.start) * ratio).toFixed(3));
  return {
    ...cue,
    start: Number(start.toFixed(3)),
    end: Number(end.toFixed(3)),
    ...(cue.words && {
      words: cue.words.map((w) => ({ ...w, start: at(w.start), end: at(w.end) })),
    }),
  };
}

/** Retimes one caption inside a sorted list. Only one caption shows at a time,
 *  so a caption pushed into its neighbour shortens it (down to 0.3 s) instead
 *  of hiding it. */
export function retimedCues(
  cues: CaptionCue[],
  id: string,
  mode: ItemDrag,
  delta: number,
  duration: number,
): CaptionCue[] {
  const list = [...cues].sort((a, b) => a.start - b.start),
    index = list.findIndex((c) => c.id === id);
  if (index < 0) return cues;
  const cue = list[index],
    previous = list[index - 1],
    next = list[index + 1];
  const min = previous ? Math.min(cue.start, previous.start + 0.3) : 0,
    max = next ? Math.max(cue.end, next.end - 0.3) : Infinity;
  const moved = retimedCue(cue, mode, delta, duration, min, max);
  return list.map((c, i) => {
    if (i === index) return moved;
    if (i === index - 1 && c.end > moved.start)
      return retimedCue(c, "end", moved.start - c.end, duration);
    if (i === index + 1 && c.start < moved.end)
      return retimedCue(c, "start", moved.end - c.start, duration);
    return c;
  });
}

/** A steady beat grid from detected onsets: the tempo is the inter-onset
 *  period (70–160 BPM) that most onsets agree with, and each beat is pulled
 *  onto a nearby onset so a long song does not drift. Falls back to the raw
 *  onsets when there are too few to judge a tempo. */
export function beatGrid(
  onsets: number[],
  duration: number,
): { beats: number[]; bpm: number | null } {
  if (onsets.length < 8) return { beats: onsets, bpm: null };
  // The tempo is judged on the first 600 onsets; the walk below follows drift.
  const sample = onsets.slice(0, 600);
  let period = 0,
    best = -1;
  for (let p = 0.375; p <= 0.857; p += 0.0025) {
    let score = 0;
    for (let i = 0; i < sample.length; i++)
      for (let j = i + 1; j < sample.length && sample[j] - sample[i] < p * 4.2; j++) {
        const d = sample[j] - sample[i],
          k = Math.round(d / p);
        if (k < 1) continue;
        const miss = (d - k * p) / 0.025;
        score += Math.exp(-miss * miss) / k;
      }
    if (score > best) {
      best = score;
      period = p;
    }
  }
  // Phase: where most of the opening onsets fall on the grid (later ones may
  // have drifted); the grid starts at the first onset on it, not in silence.
  const opening = onsets.filter((t) => t < onsets[0] + 16);
  let phase = 0,
    hits = -1;
  for (let f = 0; f < period; f += 0.005) {
    let count = 0;
    for (const t of opening) {
      const r = (((t - f) % period) + period) % period;
      if (Math.min(r, period - r) < 0.04) count++;
    }
    if (count > hits) {
      hits = count;
      phase = f;
    }
  }
  const first = onsets.find((t) => {
    const r = (((t - phase) % period) + period) % period;
    return Math.min(r, period - r) < 0.04;
  });
  const beats: number[] = [];
  let at = first ?? phase,
    cursor = 0;
  while (at <= duration + 1e-6 && beats.length < 5000) {
    while (cursor < onsets.length && onsets[cursor] < at - 0.08) cursor++;
    const near =
      cursor < onsets.length && Math.abs(onsets[cursor] - at) <= 0.08 ? onsets[cursor] : null;
    if (near !== null) at = near;
    beats.push(Number(at.toFixed(3)));
    at += period;
  }
  return { beats, bpm: Math.round(60 / period) };
}

/** Timeline times to cut at: every `every`-th beat inside [from, to], away
 *  from existing cuts and the range edges. */
export function beatCutTimes(
  beats: number[],
  clips: EditClip[],
  every: number,
  from: number,
  to: number,
  gap = 0.2,
): number[] {
  const edges = [0];
  let at = 0;
  for (const clip of clips) edges.push((at += (clip.out - clip.in) / clip.rate));
  // A beat right at the start of the range counts as its first beat.
  const inside = timelineMarks(beats, clips).filter((t) => t >= from - 0.05 && t < to - 1e-6);
  return (
    inside
      // Counting from the first beat keeps 4-beat cuts on the bar lines.
      .filter((_, i) => i % every === 0)
      .filter((t) => t - from >= gap && to - t >= gap && edges.every((e) => Math.abs(e - t) >= gap))
      .filter((t, i, list) => i === 0 || t - list[i - 1] >= gap)
  );
}

/** Cuts the timeline at `times` (one undo step for the caller). New cuts may
 *  get a transition; stops at `limit` clips and reports what was left out. */
export function splitAtTimes(
  clips: EditClip[],
  times: number[],
  limit: number,
  transition?: SceneTransition,
): { clips: EditClip[]; added: number; skipped: number } {
  let next = clips,
    added = 0;
  for (const time of times) {
    if (next.length >= limit) break;
    const split = splitClip(next, time);
    if (split === next) continue;
    next = split;
    added++;
  }
  if (transition && transition.id !== "none") {
    const old = new Set(clips.map((c) => c.id));
    next = next.map((c, i) =>
      i > 0 && !old.has(c.id) ? { ...c, transition: { ...transition } } : c,
    );
  }
  return { clips: next, added, skipped: times.length - added };
}

export type BeatSlot = { start: number; end: number; image: number };

/** Slots for a beat-synced slideshow: a new picture every `every` beats from
 *  `from` to `to` (timeline time). A lead-in before the first beat becomes its
 *  own slot. With `loop` the pictures repeat to the end, otherwise each is
 *  used once. `order` maps slot → picture index (defaults to 0,1,2,…). */
export function beatSlots(
  marks: number[],
  every: number,
  from: number,
  to: number,
  count: number,
  loop: boolean,
  order?: (slot: number) => number,
): BeatSlot[] {
  if (count < 1 || to - from < 0.2) return [];
  const cuts = marks
    .filter((t) => t >= from - 0.05 && t < to)
    .filter((_, i) => i % every === 0)
    .filter((t) => t >= from + 0.2 && t <= to - 0.2);
  const edges = [from, ...cuts, to],
    slots: BeatSlot[] = [];
  for (let i = 0; i < edges.length - 1 && slots.length < 300; i++) {
    if (!loop && i >= count) break;
    slots.push({
      start: Number(edges[i].toFixed(3)),
      end: Number(edges[i + 1].toFixed(3)),
      image: order ? order(i) : i % count,
    });
  }
  return slots;
}

/** A repeatable shuffle: every picture once per round, no picture twice in a row. */
export function shuffledOrder(count: number, seed = 1): (slot: number) => number {
  let state = seed >>> 0 || 1;
  const random = () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296;
  const rounds: number[][] = [];
  return (slot: number) => {
    const round = Math.floor(slot / count);
    while (rounds.length <= round) {
      const deck = Array.from({ length: count }, (_, i) => i);
      for (let i = count - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      const previous = rounds.at(-1)?.at(-1);
      if (count > 1 && deck[0] === previous) [deck[0], deck[1]] = [deck[1], deck[0]];
      rounds.push(deck);
    }
    return rounds[round][slot % count];
  };
}

/** The distinct pictures of a project in timeline order (a picture placed
 *  several times counts once), ready to be laid out again. */
export function slideshowPictures(media: MediaClip[]): MediaClip[] {
  const seen = new Set<string>();
  return [...media]
    .filter((m) => !m.sourceVideo)
    .sort((a, b) => a.start - b.start)
    .filter((m) => !seen.has(m.asset) && seen.add(m.asset));
}

/** Replaces the picture track with one item per slot; each copies its
 *  picture's look (fit, mask, motion…) and gets the chosen transition. */
export function arrangedMedia(
  media: MediaClip[],
  pictures: MediaClip[],
  slots: BeatSlot[],
  transition: MediaClip["transition"],
  transitionDuration: number,
): MediaClip[] {
  return [
    ...media.filter((m) => m.sourceVideo),
    ...slots.map((slot) => {
      const picture = pictures[slot.image];
      return {
        ...picture,
        id: createId(),
        start: slot.start,
        end: slot.end,
        transition,
        transitionDuration: Number(
          Math.min(transitionDuration, (slot.end - slot.start) / 2).toFixed(3),
        ),
      };
    }),
  ];
}
