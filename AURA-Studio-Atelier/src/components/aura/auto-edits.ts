// One-tap professional edits. Each recipe reads the song (loudness `peaks`
// spread over `duration` seconds, and the beat grid in source seconds) and
// builds a finished short edit: which part of the song, where the cuts fall,
// the hit on each cut and how it opens and ends. The result replaces the
// main clips as one undo step.
import { createId } from "./id.ts";
import { clipDuration, type EditClip } from "./editor.ts";
import type { SceneTransition } from "./scene-transitions.ts";
import { motionDefaults, type VideoMotionId } from "./video-motion.ts";

export const AUTO_EDITS = [
  {
    id: "hook",
    name: "Kancalı Reel",
    length: 15,
    description: "En güçlü an başta, sonra yükselişten ritimle akış",
  },
  {
    id: "drop",
    name: "Drop Anı",
    length: 15,
    description: "Sakin yükseliş, ışıkla patlama, sonra her iki vuruşta kesim",
  },
  {
    id: "teaser",
    name: "Hızlı Tanıtım",
    length: 10,
    description: "Şarkının en güçlü beş anı, ışık çakmalarıyla",
  },
  {
    id: "rhythm",
    name: "Ritim Montajı",
    length: 30,
    description: "Her iki vuruşta kesim, her kesimde değişen hareket",
  },
  {
    id: "trailer",
    name: "Sinematik Fragman",
    length: 30,
    description: "Uzun kesimler, kararan geçişler ve güçlü bir final",
  },
  {
    id: "loop",
    name: "Kusursuz Döngü",
    length: 16,
    description: "Tam 8 ölçü; başa sarınca ritim kesintisiz devam eder",
  },
] as const;
export type AutoEditId = (typeof AUTO_EDITS)[number]["id"];
export type AutoEdit = {
  clips: EditClip[];
  /** Seconds on the timeline. */
  length: number;
  /** Where the edit starts in the song, in seconds. */
  from: number;
};

const LIMIT = 60;
const round = (n: number) => Number(n.toFixed(3));

/** Mean loudness (squared) over [a, b] seconds of the source. */
function energy(peaks: number[], duration: number) {
  const bar = duration / peaks.length,
    sums = new Float64Array(peaks.length + 1);
  for (let i = 0; i < peaks.length; i++) sums[i + 1] = sums[i] + peaks[i] * peaks[i];
  return (a: number, b: number) => {
    const i = Math.max(0, Math.min(peaks.length, Math.floor(a / bar))),
      j = Math.max(i + 1, Math.min(peaks.length, Math.ceil(b / bar)));
    return (sums[j] - sums[i]) / (j - i);
  };
}

/** The song's beats, or a steady half-second grid when none were found. */
function grid(beats: number[], duration: number): number[] {
  const usable = beats.filter((b) => b >= 0 && b < duration);
  if (usable.length >= 8) return usable;
  return Array.from({ length: Math.floor(duration / 0.5) }, (_, i) => i * 0.5);
}
function period(beats: number[]) {
  const gaps = beats
    .slice(1)
    .map((b, i) => b - beats[i])
    .sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] || 0.5;
}
const nearest = (t: number, beats: number[]) =>
  beats.reduce((best, b) => (Math.abs(b - t) < Math.abs(best - t) ? b : best), beats[0]);

/** The beat where the music jumps up the most: the drop. */
export function findDrop(peaks: number[], duration: number, beats: number[]): number | null {
  if (!peaks.length || duration < 10) return null;
  const e = energy(peaks, duration),
    span = Math.min(4, duration / 6);
  let best: number | null = null,
    score = 0;
  for (const b of grid(beats, duration)) {
    if (b < span || b > duration - span) continue;
    const after = e(b, b + span),
      before = e(b - span, b);
    // A loud section that rises from a quieter one, not just a loud one.
    const rise = (after - before) * Math.sqrt(after);
    if (rise > score) {
      score = rise;
      best = b;
    }
  }
  return best;
}

/** Start (on a beat) of the loudest `span` seconds, or 0 when the song is short. */
function loudest(peaks: number[], duration: number, span: number, beats: number[]) {
  if (span >= duration) return 0;
  const e = energy(peaks, duration);
  let best = 0,
    score = -1;
  for (const b of grid(beats, duration)) {
    if (b + span > duration) break;
    const value = e(b, b + span);
    if (value > score + 1e-9) {
      score = value;
      best = b;
    }
  }
  return best;
}

type Look = {
  transition?: SceneTransition["id"];
  motion?: VideoMotionId;
  /** Seconds the motion takes. */
  hit?: number;
};
function piece(base: EditClip, from: number, to: number, look: Look = {}): EditClip {
  const clip: EditClip = {
    ...base,
    id: createId(),
    in: round(from),
    out: round(to),
    rate: 1,
    fadeIn: 0,
    fadeOut: 0,
    transition: look.transition ? { id: look.transition, duration: 0.3 } : undefined,
    motion: undefined,
  };
  if (look.motion) {
    const motion = motionDefaults();
    motion.in = { id: look.motion, duration: look.hit ?? 0.3 };
    clip.motion = motion;
  }
  return clip;
}

/** Cuts [from, to] on every `every`-th beat; `look(i)` styles piece i > 0. */
function cutOnBeats(
  base: EditClip,
  from: number,
  to: number,
  beats: number[],
  every: number,
  look: (i: number) => Look,
  first: Look = {},
): EditClip[] {
  const inside = beats.filter((b) => b > from + 0.2 && b < to - 0.2);
  let step = every;
  // Keep within the project's clip limit on fast songs.
  while (inside.length / step + 1 > LIMIT) step *= 2;
  const cuts = inside.filter((_, i) => (i + 1) % step === 0);
  const edges = [from, ...cuts, to];
  return edges
    .slice(1)
    .map((end, i) => piece(base, edges[i], end, i === 0 ? first : look(i)))
    .filter((c) => c.out - c.in >= 0.15);
}
function finish(clips: EditClip[], fadeIn: number, fadeOut: number): EditClip[] {
  if (!clips.length) return clips;
  const out = clips.map((c) => ({ ...c }));
  out[0].fadeIn = round(Math.min(fadeIn, clipDuration(out[0]) / 3));
  const last = out[out.length - 1];
  last.fadeOut = round(Math.min(fadeOut, clipDuration(last) / 2));
  return out;
}
const total = (clips: EditClip[]) => clips.reduce((n, c) => n + clipDuration(c), 0);

const PUNCHES: VideoMotionId[] = ["zoom-in", "impact", "slide-left", "zoom-in", "slide-right"];

/** Builds the recipe `id` on `base` (the first clip carries volume etc.). */
export function autoEdit(
  id: AutoEditId,
  base: EditClip,
  duration: number,
  peaks: number[],
  beats: number[],
): AutoEdit | null {
  if (!peaks.length || duration < 4) return null;
  const recipe = AUTO_EDITS.find((r) => r.id === id)!;
  const b = grid(beats, duration),
    beat = period(b),
    target = Math.min(recipe.length, duration),
    drop = findDrop(peaks, duration, beats) ?? loudest(peaks, duration, target, beats) + beat * 8;
  const window = (start: number) => {
    const from = Math.max(0, Math.min(duration - target, start));
    return [from, Math.min(duration, from + target)] as const;
  };
  let clips: EditClip[] = [];
  if (id === "hook") {
    // Two bars of the drop up front, then the build-up that leads to it.
    const teaser = Math.min(beat * 8, 4, target / 3),
      tFrom = Math.min(drop, duration - teaser),
      rest = target - teaser,
      [from, to] = window(nearest(Math.max(0, drop - rest * 0.45), b));
    const main = cutOnBeats(
      base,
      from,
      Math.min(to - teaser, duration),
      b,
      2,
      (i) => ({ motion: PUNCHES[i % PUNCHES.length], hit: 0.25 }),
      { transition: "flash" },
    );
    clips = [piece(base, tFrom, tFrom + teaser, { motion: "impact", hit: 0.35 }), ...main];
    clips = finish(clips, 0, 1.2);
  } else if (id === "drop") {
    const [from, to] = window(nearest(drop - target * 0.4, b));
    const hit = Math.max(from + 0.5, Math.min(to - 0.5, drop));
    const build = cutOnBeats(base, from, hit, b, 8, () => ({ transition: "dissolve" }));
    const blast = cutOnBeats(
      base,
      hit,
      to,
      b,
      2,
      (i) => ({ motion: i % 2 ? "zoom-in" : "shake", hit: 0.25 }),
      { transition: "flash", motion: "impact", hit: 0.45 },
    );
    clips = finish([...build, ...blast], 1, 1.2);
  } else if (id === "rhythm") {
    const [from, to] = window(loudest(peaks, duration, target, beats));
    clips = finish(
      cutOnBeats(base, from, to, b, 2, (i) => ({
        motion: PUNCHES[i % PUNCHES.length],
        hit: 0.25,
      })),
      0.3,
      1.5,
    );
  } else if (id === "teaser") {
    // The strongest separate moments of the song, four beats each, in order.
    const e = energy(peaks, duration),
      slice = Math.max(1.2, Math.min(2.5, beat * 4)),
      count = Math.max(2, Math.min(5, Math.floor(target / slice))),
      // Separate moments, but strength first: a long chorus may give several.
      gap = Math.max(slice * 1.5, duration / 20);
    const ranked = b
      .filter((t) => t + slice <= duration)
      .map((t) => ({ t, score: e(t, t + slice) }))
      .sort((x, y) => y.score - x.score);
    const chosen: number[] = [];
    for (const { t } of ranked) {
      if (chosen.length >= count) break;
      if (chosen.every((c) => Math.abs(c - t) >= gap)) chosen.push(t);
    }
    chosen.sort((x, y) => x - y);
    clips = finish(
      chosen.map((t, i) =>
        piece(
          base,
          t,
          t + slice,
          i ? { transition: "flash", motion: i % 2 ? "zoom-in" : "impact", hit: 0.3 } : {},
        ),
      ),
      0.3,
      0.8,
    );
  } else if (id === "trailer") {
    const [from, to] = window(loudest(peaks, duration, target, beats) - beat * 8);
    clips = cutOnBeats(
      base,
      from,
      to,
      b,
      8,
      (i) => ({ transition: i % 2 ? "fade-black" : "dissolve", motion: "zoom-out", hit: 1.2 }),
      { motion: "zoom-out", hit: 1.6 },
    );
    // The final shot is long enough to fade out: a short leftover joins it.
    if (clips.length > 2 && clipDuration(clips[clips.length - 1]) < beat * 6) {
      const tail = clips.pop()!;
      clips[clips.length - 1] = { ...clips[clips.length - 1], out: tail.out };
    }
    if (clips.length > 1) {
      const last = clips[clips.length - 1];
      clips[clips.length - 1] = { ...last, transition: { id: "flash", duration: 0.35 } };
    }
    clips = finish(clips, 1.5, 2.5);
  } else {
    // Exactly eight bars that start on a downbeat; no fades, so a replay
    // continues in rhythm.
    const bars = Math.max(4, Math.min(8, Math.floor(duration / (beat * 4)))),
      span = beat * 4 * bars,
      e = energy(peaks, duration);
    let from = 0,
      score = -1;
    b.forEach((t, i) => {
      if (i % 4 || t + span > duration) return;
      const value = e(t, t + span);
      if (value > score) {
        score = value;
        from = t;
      }
    });
    clips = cutOnBeats(base, from, Math.min(duration, from + span), b, 4, (i) => ({
      motion: i % 2 ? "zoom-in" : "impact",
      hit: 0.25,
    }));
  }
  if (!clips.length) return null;
  return { clips, length: total(clips), from: clips[0].in };
}
