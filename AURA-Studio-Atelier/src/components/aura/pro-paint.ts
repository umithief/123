// Shared drawing tools for the AURA Pro effects, animations and transitions:
// true motion blur (averaged copies), colour-channel separation, highlight
// extraction and scratch canvases. Everything works on any frame size, so
// the same code paints the 120 px gallery previews and the 1080p export.

/** Every Pro item's id starts with this prefix. */
export const isPro = (id: string) => id.startsWith("pro-");

const scratch = new Map<string, HTMLCanvasElement>();
/**
 * A reusable canvas for `purpose` holding a w × h picture at `density` pixels
 * per unit (its context is scaled, so drawing code uses the same units as the
 * frame). Previews and the export keep separate ones.
 */
export function surface(purpose: string, w: number, h: number, density = 1) {
  const width = Math.max(1, Math.round(w * density)),
    height = Math.max(1, Math.round(h * density)),
    key = `${purpose}:${width}x${height}`;
  let canvas = scratch.get(key);
  if (!canvas) {
    if (scratch.size > 48) scratch.clear();
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    scratch.set(key, canvas);
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(density, 0, 0, density, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  return { canvas, ctx };
}

/** Pixels per unit of `ctx` (the studio draws in units scaled up to the output). */
export function density(ctx: CanvasRenderingContext2D) {
  const t = ctx.getTransform();
  return Math.max(1, Math.min(3, Math.hypot(t.a, t.b)));
}

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const easeIn = (p: number) => p ** 3;
export const easeOut = (p: number) => 1 - (1 - p) ** 3;
/** A steady pseudo-random number in 0..1 for `n` (same frame, same value). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Place = { x?: number; y?: number; scale?: number; rotate?: number };
/** Draws `image` filling w × h, moved, scaled and turned about the centre. */
export function place(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  w: number,
  h: number,
  { x = 0, y = 0, scale = 1, rotate = 0 }: Place = {},
) {
  ctx.save();
  ctx.translate(w / 2 + x, h / 2 + y);
  if (rotate) ctx.rotate(rotate);
  if (scale !== 1) ctx.scale(scale, scale);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** How far (px) the farthest corner travels between two placements. */
function travel(from: Place, to: Place, w: number, h: number) {
  const reach = Math.hypot(w, h) / 2;
  return (
    Math.hypot((from.x ?? 0) - (to.x ?? 0), (from.y ?? 0) - (to.y ?? 0)) +
    Math.abs((from.scale ?? 1) - (to.scale ?? 1)) * reach +
    Math.abs((from.rotate ?? 0) - (to.rotate ?? 0)) * reach
  );
}

/**
 * Real motion blur: the average of copies spread between two placements (a
 * pan, a zoom or a turn), built additively. Long moves are worked out at half
 * size with each copy softened, so the blur is smooth instead of a row of
 * ghosts and stays cheap on a phone.
 */
export function smear(
  image: CanvasImageSource,
  w: number,
  h: number,
  from: Place,
  to: Place,
  samples = 8,
  purpose = "smear",
  pixels = 1,
  most = 18,
) {
  const distance = travel(from, to, w, h),
    count = Math.max(
      Math.min(samples, most),
      Math.min(most, Math.ceil(distance / (Math.min(w, h) * 0.025))),
    ),
    k = (distance > Math.min(w, h) * 0.15 ? 0.5 : 1) * pixels,
    sw = Math.max(1, Math.round(w * k)),
    sh = Math.max(1, Math.round(h * k));
  const { canvas, ctx } = surface(purpose, sw, sh);
  ctx.clearRect(0, 0, sw, sh);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 1 / count;
  const gap = (distance / count) * k;
  const mix = (a = 0, b = 0, t: number) => a + (b - a) * t;
  ctx.scale(k, k);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    place(ctx, image, w, h, {
      x: mix(from.x, to.x, t),
      y: mix(from.y, to.y, t),
      scale: mix(from.scale ?? 1, to.scale ?? 1, t),
      rotate: mix(from.rotate, to.rotate, t),
    });
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (gap <= 1.5) return canvas;
  // One soft pass melts the copies together (cheaper than softening each).
  const soft = surface(`${purpose}-soft`, sw, sh);
  soft.ctx.clearRect(0, 0, sw, sh);
  soft.ctx.filter = `blur(${Math.min(10, gap * 0.5)}px)`;
  soft.ctx.drawImage(canvas, 0, 0);
  soft.ctx.filter = "none";
  return soft.canvas;
}

/** Pans, zooms or turns `image` with motion blur straight onto `ctx`. */
export function drawSmeared(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  w: number,
  h: number,
  from: Place,
  to: Place,
  samples = 8,
  most = 18,
) {
  if (travel(from, to, w, h) <= 1) {
    place(ctx, image, w, h, from);
    return;
  }
  ctx.save();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(smear(image, w, h, from, to, samples, "smear", density(ctx), most), 0, 0, w, h);
  ctx.restore();
}

/**
 * Splits `image` into red, green and blue and adds them back with the red
 * and blue pushed apart (`dx`, `dy` in px) or scaled about the centre (`zoom`).
 */
export function drawChromatic(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  w: number,
  h: number,
  dx: number,
  dy = 0,
  zoom = 0,
) {
  const channels = [
    ["#ff0000", -1],
    ["#00ff00", 0],
    ["#0000ff", 1],
  ] as const;
  const d = density(ctx);
  const layers = channels.map(([colour, side], i) => {
    const { canvas, ctx: c } = surface(`chroma-${i}`, w, h, d);
    c.clearRect(0, 0, w, h);
    place(c, image, w, h, { x: dx * side, y: dy * side, scale: 1 + zoom * side });
    c.globalCompositeOperation = "multiply";
    c.fillStyle = colour;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "destination-in";
    place(c, image, w, h, { x: dx * side, y: dy * side, scale: 1 + zoom * side });
    return canvas;
  });
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  for (const layer of layers) ctx.drawImage(layer, 0, 0, w, h);
  ctx.restore();
}

/** The bright parts of `image`, small and soft: the raw material for glows. */
export function highlights(image: CanvasImageSource, w: number, h: number, threshold = 0.6) {
  const sw = Math.max(8, Math.round(w / 6)),
    sh = Math.max(8, Math.round(h / 6));
  const { canvas, ctx } = surface("highlights", sw, sh);
  // Lift contrast hard around the threshold: darker areas fall to black.
  const gain = 1 / Math.max(0.05, 1 - threshold);
  ctx.filter = `brightness(${0.55 + threshold * 0.15}) contrast(${2.2 + gain}) saturate(1.2)`;
  ctx.drawImage(image, 0, 0, sw, sh);
  ctx.filter = "none";
  return canvas;
}

/** Adds a soft glow of the highlights over ctx (`screen`). */
export function glow(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  w: number,
  h: number,
  amount: number,
  radius: number,
  tint?: string,
  threshold = 0.6,
) {
  if (amount <= 0) return;
  const bright = highlights(source, w, h, threshold);
  // Blur where the picture is small, then scale up: same glow, a fraction of the work.
  const scale = bright.width / w,
    soft = surface("glow-soft", bright.width, bright.height);
  soft.ctx.clearRect(0, 0, bright.width, bright.height);
  soft.ctx.filter = `blur(${Math.max(0.5, radius * scale)}px)`;
  soft.ctx.drawImage(bright, 0, 0);
  soft.ctx.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(1, amount);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(soft.canvas, 0, 0, w, h);
  if (tint) {
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = Math.min(1, amount) * 0.5;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/** Horizontal anamorphic streaks through the highlights (blue by default). */
export function anamorphic(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  w: number,
  h: number,
  amount: number,
  colour = "#5fb3ff",
) {
  if (amount <= 0) return;
  const bright = highlights(source, w, h, 0.72);
  // Few columns but most of the rows, then a wide sideways smear: every
  // highlight becomes a long thin horizontal line.
  const cols = Math.max(6, Math.round(w / 40)),
    rows = Math.max(8, Math.round(h / 3));
  const narrow = surface("streak-narrow", cols, rows);
  narrow.ctx.clearRect(0, 0, cols, rows);
  // Lens streaks take the lens coating's colour, not the light's.
  narrow.ctx.filter = "grayscale(1)";
  narrow.ctx.drawImage(bright, 0, 0, cols, rows);
  narrow.ctx.filter = "none";
  const { canvas, ctx: c } = surface("streak", cols, rows);
  // Black is neutral for the screen blend below (and keeps the tint out of empty space).
  c.fillStyle = "#000";
  c.fillRect(0, 0, cols, rows);
  c.globalCompositeOperation = "lighter";
  const taps = 9;
  for (let i = 0; i < taps; i++) {
    const offset = (i / (taps - 1) - 0.5) * cols * 0.7;
    c.globalAlpha = (1 - Math.abs(offset) / (cols * 0.4)) * 0.45;
    c.drawImage(narrow.canvas, offset, 0);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = "multiply";
  c.fillStyle = colour;
  c.fillRect(0, 0, cols, rows);
  const lit = surface("streak-lit", cols, rows);
  lit.ctx.filter = `brightness(${1.5 + amount})`;
  lit.ctx.drawImage(canvas, 0, 0);
  lit.ctx.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(1, amount);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(lit.canvas, 0, 0, w, h);
  ctx.restore();
}

/** Warm film-burn light drifting across the frame; `phase` 0..1 moves it. */
export function filmBurn(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number,
  phase: number,
) {
  if (amount <= 0) return;
  const short = Math.min(w, h);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const flames = [
    ["255,92,24", 0.0],
    ["255,180,80", 0.17],
    ["220,24,48", 0.33],
    ["255,236,190", 0.5],
  ] as const;
  flames.forEach(([colour, offset], i) => {
    const flicker = 0.75 + hash(Math.floor(phase * 24) + i * 11) * 0.25;
    const x = (-0.4 + (phase + offset) * 1.5) * w,
      y = (0.25 + Math.sin(phase * 4 + i * 1.7) * 0.25 + i * 0.12) * h,
      r = short * (0.55 + i * 0.18) * (0.6 + amount);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${colour},${amount * flicker})`);
    g.addColorStop(0.5, `rgba(${colour},${amount * flicker * 0.45})`);
    g.addColorStop(1, `rgba(${colour},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  ctx.restore();
}

let band: HTMLCanvasElement | null = null;
/** A horizontal line of blue light, bright in the middle and soft all round. */
function flareBand() {
  if (band) return band;
  band = document.createElement("canvas");
  band.width = 512;
  band.height = 48;
  const c = band.getContext("2d")!;
  const across = c.createLinearGradient(0, 0, 512, 0);
  across.addColorStop(0, "rgba(40,120,255,0)");
  across.addColorStop(0.2, "rgba(90,170,255,0.35)");
  across.addColorStop(0.5, "rgba(214,238,255,1)");
  across.addColorStop(0.8, "rgba(90,170,255,0.35)");
  across.addColorStop(1, "rgba(40,120,255,0)");
  c.fillStyle = across;
  c.fillRect(0, 0, 512, 48);
  const down = c.createLinearGradient(0, 0, 0, 48);
  down.addColorStop(0, "rgba(0,0,0,0)");
  down.addColorStop(0.5, "rgba(0,0,0,1)");
  down.addColorStop(1, "rgba(0,0,0,0)");
  c.globalCompositeOperation = "destination-in";
  c.fillStyle = down;
  c.fillRect(0, 0, 512, 48);
  return band;
}

/**
 * An anamorphic lens flare at (x, y): a thin hot blue line across the frame,
 * a bright core and ghosts mirrored through the centre.
 */
export function lensFlare(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number,
  x: number,
  y: number,
) {
  if (amount <= 0) return;
  const short = Math.min(w, h);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  // The line is a ready-made soft sprite: no per-frame blur.
  const band = flareBand();
  ctx.globalAlpha = Math.min(1, amount);
  ctx.drawImage(band, x - w * 0.6, y - short * 0.012, w * 1.2, short * 0.024);
  ctx.globalAlpha = Math.min(1, amount) * 0.8;
  ctx.drawImage(band, x - w * 0.9, y - short * 0.07, w * 1.8, short * 0.14);
  ctx.globalAlpha = 1;
  const core = ctx.createRadialGradient(x, y, 0, x, y, short * 0.5);
  core.addColorStop(0, `rgba(255,255,255,${amount})`);
  core.addColorStop(0.2, `rgba(170,215,255,${amount * 0.7})`);
  core.addColorStop(1, "rgba(80,140,255,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, w, h);
  [0.35, 0.7, 1.25].forEach((k, i) => {
    const gx = w / 2 + (w / 2 - x) * k,
      gy = h / 2 + (h / 2 - y) * k,
      r = short * (0.05 + i * 0.035);
    const ghost = ctx.createRadialGradient(gx, gy, r * 0.6, gx, gy, r);
    ghost.addColorStop(0, `rgba(120,190,255,${amount * 0.12})`);
    ghost.addColorStop(0.85, `rgba(160,120,255,${amount * 0.22})`);
    ghost.addColorStop(1, "rgba(160,120,255,0)");
    ctx.fillStyle = ghost;
    ctx.fillRect(0, 0, w, h);
  });
  ctx.restore();
}
