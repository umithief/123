import { createId } from "./id.ts";
import { CAPTION_FONTS, type CaptionFont } from "./captions.ts";
import { parseVideoMotion, type VideoMotion } from "./video-motion.ts";
import { parseSceneTransition, type SceneTransition } from "./scene-transitions.ts";
export const LAYER_ANIMATIONS = [
  { id: "none", label: "Sabit" },
  { id: "fade", label: "Yumuşak giriş" },
  { id: "pop", label: "Pop" },
  { id: "slide", label: "Yüksel" },
  { id: "typewriter", label: "Daktilo" },
  { id: "elastic", label: "Elastik" },
  { id: "blur", label: "Netleş" },
  { id: "swing", label: "Salınım" },
  { id: "wipe", label: "Perde" },
  { id: "float", label: "Süzül" },
  { id: "zoom-out", label: "Yakın plan" },
] as const;
export const VIDEO_EFFECTS = [
  { id: "none", label: "Kapalı", description: "Orijinal görüntü" },
  { id: "grain", label: "Film dokusu", description: "İnce ve hareketli film tanesi" },
  { id: "leak", label: "Işık sızıntısı", description: "Kenarlardan sıcak ışık" },
  { id: "scanlines", label: "Analog ekran", description: "Retro tarama çizgileri" },
  { id: "frame", label: "Film çerçevesi", description: "İnce sinema çerçevesi" },
  { id: "dream", label: "Rüya parıltısı", description: "Yumuşak ışık ve atmosfer" },
  { id: "prism", label: "Prizma ışığı", description: "Renkli ve hareketli yansımalar" },
  // AURA Pro: lens, light and film looks built from the picture's own highlights.
  {
    id: "pro-anamorphic",
    label: "Anamorfik Işık",
    description: "Parlak noktalardan uzanan mavi sinema çizgileri",
  },
  {
    id: "pro-bloom",
    label: "Sinematik Parıltı",
    description: "Işıklar yumuşak ve sıcak bir parıltıyla taşar",
  },
  {
    id: "pro-halation",
    label: "Film Halasyonu",
    description: "Analog filmdeki kırmızı ışık halesi, ince tane ve vinyet",
  },
  {
    id: "pro-chroma",
    label: "Lens Kırılması",
    description: "Kenarlara doğru açılan gerçek renk sapması",
  },
  {
    id: "pro-rays",
    label: "Işık Hüzmeleri",
    description: "Parlak bölgelerden yayılan hacimli ışık huzmeleri",
  },
  {
    id: "pro-neon",
    label: "Neon Rüya",
    description: "Pembe ve camgöbeği iki tonlu neon görünüm, ışıltıyla",
  },
  {
    id: "pro-vhs",
    label: "VHS Kaset",
    description: "Renk kayması, takip parazitleri ve kayıt ekranı",
  },
  {
    id: "pro-scope",
    label: "Sinemaskop",
    description: "Sinema bantları (yatayda 2.39:1), camgöbeği gölgeler ve sıcak ışıklar",
  },
] as const;
export type EditClip = {
  transition?: SceneTransition;
  motion?: VideoMotion;
  id: string;
  in: number;
  out: number;
  rate: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
};
export type Adjustment = {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  blur: number;
  vignette: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  zoom: number;
  filter: "none" | "mono" | "sepia" | "vintage" | "cool" | "vivid";
  effect: (typeof VIDEO_EFFECTS)[number]["id"];
  effectAmount: number;
};
export type MediaClip = {
  motion?: VideoMotion;
  sourceVideo?: boolean;
  id: string;
  asset: string;
  name: string;
  kind: "image" | "video";
  start: number;
  end: number;
  offset: number;
  rate: number;
  fit: "cover" | "contain";
  transition: "none" | "fade" | "slide" | "zoom";
  transitionDuration: number;
  opacity: number;
  keyColor: string;
  keyTolerance: number;
  mask: "none" | "circle" | "rounded";
};
export type Keyframe = {
  time: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
};
export type Overlay = {
  id: string;
  kind: "text" | "image" | "heart" | "star" | "arrow" | "circle" | "rectangle";
  asset?: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color: string;
  background: boolean;
  animation: (typeof LAYER_ANIMATIONS)[number]["id"];
  font: CaptionFont;
  weight: 500 | 600 | 700;
  textEffect: "none" | "neon" | "extrude" | "gold";
  blend: "source-over" | "screen" | "multiply";
  keyframes: Keyframe[];
};
export type SoundLayer = {
  id: string;
  asset: string;
  name: string;
  start: number;
  end: number;
  offset: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
};
export type EditorProject = {
  version: 1;
  clips: EditClip[];
  media: MediaClip[];
  sounds: SoundLayer[];
  layers: Overlay[];
  adjust: Adjustment;
  showSpectrum: boolean;
};
export const DEFAULT_ADJUST: Adjustment = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  warmth: 0,
  blur: 0,
  vignette: 0,
  rotation: 0,
  flipX: false,
  flipY: false,
  zoom: 1,
  filter: "none",
  effect: "none",
  effectAmount: 0.5,
};
export const emptyProject = (): EditorProject => ({
  version: 1,
  clips: [],
  media: [],
  sounds: [],
  layers: [],
  adjust: { ...DEFAULT_ADJUST },
  showSpectrum: true,
});
export const makeClip = (duration: number): EditClip => ({
  id: createId(),
  in: 0,
  out: duration,
  rate: 1,
  volume: 1,
  fadeIn: 0,
  fadeOut: 0,
});
export const clipDuration = (clip: EditClip) => (clip.out - clip.in) / clip.rate;
export const projectDuration = (project: EditorProject) =>
  project.clips.reduce((sum, clip) => sum + clipDuration(clip), 0);
export function locateTime(clips: EditClip[], time: number) {
  let offset = 0;
  for (let index = 0; index < clips.length; index++) {
    const duration = clipDuration(clips[index]);
    if (time < offset + duration || index === clips.length - 1)
      return {
        index,
        clip: clips[index],
        offset,
        local: Math.max(0, Math.min(duration, time - offset)),
        source:
          clips[index].in + Math.max(0, Math.min(duration, time - offset)) * clips[index].rate,
      };
    offset += duration;
  }
  return null;
}
export function timelineTime(clips: EditClip[], index: number, source: number) {
  const clip = clips[index];
  return clip
    ? clips.slice(0, index).reduce((n, c) => n + clipDuration(c), 0) +
        Math.max(0, Math.min(clipDuration(clip), (source - clip.in) / clip.rate))
    : 0;
}
export function splitClip(clips: EditClip[], time: number): EditClip[] {
  const found = locateTime(clips, time);
  if (!found || found.local < 0.1 || clipDuration(found.clip) - found.local < 0.1) return clips;
  return clips.flatMap((clip, index) =>
    index === found.index
      ? [
          {
            ...clip,
            out: found.source,
            fadeOut: 0,
            ...(clip.motion
              ? { motion: { ...clip.motion, out: { ...clip.motion.out, id: "none" as const } } }
              : {}),
          },
          {
            ...clip,
            id: createId(),
            in: found.source,
            fadeIn: 0,
            transition: undefined,
            ...(clip.motion
              ? { motion: { ...clip.motion, in: { ...clip.motion.in, id: "none" as const } } }
              : {}),
          },
        ]
      : [clip],
  );
}
export function clipGain(clip: EditClip, source: number): number {
  const at = (source - clip.in) / clip.rate,
    total = clipDuration(clip);
  return (
    clip.volume *
    Math.max(
      0,
      Math.min(
        1,
        clip.fadeIn > 0 ? at / clip.fadeIn : 1,
        clip.fadeOut > 0 ? (total - at) / clip.fadeOut : 1,
      ),
    )
  );
}
const isSorted = (frames: Keyframe[]) => {
  for (let i = 1; i < frames.length; i++) if (frames[i].time < frames[i - 1].time) return false;
  return true;
};
export function frameAt(layer: Overlay, time: number): Keyframe {
  // Called for every layer on every painted frame: keyframes are normally
  // stored in order, so avoid copying and sorting them each time.
  const frames = isSorted(layer.keyframes)
    ? layer.keyframes
    : [...layer.keyframes].sort((a, b) => a.time - b.time);
  const base = {
    time,
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    opacity: layer.opacity,
    rotation: layer.rotation,
  };
  if (!frames.length) return base;
  if (time <= frames[0].time) return frames[0];
  if (time >= frames.at(-1)!.time) return frames.at(-1)!;
  const index = frames.findIndex((f) => f.time > time),
    a = frames[index - 1],
    b = frames[index];
  const p = (time - a.time) / (b.time - a.time);
  return {
    time,
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    scale: a.scale + (b.scale - a.scale) * p,
    opacity: a.opacity + (b.opacity - a.opacity) * p,
    rotation: a.rotation + (b.rotation - a.rotation) * p,
  };
}
const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
export function parseEditorProject(raw: string, duration: number): EditorProject {
  if (raw.length > 500000) throw new Error("Kurgu dosyası çok büyük.");
  const p = JSON.parse(raw);
  if (p?.version !== 1 || !Array.isArray(p.clips))
    throw new Error("Geçerli bir AURA kurgu dosyası seçin.");
  const result = emptyProject();
  const color = (v: unknown, fallback: string) =>
    typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
  result.clips = p.clips.slice(0, 60).flatMap((c: Record<string, unknown>) => {
    const start = clamp(c.in, 0, duration, 0),
      end = clamp(c.out, 0, duration, duration);
    return end - start >= 0.1
      ? [
          {
            id: createId(),
            in: start,
            out: end,
            rate: clamp(c.rate, 0.25, 4, 1),
            volume: clamp(c.volume, 0, 2, 1),
            fadeIn: clamp(c.fadeIn, 0, 10, 0),
            fadeOut: clamp(c.fadeOut, 0, 10, 0),
            motion: parseVideoMotion(c.motion),
            transition: parseSceneTransition(c.transition),
          },
        ]
      : [];
  });
  if (!result.clips.length) result.clips = [makeClip(duration)];
  const a = p.adjust ?? {};
  result.adjust = {
    brightness: clamp(a.brightness, 0.25, 2, 1),
    contrast: clamp(a.contrast, 0.25, 2, 1),
    saturation: clamp(a.saturation, 0, 2, 1),
    warmth: clamp(a.warmth, -1, 1, 0),
    blur: clamp(a.blur, 0, 8, 0),
    vignette: clamp(a.vignette, 0, 1, 0),
    rotation: clamp(a.rotation, -180, 180, 0),
    zoom: clamp(a.zoom, 0.5, 3, 1),
    flipX: a.flipX === true,
    flipY: a.flipY === true,
    filter: ["none", "mono", "sepia", "vintage", "cool", "vivid"].includes(a.filter)
      ? a.filter
      : "none",
    effect: VIDEO_EFFECTS.some((e) => e.id === a.effect) ? a.effect : "none",
    effectAmount: clamp(a.effectAmount, 0, 1, 0.5),
  };
  result.showSpectrum = p.showSpectrum !== false;
  result.media = (Array.isArray(p.media) ? p.media : [])
    .slice(0, 30)
    .map((c: Record<string, unknown>) => ({
      id: createId(),
      asset: String(c.asset ?? "").slice(0, 100),
      name: String(c.name ?? "Medya").slice(0, 100),
      kind: c.kind === "video" ? "video" : "image",
      sourceVideo: c.sourceVideo === true,
      start: clamp(c.start, 0, 3600, 0),
      end: clamp(c.end, 0.1, 3600, 5),
      offset: clamp(c.offset, 0, 3600, 0),
      rate: clamp(c.rate, 0.25, 4, 1),
      fit: c.fit === "contain" ? "contain" : "cover",
      transition: ["none", "fade", "slide", "zoom"].includes(String(c.transition))
        ? c.transition
        : "fade",
      transitionDuration: clamp(c.transitionDuration, 0.1, 3, 0.5),
      motion: parseVideoMotion(c.motion),
      opacity: clamp(c.opacity, 0, 1, 1),
      keyColor: color(c.keyColor, "#00ff00"),
      keyTolerance: clamp(c.keyTolerance, 0, 150, 0),
      mask: ["circle", "rounded"].includes(String(c.mask)) ? c.mask : "none",
    }));
  result.sounds = (Array.isArray(p.sounds) ? p.sounds : [])
    .slice(0, 20)
    .map((c: Record<string, unknown>) => ({
      id: createId(),
      asset: String(c.asset ?? "").slice(0, 100),
      name: String(c.name ?? "Ses").slice(0, 100),
      start: clamp(c.start, 0, 3600, 0),
      end: clamp(c.end, 0.1, 3600, 5),
      offset: clamp(c.offset, 0, 3600, 0),
      volume: clamp(c.volume, 0, 2, 1),
      fadeIn: clamp(c.fadeIn, 0, 10, 0),
      fadeOut: clamp(c.fadeOut, 0, 10, 0),
    }));
  result.layers = (Array.isArray(p.layers) ? p.layers : [])
    .slice(0, 50)
    .map((l: Record<string, unknown>) => ({
      id: createId(),
      kind: ["text", "image", "heart", "star", "arrow", "circle", "rectangle"].includes(
        String(l.kind),
      )
        ? l.kind
        : "text",
      asset: typeof l.asset === "string" ? l.asset.slice(0, 100) : undefined,
      text: String(l.text ?? "").slice(0, 300),
      start: clamp(l.start, 0, 3600, 0),
      end: clamp(l.end, 0.1, 3600, 5),
      x: clamp(l.x, 0, 1, 0.5),
      y: clamp(l.y, 0, 1, 0.5),
      scale: clamp(l.scale, 0.2, 4, 1),
      rotation: clamp(l.rotation, -180, 180, 0),
      opacity: clamp(l.opacity, 0, 1, 1),
      color: color(l.color, "#ffffff"),
      background: l.background === true,
      animation: LAYER_ANIMATIONS.some((a) => a.id === l.animation) ? l.animation : "none",
      font: Object.hasOwn(CAPTION_FONTS, String(l.font)) ? l.font : "sans",
      weight: [500, 600, 700].includes(Number(l.weight)) ? l.weight : 600,
      textEffect: ["neon", "extrude", "gold"].includes(String(l.textEffect))
        ? l.textEffect
        : "none",
      blend: ["screen", "multiply"].includes(String(l.blend)) ? l.blend : "source-over",
      keyframes: (Array.isArray(l.keyframes) ? l.keyframes : [])
        .slice(0, 50)
        .map((f: Record<string, unknown>) => ({
          time: clamp(f.time, 0, 3600, 0),
          x: clamp(f.x, 0, 1, 0.5),
          y: clamp(f.y, 0, 1, 0.5),
          scale: clamp(f.scale, 0.2, 4, 1),
          opacity: clamp(f.opacity, 0, 1, 1),
          rotation: clamp(f.rotation, -180, 180, 0),
        }))
        .sort((a: Keyframe, b: Keyframe) => a.time - b.time),
    }));
  return result;
}
