// Layered caption motion, CapCut style: an entrance (Giriş), an exit (Çıkış)
// and a loop (Döngü), each chosen on its own and stacked on one caption. The
// whole caption block moves together; word animations ("Kombo") still run
// inside it. Everything here is pure so the preview, the timeline and the
// exported video draw exactly the same frame.

export const CAPTION_IN = [
  { id: "none", label: "Yok", description: "Hareketsiz belirir" },
  { id: "fade", label: "Belirme", description: "Yumuşakça görünür" },
  { id: "zoom-in", label: "Büyüyerek", description: "Küçükten tam boya" },
  { id: "zoom-out", label: "Küçülerek", description: "Büyükten yerine oturur" },
  { id: "pop", label: "Zıpla", description: "Esneyerek fırlar" },
  { id: "slide-up", label: "Aşağıdan", description: "Alttan yükselir" },
  { id: "slide-down", label: "Yukarıdan", description: "Üstten iner" },
  { id: "from-right", label: "Sağdan", description: "Sağdan kayarak gelir" },
  { id: "from-left", label: "Soldan", description: "Soldan kayarak gelir" },
  { id: "bounce", label: "Sekerek", description: "Düşüp sekerek durur" },
  { id: "spin", label: "Dönerek", description: "Dönüp büyüyerek gelir" },
  { id: "blur", label: "Netleş", description: "Bulanıktan netleşir" },
  { id: "wipe", label: "Silme", description: "Soldan sağa açılır" },
  { id: "typewriter", label: "Daktilo", description: "Adım adım yazılır" },
  { id: "open", label: "Ortadan aç", description: "Ortadan iki yana açılır" },
  { id: "rise", label: "Perde", description: "Perdenin arkasından çıkar" },
  { id: "flip", label: "Çevir", description: "Dikey dönerek açılır" },
  { id: "stretch", label: "Esnet", description: "Yatay esneyip toplanır" },
  { id: "swing", label: "Sarkaç", description: "Sallanarak yerleşir" },
  { id: "glitch", label: "Dijital", description: "Bozulma ile gelir" },
] as const;

// Exits play an entrance backwards, so each one names the entrance it reverses.
export const CAPTION_OUT = [
  { id: "none", via: "none", label: "Yok", description: "Hareketsiz kaybolur" },
  { id: "fade", via: "fade", label: "Sönme", description: "Yumuşakça kaybolur" },
  { id: "zoom-in", via: "zoom-out", label: "Büyüyerek", description: "Büyüyüp kaybolur" },
  { id: "zoom-out", via: "zoom-in", label: "Küçülerek", description: "Küçülüp kaybolur" },
  { id: "pop", via: "pop", label: "Patla", description: "Toplanıp söner" },
  { id: "slide-up", via: "slide-down", label: "Yukarı", description: "Yukarı çıkar" },
  { id: "slide-down", via: "slide-up", label: "Aşağı", description: "Aşağı iner" },
  { id: "to-left", via: "from-left", label: "Sola", description: "Sola kayar" },
  { id: "to-right", via: "from-right", label: "Sağa", description: "Sağa kayar" },
  { id: "spin", via: "spin", label: "Dönerek", description: "Dönerek küçülür" },
  { id: "blur", via: "blur", label: "Bulanıklaş", description: "Bulanıklaşıp söner" },
  { id: "wipe", via: "wipe", label: "Silinme", description: "Sağdan sola silinir" },
  { id: "backspace", via: "typewriter", label: "Geri sil", description: "Adım adım silinir" },
  { id: "close", via: "open", label: "Ortaya kapan", description: "İki yandan kapanır" },
  { id: "sink", via: "rise", label: "Perdeye in", description: "Perdenin arkasına iner" },
  { id: "flip", via: "flip", label: "Çevir", description: "Dikey dönerek kapanır" },
  { id: "stretch", via: "stretch", label: "Esnet", description: "Yatay esneyip söner" },
  { id: "glitch", via: "glitch", label: "Dijital", description: "Bozularak kaybolur" },
] as const;

export const CAPTION_LOOP = [
  { id: "none", label: "Yok", description: "Sabit durur" },
  { id: "pulse", label: "Nabız", description: "Hafifçe büyüyüp küçülür" },
  { id: "float", label: "Süzül", description: "Yavaşça yukarı aşağı" },
  { id: "sway", label: "Salınım", description: "Sağa sola eğilir" },
  { id: "bounce", label: "Zıplama", description: "Ritimle zıplar" },
  { id: "shake", label: "Titreşim", description: "Hızlı ve küçük sarsıntı" },
  { id: "heartbeat", label: "Kalp atışı", description: "Çift vuruşla atar" },
  { id: "jelly", label: "Jöle", description: "Esneyip toplanır" },
  { id: "wiggle", label: "Kıpırtı", description: "Oynak küçük hareket" },
  { id: "flicker", label: "Titrek ışık", description: "Neon gibi titrer" },
  { id: "glow", label: "Parıltı", description: "Işıltısı nefes alır" },
  { id: "push", label: "Yakınlaş", description: "Süre boyunca yavaşça büyür" },
] as const;

export type CaptionInId = (typeof CAPTION_IN)[number]["id"];
export type CaptionOutId = (typeof CAPTION_OUT)[number]["id"];
export type CaptionLoopId = (typeof CAPTION_LOOP)[number]["id"];
export type CaptionMotion = {
  in: CaptionInId;
  /** Seconds; shortened on short captions so in + out always fit. */
  inDuration: number;
  out: CaptionOutId;
  outDuration: number;
  loop: CaptionLoopId;
  /** Loop tempo multiplier. */
  loopSpeed: number;
};
export const NO_MOTION: CaptionMotion = {
  in: "none",
  inDuration: 0.5,
  out: "none",
  outDuration: 0.4,
  loop: "none",
  loopSpeed: 1,
};
export const MOTION_LIMITS = { duration: [0.1, 2], speed: [0.25, 3] } as const;

export const hasMotion = (m: CaptionMotion) =>
  m.in !== "none" || m.out !== "none" || m.loop !== "none";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const number = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? clamp(v, min, max) : fallback;

/** A stored motion, or null when the value is not one (keeps old projects valid). */
export function parseCaptionMotion(raw: unknown): CaptionMotion | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const [dMin, dMax] = MOTION_LIMITS.duration,
    [sMin, sMax] = MOTION_LIMITS.speed;
  return {
    in: CAPTION_IN.some((a) => a.id === v.in) ? (v.in as CaptionInId) : "none",
    inDuration: number(v.inDuration, dMin, dMax, NO_MOTION.inDuration),
    out: CAPTION_OUT.some((a) => a.id === v.out) ? (v.out as CaptionOutId) : "none",
    outDuration: number(v.outDuration, dMin, dMax, NO_MOTION.outDuration),
    loop: CAPTION_LOOP.some((a) => a.id === v.loop) ? (v.loop as CaptionLoopId) : "none",
    loopSpeed: number(v.loopSpeed, sMin, sMax, NO_MOTION.loopSpeed),
  };
}

/** Lengths of the entrance and exit on a caption of `length` seconds: each is
 *  at most half the caption and together they leave 10 % of it at rest. */
export function motionWindows(m: CaptionMotion, length: number) {
  let enter = m.in === "none" ? 0 : Math.min(m.inDuration, length / 2),
    leave = m.out === "none" ? 0 : Math.min(m.outDuration, length / 2);
  const room = Math.max(0, length * 0.9);
  if (enter + leave > room && enter + leave > 0) {
    const k = room / (enter + leave);
    enter *= k;
    leave *= k;
  }
  return { enter, leave };
}

export type RevealMode = "none" | "left" | "center" | "up";
export type MotionFrame = {
  alpha: number;
  /** Offsets in multiples of the font size. */
  x: number;
  y: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  /** Radians. */
  rotate: number;
  /** Horizontal shear factor. */
  skew: number;
  /** Blur radius in multiples of the font size. */
  blur: number;
  /** How much of the block is uncovered, 0–1, and from where. */
  reveal: number;
  revealMode: RevealMode;
  /** Extra glow, 0–1. */
  glow: number;
};
export const REST: MotionFrame = {
  alpha: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  skew: 0,
  blur: 0,
  reveal: 1,
  revealMode: "none",
  glow: 0,
};

const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const backOut = (p: number) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);
function bounceOut(p: number) {
  const n = 7.5625,
    d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
  if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
  return n * (p -= 2.625 / d) * p + 0.984375;
}
const appear = (p: number, rate: number) => clamp(p * rate, 0, 1);

/** Entrance frame at progress `p` (0 hidden → 1 at rest); `k` scales the travel. */
export function entranceFrame(id: CaptionInId, p: number, k = 1): MotionFrame {
  p = clamp(p, 0, 1);
  const e = outCubic(p),
    f = { ...REST };
  switch (id) {
    case "fade":
      f.alpha = e;
      break;
    case "zoom-in":
      f.scale = 1 - 0.6 * k * (1 - e);
      f.alpha = appear(p, 2.5);
      break;
    case "zoom-out":
      f.scale = 1 + 0.7 * k * (1 - e);
      f.alpha = appear(p, 2.5);
      break;
    case "pop":
      f.scale = Math.max(0.001, 1 + (backOut(p) - 1) * Math.min(1.4, k));
      f.alpha = appear(p, 4);
      break;
    case "slide-up":
      f.y = 1.4 * k * (1 - e);
      f.alpha = appear(p, 2);
      break;
    case "slide-down":
      f.y = -1.4 * k * (1 - e);
      f.alpha = appear(p, 2);
      break;
    case "from-right":
      f.x = 4 * k * (1 - e);
      f.alpha = appear(p, 2);
      break;
    case "from-left":
      f.x = -4 * k * (1 - e);
      f.alpha = appear(p, 2);
      break;
    case "bounce":
      f.y = -2.2 * k * (1 - bounceOut(p));
      f.alpha = appear(p, 4);
      break;
    case "spin":
      f.rotate = -1.2 * k * (1 - e);
      f.scale = 0.5 + 0.5 * e;
      f.alpha = appear(p, 2);
      break;
    case "blur":
      f.blur = 0.5 * k * (1 - e);
      f.alpha = appear(p, 1.5);
      break;
    case "wipe":
      f.reveal = e;
      f.revealMode = "left";
      break;
    case "typewriter":
      f.reveal = p >= 1 ? 1 : Math.floor(p * 12) / 12;
      f.revealMode = "left";
      break;
    case "open":
      f.reveal = e;
      f.revealMode = "center";
      break;
    case "rise":
      f.reveal = e;
      f.revealMode = "up";
      f.y = 0.5 * (1 - e);
      break;
    case "flip":
      f.scaleY = Math.max(0.03, Math.sin((p * Math.PI) / 2));
      f.alpha = appear(p, 3);
      break;
    case "stretch":
      f.scaleX = 1 + 1.2 * k * (1 - e);
      f.scaleY = Math.max(0.2, 1 - 0.45 * k * (1 - e));
      f.alpha = appear(p, 2);
      break;
    case "swing":
      f.rotate = Math.sin(p * Math.PI * 3) * (1 - p) * 0.5 * k;
      f.alpha = appear(p, 3);
      break;
    case "glitch":
      if (p < 1) {
        f.x = Math.sin(p * 97) * 0.35 * k * (1 - p);
        f.skew = Math.sin(p * 61) * 0.3 * (1 - p);
        f.alpha = [1, 0.2, 1, 0.5, 1, 0.8][Math.floor(p * 18) % 6] * appear(p, 3);
      }
      break;
  }
  return f;
}

/** Exit frame at progress `q` (0 at rest → 1 gone): the matching entrance, reversed. */
export function exitFrame(id: CaptionOutId, q: number, k = 1): MotionFrame {
  const via = CAPTION_OUT.find((a) => a.id === id)?.via ?? "none";
  return entranceFrame(via, 1 - clamp(q, 0, 1), k);
}

/** Loop frame `t` seconds into the loop; it eases in over its first 0.3 s. */
export function loopFrame(id: CaptionLoopId, t: number, speed = 1, k = 1, length = 1): MotionFrame {
  const f = { ...REST };
  if (id === "none" || t < 0) return f;
  const a = k * Math.min(1, t / 0.3),
    s = t * speed,
    wave = (hz: number) => Math.sin(2 * Math.PI * hz * s);
  switch (id) {
    case "pulse":
      f.scale = 1 + 0.06 * a * wave(1.2);
      break;
    case "float":
      f.y = 0.14 * a * wave(0.5);
      break;
    case "sway":
      f.rotate = 0.07 * a * wave(0.6);
      break;
    case "bounce":
      f.y = -0.22 * a * Math.abs(Math.sin(Math.PI * 1.6 * s));
      break;
    case "shake":
      f.x = 0.05 * a * Math.sin(s * 47);
      f.y = 0.035 * a * Math.cos(s * 39);
      break;
    case "heartbeat": {
      const beat = s % 0.9,
        bump =
          Math.exp(-((beat - 0.05) ** 2) / 0.003) + 0.65 * Math.exp(-((beat - 0.25) ** 2) / 0.003);
      f.scale = 1 + 0.1 * a * bump;
      break;
    }
    case "jelly":
      f.scaleX = 1 + 0.07 * a * wave(1.1);
      f.scaleY = 1 - 0.07 * a * wave(1.1);
      break;
    case "wiggle":
      f.rotate = 0.035 * a * Math.sin(s * 9);
      f.x = 0.04 * a * Math.sin(s * 7);
      break;
    case "flicker":
      f.alpha = 1 - (1 - [1, 0.55, 1, 0.8, 1, 1, 0.65, 1][Math.floor(s * 14) % 8]) * Math.min(1, a);
      break;
    case "glow":
      f.glow = Math.min(1, a) * (0.5 + 0.5 * wave(0.7));
      break;
    case "push":
      f.scale = 1 + 0.1 * a * clamp(t / Math.max(0.1, length), 0, 1);
      break;
  }
  return f;
}

/** Stacks two frames: offsets add, scales multiply, the tighter reveal wins. */
export function composeFrames(a: MotionFrame, b: MotionFrame): MotionFrame {
  const hidden = b.reveal < a.reveal ? b : a;
  return {
    alpha: a.alpha * b.alpha,
    x: a.x + b.x,
    y: a.y + b.y,
    scale: a.scale * b.scale,
    scaleX: a.scaleX * b.scaleX,
    scaleY: a.scaleY * b.scaleY,
    rotate: a.rotate + b.rotate,
    skew: a.skew + b.skew,
    blur: a.blur + b.blur,
    reveal: Math.min(a.reveal, b.reveal),
    revealMode:
      hidden.revealMode === "none"
        ? a.revealMode !== "none"
          ? a.revealMode
          : b.revealMode
        : hidden.revealMode,
    glow: Math.max(a.glow, b.glow),
  };
}

/** The caption's frame `elapsed` seconds after it starts, on a caption of
 *  `length` seconds. `intensity` is the caption's motion strength (0.2–1). */
export function motionFrame(
  m: CaptionMotion,
  elapsed: number,
  length: number,
  intensity = 0.7,
): MotionFrame {
  if (!hasMotion(m)) return REST;
  const k = clamp(intensity / 0.7, 0.3, 1.45);
  const { enter, leave } = motionWindows(m, length);
  let frame = REST;
  if (m.in !== "none")
    frame = composeFrames(frame, entranceFrame(m.in, enter > 0 ? elapsed / enter : 1, k));
  if (m.loop !== "none")
    frame = composeFrames(
      frame,
      loopFrame(m.loop, elapsed - enter, m.loopSpeed, k, length - enter),
    );
  if (m.out !== "none" && leave > 0)
    frame = composeFrames(frame, exitFrame(m.out, (elapsed - (length - leave)) / leave, k));
  return frame;
}
