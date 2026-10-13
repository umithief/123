import { colorAt, rgba, type Theme, type ModeId } from "./palette";
import type { RenderState } from "./render";
import { HISTORY_FRAMES } from "./signatures";

const TAU = Math.PI * 2;
function level(s: RenderState, f: number) {
  const index = Math.max(0, Math.min(s.levels.length - 1, f * (s.levels.length - 1)));
  const a = Math.floor(index),
    b = Math.min(a + 1, s.levels.length - 1);
  return s.levels[a] + (s.levels[b] - s.levels[a]) * (index - a);
}
function metal(
  ctx: CanvasRenderingContext2D,
  t: Theme,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, rgba(t.low, 0.8));
  g.addColorStop(0.32, rgba(t.mid, 0.95));
  g.addColorStop(0.48, rgba(t.high, 1));
  g.addColorStop(0.59, rgba(t.mid, 0.85));
  g.addColorStop(1, rgba(t.low, 0.65));
  return g;
}
function bloom(
  ctx: CanvasRenderingContext2D,
  t: Theme,
  x: number,
  y: number,
  r: number,
  power: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
  g.addColorStop(0, rgba(t.mid, power));
  g.addColorStop(0.4, rgba(t.low, power * 0.35));
  g.addColorStop(1, rgba(t.low, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Six bounded, deterministic renderers shared by thumbnails, preview and video export. */
export function paintPremiumSpectrum(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  mode: ModeId,
  s: RenderState,
  reduce: boolean,
) {
  const usable = Math.max(h * 0.4, h - s.reserve),
    cx = w / 2,
    cy = usable * 0.49;
  const size = Math.min(w * 0.42, usable * 0.4),
    time = reduce ? 0 : s.t;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (mode === "eclipse") {
    bloom(ctx, theme, cx, cy, size * 1.5, 0.15 + s.bass * 0.2);
    // Two offset crescents carry independent low/high frequency sweeps.
    for (let ring = 0; ring < 2; ring++) {
      const radius = size * (ring ? 0.73 : 1),
        offset = ring ? Math.PI : 0;
      ctx.strokeStyle = rgba(theme.mid, 0.16);
      ctx.lineWidth = Math.max(0.6, w / 1000);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 72; i++) {
        const f = i / 71,
          a = offset + f * Math.PI * 1.65 + time * (ring ? -0.025 : 0.025),
          v = level(s, ring ? 1 - f : f);
        const extent = size * (0.035 + v * 0.43),
          r = radius + Math.sin(f * Math.PI) * size * 0.018;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * (r + extent), cy + Math.sin(a) * (r + extent));
        ctx.strokeStyle = rgba(colorAt(theme, f), 0.45 + v * 0.55);
        ctx.lineWidth = Math.max(1, size * 0.008);
        ctx.stroke();
        if (i % 3 === 0) {
          const peak = s.peaks[Math.round((ring ? 1 - f : f) * 95)];
          ctx.fillStyle = rgba(theme.high, 0.55);
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(a) * (r + size * (0.045 + peak * 0.43)),
            cy + Math.sin(a) * (r + size * (0.045 + peak * 0.43)),
            Math.max(0.8, size * 0.004),
            0,
            TAU,
          );
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = metal(ctx, theme, cx - size * 0.45, cy - size * 0.45, size * 0.9, size * 0.9);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.44, 0, TAU);
    ctx.fill();
    ctx.fillStyle = theme.bg;
    ctx.beginPath();
    ctx.arc(cx + size * 0.035, cy - size * 0.025, size * 0.415, 0, TAU);
    ctx.fill();
  } else if (mode === "valley") {
    // The ridges show actual retained FFT history; newest frequencies sit in front.
    const left = w * 0.08,
      span = w * 0.84,
      floor = usable * 0.83,
      depth = usable * 0.55;
    for (let row = 19; row >= 0; row--) {
      const near = 1 - row / 24,
        y = floor - (row / 19) * depth,
        scale = 0.32 + near * 0.68;
      const head = (s.historyHead - 1 - row * 4 + HISTORY_FRAMES) % HISTORY_FRAMES;
      ctx.beginPath();
      for (let i = 0; i < 64; i++) {
        const f = i / 63,
          index = Math.round(f * 95),
          v = row === 0 ? level(s, f) : s.history[head * 96 + index] || 0;
        const x = cx + (f - 0.5) * span * scale,
          yy = y - v * usable * 0.21 * scale;
        if (i === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.lineTo(cx + (span * scale) / 2, y + depth * 0.065);
      ctx.lineTo(cx - (span * scale) / 2, y + depth * 0.065);
      ctx.closePath();
      ctx.fillStyle = rgba(theme.low, 0.13 + near * 0.13);
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < 64; i++) {
        const f = i / 63,
          v = row === 0 ? level(s, f) : s.history[head * 96 + Math.round(f * 95)] || 0;
        const x = cx + (f - 0.5) * span * scale,
          yy = y - v * usable * 0.21 * scale;
        if (i === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = rgba(colorAt(theme, near), 0.12 + near * 0.66);
      ctx.lineWidth = Math.max(0.6, w * 0.0015) * near;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(theme.high, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, floor + depth * 0.09);
    ctx.lineTo(w - left, floor + depth * 0.09);
    ctx.stroke();
  } else if (mode === "liquid-metal") {
    bloom(ctx, theme, cx, cy, size * 1.5, 0.18 + s.energy * 0.18);
    // A frequency-driven closed membrane with reflective contour rings.
    for (let contour = 7; contour >= 0; contour--) {
      const scale = 0.42 + contour * 0.081;
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * TAU,
          f = (1 - Math.cos(a)) / 2,
          v = level(s, f);
        const r =
          size *
          scale *
          (0.85 +
            v * 0.36 +
            Math.sin(a * 5 + time * 0.23) * 0.045 +
            Math.cos(a * 3 - time * 0.18) * s.bass * 0.09);
        const x = cx + Math.cos(a) * r,
          y = cy + Math.sin(a) * r;
        if (!i) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (contour === 7) {
        ctx.fillStyle = metal(ctx, theme, cx - size, cy - size, size * 2, size * 2);
        ctx.fill();
      }
      ctx.strokeStyle = rgba(contour % 2 ? theme.high : theme.low, 0.18 + contour * 0.045);
      ctx.lineWidth = Math.max(0.7, size * 0.004);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(theme.high, 0.6);
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.arc(cx - size * 0.1, cy - size * 0.07, size * 0.6, 3.5, 4.6);
    ctx.stroke();
  } else if (mode === "phase-flower") {
    bloom(ctx, theme, cx, cy, size * 1.4, 0.13);
    // Oscilloscope phase portrait: the same waveform at a quarter-cycle delay.
    for (let strand = 0; strand < 5; strand++) {
      ctx.beginPath();
      for (let i = 0; i <= 384; i++) {
        const a = (i / 384) * TAU,
          index = Math.floor((i / 384) * s.wave.length) % s.wave.length;
        const xWave = s.wave[index],
          yWave = s.wave[(index + 48) % s.wave.length];
        const r = size * (0.52 + strand * 0.055 + level(s, (1 - Math.cos(a)) / 2) * 0.2);
        const x = cx + Math.cos(a * 3 + strand * 0.1) * r * 0.7 + xWave * size * 0.38;
        const y = cy + Math.sin(a * 2 + strand * 0.1) * r * 0.7 + yWave * size * 0.38;
        if (!i) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(colorAt(theme, strand / 4), 0.28 + strand * 0.12);
      ctx.lineWidth = Math.max(0.6, size * 0.005);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(theme.mid, 0.16);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, TAU);
    ctx.stroke();
  } else if (mode === "deco") {
    const y = usable * 0.79,
      radius = Math.min(w * 0.45, usable * 0.66);
    bloom(ctx, theme, cx, y - radius * 0.4, radius, 0.12);
    for (let i = 0; i < 55; i++) {
      const f = i / 54,
        a = Math.PI + f * Math.PI,
        v = level(s, f),
        inner = radius * 0.15,
        outer = radius * (0.36 + Math.sin(f * Math.PI) * 0.2 + v * 0.45);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, y + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, y + Math.sin(a) * outer);
      ctx.strokeStyle = metal(ctx, theme, cx, y - radius, 0, radius);
      ctx.lineWidth = Math.max(1, radius * 0.009);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * outer,
        y + Math.sin(a) * outer,
        Math.max(1, radius * 0.004),
        0,
        TAU,
      );
      ctx.fillStyle = rgba(theme.high, 0.8);
      ctx.fill();
    }
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.arc(cx, y, radius * (0.22 + j * 0.32), Math.PI, TAU);
      ctx.strokeStyle = rgba(theme.mid, 0.2);
      ctx.lineWidth = Math.max(0.6, w * 0.001);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(theme.high, 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.07, y + radius * 0.045);
    ctx.lineTo(w * 0.93, y + radius * 0.045);
    ctx.stroke();
    ctx.fillStyle = metal(
      ctx,
      theme,
      cx - radius * 0.11,
      y - radius * 0.08,
      radius * 0.22,
      radius * 0.16,
    );
    ctx.beginPath();
    ctx.moveTo(cx, y - radius * 0.12);
    ctx.lineTo(cx + radius * 0.1, y);
    ctx.lineTo(cx, y + radius * 0.05);
    ctx.lineTo(cx - radius * 0.1, y);
    ctx.closePath();
    ctx.fill();
  } else if (mode === "glass-towers") {
    const count = 22,
      span = w * 0.8,
      step = span / count,
      base = usable * 0.77;
    bloom(ctx, theme, cx, usable * 0.5, size * 1.6, 0.16);
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1),
        v = level(s, f),
        x = w * 0.1 + i * step,
        bw = step * 0.64,
        depth = step * 0.25,
        height = usable * (0.045 + v * 0.5);
      const g = ctx.createLinearGradient(x, base - height, x + bw, base);
      g.addColorStop(0, rgba(theme.high, 0.6));
      g.addColorStop(0.16, rgba(colorAt(theme, f), 0.4));
      g.addColorStop(1, rgba(theme.low, 0.12));
      ctx.fillStyle = g;
      ctx.fillRect(x, base - height, bw, height);
      ctx.fillStyle = rgba(theme.high, 0.24);
      ctx.beginPath();
      ctx.moveTo(x, base - height);
      ctx.lineTo(x + depth, base - height - depth);
      ctx.lineTo(x + bw + depth, base - height - depth);
      ctx.lineTo(x + bw, base - height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(theme.mid, 0.13);
      ctx.beginPath();
      ctx.moveTo(x + bw, base);
      ctx.lineTo(x + bw + depth, base - depth);
      ctx.lineTo(x + bw + depth, base - height - depth);
      ctx.lineTo(x + bw, base - height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(theme.high, 0.55);
      ctx.lineWidth = Math.max(0.6, w * 0.001);
      ctx.strokeRect(x, base - height, bw, height);
      ctx.fillStyle = rgba(theme.mid, 0.09);
      ctx.fillRect(x, base + step * 0.2, bw, Math.min(height * 0.3, usable * 0.13));
      const peak = s.peaks[Math.round(f * 95)];
      ctx.fillStyle = rgba(theme.high, 0.65);
      ctx.fillRect(
        x,
        base - usable * (0.045 + peak * 0.5) - step * 0.3,
        bw,
        Math.max(1, w * 0.0015),
      );
    }
  }
  ctx.restore();
}
