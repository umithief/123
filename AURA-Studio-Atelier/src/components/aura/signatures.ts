import { colorAt, rgba, type Theme } from "./palette";
import type { RenderState } from "./render";

export const HISTORY_FRAMES = 144;

function stage(w: number, h: number, reserve: number) {
  const top = Math.min(100, h * 0.14);
  const available = Math.max(130, h - reserve - top - 12);
  return {
    cx: w / 2,
    cy: top + available / 2,
    radius: Math.min(w * 0.4, available * 0.44),
    available,
  };
}

function mag(state: RenderState, t: number): number {
  const pos = Math.min(95, Math.max(0, t * 95));
  const i = Math.floor(pos);
  return (
    (state.levels[i] ?? 0) * (1 - (pos - i)) + (state.levels[Math.min(95, i + 1)] ?? 0) * (pos - i)
  );
}

export function paintPrism(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const { cx, cy, radius } = stage(w, h, state.reserve);
  ctx.save();
  // Layered facets provide their own light; avoid 128 separate software blur passes.
  ctx.shadowBlur = 0;
  ctx.translate(cx, cy);
  ctx.rotate(state.t * 0.055);
  ctx.globalCompositeOperation = "lighter";
  for (let petal = 0; petal < 8; petal++) {
    ctx.save();
    ctx.rotate((petal * Math.PI) / 4);
    for (let facet = 0; facet < 16; facet++) {
      const t = facet / 15;
      const level = mag(state, t);
      const inner = radius * (0.1 + t * 0.4);
      const outer = inner + radius * (0.2 + level * 0.38);
      const spread = 0.12 + state.mid * 0.12;
      const angle = Math.sin(t * 3 + state.t * 0.15) * 0.08;
      ctx.beginPath();
      ctx.moveTo(inner, 0);
      ctx.lineTo(Math.cos(spread + angle) * outer, Math.sin(spread + angle) * outer);
      ctx.lineTo(Math.cos(-spread + angle) * outer, Math.sin(-spread + angle) * outer);
      ctx.closePath();
      ctx.strokeStyle = rgba(colorAt(theme, t), 0.16 + level * 0.5);
      ctx.lineWidth = facet % 4 === 0 ? 1.3 : 0.65;
      ctx.stroke();
      if (facet % 5 === 0) {
        ctx.fillStyle = rgba(theme.mid, 0.012 + level * 0.025);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

const STAR_COUNT = 46;
const starX = new Float32Array(STAR_COUNT);
const starY = new Float32Array(STAR_COUNT);

export function paintConstellation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const { cx, cy, radius } = stage(w, h, state.reserve);
  const extentX = Math.min(w * 0.44, radius * 1.7);
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = i * 2.399963;
    const spread = Math.sqrt((i + 1) / STAR_COUNT);
    const orbit = state.t * (i % 2 ? 0.02 : -0.025);
    const influence = 1 + mag(state, i / (STAR_COUNT - 1)) * 0.15;
    starX[i] = cx + Math.cos(a + orbit) * spread * extentX * influence;
    starY[i] = cy + Math.sin(a + orbit) * spread * radius * influence;
  }
  ctx.save();
  ctx.shadowBlur = 0;
  const reach = radius * (0.42 + state.mid * 0.15);
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = starX[i] ?? 0;
    const y = starY[i] ?? 0;
    const level = mag(state, i / (STAR_COUNT - 1));
    for (let j = i + 1; j < STAR_COUNT; j++) {
      const dx = x - (starX[j] ?? 0);
      const dy = y - (starY[j] ?? 0);
      const distance = Math.hypot(dx, dy);
      if (distance >= reach) continue;
      ctx.strokeStyle = rgba(theme.mid, (1 - distance / reach) * (0.12 + level * 0.42));
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(starX[j] ?? 0, starY[j] ?? 0);
      ctx.stroke();
    }
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 8 + level * 14);
    glow.addColorStop(0, rgba(colorAt(theme, i / STAR_COUNT), 0.3 + level * 0.35));
    glow.addColorStop(1, rgba(theme.mid, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 8 + level * 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(theme.high, 0.5 + level * 0.5);
    ctx.beginPath();
    ctx.arc(x, y, 1 + level * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function paintHelix(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const { cx, cy, available } = stage(w, h, state.reserve);
  const span = Math.min(w * 0.28, available * 0.25);
  const height = available * 0.84;
  const count = 64;
  ctx.save();
  ctx.shadowBlur = 0;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const phase = t * Math.PI * 5 + state.t * 0.55;
    const level = mag(state, t);
    const spread = span * (0.5 + Math.sin(t * Math.PI) * 0.5) * (1 + level * 0.32);
    const x1 = cx + Math.cos(phase) * spread;
    const x2 = cx - Math.cos(phase) * spread;
    const y = cy - height / 2 + t * height;
    const z = (Math.sin(phase) + 1) / 2;
    const wire = ctx.createLinearGradient(x1, y, x2 === x1 ? x2 + 0.01 : x2, y);
    wire.addColorStop(0, rgba(theme.high, 0.3 + z * 0.55));
    wire.addColorStop(0.5, rgba(theme.mid, 0.08 + level * 0.32));
    wire.addColorStop(1, rgba(theme.high, 0.85 - z * 0.55));
    ctx.strokeStyle = wire;
    ctx.lineWidth = 0.75 + level * 1.1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    for (let side = 0; side < 2; side++) {
      const depth = side === 0 ? z : 1 - z;
      const x = side === 0 ? x1 : x2;
      ctx.fillStyle = rgba(colorAt(theme, t), 0.32 + depth * 0.65);
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + depth * 2.4 + level * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

type SpectrogramCache = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  image: ImageData;
  colors: Uint8Array;
  sequence: number;
  theme: string;
};
const spectrograms = new WeakMap<RenderState, SpectrogramCache>();

export function paintSpectrogram(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  let cache = spectrograms.get(state);
  if (!cache) {
    const canvas = document.createElement("canvas");
    canvas.width = HISTORY_FRAMES;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    if (!context) return;
    cache = {
      canvas,
      ctx: context,
      image: context.createImageData(HISTORY_FRAMES, 96),
      colors: new Uint8Array(256 * 3),
      sequence: -1,
      theme: "",
    };
    spectrograms.set(state, cache);
  }
  if (cache.sequence !== state.historySequence || cache.theme !== theme.id) {
    if (cache.theme !== theme.id) {
      for (let i = 0; i < 256; i++) {
        const value = i / 255;
        const color = colorAt(theme, Math.min(1, value * 1.25));
        const brightness = Math.pow(value, 1.2);
        cache.colors[i * 3] = color[0] * brightness;
        cache.colors[i * 3 + 1] = color[1] * brightness;
        cache.colors[i * 3 + 2] = color[2] * brightness;
      }
    }
    const pixels = cache.image.data;
    for (let x = 0; x < HISTORY_FRAMES; x++) {
      const frame = (state.historyHead + x) % HISTORY_FRAMES;
      for (let bin = 0; bin < 96; bin++) {
        const value = state.history[frame * 96 + bin] ?? 0;
        const colorIndex = Math.max(0, Math.min(255, Math.round(value * 255))) * 3;
        const pixel = ((95 - bin) * HISTORY_FRAMES + x) * 4;
        pixels[pixel] = cache.colors[colorIndex] ?? 0;
        pixels[pixel + 1] = cache.colors[colorIndex + 1] ?? 0;
        pixels[pixel + 2] = cache.colors[colorIndex + 2] ?? 0;
        pixels[pixel + 3] = 255;
      }
    }
    cache.ctx.putImageData(cache.image, 0, 0);
    cache.sequence = state.historySequence;
    cache.theme = theme.id;
  }
  const { cy, available } = stage(w, h, state.reserve);
  const width = Math.min(w * 0.88, 1120);
  const height = available * 0.76;
  const left = (w - width) / 2;
  const top = cy - height / 2;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 12);
  ctx.clip();
  ctx.globalAlpha = 0.9;
  ctx.drawImage(cache.canvas, left, top, width, height);
  ctx.restore();
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(theme.high, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 12);
  ctx.stroke();
  ctx.fillStyle = rgba(theme.high, 0.65);
  ctx.font = "11px Outfit, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("15 kHz", left + 10, top + 20);
  ctx.fillText("36 Hz", left + 10, top + height - 12);
  ctx.textAlign = "right";
  ctx.fillText("ŞİMDİ", left + width - 10, top + height + 20);
  ctx.restore();
}
