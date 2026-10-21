// Where the apps' own buttons and text cover a video. Rectangles are
// fractions of the frame (x, y, width, height), approximate and on the
// generous side for current phone layouts. The guide is drawn over the
// preview only; it never reaches the exported video.
export type Rect = { x: number; y: number; w: number; h: number };
export type SafeZone = Rect & { label: string };
export type GuideId = "off" | "tiktok" | "reels" | "shorts" | "margin";

const TOP = "Üst menü",
  ACTIONS = "Beğeni ve paylaş düğmeleri";
export const SAFE_GUIDES: Array<{
  id: Exclude<GuideId, "off">;
  name: string;
  /** Platform guides describe a 9:16 video. */
  vertical: boolean;
  zones: SafeZone[];
}> = [
  {
    id: "tiktok",
    name: "TikTok",
    vertical: true,
    zones: [
      { x: 0, y: 0, w: 1, h: 0.085, label: TOP },
      { x: 0.855, y: 0.38, w: 0.145, h: 0.46, label: ACTIONS },
      { x: 0, y: 0.8, w: 1, h: 0.2, label: "Açıklama ve müzik" },
    ],
  },
  {
    id: "reels",
    name: "Instagram Reels",
    vertical: true,
    zones: [
      { x: 0, y: 0, w: 1, h: 0.08, label: TOP },
      { x: 0.86, y: 0.5, w: 0.14, h: 0.36, label: ACTIONS },
      { x: 0, y: 0.82, w: 1, h: 0.18, label: "Açıklama ve hesap" },
    ],
  },
  {
    id: "shorts",
    name: "YouTube Shorts",
    vertical: true,
    zones: [
      { x: 0, y: 0, w: 1, h: 0.07, label: TOP },
      { x: 0.84, y: 0.44, w: 0.16, h: 0.4, label: ACTIONS },
      { x: 0, y: 0.8, w: 1, h: 0.2, label: "Başlık ve kanal" },
    ],
  },
  {
    id: "margin",
    name: "Kenar payı",
    vertical: false,
    // The classic title-safe area: the inner 90 %.
    zones: [
      { x: 0, y: 0, w: 1, h: 0.05, label: "Kenar" },
      { x: 0, y: 0.95, w: 1, h: 0.05, label: "Kenar" },
      { x: 0, y: 0.05, w: 0.05, h: 0.9, label: "Kenar" },
      { x: 0.95, y: 0.05, w: 0.05, h: 0.9, label: "Kenar" },
    ],
  },
];

export const parseGuide = (raw: unknown): GuideId =>
  SAFE_GUIDES.some((g) => g.id === raw) ? (raw as GuideId) : "off";

/** The zones of `id` for a video in `format` (platform guides need 9:16). */
export function guideZones(id: GuideId, format: string): SafeZone[] {
  const guide = SAFE_GUIDES.find((g) => g.id === id);
  if (!guide || (guide.vertical && format !== "portrait")) return [];
  return guide.zones;
}

function overlap(a: Rect, b: Rect) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
    h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  // A hair's width of contact is not a covered caption.
  return w > 0.004 && h > 0.004 ? w * h : 0;
}

/** The zone that covers the most of `box`, or null when it is clear. */
export function coveredBy(box: Rect, zones: SafeZone[]): SafeZone | null {
  let best: SafeZone | null = null,
    most = 0;
  for (const zone of zones) {
    const area = overlap(box, zone);
    if (area > most) {
      most = area;
      best = zone;
    }
  }
  return best;
}

const spans = (z: Rect) => z.w >= 0.99;

/**
 * The nearest centre for `box` that keeps it clear of `zones`, `gap` away
 * from them; null when it cannot fit anywhere in the clear area.
 */
export function safeSpot(
  box: Rect,
  zones: SafeZone[],
  gap = 0.015,
): { x: number; y: number } | null {
  const top = Math.max(0, ...zones.filter((z) => spans(z) && z.y <= 0.001).map((z) => z.y + z.h)),
    bottom = Math.min(1, ...zones.filter((z) => spans(z) && z.y + z.h >= 0.999).map((z) => z.y)),
    sides = zones.filter((z) => !spans(z)),
    // Margins that run the whole height limit every position.
    tall = sides.filter((z) => z.h >= 0.85),
    left = Math.max(0, ...tall.filter((z) => z.x <= 0.001).map((z) => z.x + z.w)),
    right = Math.min(1, ...tall.filter((z) => z.x + z.w >= 0.999).map((z) => z.x));
  const half = { w: box.w / 2, h: box.h / 2 };
  const low = top + gap + half.h,
    high = bottom - gap - half.h;
  if (low > high) return null;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  let x = box.x + half.w,
    y = clamp(box.y + half.h, low, high);
  // Side zones that only cover part of the height (the like/share column):
  // slide sideways, or above / below them when the caption is too wide.
  for (const zone of sides) {
    if (zone.h >= 0.85) continue;
    const clear = (cy: number) =>
      cy + half.h <= zone.y - gap || cy - half.h >= zone.y + zone.h + gap;
    if (clear(y)) continue;
    const fromRight = zone.x > 0.5,
      edge = fromRight ? zone.x - gap - half.w : zone.x + zone.w + gap + half.w;
    const nx = fromRight ? Math.min(x, edge) : Math.max(x, edge);
    if (nx - half.w >= left + gap - 1e-9 && nx + half.w <= right - gap + 1e-9) {
      x = nx;
      continue;
    }
    const above = zone.y - gap - half.h,
      below = zone.y + zone.h + gap + half.h;
    const options = [above, below].filter((cy) => cy >= low - 1e-9 && cy <= high + 1e-9);
    if (!options.length) return null;
    y = options.reduce((a, b) => (Math.abs(a - y) <= Math.abs(b - y) ? a : b));
  }
  x = clamp(x, left + gap + half.w, right - gap - half.w);
  if (left + gap + half.w > right - gap - half.w) x = 0.5;
  return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
}
