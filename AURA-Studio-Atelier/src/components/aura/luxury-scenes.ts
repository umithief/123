import { rgba, mix, type Theme, type RGB, type ModeId } from "./palette";
import type { RenderState } from "./render";

const TAU = Math.PI * 2;
function band(s: RenderState, t: number) {
  const at = Math.max(0, Math.min(s.levels.length - 1, t * (s.levels.length - 1)));
  const i = Math.floor(at),
    f = at - i;
  return (s.levels[i] ?? 0) * (1 - f) + (s.levels[Math.min(i + 1, s.levels.length - 1)] ?? 0) * f;
}
function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: RGB,
  alpha: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  gradient.addColorStop(0, rgba(color, alpha));
  gradient.addColorStop(0.35, rgba(color, alpha * 0.25));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function metal(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  x: number,
  y: number,
  dx: number,
  dy: number,
) {
  const g = ctx.createLinearGradient(x, y, x + dx, y + dy);
  g.addColorStop(0, rgba(theme.low, 0.9));
  g.addColorStop(0.24, rgba(theme.mid, 0.9));
  g.addColorStop(0.46, rgba(theme.high, 1));
  g.addColorStop(0.54, rgba(theme.mid, 0.85));
  g.addColorStop(1, rgba(theme.low, 0.6));
  return g;
}
function drawGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  theme: Theme,
  intensity: number,
) {
  ctx.save();
  ctx.translate(x, y);
  const points = [
    [0, -r],
    [r * 0.65, -r * 0.22],
    [r * 0.4, r * 0.45],
    [0, r],
    [-r * 0.4, r * 0.45],
    [-r * 0.65, -r * 0.22],
  ];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fillStyle = rgba(
      i % 3 === 0 ? theme.high : i % 3 === 1 ? theme.mid : theme.low,
      0.4 + intensity * 0.55,
    );
    ctx.fill();
  }
  ctx.strokeStyle = rgba(theme.high, 0.6);
  ctx.lineWidth = Math.max(0.4, r * 0.035);
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// Rasterize the small crystal facets once per palette/intensity. Reusing this
// bounded atlas keeps chandeliers smooth on mobile instead of repainting over
// 500 tiny triangles every frame. The sprites are generated locally.
const crystals = new Map<string, HTMLCanvasElement>();
function gem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  theme: Theme,
  intensity: number,
) {
  const tier = Math.max(0, Math.min(3, Math.round(intensity * 3)));
  const key = `${theme.id}:${tier}`;
  let crystal = crystals.get(key);
  if (!crystal) {
    if (crystals.size >= 40) crystals.clear();
    crystal = document.createElement("canvas");
    crystal.width = 96;
    crystal.height = 128;
    drawGem(crystal.getContext("2d")!, 48, 64, 54, theme, tier / 3);
    crystals.set(key, crystal);
  }
  ctx.drawImage(crystal, x - (r * 48) / 54, y - (r * 64) / 54, (r * 96) / 54, (r * 128) / 54);
}

export function luxuryLayout(w: number, h: number, reserve: number) {
  const bottom = Math.max(h * 0.55, h - reserve - h * 0.08),
    top = h * 0.12;
  const available = Math.max(h * 0.3, bottom - top),
    short = Math.min(w, available);
  return { bottom, top, available, short, cx: w / 2, cy: top + available * 0.48 };
}

export function paintLuxuryScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: Theme,
  mode: ModeId,
  s: RenderState,
  reduce: boolean,
) {
  const { bottom, top, available, short, cx, cy } = luxuryLayout(w, h, s.reserve),
    t = reduce ? 0 : s.t;
  ctx.save();
  ctx.shadowBlur = 0;
  // Local clipping and relative dimensions protect all four output ratios and
  // tiny gallery thumbnails. No per-frame pixel readback or temporary canvases.
  ctx.beginPath();
  ctx.rect(w * 0.03, h * 0.04, w * 0.94, h * 0.9);
  ctx.clip();

  if (mode === "vinyl") {
    const r = short * 0.32,
      spin = t * 0.07;
    glow(ctx, cx, cy, r * 1.5, theme.mid, 0.18 + s.bass * 0.16);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = "rgba(4,4,5,0.86)";
    ctx.fill();
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.32 + i / 32), 0, TAU);
      ctx.strokeStyle = rgba(i % 5 === 0 ? theme.high : theme.mid, i % 5 === 0 ? 0.23 : 0.09);
      ctx.lineWidth = short * 0.0016;
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, a, a + 0.16);
      ctx.arc(0, 0, r * 0.31, a + 0.16, a, true);
      ctx.closePath();
      ctx.fillStyle = rgba(theme.high, 0.035 + s.high * 0.08);
      ctx.fill();
    }
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU,
        value = band(s, Math.abs(Math.sin(a / 2)));
      const length = short * (0.009 + value * 0.12);
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = metal(ctx, theme, r, 0, length, 0);
      ctx.fillRect(r + short * 0.015, -short * 0.0025, length, short * 0.005);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.27, 0, TAU);
    ctx.fillStyle = metal(ctx, theme, -r * 0.27, -r * 0.27, r * 0.54, r * 0.54);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.035, 0, TAU);
    ctx.fillStyle = theme.bg;
    ctx.fill();
    ctx.restore();
    // Tonearm gives the record a distinct silhouette without covering the label.
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.92, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.68, cy - r * 0.15);
    ctx.lineTo(cx + r * 0.34, cy + r * 0.24);
    ctx.strokeStyle = metal(ctx, theme, cx, cy - r, r, r);
    ctx.lineWidth = short * 0.013;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.92, cy - r * 0.9, short * 0.023, 0, TAU);
    ctx.fillStyle = rgba(theme.high, 0.75);
    ctx.fill();
  } else if (mode === "jewels") {
    const count = 25,
      span = w * 0.79,
      slot = span / count,
      baseline = cy + available * 0.2;
    glow(ctx, cx, baseline, short * 0.65, theme.mid, 0.1 + s.energy * 0.1);
    for (let i = 0; i < count; i++) {
      const value = band(s, Math.abs(i - (count - 1) / 2) / ((count - 1) / 2));
      const x = cx - span / 2 + (i + 0.5) * slot,
        rise = available * (0.03 + value * 0.34),
        radius = Math.min(slot * 0.65, short * 0.032) * (0.8 + value * 0.4);
      ctx.strokeStyle = rgba(theme.mid, 0.25);
      ctx.lineWidth = short * 0.0015;
      ctx.beginPath();
      ctx.moveTo(x, baseline);
      ctx.lineTo(x, baseline - rise);
      ctx.stroke();
      gem(ctx, x, baseline - rise, radius, theme, value);
      ctx.save();
      ctx.globalAlpha = 0.2;
      gem(ctx, x, baseline + rise * 0.24, radius * 0.7, theme, value);
      ctx.restore();
      ctx.fillStyle = rgba(theme.high, 0.22 + value * 0.5);
      ctx.fillRect(x - slot * 0.22, baseline - short * 0.002, slot * 0.44, short * 0.004);
    }
    ctx.strokeStyle = rgba(theme.high, 0.2);
    ctx.beginPath();
    ctx.moveTo(w * 0.1, baseline);
    ctx.lineTo(w * 0.9, baseline);
    ctx.stroke();
  } else if (mode === "ribbon") {
    const span = w * 0.88,
      left = (w - span) / 2;
    for (let ribbon = 0; ribbon < 7; ribbon++) {
      const center = cy + (ribbon - 3) * short * 0.04;
      const amplitude = short * (0.035 + s.bass * 0.07 + ribbon * 0.004);
      const path = (reverse: boolean) => {
        let previousX = 0,
          previousY = 0;
        for (let n = 0; n <= 80; n++) {
          const u = reverse ? 1 - n / 80 : n / 80,
            envelope = Math.sin(u * Math.PI);
          const wave = s.wave[Math.floor(u * (s.wave.length - 1))] ?? 0;
          const y =
            center +
            Math.sin(u * TAU * 1.5 + t * 0.55 + ribbon * 0.28) * amplitude * envelope +
            wave * amplitude * 0.5 +
            (reverse ? 1 : -1) * (short * 0.006 + band(s, u) * short * 0.026) * envelope;
          const x = left + u * span;
          if (n === 0) {
            if (reverse) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          } else
            ctx.quadraticCurveTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2);
          previousX = x;
          previousY = y;
        }
        ctx.lineTo(previousX, previousY);
      };
      ctx.beginPath();
      path(false);
      path(true);
      ctx.closePath();
      ctx.fillStyle = metal(ctx, theme, left, center - amplitude, span, amplitude * 2);
      ctx.globalAlpha = 0.42 + ribbon * 0.06;
      ctx.fill();
      ctx.strokeStyle = rgba(theme.high, 0.38);
      ctx.lineWidth = short * 0.0014;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (mode === "monolith") {
    const count = 20,
      span = w * 0.78,
      slot = span / count,
      base = cy + available * 0.23,
      depth = short * 0.02;
    for (let i = 0; i < count; i++) {
      const x = cx - span / 2 + i * slot,
        value = band(s, i / (count - 1));
      const rise = short * 0.06 + value * available * 0.42,
        bw = slot * 0.58;
      ctx.fillStyle = metal(ctx, theme, x, base - rise, bw, rise);
      ctx.fillRect(x, base - rise, bw, rise);
      ctx.beginPath();
      ctx.moveTo(x, base - rise);
      ctx.lineTo(x + depth, base - rise - depth);
      ctx.lineTo(x + bw + depth, base - rise - depth);
      ctx.lineTo(x + bw, base - rise);
      ctx.closePath();
      ctx.fillStyle = rgba(theme.high, 0.65 + value * 0.3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + bw, base - rise);
      ctx.lineTo(x + bw + depth, base - rise - depth);
      ctx.lineTo(x + bw + depth, base - depth);
      ctx.lineTo(x + bw, base);
      ctx.closePath();
      ctx.fillStyle = rgba(theme.low, 0.7);
      ctx.fill();
      ctx.fillStyle = rgba(theme.high, 0.35);
      ctx.fillRect(x + bw * 0.12, base - rise + 2, Math.max(0.4, bw * 0.08), Math.max(0, rise - 4));
      const reflection = ctx.createLinearGradient(0, base, 0, base + rise * 0.22);
      reflection.addColorStop(0, rgba(theme.mid, 0.2));
      reflection.addColorStop(1, rgba(theme.mid, 0));
      ctx.fillStyle = reflection;
      ctx.fillRect(x, base + 3, bw, rise * 0.22);
    }
  } else if (mode === "velvet") {
    const floor = top + available * 0.76;
    for (let i = 0; i < 18; i++) {
      const x = ((i + 0.5) / 18) * w,
        shade = ctx.createLinearGradient(x - w / 36, 0, x + w / 36, 0);
      shade.addColorStop(0, rgba(theme.low, 0.02));
      shade.addColorStop(0.5, rgba(theme.low, 0.12 + band(s, i / 17) * 0.1));
      shade.addColorStop(1, rgba(theme.low, 0.02));
      ctx.fillStyle = shade;
      ctx.fillRect(x - w / 36, top, w / 18, available * 0.78);
    }
    for (let i = 0; i < 5; i++) {
      const origin = w * (0.12 + i * 0.19),
        aim = cx + Math.sin(t * 0.28 + i * 1.3) * w * 0.28,
        value = band(s, i / 4);
      const spread = w * (0.035 + value * 0.1);
      const beam = ctx.createLinearGradient(origin, top, aim, floor);
      beam.addColorStop(0, rgba(theme.high, 0.26 + s.high * 0.15));
      beam.addColorStop(0.55, rgba(theme.mid, 0.06 + value * 0.15));
      beam.addColorStop(1, rgba(theme.mid, 0));
      ctx.beginPath();
      ctx.moveTo(origin, top);
      ctx.lineTo(aim + spread, floor);
      ctx.quadraticCurveTo(aim, floor + short * 0.07, aim - spread, floor);
      ctx.closePath();
      ctx.fillStyle = beam;
      ctx.fill();
      glow(ctx, aim, floor, short * 0.12, theme.high, 0.1 + value * 0.18);
    }
    ctx.beginPath();
    ctx.ellipse(cx, floor, w * 0.35, short * 0.08, 0, 0, TAU);
    ctx.strokeStyle = rgba(theme.high, 0.15 + s.bass * 0.12);
    ctx.lineWidth = short * 0.003;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, floor, w * 0.28, short * 0.05, 0, 0, Math.PI);
    ctx.strokeStyle = rgba(theme.mid, 0.17);
    ctx.stroke();
  } else if (mode === "chandelier") {
    const r = short * 0.38,
      hang = top + available * 0.12;
    ctx.beginPath();
    ctx.ellipse(cx, hang, r, r * 0.16, 0, 0, TAU);
    ctx.strokeStyle = metal(ctx, theme, cx - r, hang, r * 2, 1);
    ctx.lineWidth = short * 0.007;
    ctx.stroke();
    const strands = 17;
    for (let i = 0; i < strands; i++) {
      const phase = (i / strands) * TAU,
        depth = (Math.sin(phase) + 1) / 2;
      const x = cx + Math.cos(phase) * r,
        start = hang + Math.sin(phase) * r * 0.16;
      const value = band(s, i / (strands - 1)),
        length = available * (0.25 + 0.23 * Math.sin(phase) ** 2) * (0.96 + s.bass * 0.07);
      ctx.strokeStyle = rgba(theme.mid, 0.22 + depth * 0.35);
      ctx.lineWidth = short * 0.0014;
      ctx.beginPath();
      ctx.moveTo(x, start);
      ctx.lineTo(x + Math.sin(t * 0.35 + i) * short * 0.008, start + length);
      ctx.stroke();
      for (let n = 1; n <= 3; n++) {
        const y = start + (length * n) / 3,
          sway = (Math.sin(t * 0.35 + i) * short * 0.008 * n) / 3;
        gem(ctx, x + sway, y, short * (0.013 + depth * 0.01 + value * 0.01), theme, value);
      }
      if (value > 0.15) {
        const glint = short * (0.008 + value * 0.012),
          y = start + length;
        ctx.beginPath();
        ctx.moveTo(x - glint, y);
        ctx.lineTo(x + glint, y);
        ctx.moveTo(x, y - glint);
        ctx.lineTo(x, y + glint);
        ctx.strokeStyle = rgba(theme.high, value * 0.55);
        ctx.lineWidth = short * 0.0015;
        ctx.stroke();
      }
    }
    glow(ctx, cx, hang + available * 0.28, short * 0.6, theme.mid, 0.06 + s.energy * 0.08);
  } else if (mode === "pearls") {
    const nodes: Array<{ x: number; y: number; z: number; r: number; value: number }> = [];
    for (let i = 0; i < 36; i++) {
      const phase = i * 2.39996 + t * 0.12,
        radius = short * (0.08 + Math.sqrt(i / 35) * 0.32);
      const z = Math.sin(phase + i * 0.3),
        value = band(s, i / 35);
      nodes.push({
        x: cx + Math.cos(phase) * radius,
        y: cy + Math.sin(phase) * radius * 0.72 + Math.sin(t * 0.5 + i) * short * 0.01,
        z,
        r: short * (0.015 + (z + 1) * 0.012 + value * 0.028),
        value,
      });
    }
    nodes.sort((a, b) => a.z - b.z);
    for (const node of nodes) {
      const { x, y, r, z, value } = node;
      const pearl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.03, x, y, r);
      pearl.addColorStop(0, rgba(theme.high, 0.95));
      pearl.addColorStop(0.3, rgba(mix(theme.high, theme.mid, 0.35), 0.85));
      pearl.addColorStop(0.7, rgba(theme.mid, 0.45 + value * 0.2));
      pearl.addColorStop(1, rgba(theme.low, 0.12));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = pearl;
      ctx.globalAlpha = 0.5 + (z + 1) * 0.25;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - r * 0.16, y - r * 0.16, r * 0.74, Math.PI * 1.08, Math.PI * 1.63);
      ctx.strokeStyle = rgba(theme.high, 0.65);
      ctx.lineWidth = short * 0.001;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (mode === "cathedral") {
    const vanishY = top + available * 0.35,
      floor = top + available * 0.88;
    for (let i = 10; i >= 0; i--) {
      const depth = i / 10,
        scale = 1 - depth * 0.8,
        half = w * 0.39 * scale;
      const rise = available * 0.63 * scale,
        base = floor - depth * available * 0.42;
      const kick = band(s, depth) * short * 0.016;
      ctx.beginPath();
      ctx.moveTo(cx - half - kick, base);
      ctx.lineTo(cx - half - kick, base - rise * 0.65);
      ctx.bezierCurveTo(
        cx - half,
        base - rise * 1.08,
        cx + half,
        base - rise * 1.08,
        cx + half + kick,
        base - rise * 0.65,
      );
      ctx.lineTo(cx + half + kick, base);
      ctx.strokeStyle = metal(ctx, theme, cx - half, base - rise, half * 2, rise);
      ctx.globalAlpha = 0.2 + scale * 0.55 + s.energy * 0.1;
      ctx.lineWidth = short * (0.0015 + scale * 0.007);
      ctx.stroke();
      ctx.lineWidth = short * 0.001;
      ctx.strokeStyle = rgba(theme.high, 0.25);
      ctx.beginPath();
      ctx.moveTo(cx - half + short * 0.01, base);
      ctx.lineTo(cx - half + short * 0.01, base - rise * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, vanishY);
      ctx.lineTo(cx + i * w * 0.15, bottom);
      ctx.strokeStyle = rgba(theme.mid, 0.08 + s.bass * 0.08);
      ctx.lineWidth = short * 0.0012;
      ctx.stroke();
    }
    glow(ctx, cx, vanishY, short * 0.28, theme.high, 0.09 + s.mid * 0.2);
  }
  ctx.restore();
}
