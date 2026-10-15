// Range edits on the main clip track, in timeline seconds. Each returns a new
// clip list the caller commits as one undo step, or the same reference when
// there is nothing to do. The timeline stays gap-free: removing a span ripples
// the later clips left, so the result is always one continuous video.
import { clipDuration, splitClip, type EditClip } from "./editor.ts";

const EPS = 1e-4;
const MIN = 0.1;

/** Ordered, clamped [low, high] span, or null when it is shorter than MIN. */
export function orderedSpan(a: number, b: number, total: number): [number, number] | null {
  const low = Math.max(0, Math.min(a, b)),
    high = Math.min(total, Math.max(a, b));
  return high - low >= MIN ? [low, high] : null;
}

/** Timeline start of each clip, in order. */
function starts(clips: EditClip[]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const clip of clips) {
    out.push(at);
    at += clipDuration(clip);
  }
  return out;
}

/** Splits exactly at `from` and `to` so the span lines up with clip edges. */
function cutAt(clips: EditClip[], from: number, to: number): EditClip[] {
  return splitClip(splitClip(clips, from), to);
}

/** Removes the timeline span [from, to] and closes the gap (ripple delete). */
export function extractRange(clips: EditClip[], from: number, to: number): EditClip[] {
  if (to - from < MIN) return clips;
  const next = cutAt(clips, from, to),
    at = starts(next);
  const out = next.filter((clip, i) => {
    const start = at[i],
      end = start + clipDuration(clip);
    return !(start >= from - EPS && end <= to + EPS);
  });
  // Never leave the project empty, and ignore a span that removed nothing.
  return out.length && out.length < next.length ? out : clips;
}

/** Keeps only the timeline span [from, to] and drops the rest (crop). */
export function keepRange(clips: EditClip[], from: number, to: number): EditClip[] {
  if (to - from < MIN) return clips;
  const next = cutAt(clips, from, to),
    at = starts(next);
  const out = next.filter((clip, i) => {
    const start = at[i],
      end = start + clipDuration(clip);
    return start >= from - EPS && end <= to + EPS;
  });
  // The first kept clip lost its left neighbour, so it starts with a hard cut.
  if (out.length && out[0].transition) out[0] = { ...out[0], transition: undefined };
  return out.length && out.length < next.length ? out : clips;
}

/** Pulls the selected clip's start ("in") or end ("out") edge to the playhead,
 *  trimming that clip; the later clips ripple to close the gap. */
export function trimToPlayhead(
  clips: EditClip[],
  id: string,
  edge: "in" | "out",
  playhead: number,
): EditClip[] {
  const index = clips.findIndex((c) => c.id === id);
  if (index < 0) return clips;
  const clip = clips[index],
    start = starts(clips)[index],
    end = start + clipDuration(clip);
  // The playhead has to sit inside the clip with room left for both sides.
  if (playhead <= start + MIN || playhead >= end - MIN) return clips;
  const source = Number((clip.in + (playhead - start) * clip.rate).toFixed(4));
  const trimmed = edge === "in" ? { ...clip, in: source } : { ...clip, out: source };
  return clips.map((c, i) => (i === index ? trimmed : c));
}
