// Ready-made video templates: one tap sets the size, scene, colours, captions,
// filter and, when the music allows it, the edit itself.
import { DEFAULT_ADJUST, clipDuration, type Adjustment, type EditClip } from "./editor.ts";
import type { ModeId, TitlePlace, TitleStyle } from "./palette.ts";
import type { Finish } from "./render.ts";
import type { VideoFormat } from "./studio.ts";
import type { VisualOptions } from "./visuals.ts";
import type { SceneTransition } from "./scene-transitions.ts";
import { loudestWindow, sectionClips, softEdges } from "./quick-edits.ts";
import { beatCutTimes, splitAtTimes } from "./timeline.ts";

export type VideoTemplate = {
  id: string;
  name: string;
  category: "Sosyal" | "Müzik videosu" | "Sinematik" | "Sade";
  description: string;
  format: VideoFormat;
  mode: ModeId;
  theme: string;
  finish: Finish;
  sensitivity: number;
  effects: VisualOptions;
  /** Id of a caption template. */
  caption: string;
  title: { place: TitlePlace; style: TitleStyle };
  /** Look of the picture; geometry (rotation, flip, zoom) is kept. */
  adjust: Partial<Adjustment>;
  edit: {
    /** Keep the strongest stretch of this many seconds. */
    section?: 15 | 30 | 60;
    /** Cut every n beats … */
    every?: 1 | 2 | 4 | 8;
    /** … with this transition on the new cuts. */
    transition?: SceneTransition["id"];
    /** Fade in at the start, out at the end. */
    soft?: boolean;
  };
};

const fx = (speed: number, particles: boolean, beatPulse: boolean): VisualOptions => ({
  speed,
  particles,
  beatPulse,
  autoScene: false,
});

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: "reels-energy",
    name: "Reels Enerji",
    category: "Sosyal",
    description: "En güçlü 30 sn, her ölçüde ışık çakması",
    format: "portrait",
    mode: "brilliant",
    theme: "kor",
    finish: "vivid",
    sensitivity: 1.5,
    effects: fx(1.2, true, true),
    caption: "viral",
    title: { place: "top", style: "wide" },
    adjust: { filter: "vivid", effect: "prism", effectAmount: 0.35, contrast: 1.08 },
    edit: { section: 30, every: 4, transition: "flash" },
  },
  {
    id: "tiktok-fast",
    name: "TikTok Hızlı",
    category: "Sosyal",
    description: "15 sn, iki vuruşta bir zoom kesim",
    format: "portrait",
    mode: "bars",
    theme: "gul",
    finish: "vivid",
    sensitivity: 1.6,
    effects: fx(1.4, true, true),
    caption: "genre-rap",
    title: { place: "top", style: "wide" },
    adjust: { effect: "scanlines", effectAmount: 0.3, contrast: 1.1 },
    edit: { section: 15, every: 2, transition: "zoom" },
  },
  {
    id: "story-calm",
    name: "Story Sakin",
    category: "Sosyal",
    description: "15 sn, rüya ışığı ve yumuşak geçiş",
    format: "portrait",
    mode: "aurora",
    theme: "buz",
    finish: "studio",
    sensitivity: 1.1,
    effects: fx(0.5, true, false),
    caption: "story",
    title: { place: "bottom", style: "serif" },
    adjust: { effect: "dream", effectAmount: 0.45, warmth: -0.1 },
    edit: { section: 15, soft: true },
  },
  {
    id: "shorts-neon",
    name: "Shorts Neon",
    category: "Sosyal",
    description: "30 sn, neon tünel ve bulanık kesimler",
    format: "portrait",
    mode: "tunnel",
    theme: "platinum",
    finish: "vivid",
    sensitivity: 1.45,
    effects: fx(1.1, true, true),
    caption: "genre-edm",
    title: { place: "top", style: "wide" },
    adjust: { effect: "prism", effectAmount: 0.5, saturation: 1.2 },
    edit: { section: 30, every: 4, transition: "blur" },
  },
  {
    id: "lyric-video",
    name: "Sözlü Klip",
    category: "Müzik videosu",
    description: "Tüm şarkı, okunaklı sözler, ipek dalga",
    format: "landscape",
    mode: "silk",
    theme: "champagne",
    finish: "cinema",
    sensitivity: 1.25,
    effects: fx(0.7, false, false),
    caption: "lyric",
    title: { place: "center", style: "serif" },
    adjust: { vignette: 0.25 },
    edit: { soft: true },
  },
  {
    id: "concert-lights",
    name: "Konser Işıkları",
    category: "Müzik videosu",
    description: "Avize ışıkları, iki ölçüde bir beyaz parlama",
    format: "landscape",
    mode: "chandelier",
    theme: "altin",
    finish: "vivid",
    sensitivity: 1.4,
    effects: fx(1, true, true),
    caption: "concert",
    title: { place: "center", style: "wide" },
    adjust: { effect: "leak", effectAmount: 0.5, contrast: 1.05 },
    edit: { every: 8, transition: "fade-white", soft: true },
  },
  {
    id: "lofi-room",
    name: "Lo-fi Oda",
    category: "Müzik videosu",
    description: "Plak, film dokusu ve sıcak tonlar",
    format: "landscape",
    mode: "vinyl",
    theme: "yesim",
    finish: "studio",
    sensitivity: 1.15,
    effects: fx(0.5, false, false),
    caption: "genre-lofi",
    title: { place: "bottom", style: "serif" },
    adjust: { filter: "vintage", effect: "grain", effectAmount: 0.5, warmth: 0.15 },
    edit: { soft: true },
  },
  {
    id: "rock-stage",
    name: "Rock Sahnesi",
    category: "Müzik videosu",
    description: "Sert kontrast, iki ölçüde bir çakma",
    format: "landscape",
    mode: "monolith",
    theme: "kor",
    finish: "vivid",
    sensitivity: 1.6,
    effects: fx(1.2, true, true),
    caption: "genre-rock",
    title: { place: "center", style: "wide" },
    adjust: { contrast: 1.2, effect: "scanlines", effectAmount: 0.25, vignette: 0.35 },
    edit: { every: 8, transition: "flash" },
  },
  {
    id: "cinema",
    name: "Sinema",
    category: "Sinematik",
    description: "Film çerçevesi, koyu kenarlar, tutulma",
    format: "landscape",
    mode: "eclipse",
    theme: "platinum",
    finish: "cinema",
    sensitivity: 1.2,
    effects: fx(0.6, false, false),
    caption: "film",
    title: { place: "center", style: "serif" },
    adjust: { effect: "frame", effectAmount: 0.6, vignette: 0.4, contrast: 1.05, saturation: 0.9 },
    edit: { soft: true },
  },
  {
    id: "golden-hour",
    name: "Altın Saat",
    category: "Sinematik",
    description: "Sıcak ışık sızıntısı ve altın tonlar",
    format: "landscape",
    mode: "golden",
    theme: "altin",
    finish: "cinema",
    sensitivity: 1.2,
    effects: fx(0.7, true, false),
    caption: "golden-hour",
    title: { place: "bottom", style: "serif" },
    adjust: { effect: "leak", effectAmount: 0.4, warmth: 0.35 },
    edit: { soft: true },
  },
  {
    id: "noir",
    name: "Kara Film",
    category: "Sinematik",
    description: "Siyah beyaz, film tanesi, org boruları",
    format: "landscape",
    mode: "organ",
    theme: "platinum",
    finish: "cinema",
    sensitivity: 1.2,
    effects: fx(0.6, false, false),
    caption: "noir",
    title: { place: "center", style: "serif" },
    adjust: { filter: "mono", effect: "grain", effectAmount: 0.6, contrast: 1.15, vignette: 0.5 },
    edit: { soft: true },
  },
  {
    id: "feed-clean",
    name: "Sade Gönderi",
    category: "Sade",
    description: "4:5, en güçlü 60 sn, temiz görünüm",
    format: "feed",
    mode: "ring",
    theme: "champagne",
    finish: "studio",
    sensitivity: 1.3,
    effects: fx(0.8, false, false),
    caption: "clean",
    title: { place: "bottom", style: "serif" },
    adjust: {},
    edit: { section: 60, soft: true },
  },
];

/** The template's picture look over the current geometry. */
export function templateAdjust(template: VideoTemplate, current: Adjustment): Adjustment {
  return {
    ...DEFAULT_ADJUST,
    ...template.adjust,
    rotation: current.rotation,
    flipX: current.flipX,
    flipY: current.flipY,
    zoom: current.zoom,
  };
}

/** The template's edit applied to `clips`. `peaks` and `beats` come from the
 *  source analysis (source seconds); steps that need them are skipped when
 *  they are missing, and a section longer than the song keeps the whole song. */
export function templateClips(
  template: VideoTemplate,
  clips: EditClip[],
  duration: number,
  peaks: number[],
  beats: number[],
): EditClip[] {
  let next = clips;
  const { section, every, transition, soft } = template.edit;
  if (section && peaks.length) {
    const start = loudestWindow(peaks, duration, section, beats);
    if (start !== null) next = sectionClips(next, start, section);
  }
  if (every && beats.length) {
    const total = next.reduce((n, c) => n + clipDuration(c), 0);
    const times = beatCutTimes(beats, next, every, 0, total);
    next = splitAtTimes(
      next,
      times,
      60,
      transition ? { id: transition, duration: 0.3 } : undefined,
    ).clips;
  }
  if (soft) next = softEdges(next);
  return next;
}
