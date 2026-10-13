export type RGB = readonly [number, number, number];

export type Theme = {
  id: string;
  name: string;
  bg: string;
  low: RGB;
  mid: RGB;
  high: RGB;
  glow: string;
};

export const THEMES: readonly Theme[] = [
  {
    id: "champagne",
    name: "Şampanya",
    bg: "#100d09",
    low: [121, 82, 38],
    mid: [222, 183, 119],
    high: [255, 242, 213],
    glow: "#ddb77b",
  },
  {
    id: "platinum",
    name: "Platin",
    bg: "#090e14",
    low: [74, 99, 128],
    mid: [166, 194, 211],
    high: [247, 251, 255],
    glow: "#b2ccdd",
  },
  {
    id: "rose-gold",
    name: "Bakır Gül",
    bg: "#150c0d",
    low: [133, 69, 62],
    mid: [225, 157, 137],
    high: [255, 234, 218],
    glow: "#e3a78f",
  },
  {
    id: "kor",
    name: "Kor",
    bg: "#100804",
    low: [255, 59, 31],
    mid: [255, 154, 46],
    high: [255, 231, 194],
    glow: "#ff6a2a",
  },
  {
    id: "buz",
    name: "Buz",
    bg: "#041018",
    low: [20, 107, 255],
    mid: [58, 215, 255],
    high: [231, 251, 255],
    glow: "#49d4ff",
  },
  {
    id: "yesim",
    name: "Yeşim",
    bg: "#04140e",
    low: [13, 143, 85],
    mid: [61, 255, 154],
    high: [231, 255, 232],
    glow: "#2ee59a",
  },
  {
    id: "gul",
    name: "Gül",
    bg: "#14060c",
    low: [225, 29, 72],
    mid: [251, 113, 133],
    high: [255, 228, 234],
    glow: "#fb4d78",
  },
  {
    id: "altin",
    name: "Altın",
    bg: "#100e08",
    low: [197, 138, 26],
    mid: [240, 193, 75],
    high: [255, 246, 216],
    glow: "#e8b84a",
  },
] as const;

export const PREMIUM_SPECTRA = [
  "eclipse",
  "valley",
  "liquid-metal",
  "phase-flower",
  "deco",
  "glass-towers",
] as const;
export const isPremiumSpectrum = (id: string) => PREMIUM_SPECTRA.some((mode) => mode === id);

export const MODES = [
  { id: "eclipse", label: "Tutulma", kind: "spectrum" },
  { id: "valley", label: "Frekans Vadisi", kind: "spectrum" },
  { id: "liquid-metal", label: "Sıvı Metal", kind: "spectrum" },
  { id: "phase-flower", label: "Faz Çiçeği", kind: "spectrum" },
  { id: "deco", label: "Art Deco", kind: "spectrum" },
  { id: "glass-towers", label: "Cam Kuleler", kind: "spectrum" },
  { id: "vinyl", label: "Altın Plak", kind: "spectrum" },
  { id: "jewels", label: "Mücevher", kind: "spectrum" },
  { id: "ribbon", label: "Saten Dalga", kind: "spectrum" },
  { id: "monolith", label: "Platin Bloklar", kind: "spectrum" },
  { id: "velvet", label: "Kadife Işık", kind: "scene" },
  { id: "chandelier", label: "Kristal Salon", kind: "scene" },
  { id: "pearls", label: "İnci Bulutu", kind: "scene" },
  { id: "cathedral", label: "Işık Katedrali", kind: "scene" },
  { id: "prism", label: "Prizma", kind: "spectrum" },
  { id: "spectrogram", label: "Spektrogram", kind: "spectrum" },
  { id: "constellation", label: "Takımyıldız", kind: "scene" },
  { id: "helix", label: "DNA", kind: "scene" },
  { id: "bars", label: "Çubuklar", kind: "spectrum" },
  { id: "needles", label: "İğne", kind: "spectrum" },
  { id: "silk", label: "İpek", kind: "spectrum" },
  { id: "mirror", label: "Ayna", kind: "spectrum" },
  { id: "ring", label: "Halka", kind: "spectrum" },
  { id: "crown", label: "Taç", kind: "spectrum" },
  { id: "halo", label: "Hale", kind: "spectrum" },
  { id: "orbit", label: "Yörünge", kind: "spectrum" },
  { id: "tunnel", label: "Tünel", kind: "spectrum" },
  { id: "flow", label: "Akış", kind: "scene" },
  { id: "lattice", label: "Dalga Ağı", kind: "scene" },
  { id: "aurora", label: "Kutup", kind: "scene" },
  { id: "orbs", label: "Damla", kind: "scene" },
  { id: "horizon", label: "Ufuk", kind: "scene" },
] as const;

export type ModeId = (typeof MODES)[number]["id"];
export const LUXURY_MODES: readonly ModeId[] = [
  ...PREMIUM_SPECTRA,
  "vinyl",
  "jewels",
  "ribbon",
  "monolith",
  "velvet",
  "chandelier",
  "pearls",
  "cathedral",
];
export const isLuxuryMode = (id: string) => LUXURY_MODES.includes(id as ModeId);

export const TITLE_PLACES = [
  { id: "top", label: "Üst" },
  { id: "center", label: "Orta" },
  { id: "bottom", label: "Alt" },
] as const;

export const TITLE_STYLES = [
  { id: "serif", label: "Serif" },
  { id: "wide", label: "Geniş" },
] as const;

export type TitlePlace = (typeof TITLE_PLACES)[number]["id"];
export type TitleStyle = (typeof TITLE_STYLES)[number]["id"];

export function themeById(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function isMode(id: string): id is ModeId {
  return MODES.some((mode) => mode.id === id);
}

export function isTitlePlace(id: string): id is TitlePlace {
  return TITLE_PLACES.some((place) => place.id === id);
}

export function isTitleStyle(id: string): id is TitleStyle {
  return TITLE_STYLES.some((style) => style.id === id);
}

export function rgba(rgb: RGB, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  const k = Math.min(1, Math.max(0, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export function colorAt(theme: Theme, t: number): RGB {
  if (t < 0.5) return mix(theme.low, theme.mid, t * 2);
  return mix(theme.mid, theme.high, (t - 0.5) * 2);
}
