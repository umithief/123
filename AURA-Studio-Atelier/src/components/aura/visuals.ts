import { colorAt, rgba, type Theme } from "./palette";
import type { RenderState } from "./render";

export type VisualOptions = {
  particles: boolean;
  speed: number;
  beatPulse?: boolean;
  autoScene?: boolean;
};

function level(state: RenderState, t: number): number {
  const position = Math.max(0, Math.min(state.levels.length - 1, t * (state.levels.length - 1)));
  const index = Math.floor(position);
  const a = state.levels[index] ?? 0;
  const b = state.levels[Math.min(state.levels.length - 1, index + 1)] ?? a;
  return a + (b - a) * (position - index);
}

export function paintTunnel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const available = Math.max(130, h - state.reserve - 100);
  const radius = Math.min(w * 0.45, available * 0.48);
  ctx.save();
  ctx.translate(w / 2, 80 + available / 2);
  for (let layer = 0; layer < 12; layer++) {
    const depth = (layer / 12 + state.t * 0.045) % 1;
    const r = radius * (0.18 + depth * depth * 0.92);
    const alpha = Math.sin(depth * Math.PI) * (0.25 + state.energy * 0.7);
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const frequency = Math.abs(Math.sin(a / 2));
      const deformation = 1 + level(state, frequency) * 0.23;
      const twist = state.t * 0.09 + depth * 0.55;
      const x = Math.cos(a + twist) * r * deformation;
      const y = Math.sin(a + twist) * r * deformation;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(colorAt(theme, depth), alpha);
    ctx.lineWidth = 0.6 + depth * 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

export function paintFlow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const available = Math.max(150, h - state.reserve - 100);
  const cy = 80 + available / 2;
  const amplitude = available * (0.16 + state.bass * 0.16);
  const span = Math.min(w * 0.92, 1300);
  const left = (w - span) / 2;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let ribbon = 0; ribbon < 22; ribbon++) {
    const band = ribbon / 21;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const envelope = Math.sin(t * Math.PI);
      const wave = state.wave[Math.floor(t * (state.wave.length - 1))] ?? 0;
      const y =
        cy +
        (band - 0.5) * available * 0.48 +
        envelope *
          (Math.sin(t * Math.PI * 3 + state.t * 0.48 + band * 4) * amplitude +
            wave * amplitude * 0.38 +
            level(state, t) * amplitude * Math.sin(band * Math.PI * 2));
      if (i === 0) ctx.moveTo(left, y);
      else ctx.lineTo(left + t * span, y);
    }
    ctx.strokeStyle = rgba(colorAt(theme, band), 0.16 + level(state, band) * 0.4);
    ctx.lineWidth = ribbon % 5 === 0 ? 1.8 : 0.75;
    ctx.stroke();
  }
  ctx.restore();
}

export function paintLattice(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const available = Math.max(150, h - state.reserve - 90);
  const cy = 80 + available * 0.58;
  const span = Math.min(w * 0.96, 1300);
  ctx.save();
  ctx.lineWidth = 0.85;
  for (let row = 0; row < 20; row++) {
    const depth = row / 19;
    const scale = 0.22 + depth * depth * 0.78;
    ctx.beginPath();
    for (let col = 0; col <= 56; col++) {
      const t = col / 56;
      const ripple = Math.sin(t * Math.PI * 5 - state.t * 0.8 + depth * 5);
      const mag = level(state, t);
      const x = w / 2 + (t - 0.5) * span * scale;
      const y =
        cy +
        (depth - 0.4) * available * 0.36 -
        (mag * 0.65 + ripple * (0.06 + state.bass * 0.12)) * available * scale;
      if (col === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (col % 4 === 0 && row % 2 === 0) {
        ctx.fillStyle = rgba(theme.high, scale * (0.2 + mag * 0.7));
        ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
      }
    }
    ctx.strokeStyle = rgba(colorAt(theme, depth), scale * (0.28 + state.energy * 0.55));
    ctx.stroke();
  }
  for (let column = 0; column <= 14; column++) {
    const t = column / 14;
    ctx.beginPath();
    for (let row = 0; row < 20; row++) {
      const depth = row / 19;
      const scale = 0.22 + depth * depth * 0.78;
      const ripple = Math.sin(t * Math.PI * 5 - state.t * 0.8 + depth * 5);
      const x = w / 2 + (t - 0.5) * span * scale;
      const y =
        cy +
        (depth - 0.4) * available * 0.36 -
        (level(state, t) * 0.65 + ripple * (0.06 + state.bass * 0.12)) * available * scale;
      if (row === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(theme.mid, 0.1 + state.energy * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

export function paintAtmosphere(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const bottom = Math.max(160, h - state.reserve);
  ctx.save();
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 44; i++) {
    const x = (((i * 137.51 + Math.sin(state.t * 0.08 + i) * 24) % w) + w) % w;
    const y =
      60 +
      ((((i * 79.73 - state.t * (4 + (i % 5))) % (bottom - 60)) + bottom - 60) % (bottom - 60));
    const mag = level(state, i / 43);
    ctx.fillStyle = rgba(colorAt(theme, i / 43), 0.08 + mag * 0.45);
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + mag * 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (mag > 0.35) {
      ctx.strokeStyle = rgba(theme.mid, mag * 0.13);
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.lineTo(x, y + 6 + mag * 14);
      ctx.stroke();
    }
  }
  ctx.restore();
}
