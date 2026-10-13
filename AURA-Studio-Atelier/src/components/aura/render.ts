import {
  colorAt,
  rgba,
  isLuxuryMode,
  isPremiumSpectrum,
  type ModeId,
  type Theme,
  type TitlePlace,
  type TitleStyle,
} from "./palette";
import type { CoverOptions } from "./cover";
import {
  paintAtmosphere,
  paintFlow,
  paintLattice,
  paintTunnel,
  type VisualOptions,
} from "./visuals";
import {
  HISTORY_FRAMES,
  paintConstellation,
  paintHelix,
  paintPrism,
  paintSpectrogram,
} from "./signatures";
import { createRhythmState, updateRhythm, type RhythmState } from "./rhythm";
import { paintLuxuryScene, luxuryLayout } from "./luxury-scenes";

import { paintPremiumSpectrum } from "./premium-spectra";

const BARS = 96;
const WAVE = 192;

export type Finish = "studio" | "cinema" | "vivid";

export type Pulse = { life: number; power: number };

export type Particle = {
  a: number;
  r: number;
  s: number;
  sp: number;
  bin: number;
};

export type RenderState = {
  levels: Float32Array;
  peaks: Float32Array;
  peakHold: Float32Array;
  wave: Float32Array;
  scratch: Float32Array;
  blur: Float32Array;
  bass: number;
  mid: number;
  high: number;
  energy: number;
  bassFollow: number;
  pulses: Pulse[];
  particles: Particle[];
  t: number;
  dt: number;
  motionDt: number;
  last: number;
  reserve: number;
  rhythm: RhythmState;
  history: Float32Array;
  historyHead: number;
  historySequence: number;
  historyTime: number;
};

export function createRenderState(): RenderState {
  const particles: Particle[] = [];
  for (let i = 0; i < 64; i++) {
    particles.push({
      a: (i / 64) * Math.PI * 2,
      r: 0.55 + (i % 7) * 0.06,
      s: 1.2 + (i % 5) * 0.35,
      sp: (0.28 + (i % 4) * 0.12) * (i % 2 === 0 ? 1 : -1),
      bin: Math.floor((i / 64) * BARS),
    });
  }
  return {
    levels: new Float32Array(BARS),
    peaks: new Float32Array(BARS),
    peakHold: new Float32Array(BARS),
    wave: new Float32Array(WAVE),
    scratch: new Float32Array(BARS),
    blur: new Float32Array(BARS),
    bass: 0,
    mid: 0,
    high: 0,
    energy: 0,
    bassFollow: 0,
    pulses: [],
    particles,
    t: 0,
    dt: 0.016,
    motionDt: 0.016,
    last: 0,
    reserve: 180,
    rhythm: createRhythmState(),
    history: new Float32Array(BARS * HISTORY_FRAMES),
    historyHead: 0,
    historySequence: 0,
    historyTime: 0,
  };
}

export type Signal =
  | { kind: "off" }
  | { kind: "silent" }
  | {
      kind: "live";
      freq: Uint8Array;
      time: Uint8Array;
      sampleRate: number;
      fftSize: number;
      sensitivity: number;
      bass?: number;
    };

function damp(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

function bandValue(
  freq: Uint8Array,
  i: number,
  sampleRate: number,
  fftSize: number,
  sensitivity: number,
): number {
  const nyquist = sampleRate / 2;
  const minF = 36;
  const maxF = Math.min(15000, nyquist * 0.92);
  const f0 = minF * Math.pow(maxF / minF, i / BARS);
  const f1 = minF * Math.pow(maxF / minF, (i + 1) / BARS);
  const hzPerBin = sampleRate / fftSize;
  const b0 = Math.max(1, Math.floor(f0 / hzPerBin));
  const b1 = Math.min(freq.length - 1, Math.max(b0, Math.ceil(f1 / hzPerBin)));
  let peak = 0;
  let sum = 0;
  for (let b = b0; b <= b1; b++) {
    const v = freq[b] ?? 0;
    peak = Math.max(peak, v);
    sum += v;
  }
  const avg = sum / (b1 - b0 + 1);
  let value = (peak * 0.62 + avg * 0.38) / 255;
  value *= 0.78 + (i / BARS) * 1.25;
  value = Math.max(0, value - 0.04) * sensitivity;
  return Math.min(1, value);
}

export function step(
  state: RenderState,
  signal: Signal,
  now: number,
  reduce: boolean,
  speed = 1,
): void {
  const dt = Math.min(0.05, state.last ? (now - state.last) / 1000 : 0.016);
  state.last = now;
  state.dt = dt;
  state.motionDt = dt * (reduce ? 0.15 : speed);
  state.t += dt * (reduce ? 0.15 : speed);

  const targets = state.scratch;
  if (signal.kind === "live") {
    for (let i = 0; i < BARS; i++) {
      targets[i] = bandValue(signal.freq, i, signal.sampleRate, signal.fftSize, signal.sensitivity);
    }
  } else if (signal.kind === "silent") {
    targets.fill(0);
  } else {
    for (let i = 0; i < BARS; i++) {
      const breath =
        0.1 +
        0.08 * Math.sin(state.t * 0.85 + i * 0.27) +
        0.045 * Math.sin(state.t * 1.6 + i * 0.11);
      targets[i] = Math.max(0, breath);
    }
  }

  const blurred = state.blur;
  for (let i = 0; i < BARS; i++) {
    const a = targets[Math.max(0, i - 2)] ?? 0;
    const b = targets[Math.max(0, i - 1)] ?? 0;
    const c = targets[i] ?? 0;
    const d = targets[Math.min(BARS - 1, i + 1)] ?? 0;
    const e = targets[Math.min(BARS - 1, i + 2)] ?? 0;
    blurred[i] = a * 0.08 + b * 0.18 + c * 0.48 + d * 0.18 + e * 0.08;
  }

  for (let i = 0; i < BARS; i++) {
    const target = blurred[i] ?? 0;
    const current = state.levels[i] ?? 0;
    state.levels[i] = damp(current, target, target > current ? 18 : 5.5, dt);
    const level = state.levels[i] ?? 0;
    const peak = state.peaks[i] ?? 0;
    if (level >= peak) {
      state.peaks[i] = level;
      state.peakHold[i] = 0.28;
    } else {
      state.peakHold[i] = Math.max(0, (state.peakHold[i] ?? 0) - dt);
      if (state.peakHold[i] === 0) state.peaks[i] = Math.max(level, peak - dt * 0.32);
    }
  }

  for (let i = 0; i < WAVE; i++) {
    let target = Math.sin(state.t * 1.15 + i * 0.07) * 0.12;
    if (signal.kind === "live") {
      const src = Math.floor((i / WAVE) * signal.time.length);
      target = ((signal.time[src] ?? 128) - 128) / 128;
    } else if (signal.kind === "silent") {
      target = 0;
    }
    state.wave[i] = damp(state.wave[i] ?? 0, target, 12, dt);
  }

  let bass = 0;
  let mid = 0;
  let high = 0;
  let energy = 0;
  for (let i = 0; i < BARS; i++) {
    const level = state.levels[i] ?? 0;
    energy += level;
    if (i < 8) bass += level;
    else if (i < 42) mid += level;
    else high += level;
  }
  bass /= 8;
  mid /= 34;
  high /= BARS - 42;
  energy /= BARS;

  const liveBass = signal.kind === "off" ? bass * 0.45 : bass;
  let rawBass = 0;
  for (let i = 0; i < 14; i++) rawBass += targets[i] ?? 0;
  rawBass /= 14;
  if (signal.kind === "live" && signal.bass !== undefined) rawBass = signal.bass;
  const beat = updateRhythm(state.rhythm, rawBass, now / 1000, dt, signal.kind === "live");
  if (beat) {
    state.pulses.push({ life: 1, power: liveBass });
    if (state.pulses.length > 5) state.pulses.shift();
  }
  state.bass = damp(state.bass, liveBass, liveBass > state.bass ? 14 : 4, dt);
  state.mid = damp(state.mid, mid, 8, dt);
  state.high = damp(state.high, high, 8, dt);
  state.energy = damp(state.energy, energy, 8, dt);
  state.bassFollow = damp(state.bassFollow, liveBass, 3.2, dt);

  state.historyTime += dt;
  if (state.historyTime >= 1 / 30) {
    state.historyTime %= 1 / 30;
    for (let i = 0; i < BARS; i++) {
      state.history[state.historyHead * BARS + i] =
        signal.kind === "live"
          ? bandValue(signal.freq, i, signal.sampleRate, signal.fftSize, 0.75)
          : 0;
    }
    state.historyHead = (state.historyHead + 1) % HISTORY_FRAMES;
    state.historySequence += 1;
  }

  for (const pulse of state.pulses) pulse.life -= dt * (reduce ? 0.45 : 0.72);
  if (state.pulses.some((pulse) => pulse.life <= 0)) {
    state.pulses = state.pulses.filter((pulse) => pulse.life > 0);
  }
}

function roundBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, Math.max(0, h / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, w, Math.max(h, 0), radius);
  ctx.fill();
}

function traceSmooth(
  ctx: CanvasRenderingContext2D,
  pts: ReadonlyArray<{ x: number; y: number }>,
): void {
  const first = pts[0];
  if (!first) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < pts.length - 1; i++) {
    const point = pts[i];
    const next = pts[i + 1];
    if (!point || !next) continue;
    ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  const last = pts[pts.length - 1];
  if (last) ctx.lineTo(last.x, last.y);
}

function paintBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
  cx: number,
  cy: number,
): void {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);

  const radius = Math.max(w, h) * (0.36 + state.bass * 0.1);
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  glow.addColorStop(0, rgba(theme.mid, 0.16 + state.bass * 0.32));
  glow.addColorStop(0.42, rgba(theme.low, 0.07 + state.energy * 0.05));
  glow.addColorStop(1, rgba(theme.low, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const driftX = cx + Math.cos(state.t * 0.17) * w * 0.18;
  const driftY = cy + Math.sin(state.t * 0.13) * h * 0.08;
  const wash = ctx.createRadialGradient(driftX, driftY, 0, driftX, driftY, Math.max(w, h) * 0.42);
  wash.addColorStop(0, rgba(theme.low, 0.12));
  wash.addColorStop(1, rgba(theme.low, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(
    cx,
    h * 0.45,
    Math.min(w, h) * 0.18,
    cx,
    h * 0.45,
    Math.max(w, h) * 0.72,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function paintPulses(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  state: RenderState,
  radius: number,
): void {
  for (const pulse of state.pulses) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * (0.35 + (1 - pulse.life) * 0.95), 0, Math.PI * 2);
    ctx.strokeStyle = rgba(theme.high, pulse.life * 0.45 * pulse.power);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function paintBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const span = Math.min(w * 0.82, 960);
  const left = (w - span) / 2;
  const base = Math.max(h * 0.38, h - state.reserve - 36);
  const maxH = Math.max(88, Math.min(base - 96, h * 0.4));
  const count = 32;
  const slot = span / count;
  const bw = Math.max(5, slot * 0.56);

  ctx.strokeStyle = rgba(theme.high, 0.22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, base + 0.5);
  ctx.lineTo(left + span, base + 0.5);
  ctx.stroke();

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const index = Math.floor(Math.pow(t, 0.92) * (BARS - 1));
    const level = state.levels[index] ?? 0;
    const peak = state.peaks[index] ?? level;
    const bh = Math.max(4, level * maxH);
    const x = left + i * slot + (slot - bw) / 2;
    const color = colorAt(theme, t);
    const grad = ctx.createLinearGradient(0, base - bh, 0, base);
    grad.addColorStop(0, rgba(theme.high, 0.96));
    grad.addColorStop(0.38, rgba(color, 0.92));
    grad.addColorStop(1, rgba(theme.low, 0.28));
    ctx.fillStyle = grad;
    roundBar(ctx, x, base - bh, bw, bh, Math.min(bw / 2, 8));

    const cap = base - Math.max(bh + 7, peak * maxH + 7);
    ctx.fillStyle = rgba(theme.high, 0.92);
    roundBar(ctx, x, cap, bw, 2, 1);

    ctx.fillStyle = rgba(theme.high, 0.24);
    roundBar(ctx, x + bw * 0.2, base - bh + 3, Math.max(1, bw * 0.13), Math.max(0, bh - 6), 1);
    const reflection = Math.min(bh * 0.22, 36);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = rgba(color, 1);
    roundBar(ctx, x, base + 5, bw, reflection, Math.min(bw / 2, 6));
    ctx.globalAlpha = 1;
  }
}

function paintMirror(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const cy = (h - state.reserve) * 0.5;
  const maxH = Math.max(40, Math.min(cy - 36, h - state.reserve - cy - 16));
  const count = 36;
  const span = Math.min(w * 0.82, 980);
  const left = (w - span) / 2;
  const slot = span / count;
  const bw = Math.max(3, slot * 0.46);

  ctx.strokeStyle = rgba(theme.high, 0.28);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, cy + 0.5);
  ctx.lineTo(left + span, cy + 0.5);
  ctx.stroke();

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const index = Math.floor(t * (BARS - 1));
    const level = state.levels[index] ?? 0;
    const bh = Math.max(2, level * maxH);
    const x = left + i * slot + (slot - bw) / 2;
    const color = colorAt(theme, t);
    const up = ctx.createLinearGradient(0, cy - bh, 0, cy);
    up.addColorStop(0, rgba(theme.high, 0.95));
    up.addColorStop(1, rgba(color, 0.45));
    ctx.fillStyle = up;
    roundBar(ctx, x, cy - bh, bw, bh, Math.min(4, bw / 2));
    const down = ctx.createLinearGradient(0, cy, 0, cy + bh);
    down.addColorStop(0, rgba(color, 0.5));
    down.addColorStop(1, rgba(theme.low, 0.08));
    ctx.fillStyle = down;
    roundBar(ctx, x, cy, bw, bh, Math.min(4, bw / 2));
    const peakH = Math.max(bh + 4, (state.peaks[index] ?? level) * maxH + 4);
    ctx.fillStyle = rgba(theme.high, 0.65);
    roundBar(ctx, x, cy - peakH, bw, 1.5, 0.75);
    ctx.fillStyle = rgba(color, 0.25);
    roundBar(ctx, x, cy + peakH, bw, 1.5, 0.75);
  }
}

function levelAt(state: RenderState, t: number): number {
  const position = Math.min(BARS - 1, Math.max(0, t * (BARS - 1)));
  const index = Math.floor(position);
  const a = state.levels[index] ?? 0;
  return a + ((state.levels[Math.min(BARS - 1, index + 1)] ?? a) - a) * (position - index);
}

function roundStage(
  w: number,
  h: number,
  reserve: number,
): { cx: number; cy: number; radius: number } {
  const top = Math.min(118, h * 0.16);
  const bottom = Math.max(top + 120, h - reserve - 8);
  const cy = (top + bottom) / 2;
  const radius = Math.max(48, Math.min(w * 0.34, (bottom - top) * 0.44));
  return { cx: w / 2, cy, radius };
}

function paintRing(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
  reduce: boolean,
): void {
  const { cx, cy, radius } = roundStage(w, h, state.reserve);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(state.t * (reduce ? 0.05 : 0.18)) * 0.08);

  const count = 70;
  const inner = radius * (0.42 + state.bass * 0.08);
  const reach = radius * 0.7;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, radius * 0.016);

  const right: { x: number; y: number }[] = [];
  const left: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const mag = levelAt(state, t);
    const len = 4 + mag * reach;
    const ang = -Math.PI / 2 + t * Math.PI;
    const mirror = Math.PI - ang;
    ctx.strokeStyle = rgba(colorAt(theme, t), 0.9);
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
    ctx.lineTo(Math.cos(ang) * (inner + len), Math.sin(ang) * (inner + len));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(mirror) * inner, Math.sin(mirror) * inner);
    ctx.lineTo(Math.cos(mirror) * (inner + len), Math.sin(mirror) * (inner + len));
    ctx.stroke();
    right.push({
      x: Math.cos(ang) * (inner + len),
      y: Math.sin(ang) * (inner + len),
    });
    left.push({
      x: Math.cos(mirror) * (inner + len),
      y: Math.sin(mirror) * (inner + len),
    });
  }

  const outer = right.concat(left.reverse());
  ctx.lineJoin = "round";
  ctx.strokeStyle = rgba(theme.high, 0.18);
  ctx.lineWidth = 8;
  traceSmooth(ctx, outer);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = rgba(theme.high, 0.9);
  ctx.lineWidth = 1.6;
  traceSmooth(ctx, outer);
  ctx.closePath();
  ctx.stroke();

  const core = ctx.createRadialGradient(0, 0, inner * 0.05, 0, 0, inner);
  core.addColorStop(0, rgba(theme.high, 0.95));
  core.addColorStop(0.42, rgba(theme.mid, 0.38 + state.bass * 0.35));
  core.addColorStop(1, rgba(theme.low, 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, inner * (0.86 + state.bass * 0.18), 0, Math.PI * 2);
  ctx.fill();

  paintPulses(ctx, theme, state, radius);
  ctx.restore();
}

function paintOrbit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
  reduce: boolean,
): void {
  const { cx, cy, radius } = roundStage(w, h, state.reserve);
  ctx.save();
  ctx.translate(cx, cy);

  const baseR = radius * (0.42 + state.bass * 0.2);
  ctx.shadowColor = rgba(theme.mid, 0.85);
  ctx.shadowBlur = reduce ? 0 : 32;
  const orb = ctx.createRadialGradient(
    -baseR * 0.28,
    -baseR * 0.32,
    baseR * 0.08,
    0,
    0,
    baseR * 1.2,
  );
  orb.addColorStop(0, rgba(theme.high, 0.95));
  orb.addColorStop(0.38, rgba(theme.mid, 0.55));
  orb.addColorStop(0.72, rgba(theme.low, 0.22));
  orb.addColorStop(1, rgba(theme.low, 0));
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(0, 0, baseR * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  for (let i = 0; i <= WAVE; i++) {
    const sample = state.wave[i % WAVE] ?? 0;
    const r = baseR * 1.45 + sample * baseR * 0.95;
    const a = (i / WAVE) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.strokeStyle = rgba(theme.high, 0.16);
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = rgba(theme.high, 0.92);
  ctx.lineWidth = 1.75;
  ctx.stroke();

  const motion = reduce ? 0.35 : 1;
  for (const particle of state.particles) {
    particle.a += particle.sp * state.motionDt * motion * (0.45 + state.energy * 2.6);
    const mag = state.levels[particle.bin] ?? 0;
    const rr = radius * particle.r + mag * radius * 0.16;
    const x = Math.cos(particle.a) * rr;
    const y = Math.sin(particle.a) * rr * 0.82;
    ctx.globalAlpha = 0.28 + mag * 0.72;
    ctx.fillStyle = rgba(colorAt(theme, particle.bin / BARS), 1);
    ctx.beginPath();
    ctx.arc(x, y, particle.s * (0.65 + mag * 1.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  paintPulses(ctx, theme, state, radius);
  ctx.restore();
}

function paintSilk(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const base = Math.max(h * 0.36, h - state.reserve - 28);
  const maxH = Math.max(90, base - h * 0.14);
  const count = 84;
  const span = Math.min(w * 0.88, 1180);
  const left = (w - span) / 2;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const level = levelAt(state, Math.pow(t, 0.92));
    pts.push({ x: left + t * span, y: base - Math.max(6, level * maxH) });
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last) return;

  const fillPath = () => {
    traceSmooth(ctx, pts);
    ctx.lineTo(last.x, base);
    ctx.lineTo(first.x, base);
    ctx.closePath();
  };

  const grad = ctx.createLinearGradient(0, base - maxH, 0, base + 8);
  grad.addColorStop(0, rgba(theme.high, 0.22));
  grad.addColorStop(0.42, rgba(theme.mid, 0.5));
  grad.addColorStop(1, rgba(theme.low, 0.02));
  ctx.fillStyle = grad;
  fillPath();
  ctx.fill();

  for (let layer = 1; layer <= 3; layer++) {
    ctx.save();
    ctx.translate(0, base * (1 - (1 - layer * 0.13)));
    ctx.scale(1, 1 - layer * 0.13);
    ctx.strokeStyle = rgba(theme.mid, 0.22 / layer);
    ctx.lineWidth = 1;
    traceSmooth(ctx, pts);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = rgba(theme.high, 0.1);
  ctx.lineWidth = 5;
  traceSmooth(ctx, pts);
  ctx.stroke();
  ctx.strokeStyle = rgba(theme.high, 0.92);
  ctx.lineWidth = 1.6;
  traceSmooth(ctx, pts);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.moveTo(first.x, base + 8);
  for (let i = 1; i < pts.length - 1; i++) {
    const point = pts[i];
    const next = pts[i + 1];
    if (!point || !next) continue;
    const y = base + (base - point.y) * 0.38;
    const ny = base + (base - next.y) * 0.38;
    ctx.quadraticCurveTo(point.x, y, (point.x + next.x) / 2, (y + ny) / 2);
  }
  ctx.lineTo(last.x, base + 8);
  ctx.strokeStyle = rgba(theme.mid, 0.8);
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
}

function paintNeedles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const base = Math.max(h * 0.3, h - state.reserve - 18);
  const maxH = Math.max(72, base - h * 0.1);
  const count = 96;
  const span = Math.min(w * 0.9, 1240);
  const left = (w - span) / 2;
  const slot = span / count;

  const floor = ctx.createLinearGradient(left, base, left + span, base);
  floor.addColorStop(0, rgba(theme.low, 0));
  floor.addColorStop(0.5, rgba(theme.mid, 0.55));
  floor.addColorStop(1, rgba(theme.low, 0));
  ctx.strokeStyle = floor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, base + 0.5);
  ctx.lineTo(left + span, base + 0.5);
  ctx.stroke();

  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const index = Math.floor(t * (BARS - 1));
    const level = state.levels[index] ?? 0;
    const peak = state.peaks[index] ?? 0;
    const x = left + i * slot + slot / 2;
    const bh = Math.max(2, level * maxH);
    const color = colorAt(theme, t);
    const needle = ctx.createLinearGradient(0, base - bh, 0, base);
    needle.addColorStop(0, rgba(theme.high, 0.9));
    needle.addColorStop(0.35, rgba(color, 0.8));
    needle.addColorStop(1, rgba(theme.low, 0.08));
    ctx.strokeStyle = needle;
    ctx.lineWidth = Math.max(1.1, slot * 0.18);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - bh);
    ctx.stroke();
    ctx.fillStyle = rgba(theme.high, 0.35 + level * 0.65);
    ctx.beginPath();
    ctx.arc(x, base - Math.max(bh, peak * maxH), Math.max(1.1, slot * 0.16), 0, Math.PI * 2);
    ctx.fill();
  }
}

function bandAverage(state: RenderState, start: number, end: number): number {
  const a = Math.max(0, Math.floor(start * (BARS - 1)));
  const b = Math.min(BARS - 1, Math.ceil(end * (BARS - 1)));
  let sum = 0;
  let n = 0;
  for (let i = a; i <= b; i++) {
    sum += state.levels[i] ?? 0;
    n += 1;
  }
  return n ? sum / n : 0;
}

function paintCrown(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
  reduce: boolean,
): void {
  const { cx, cy, radius } = roundStage(w, h, state.reserve);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(state.t * (reduce ? 0.04 : 0.12)) * 0.12);

  const inner = radius * (0.34 + state.bass * 0.05);
  const drawLayer = (count: number, reach: number, width: number, fold: boolean) => {
    const tips: { x: number; y: number }[] = [];
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const mag = levelAt(state, fold ? Math.pow(t, 0.72) : t);
      const len = 3 + mag * reach;
      const ang = -Math.PI / 2 + t * Math.PI;
      const mirror = Math.PI - ang;
      ctx.strokeStyle = rgba(colorAt(theme, t), 0.28 + mag * 0.7);
      for (const theta of [ang, mirror]) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(theta) * inner, Math.sin(theta) * inner);
        ctx.lineTo(Math.cos(theta) * (inner + len), Math.sin(theta) * (inner + len));
        ctx.stroke();
      }
      tips.push({
        x: Math.cos(ang) * (inner + len),
        y: Math.sin(ang) * (inner + len),
      });
    }
    return tips;
  };

  drawLayer(40, radius * 0.28, Math.max(2.4, radius * 0.012), true);
  const outer = drawLayer(78, radius * 0.62, Math.max(1.4, radius * 0.007), false);
  const mirrored = outer.map((point) => ({ x: -point.x, y: point.y })).reverse();
  const loop = outer.concat(mirrored);
  ctx.strokeStyle = rgba(theme.high, 0.85);
  ctx.lineWidth = 1.35;
  traceSmooth(ctx, loop);
  ctx.closePath();
  ctx.stroke();

  const core = ctx.createRadialGradient(0, 0, inner * 0.05, 0, 0, inner * 0.95);
  core.addColorStop(0, rgba(theme.high, 0.9));
  core.addColorStop(0.5, rgba(theme.mid, 0.28 + state.bass * 0.3));
  core.addColorStop(1, rgba(theme.low, 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, inner * 0.78, 0, Math.PI * 2);
  ctx.fill();
  paintPulses(ctx, theme, state, radius);
  ctx.restore();
}

function paintHalo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
  reduce: boolean,
): void {
  const { cx, cy, radius } = roundStage(w, h, state.reserve);
  ctx.save();
  ctx.translate(cx, cy);

  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands;
    const t1 = (i + 1) / bands;
    const mag = bandAverage(state, t0, t1);
    const base = radius * (0.18 + (i / (bands - 1)) * 0.82);
    const r = base * (1 + mag * 0.045);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(colorAt(theme, i / (bands - 1)), 0.18 + mag * 0.78);
    ctx.lineWidth = 1.1 + mag * (i === bands - 1 ? 5 : 3.2);
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(state.t * (reduce ? 0.15 : 0.45));
  const outerMag = bandAverage(state, 0.72, 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (1.02 + outerMag * 0.04), -0.7, 0.9);
  ctx.strokeStyle = rgba(theme.high, 0.75);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.22);
  core.addColorStop(0, rgba(theme.high, 0.85));
  core.addColorStop(1, rgba(theme.mid, 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.16 + state.bass * 0.08), 0, Math.PI * 2);
  ctx.fill();
  paintPulses(ctx, theme, state, radius * 0.92);
  ctx.restore();
}

function paintAurora(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const floor = Math.max(h * 0.72, h - state.reserve - 4);
  const bands = [
    state.bass,
    (state.bass + state.mid) * 0.5,
    state.mid,
    (state.mid + state.high) * 0.5,
    state.high,
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < bands.length; i++) {
    const mag = bands[i] ?? 0;
    const x = w * (0.14 + i * 0.18);
    const sway = Math.sin(state.t * 0.32 + i * 1.15) * w * 0.03;
    const rise = Math.min(floor - 70, h * (0.18 + mag * 0.42));
    const top = floor - rise;
    const half = w * (0.055 + mag * 0.02);
    ctx.beginPath();
    ctx.moveTo(x - half * 0.15, floor);
    ctx.bezierCurveTo(
      x - half + sway,
      floor - rise * 0.42,
      x + sway,
      top + rise * 0.2,
      x + sway * 0.6,
      top,
    );
    ctx.bezierCurveTo(
      x + sway,
      top + rise * 0.15,
      x + half + sway * 0.4,
      floor - rise * 0.5,
      x + half * 0.2,
      floor,
    );
    ctx.closePath();
    const veil = ctx.createLinearGradient(x, top, x, floor);
    veil.addColorStop(0, rgba(theme.high, 0.02 + mag * 0.42));
    veil.addColorStop(0.4, rgba(colorAt(theme, i / 4), 0.05 + mag * 0.22));
    veil.addColorStop(1, rgba(theme.low, 0));
    ctx.fillStyle = veil;
    ctx.fill();
  }
  ctx.restore();

  const haze = ctx.createLinearGradient(0, floor - 70, 0, floor);
  haze.addColorStop(0, rgba(theme.mid, 0));
  haze.addColorStop(1, rgba(theme.mid, 0.12 + state.energy * 0.28));
  ctx.fillStyle = haze;
  ctx.fillRect(0, floor - 70, w, 70);
}

function paintOrbs(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const { cx, cy, radius } = roundStage(w, h, state.reserve);
  const layout = [
    { x: 0, y: 0, band: 0.08, scale: 0.72 },
    { x: -0.62, y: -0.18, band: 0.28, scale: 0.4 },
    { x: 0.58, y: -0.28, band: 0.48, scale: 0.36 },
    { x: -0.42, y: 0.42, band: 0.7, scale: 0.32 },
    { x: 0.48, y: 0.36, band: 0.9, scale: 0.34 },
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const orb of layout) {
    const mag = levelAt(state, orb.band);
    const px = cx + orb.x * radius + Math.sin(state.t * 0.28 + orb.band * 9) * 12;
    const py = cy + orb.y * radius * 0.85 + Math.cos(state.t * 0.22 + orb.band * 6) * 10;
    const r = radius * orb.scale * (0.42 + mag * 0.9);
    const glow = ctx.createRadialGradient(px, py, 0, px, py, r);
    glow.addColorStop(0, rgba(theme.high, 0.9));
    glow.addColorStop(0.22, rgba(colorAt(theme, orb.band), 0.55));
    glow.addColorStop(1, rgba(theme.low, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function paintHorizon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
): void {
  const y = Math.min(h - state.reserve - 24, (h - state.reserve) * 0.62);
  const sunR = 22 + state.bass * Math.min(w, h) * 0.1;
  const sunX = w * 0.5 + Math.sin(state.t * 0.07) * w * 0.03;

  for (let i = 0; i < 16; i++) {
    const sx = ((i * 97 + 20) % Math.max(1, w - 8)) + 4;
    const sy = 36 + ((i * 53) % Math.max(24, y - 90));
    const twinkle = 0.2 + 0.8 * Math.abs(Math.sin(state.t * 1.3 + i));
    ctx.globalAlpha = twinkle * (0.15 + state.high * 0.85);
    ctx.fillStyle = rgba(theme.high, 1);
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  const halo = ctx.createRadialGradient(sunX, y, 0, sunX, y, sunR * 3.4);
  halo.addColorStop(0, rgba(theme.high, 0.95));
  halo.addColorStop(0.18, rgba(theme.mid, 0.45 + state.bass * 0.3));
  halo.addColorStop(1, rgba(theme.low, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, y, sunR * 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgba(theme.high, 0.94);
  ctx.beginPath();
  ctx.arc(sunX, y, sunR, 0, Math.PI * 2);
  ctx.fill();

  const ground = ctx.createLinearGradient(0, y, 0, h);
  ground.addColorStop(0, rgba(theme.low, 0.08));
  ground.addColorStop(0.2, "rgba(0,0,0,0.28)");
  ground.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, y, w, h - y);

  const amp = Math.min(72, h * 0.09) * (0.35 + state.energy);
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let i = 0; i < WAVE; i++) {
    const x = (i / (WAVE - 1)) * w;
    const sample = state.wave[i] ?? 0;
    ctx.lineTo(x, y - sample * amp);
  }
  ctx.strokeStyle = rgba(theme.high, 0.88);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.moveTo(0, y + 6);
  for (let i = 0; i < WAVE; i++) {
    const x = (i / (WAVE - 1)) * w;
    const sample = state.wave[i] ?? 0;
    ctx.lineTo(x, y + 6 + sample * amp * 0.45);
  }
  ctx.strokeStyle = rgba(theme.mid, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function paintRadialFinish(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  mode: ModeId,
  state: RenderState,
  reduce: boolean,
): void {
  const { cx, cy, radius } = roundStage(w, h, state.reserve);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 0.75;
  const inner = radius * (mode === "crown" ? 0.29 : mode === "halo" ? 0.12 : 0.36);
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, inner - i * 4, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(theme.high, i === 0 ? 0.3 : 0.1);
    ctx.stroke();
  }
  if (mode === "ring" || mode === "crown") {
    ctx.rotate(
      Math.sin(state.t * (reduce ? 0.05 : mode === "ring" ? 0.18 : 0.12)) *
        (mode === "ring" ? 0.08 : 0.12),
    );
    for (let i = 1; i < 48; i++) {
      const t = i / 48;
      const bin = Math.floor(t * (BARS - 1));
      const peak = state.peaks[bin] ?? 0;
      const r =
        radius * (mode === "ring" ? 0.42 + state.bass * 0.08 : 0.34 + state.bass * 0.05) +
        8 +
        peak * radius * (mode === "ring" ? 0.7 : 0.62);
      const angle = -Math.PI / 2 + t * Math.PI;
      ctx.fillStyle = rgba(theme.high, 0.2 + peak * 0.5);
      for (const a of [angle, Math.PI - angle]) {
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (mode === "orbit") {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3 + state.t * (reduce ? 0 : 0.035));
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.86, radius * 0.38, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(theme.mid, 0.12 + state.mid * 0.18);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

export type CoverDraw = CoverOptions & { image: HTMLImageElement | null };

function drawImageFit(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    (image.naturalHeight - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h,
  );
}

function paintCoverBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cover: CoverDraw,
): void {
  if (!cover.image || cover.placement === "center") return;
  ctx.save();
  ctx.globalAlpha = cover.opacity;
  drawImageFit(ctx, cover.image, 0, 0, w, h);
  ctx.globalAlpha = 1;
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, "rgba(0,0,0,0.3)");
  shade.addColorStop(0.5, "rgba(0,0,0,0.05)");
  shade.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function paintCoverCenter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  state: RenderState,
  cover: CoverDraw,
  reduce: boolean,
  anchor?: { cx: number; cy: number },
): void {
  if (!cover.image || cover.placement === "background") return;
  const radial = roundStage(w, h, state.reserve),
    { cx, cy } = anchor ?? radial,
    radius = radial.radius;
  const half = radius * cover.size * (cover.pulse && !reduce ? 1 + state.bass * 0.1 : 1);
  const path = () => {
    ctx.beginPath();
    if (cover.shape === "circle") ctx.arc(cx, cy, half, 0, Math.PI * 2);
    else ctx.roundRect(cx - half, cy - half, half * 2, half * 2, half * 0.12);
  };
  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12 + state.bass * 12;
  path();
  ctx.fillStyle = theme.bg;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  path();
  ctx.clip();
  drawImageFit(ctx, cover.image, cx - half, cy - half, half * 2, half * 2);
  ctx.restore();
  path();
  ctx.strokeStyle = rgba(theme.high, 0.65);
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.restore();
}

export type TitleDraw = {
  text: string;
  place: TitlePlace;
  style: TitleStyle;
};

function paintTitle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  title: TitleDraw,
  reserve: number,
): void {
  const raw = title.text.trim();
  if (!raw) return;
  const text = title.style === "wide" ? raw.toLocaleUpperCase("tr") : raw;
  const y =
    title.place === "top"
      ? Math.max(56, Math.min(72, h * 0.08))
      : title.place === "bottom"
        ? Math.max(72, h - reserve - 18)
        : (h - reserve) * 0.5;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxWidth = w * 0.84;
  const fontOf =
    title.style === "serif"
      ? (size: number) => `italic 500 ${size}px "Cormorant Garamond", Georgia, serif`
      : (size: number) => `600 ${size}px Syne, sans-serif`;
  const spaced = ctx as CanvasRenderingContext2D & { letterSpacing: string };
  let size = title.style === "serif" ? Math.min(w * 0.1, h * 0.12, 96) : Math.min(w * 0.046, 34);
  while (size > 16) {
    ctx.font = fontOf(size);
    spaced.letterSpacing = title.style === "wide" ? `${Math.max(3, size * 0.34)}px` : "1px";
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = fontOf(size);
  spaced.letterSpacing = title.style === "wide" ? `${Math.max(3, size * 0.34)}px` : "1px";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = rgba(theme.high, 0.94);
  ctx.fillText(text, w / 2, y);
  ctx.shadowBlur = 0;
  const measured = ctx.measureText(text).width;
  const rule = Math.min(measured * 0.28, w * 0.16);
  ctx.strokeStyle = rgba(theme.mid, 0.85);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2 - rule, y + size * 0.62);
  ctx.lineTo(w / 2 + rule, y + size * 0.62);
  ctx.stroke();
  ctx.restore();
}

export function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: Theme,
  mode: ModeId,
  state: RenderState,
  reserve: number,
  reduce: boolean,
  title: TitleDraw,
  finish: Finish = "cinema",
  cover?: CoverDraw,
  effects: VisualOptions = { particles: true, speed: 1 },
): void {
  state.reserve = damp(state.reserve, reserve, 8, state.dt || 0.016);
  const cx = width / 2;
  const cy = (height - state.reserve) * 0.46;
  paintBackdrop(ctx, width, height, theme, state, cx, cy);

  if (cover) paintCoverBackground(ctx, width, height, cover);
  if (effects.particles) paintAtmosphere(ctx, width, height, theme, state);

  ctx.save();
  const spectrum = !["aurora", "orbs", "horizon"].includes(mode);
  if (spectrum && finish !== "studio") {
    ctx.shadowColor = rgba(theme.mid, finish === "vivid" ? 0.7 : 0.4);
    ctx.shadowBlur = finish === "vivid" ? 16 : 7;
  }
  if (isPremiumSpectrum(mode)) paintPremiumSpectrum(ctx, width, height, theme, mode, state, reduce);
  else if (isLuxuryMode(mode)) paintLuxuryScene(ctx, width, height, theme, mode, state, reduce);
  else if (mode === "bars") paintBars(ctx, width, height, theme, state);
  else if (mode === "needles") paintNeedles(ctx, width, height, theme, state);
  else if (mode === "silk") paintSilk(ctx, width, height, theme, state);
  else if (mode === "mirror") paintMirror(ctx, width, height, theme, state);
  else if (mode === "ring") paintRing(ctx, width, height, theme, state, reduce);
  else if (mode === "crown") paintCrown(ctx, width, height, theme, state, reduce);
  else if (mode === "halo") paintHalo(ctx, width, height, theme, state, reduce);
  else if (mode === "tunnel") paintTunnel(ctx, width, height, theme, state);
  else if (mode === "flow") paintFlow(ctx, width, height, theme, state);
  else if (mode === "lattice") paintLattice(ctx, width, height, theme, state);
  else if (mode === "prism") paintPrism(ctx, width, height, theme, state);
  else if (mode === "constellation") paintConstellation(ctx, width, height, theme, state);
  else if (mode === "helix") paintHelix(ctx, width, height, theme, state);
  else if (mode === "spectrogram") paintSpectrogram(ctx, width, height, theme, state);
  else if (mode === "aurora") paintAurora(ctx, width, height, theme, state);
  else if (mode === "orbs") paintOrbs(ctx, width, height, theme, state);
  else if (mode === "horizon") paintHorizon(ctx, width, height, theme, state);
  else paintOrbit(ctx, width, height, theme, state, reduce);

  ctx.restore();
  if (effects.beatPulse && mode !== "spectrogram" && !reduce && state.rhythm.envelope > 0.02) {
    const { cx: pulseX, cy: pulseY, radius } = roundStage(width, height, state.reserve);
    ctx.save();
    ctx.translate(pulseX, pulseY);
    const envelope = state.rhythm.envelope;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (0.6 + (1 - envelope) * 0.7), 0, Math.PI * 2);
    ctx.strokeStyle = rgba(theme.high, envelope * 0.2);
    ctx.lineWidth = 1 + envelope * 2;
    ctx.stroke();
    ctx.restore();
  }
  if (["ring", "crown", "halo", "orbit"].includes(mode) && finish !== "studio") {
    paintRadialFinish(ctx, width, height, theme, mode, state, reduce);
  }
  if (cover)
    paintCoverCenter(
      ctx,
      width,
      height,
      theme,
      state,
      cover,
      reduce,
      mode === "vinyl" ? luxuryLayout(width, height, state.reserve) : undefined,
    );
  paintTitle(ctx, width, height, theme, title, state.reserve);
}
