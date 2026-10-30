// Names for undo steps. The history keeps whole projects; comparing a step's
// before and after says what the step did ("Klip silindi", "Geçiş: 3D Küp").
// `text` is a fixed phrase and `detail` a preset's name: both are Turkish and
// translated where they are shown.
import { SCENE_TRANSITIONS } from "./scene-transitions.ts";
import { VIDEO_MOTIONS } from "./video-motion.ts";
import { VIDEO_EFFECTS, type EditorProject, type EditClip } from "./editor.ts";
import type { CaptionCue, CaptionPosition } from "./captions.ts";

export type StepName = { text: string; detail?: string };

const length = (clips: EditClip[]) => clips.reduce((n, c) => n + (c.out - c.in) / c.rate, 0);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const label = (list: readonly { id: string; label: string }[], id: string | undefined) =>
  list.find((item) => item.id === id)?.label;

function describeClips(before: EditClip[], after: EditClip[]): StepName | null {
  if (same(before, after)) return null;
  const a = length(before),
    b = length(after),
    sameClips = before.length === after.length && before.every((c, i) => c.id === after[i].id);
  if (sameClips) return describeClipChanges(before, after);
  if (after.length > before.length && Math.abs(a - b) < 0.02)
    return { text: after.length - before.length === 1 ? "Klip bölündü" : "Klipler bölündü" };
  if (after.length > before.length && b > a + 0.02) return { text: "Klip çoğaltıldı" };
  if (after.length < before.length && b < a - 0.02 && before.length - after.length === 1) {
    const kept = new Set(after.map((c) => c.id));
    if (before.filter((c) => !kept.has(c.id)).length === 1) return { text: "Klip silindi" };
  }
  if (b < a - 0.02)
    return { text: "Kurgu kısaldı", detail: `−${(a - b).toFixed(1).replace(".", ",")} sn` };
  if (b > a + 0.02 && after.length !== before.length) return { text: "Kurgu yeniden yapıldı" };
  return describeClipChanges(before, after);
}

/** The same clips, changed in place: what changed on them. */
function describeClipChanges(before: EditClip[], after: EditClip[]): StepName {
  const pairs = after.map((c) => [before.find((x) => x.id === c.id), c] as const);
  const changed = pairs.filter(([x, c]) => x && !same(x, c));
  if (changed.length === 0) return { text: "Klip sırası değişti" };
  const transitions = changed.filter(([x, c]) => !same(x!.transition, c.transition));
  if (transitions.length) {
    const ids = new Set(transitions.map(([, c]) => c.transition?.id ?? "none"));
    if (ids.size === 1 && [...ids][0] === "none")
      return { text: transitions.length > 1 ? "Tüm geçişler kaldırıldı" : "Geçiş kaldırıldı" };
    const id = transitions.at(-1)![1].transition?.id;
    return {
      text: transitions.length > 1 && ids.size === 1 ? "Geçiş tüm aralıklara" : "Geçiş",
      detail: label(SCENE_TRANSITIONS, id),
    };
  }
  const motions = changed.filter(([x, c]) => !same(x!.motion, c.motion));
  if (motions.length) {
    const [x, c] = motions.at(-1)!;
    const part = (["in", "out", "combo"] as const).find(
      (s) => x!.motion?.[s]?.id !== c.motion?.[s]?.id,
    );
    const id = part ? c.motion?.[part]?.id : undefined;
    return {
      text: motions.length > 1 ? "Animasyon tüm kliplere" : "Animasyon",
      detail: id && id !== "none" ? label(VIDEO_MOTIONS, id) : "Kaldırıldı",
    };
  }
  if (changed.some(([x, c]) => x!.rate !== c.rate))
    return { text: "Hız", detail: `${changed.at(-1)![1].rate}×` };
  if (changed.some(([x, c]) => x!.in !== c.in || x!.out !== c.out))
    return { text: "Klip kırpıldı" };
  if (changed.some(([x, c]) => x!.volume !== c.volume)) return { text: "Ses düzeyi" };
  if (changed.some(([x, c]) => x!.fadeIn !== c.fadeIn || x!.fadeOut !== c.fadeOut))
    return { text: "Sesin açılışı ve kapanışı" };
  return { text: "Klip düzenlendi" };
}

function describeLayers(before: EditorProject, after: EditorProject): StepName | null {
  const a = before.layers,
    b = after.layers;
  if (same(a, b)) return null;
  if (b.length > a.length) {
    const added = b.find((l) => !a.some((x) => x.id === l.id));
    return {
      text:
        added?.kind === "text"
          ? "Yazı eklendi"
          : added?.kind === "image"
            ? "Görsel eklendi"
            : "Şekil eklendi",
    };
  }
  if (b.length < a.length) return { text: "Katman silindi" };
  const pair = b
    .map((l) => [a.find((x) => x.id === l.id), l] as const)
    .find(([x, l]) => x && !same(x, l));
  if (!pair) return { text: "Katman sırası değişti" };
  const [x, l] = pair;
  if (x!.text !== l.text) return { text: "Yazı düzenlendi" };
  if (x!.scale !== l.scale || x!.rotation !== l.rotation)
    return { text: "Katman büyütüldü ya da döndürüldü" };
  if (x!.x !== l.x || x!.y !== l.y || !same(x!.keyframes, l.keyframes))
    return { text: "Katman taşındı" };
  if (x!.start !== l.start || x!.end !== l.end) return { text: "Katman zamanı" };
  return { text: "Katman düzenlendi" };
}

function describeList(
  before: unknown[],
  after: unknown[],
  added: string,
  removed: string,
  changed: string,
): StepName | null {
  if (same(before, after)) return null;
  return {
    text: after.length > before.length ? added : after.length < before.length ? removed : changed,
  };
}

/** What one project step did. */
export function describeEdit(before: EditorProject, after: EditorProject): StepName {
  return (
    describeClips(before.clips, after.clips) ??
    describeLayers(before, after) ??
    describeList(before.media, after.media, "Medya eklendi", "Medya silindi", "Medya düzenlendi") ??
    describeList(before.sounds, after.sounds, "Ses eklendi", "Ses silindi", "Ses düzenlendi") ??
    (before.adjust.effect !== after.adjust.effect
      ? { text: "Efekt", detail: label(VIDEO_EFFECTS, after.adjust.effect) }
      : before.adjust.filter !== after.adjust.filter
        ? { text: "Filtre değişti" }
        : !same(before.adjust, after.adjust)
          ? { text: "Renk ve kadraj" }
          : { text: "Düzenleme" })
  );
}

/** What one caption step did. */
export function describeCaptions(
  before: { cues: CaptionCue[]; pos: CaptionPosition | null },
  after: { cues: CaptionCue[]; pos: CaptionPosition | null },
): StepName {
  if (!same(before.pos, after.pos) && same(before.cues, after.cues))
    return { text: "Altyazı konumu değişti" };
  if (!before.cues.length && after.cues.length) return { text: "Altyazılar eklendi" };
  if (after.cues.length < before.cues.length)
    return { text: after.cues.length ? "Altyazı silindi" : "Altyazılar kaldırıldı" };
  if (after.cues.length > before.cues.length) return { text: "Altyazı eklendi" };
  const pair = after.cues
    .map((c, i) => [before.cues[i] as CaptionCue | undefined, c] as const)
    .find(([x, c]) => !same(x, c));
  if (pair) {
    const [x, c] = pair;
    if (x && x.text !== c.text) return { text: "Altyazı metni düzenlendi" };
    if (x && (x.start !== c.start || x.end !== c.end)) return { text: "Altyazı zamanı değişti" };
    if (x && !same(x.motion, c.motion)) return { text: "Altyazı animasyonu" };
  }
  return { text: "Altyazılar düzenlendi" };
}
