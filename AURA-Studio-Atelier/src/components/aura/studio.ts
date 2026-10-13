import {
  isMode,
  isTitlePlace,
  isTitleStyle,
  THEMES,
  type ModeId,
  type TitlePlace,
  type TitleStyle,
} from "./palette.ts";
import { restoreMusic, type MusicOptions } from "./music.ts";
import { restoreCoverOptions, type CoverOptions } from "./cover.ts";
import { restoreCaptionOptions, type CaptionOptions } from "./captions.ts";
import type { VisualOptions } from "./visuals";
import type { Finish } from "./render";

export const VIDEO_FORMATS = [
  { id: "landscape", label: "Yatay", ratio: "16:9", width: 16, height: 9 },
  { id: "portrait", label: "Dikey", ratio: "9:16", width: 9, height: 16 },
  { id: "square", label: "Kare", ratio: "1:1", width: 1, height: 1 },
  { id: "feed", label: "Gönderi", ratio: "4:5", width: 4, height: 5 },
] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number]["id"];
export type Resolution = "720" | "1080";
export function videoSize(format: VideoFormat, resolution: Resolution) {
  const short = resolution === "1080" ? 1080 : 720;
  if (format === "landscape") return { width: (short * 16) / 9, height: short };
  if (format === "portrait") return { width: short, height: (short * 16) / 9 };
  if (format === "feed") return { width: short, height: (short * 5) / 4 };
  return { width: short, height: short };
}
export type StudioSnapshot = {
  version: 1;
  title: string;
  mode: ModeId;
  theme: string;
  sensitivity: number;
  titlePlace: TitlePlace;
  titleStyle: TitleStyle;
  finish: Finish;
  effects: VisualOptions;
  music: MusicOptions;
  cover: CoverOptions;
  captions: CaptionOptions;
  format: VideoFormat;
  resolution: Resolution;
};
export type SavedLook = { id: string; name: string; savedAt: string; settings: StudioSnapshot };
export function parseSnapshot(raw: string): StudioSnapshot {
  if (raw.length > 100_000) throw new Error("Ayar dosyası çok büyük.");
  let v;
  try {
    v = JSON.parse(raw);
  } catch {
    throw new Error("Geçerli bir AURA ayar dosyası seçin.");
  }
  if (v?.version !== 1 || !isMode(v.mode) || !THEMES.some((t) => t.id === v.theme))
    throw new Error("Bu dosya desteklenen bir AURA ayar yedeği değil.");
  const bounded = (value: unknown, min: number, max: number, fallback: number) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.max(min, Math.min(max, value))
      : fallback;
  return {
    version: 1,
    title: typeof v.title === "string" ? v.title.slice(0, 64) : "",
    mode: v.mode,
    theme: v.theme,
    sensitivity: bounded(v.sensitivity, 0.4, 3, 1.35),
    titlePlace: isTitlePlace(v.titlePlace) ? v.titlePlace : "center",
    titleStyle: isTitleStyle(v.titleStyle) ? v.titleStyle : "serif",
    finish: ["studio", "cinema", "vivid"].includes(v.finish) ? v.finish : "cinema",
    effects: {
      particles: v.effects?.particles !== false,
      speed: bounded(v.effects?.speed, 0.25, 2, 1),
      beatPulse: v.effects?.beatPulse !== false,
      autoScene: v.effects?.autoScene === true,
    },
    music: restoreMusic(JSON.stringify(v.music)),
    cover: restoreCoverOptions(JSON.stringify(v.cover)),
    captions: restoreCaptionOptions(JSON.stringify(v.captions)),
    format: VIDEO_FORMATS.some((f) => f.id === v.format) ? v.format : "landscape",
    resolution: v.resolution === "1080" ? "1080" : "720",
  };
}
export function restoreLooks(raw: string | null): SavedLook[] {
  try {
    const items = JSON.parse(raw ?? "[]");
    if (!Array.isArray(items)) return [];
    return items.slice(0, 8).flatMap((item) => {
      try {
        if (typeof item.id !== "string" || typeof item.name !== "string") return [];
        return [
          {
            id: item.id.slice(0, 80),
            name: item.name.slice(0, 40),
            savedAt: String(item.savedAt ?? ""),
            settings: parseSnapshot(JSON.stringify(item.settings)),
          },
        ];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
