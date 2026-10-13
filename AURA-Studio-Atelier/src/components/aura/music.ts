export type MusicOptions = {
  eq: boolean;
  bass: number;
  mid: number;
  treble: number;
  volume: number;
  compressor: boolean;
  echo: number;
  space: number;
};

export const DEFAULT_MUSIC: MusicOptions = {
  eq: false,
  bass: 0,
  mid: 0,
  treble: 0,
  volume: 1,
  compressor: false,
  echo: 0,
  space: 0,
};

export function restoreMusic(raw: string | null): MusicOptions {
  try {
    const saved = JSON.parse(raw ?? "null");
    const gain = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(-6, Math.min(6, v)) : 0;
    const effect = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(0.4, v)) : 0;
    return {
      eq: saved?.eq === true,
      compressor: saved?.compressor === true,
      bass: gain(saved?.bass),
      mid: gain(saved?.mid),
      treble: gain(saved?.treble),
      echo: effect(saved?.echo),
      space: effect(saved?.space),
      volume:
        typeof saved?.volume === "number" && Number.isFinite(saved.volume)
          ? Math.max(0, Math.min(1, saved.volume))
          : 1,
    };
  } catch {
    return { ...DEFAULT_MUSIC };
  }
}

export const MUSIC_PRESETS = [
  { id: "neutral", label: "Dengeli", bass: 0, mid: 0, treble: 0 },
  { id: "bass", label: "Bas", bass: 4, mid: -1, treble: 1 },
  { id: "vocal", label: "Vokal", bass: -2, mid: 3, treble: 1 },
  { id: "warm", label: "Sıcak", bass: 2, mid: 1, treble: -2 },
] as const;
