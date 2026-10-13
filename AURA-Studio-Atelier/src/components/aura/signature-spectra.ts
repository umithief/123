import { colorAt, mix, rgba, type ModeId, type RGB, type Theme } from "./palette";
import type { RenderState } from "./render";

// The Signature collection: ten premium spectra. Every shape is driven by the
// analysed music (96 log bands, peaks, waveform, bass/mid/high, beat envelope,
// beat count and tempo) and is fully deterministic, so gallery thumbnails,
// preview and MP4 export draw the same picture. No per-frame canvases, pixel
// readback or shadows: everything stays smooth on phones.
const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function level(s: RenderState, f: number) {
  const at = Math.max(0, Math.min(s.levels.length - 1, f * (s.levels.length - 1)));
  const a = Math.floor(at),
    b = Math.min(a + 1, s.levels.length - 1);
  return (s.levels[a] ?? 0) + ((s.levels[b] ?? 0) - (s.levels[a] ?? 0)) * (at - a);
}
function peak(s: RenderState, f: number) {
  return s.peaks[Math.round(Math.max(0, Math.min(1, f)) * (s.peaks.length - 1))] ?? 0;
}
/** Average of a frequency range, f0..f1 in 0..1 of the log spectrum. */
function range(s: RenderState, f0: number, f1: number) {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += level(s, f0 + ((f1 - f0) * (i + 0.5)) / 6);
  return sum / 6;
}
function wave(s: RenderState, f: number) {
  return s.wave[Math.round(Math.max(0, Math.min(1, f)) * (s.wave.length - 1))] ?? 0;
}
/** Waveform averaged over a short window: graceful curves instead of jitter. */
function smoothWave(s: RenderState, f: number) {
  let sum = 0;
  for (let i = -6; i <= 6; i++) sum += wave(s, f + i * 0.012);
  return sum / 13;
}
function halo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number) {
  if (a <= 0.002 || r <= 1) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(0.4, rgba(c, a * 0.3));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function metal(
  ctx: CanvasRenderingContext2D,
  t: Theme,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  a = 1,
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(t.low, 0.85 * a));
  g.addColorStop(0.3, rgba(t.mid, 0.95 * a));
  g.addColorStop(0.47, rgba(t.high, a));
  g.addColorStop(0.6, rgba(t.mid, 0.85 * a));
  g.addColorStop(1, rgba(t.low, 0.6 * a));
  return g;
}
function glint(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number) {
  if (a <= 0.02) return;
  ctx.fillStyle = rgba(c, a);
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

export function paintSignatureSpectrum(
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
    cy = usable * 0.5,
    size = Math.min(w * 0.42, usable * 0.42),
    time = reduce ? 0 : s.t,
    beat = reduce ? 0 : s.rhythm.envelope,
    hair = Math.max(0.6, size * 0.004);
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (mode === "fan") {
    // A folding silk fan: the paper keeps its classic half-round silhouette;
    // the music lifts each pleat's lace edge (bass in the centre, treble outside).
    const px = cx,
      py = cy + size * 0.72,
      blades = 39,
      open = 0.94 + beat * 0.05,
      spread = Math.PI * 0.94 * open,
      r0 = size * 0.14,
      // Narrow (9:16) frames keep the open fan inside the picture.
      paper = Math.min(size * 1.02, w * 0.47 - size * 0.4);
    halo(ctx, px, py - size * 0.55, size * 1.7, theme.mid, 0.1 + s.bass * 0.16);
    for (let i = 0; i < blades; i++) {
      const u = i / (blades - 1),
        f = Math.abs(u - 0.5) * 2,
        v = level(s, f),
        a0 = -Math.PI / 2 - spread / 2 + spread * u,
        da = (spread / (blades - 1)) * 0.5,
        r1 = paper + size * v * 0.32;
      const fold = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a0) * r0, py + Math.sin(a0) * r0);
      ctx.lineTo(px + Math.cos(a0 - da) * r1, py + Math.sin(a0 - da) * r1);
      ctx.quadraticCurveTo(
        px + Math.cos(a0) * r1 * 1.05,
        py + Math.sin(a0) * r1 * 1.05,
        px + Math.cos(a0 + da) * r1,
        py + Math.sin(a0 + da) * r1,
      );
      ctx.closePath();
      const g = ctx.createLinearGradient(px, py, px + Math.cos(a0) * r1, py + Math.sin(a0) * r1);
      const c = colorAt(theme, 0.3 + f * 0.55);
      g.addColorStop(0, rgba(theme.low, 0.18));
      g.addColorStop(0.35, rgba(c, fold ? 0.3 : 0.5));
      g.addColorStop(0.8, rgba(mix(c, theme.high, v), (fold ? 0.45 : 0.68) + v * 0.3));
      g.addColorStop(1, rgba(theme.high, 0.4 + v * 0.6));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = rgba(theme.high, 0.14 + v * 0.3);
      ctx.lineWidth = hair;
      ctx.stroke();
      // Lace beads ride the held peaks.
      const p = paper + size * peak(s, f) * 0.32 + size * 0.05;
      ctx.fillStyle = rgba(theme.high, 0.4 + v * 0.5);
      ctx.beginPath();
      ctx.arc(px + Math.cos(a0) * p, py + Math.sin(a0) * p, hair * (1.2 + v * 1.5), 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = metal(ctx, theme, px - size, py, px + size, py);
    for (const [r, wdt] of [
      [paper * 0.42, 0.012],
      [paper * 0.97, 0.008],
    ]) {
      ctx.lineWidth = size * wdt;
      ctx.beginPath();
      ctx.arc(px, py, r, -Math.PI / 2 - spread / 2, -Math.PI / 2 + spread / 2);
      ctx.stroke();
    }
    ctx.fillStyle = metal(ctx, theme, px - r0, py - r0, px + r0, py + r0);
    ctx.beginPath();
    ctx.arc(px, py, size * 0.065, 0, TAU);
    ctx.fill();
  } else if (mode === "brilliant") {
    // A round brilliant seen from above: table, star, kite and upper-girdle
    // facets. Dark/bright facets alternate like real fire; each set listens
    // to a register (bass in the table, mids in the stars, treble on the rim).
    const turn = time * 0.05,
      rg = size * (0.98 + s.bass * 0.06 + beat * 0.035),
      rt = rg * 0.5,
      rs = rg * 0.76;
    const dark = mix(theme.low, [6, 6, 9], 0.7);
    halo(ctx, cx, cy, rg * 1.6, theme.mid, 0.12 + s.energy * 0.22);
    const at = (r: number, a: number): [number, number] => [
      cx + Math.cos(a + turn) * r,
      cy + Math.sin(a + turn) * r,
    ];
    const facet = (pts: [number, number][], f: number, bright: boolean) => {
      const v = level(s, f),
        light = bright ? 0.42 + v * 0.55 : 0.16 + v * 0.42;
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = rgba(mix(dark, mix(colorAt(theme, f), theme.high, v * 0.8), light), 0.86);
      ctx.fill();
      ctx.strokeStyle = rgba(theme.high, 0.2 + v * 0.35);
      ctx.lineWidth = hair;
      ctx.stroke();
    };
    const step = TAU / 8;
    for (let k = 0; k < 8; k++) {
      const a = k * step,
        m = a + step / 2;
      // Upper girdle facets
      facet([at(rs, m), at(rg, a), at(rg, m)], 0.68 + (k % 4) * 0.08, k % 2 === 0);
      facet([at(rs, m), at(rg, m), at(rg, a + step)], 0.7 + (k % 4) * 0.08, k % 2 === 1);
      // Kite (bezel) facets
      facet(
        [at(rt, a), at(rs, a - step / 2), at(rg, a), at(rs, m)],
        0.35 + (k % 4) * 0.07,
        k % 2 === 1,
      );
      // Star facets
      facet([at(rt, a), at(rt, a + step), at(rs, m)], 0.18 + (k % 4) * 0.05, k % 2 === 0);
    }
    // Glassy table: a diagonal sheen that brightens with the bass.
    const table = ctx.createLinearGradient(cx - rt, cy - rt, cx + rt, cy + rt);
    table.addColorStop(0, rgba(mix(dark, theme.high, 0.55 + s.bass * 0.4), 0.92));
    table.addColorStop(0.45, rgba(mix(dark, theme.mid, 0.3 + s.bass * 0.3), 0.92));
    table.addColorStop(0.55, rgba(mix(dark, theme.high, 0.35 + s.bass * 0.5), 0.92));
    table.addColorStop(1, rgba(mix(dark, theme.low, 0.4), 0.92));
    ctx.fillStyle = table;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const [x, y] = at(rt, k * step);
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(theme.high, 0.55);
    ctx.lineWidth = hair;
    ctx.stroke();
    // Arrows: the pavilion reflected through the table.
    ctx.strokeStyle = rgba(theme.high, 0.12 + s.mid * 0.25);
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const [x, y] = at(rt * 0.98, k * step + step / 2);
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
    }
    for (let k = 0; k <= 8; k++) {
      const [x, y] = at(rt * 0.55, k * step + step / 2);
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = metal(ctx, theme, cx - rg, cy - rg, cx + rg, cy + rg, 0.95);
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.arc(cx, cy, rg, 0, TAU);
    ctx.stroke();
    // Fire: glints on the facet corners where treble peaks.
    for (let k = 0; k < 12; k++) {
      const f = 0.55 + k * 0.035,
        p = peak(s, f);
      if (p < 0.3) continue;
      const [x, y] = at(k % 3 === 0 ? rt : k % 3 === 1 ? rs : rg, ((k * 5) % 16) * (step / 2));
      glint(ctx, x, y, size * (0.03 + p * 0.08), theme.high, Math.min(0.95, (p - 0.25) * 1.5));
    }
  } else if (mode === "tourbillon") {
    // Haute-horlogerie dial. The seconds hand advances one tick per detected
    // beat; the cage turns an eighth per beat at the detected tempo.
    const R = size * 1.02,
      bpm = s.rhythm.bpm ?? 0,
      cage = bpm ? ((time * bpm) / 60) * (TAU / 8) : time * 0.35;
    halo(ctx, cx, cy, R * 1.4, theme.mid, 0.1 + s.bass * 0.12);
    for (let ring = 0; ring < 7; ring++) {
      // Guilloché rings ripple with the mids.
      const r = R * (0.36 + ring * 0.075),
        amp = size * 0.012 * (0.4 + s.mid * 2.2);
      ctx.beginPath();
      for (let k = 0; k <= 120; k++) {
        const a = (k / 120) * TAU,
          rr = r + Math.sin(a * (12 + ring * 2) + time * 0.4 * (ring % 2 ? -1 : 1)) * amp;
        const x = cx + Math.cos(a) * rr,
          y = cy + Math.sin(a) * rr;
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = rgba(ring % 2 ? theme.mid : theme.high, 0.1 + s.mid * 0.25);
      ctx.lineWidth = hair;
      ctx.stroke();
    }
    for (let i = 0; i < 96; i++) {
      // Minute track: 96 bands as engraved ticks.
      const f = i / 96,
        v = level(s, f),
        a = f * TAU - Math.PI / 2,
        major = i % 8 === 0,
        r1 = R * (major ? 0.87 : 0.9),
        r2 = R * (0.93 + v * 0.22);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.strokeStyle = rgba(colorAt(theme, 0.3 + v * 0.7), major ? 0.9 : 0.45 + v * 0.5);
      ctx.lineWidth = major ? hair * 2.6 : hair * 1.3;
      ctx.stroke();
    }
    ctx.strokeStyle = metal(ctx, theme, cx - R, cy - R, cx + R, cy + R);
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.86, 0, TAU);
    ctx.stroke();
    // Tourbillon cage
    const tx = cx,
      ty = cy + R * 0.42,
      tr = R * 0.24;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(cage);
    ctx.strokeStyle = metal(ctx, theme, -tr, -tr, tr, tr);
    ctx.lineWidth = size * 0.016;
    ctx.beginPath();
    ctx.arc(0, 0, tr, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * tr, Math.sin(a) * tr);
      ctx.stroke();
    }
    const swing = Math.sin(time * TAU * 1.2) * (0.5 + s.high * 0.8);
    ctx.rotate(swing);
    ctx.strokeStyle = rgba(theme.high, 0.75);
    ctx.lineWidth = hair * 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, tr * 0.62, 0, TAU);
    ctx.moveTo(-tr * 0.62, 0);
    ctx.lineTo(tr * 0.62, 0);
    ctx.stroke();
    ctx.restore();
    // Hands
    const seconds = ((s.rhythm.count % 60) / 60) * TAU - Math.PI / 2,
      minutes = time * 0.02 - Math.PI / 2,
      hours = time * 0.004 + 1.2;
    const hand = (a: number, len: number, width: number, c: RGB, alpha: number) => {
      ctx.strokeStyle = rgba(c, alpha);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * len * 0.15, cy - Math.sin(a) * len * 0.15);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    };
    hand(hours, R * 0.45, size * 0.026, theme.mid, 0.95);
    hand(minutes, R * 0.68, size * 0.018, theme.high, 0.9);
    hand(seconds, R * 0.8, hair * 1.4, theme.high, 0.65 + beat * 0.35);
    ctx.fillStyle = metal(ctx, theme, cx - 10, cy - 10, cx + 10, cy + 10);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.035, 0, TAU);
    ctx.fill();
  } else if (mode === "moons") {
    // A procession of moons; each phase is the loudness of its register.
    const n = w > usable * 1.2 ? 7 : 5,
      span = Math.min(w * 0.86, usable * (n === 7 ? 2.1 : 1.05)),
      r = Math.min(span / n / 2.6, size * 0.34),
      y0 = cy + size * 0.05;
    ctx.strokeStyle = rgba(theme.mid, 0.22);
    ctx.lineWidth = hair;
    ctx.beginPath();
    for (let k = 0; k <= 60; k++) {
      const u = k / 60,
        x = cx - span / 2 + span * u,
        y = y0 - Math.sin(u * Math.PI) * r * 1.6;
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1),
        x = cx - span / 2 + span * u,
        y = y0 - Math.sin(u * Math.PI) * r * 1.6,
        f0 = i / n,
        v = Math.min(1, range(s, f0, (i + 1) / n) * 1.5),
        lit = 0.08 + v * 0.92,
        light = mix(theme.mid, theme.high, v),
        dark = mix(theme.low, [8, 8, 10], 0.75);
      halo(ctx, x, y, r * (2 + beat * 0.6), theme.mid, 0.08 + v * 0.22);
      ctx.fillStyle = rgba(dark, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      // Lit half plus a terminator ellipse: waxing from the right.
      ctx.fillStyle = rgba(light, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      ctx.fillStyle = rgba(lit >= 0.5 ? light : dark, 0.97);
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0.01, r * Math.abs(1 - lit * 2)), r, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(theme.low, 0.18 * v);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(x + r * (0.25 - k * 0.2), y + r * (k * 0.25 - 0.25), r * (0.12 + k * 0.04), 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = rgba(theme.high, 0.35 + v * 0.4);
      ctx.lineWidth = hair;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    }
  } else if (mode === "marble") {
    // Polished marble: soft veins that sway with their register, a gold vein
    // that swells on the bass. Smoothed control points, never jagged.
    const left = w * 0.02,
      right = w * 0.98,
      veins = 8,
      pts = 18;
    halo(ctx, cx, cy, size * 1.9, theme.high, 0.05 + s.energy * 0.08);
    // Slow waveform swell: an average over the whole buffer, not raw samples.
    let swell = 0;
    for (let i = 0; i < s.wave.length; i += 4) swell += Math.abs(s.wave[i] ?? 0);
    swell = Math.min(1, (swell / (s.wave.length / 4)) * 2.5);
    for (let k = 0; k < veins; k++) {
      const gold = k === 3,
        f = k / (veins - 1),
        v = gold ? s.bass : range(s, f * 0.82, f * 0.82 + 0.18),
        base = cy + (k - (veins - 1) / 2) * size * 0.22 + Math.sin(k * 2.3) * size * 0.08,
        amp = size * (0.1 + v * 0.32 + swell * 0.06),
        slope = (((k * 37) % 11) / 11 - 0.5) * size * 0.6;
      const path = new Path2D();
      let px = 0,
        py = 0;
      for (let j = 0; j <= pts; j++) {
        const u = j / pts,
          x = left + (right - left) * u,
          y =
            base +
            slope * (u - 0.5) +
            Math.sin(u * 4.1 + k * 1.7 + time * 0.2) * amp * 0.7 +
            Math.sin(u * 9.3 - k * 0.9 + time * 0.33) * amp * 0.22;
        if (j === 0) path.moveTo(x, y);
        else path.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        px = x;
        py = y;
      }
      path.lineTo(px, py);
      if (gold) {
        ctx.strokeStyle = rgba(theme.mid, 0.12 + v * 0.18);
        ctx.lineWidth = size * (0.07 + v * 0.08);
        ctx.stroke(path);
        ctx.strokeStyle = metal(ctx, theme, left, base - amp, right, base + amp);
        ctx.lineWidth = size * (0.014 + v * 0.022 + beat * 0.01);
        ctx.stroke(path);
      } else {
        const c = colorAt(theme, 0.35 + f * 0.55);
        ctx.strokeStyle = rgba(c, 0.05 + v * 0.12);
        ctx.lineWidth = size * (0.05 + v * 0.05);
        ctx.stroke(path);
        ctx.strokeStyle = rgba(c, 0.12 + v * 0.22);
        ctx.lineWidth = size * 0.012;
        ctx.stroke(path);
        ctx.strokeStyle = rgba(theme.high, 0.22 + v * 0.5);
        ctx.lineWidth = hair;
        ctx.stroke(path);
      }
    }
  } else if (mode === "organ") {
    // A symmetric pipe-organ façade; each pipe sounds its frequency band.
    const n = 23,
      floor = cy + size * 0.95,
      span = Math.min(w * 0.88, size * 2.6),
      pw = (span / n) * 0.72;
    ctx.strokeStyle = metal(ctx, theme, cx - span / 2, 0, cx + span / 2, 0, 0.8);
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.moveTo(cx - span * 0.55, floor + size * 0.04);
    ctx.lineTo(cx + span * 0.55, floor + size * 0.04);
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1),
        f = Math.abs(u - 0.5) * 2,
        v = level(s, f),
        facade = 0.55 + 0.45 * Math.cos((u - 0.5) * Math.PI * 1.15) + (i % 2 ? -0.05 : 0.05),
        ph = size * (0.55 + facade * 0.8) + v * size * 0.18,
        x = cx - span / 2 + span * u - pw / 2,
        top = floor - ph;
      ctx.fillStyle = metal(ctx, theme, x, 0, x + pw, 0, 0.55 + v * 0.45);
      ctx.beginPath();
      ctx.roundRect(x, top, pw, ph, [pw / 2, pw / 2, 0, 0]);
      ctx.fill();
      const my = floor - ph * 0.18;
      halo(
        ctx,
        x + pw / 2,
        my,
        pw * (1.4 + v * 2.2),
        colorAt(theme, 0.4 + v * 0.6),
        0.12 + v * 0.55,
      );
      ctx.fillStyle = "rgba(6, 6, 8, 0.85)";
      ctx.beginPath();
      ctx.moveTo(x + pw * 0.15, my);
      ctx.lineTo(x + pw / 2, my - pw * 0.55);
      ctx.lineTo(x + pw * 0.85, my);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(theme.high, 0.25 + v * 0.7 + beat * 0.1);
      ctx.fillRect(x + pw * 0.2, my - hair, pw * 0.6, hair * 1.6);
    }
    ctx.strokeStyle = rgba(theme.mid, 0.35 + beat * 0.3);
    ctx.lineWidth = hair * 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, floor - size * 1.62, span * 0.44, size * 0.22, 0, Math.PI, TAU);
    ctx.stroke();
  } else if (mode === "flute") {
    // A champagne flute; bubble streams rise faster with their band.
    const fh = Math.min(usable * 0.84, size * 2.3),
      top = cy - fh * 0.5,
      bowl = fh * 0.62,
      fw = Math.min(fh * 0.2, w * 0.2),
      surface = top + bowl * (0.14 - s.bass * 0.05) + Math.sin(time * 2.2) * fh * 0.004,
      bottom = top + bowl;
    const edge = (y: number) => {
      const k = Math.max(0, Math.min(1, (y - top) / bowl));
      return fw * (0.5 - Math.pow(k, 2.6) * 0.42);
    };
    halo(ctx, cx, top + bowl * 0.55, fh * 0.55, theme.mid, 0.12 + s.energy * 0.18);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - edge(surface), surface);
    for (let y = surface; y <= bottom; y += bowl / 40) ctx.lineTo(cx - edge(y), y);
    for (let y = bottom; y >= surface; y -= bowl / 40) ctx.lineTo(cx + edge(y), y);
    ctx.closePath();
    const liquid = ctx.createLinearGradient(0, surface, 0, bottom);
    liquid.addColorStop(0, rgba(theme.high, 0.4));
    liquid.addColorStop(0.5, rgba(theme.mid, 0.32 + s.mid * 0.2));
    liquid.addColorStop(1, rgba(theme.low, 0.45));
    ctx.fillStyle = liquid;
    ctx.fill();
    ctx.clip();
    for (let c = 0; c < 12; c++) {
      const f = c / 11,
        v = level(s, f),
        speed = 0.12 + v * 0.9,
        x0 = cx + (((c * 7) % 12) / 11 - 0.5) * fw * 0.7;
      for (let b = 0; b < 7; b++) {
        const p = (((time * speed + b / 7 + c * 0.137) % 1) + 1) % 1,
          y = bottom - (bottom - surface) * p,
          x = x0 + Math.sin(p * 9 + c) * fw * 0.03,
          r = fh * (0.004 + v * 0.008) * (0.6 + p * 0.6);
        ctx.fillStyle = rgba(theme.high, 0.35 + v * 0.55);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    // Fizz above the surface pops on beats.
    for (let k = 0; k < 14; k++) {
      const f = 0.55 + k * 0.03,
        v = peak(s, f),
        x = cx + (((k * 5) % 14) / 13 - 0.5) * fw * 0.9,
        y = surface - fh * (0.01 + v * 0.06 + beat * 0.03) * (0.5 + (k % 3) * 0.3);
      ctx.fillStyle = rgba(theme.high, 0.2 + v * 0.6);
      ctx.beginPath();
      ctx.arc(x, y, fh * 0.004, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(theme.high, 0.55);
    ctx.lineWidth = Math.max(1, fh * 0.004);
    ctx.beginPath();
    for (let y = top; y <= bottom; y += bowl / 40) ctx.lineTo(cx - edge(y), y);
    ctx.lineTo(cx - fw * 0.025, bottom + fh * 0.02);
    ctx.lineTo(cx - fw * 0.025, top + fh * 0.93);
    ctx.quadraticCurveTo(cx - fw * 0.5, top + fh * 0.95, cx - fw * 0.55, top + fh);
    ctx.lineTo(cx + fw * 0.55, top + fh);
    ctx.quadraticCurveTo(cx + fw * 0.5, top + fh * 0.95, cx + fw * 0.025, top + fh * 0.93);
    ctx.lineTo(cx + fw * 0.025, bottom + fh * 0.02);
    for (let y = bottom; y >= top; y -= bowl / 40) ctx.lineTo(cx + edge(y), y);
    ctx.stroke();
    ctx.strokeStyle = rgba(theme.high, 0.25 + s.high * 0.4);
    ctx.lineWidth = fw * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx - edge(top) * 0.62, top + bowl * 0.08);
    ctx.quadraticCurveTo(cx - edge(top) * 0.7, top + bowl * 0.5, cx - fw * 0.12, top + bowl * 0.85);
    ctx.stroke();
  } else if (mode === "golden") {
    // Phyllotaxis on the golden angle: bass seeds at the heart, treble outside.
    const seeds = 300,
      R = size * 1.05,
      spin = time * 0.05;
    halo(ctx, cx, cy, R * 1.3, theme.mid, 0.1 + s.bass * 0.18);
    for (const pulse of s.pulses) {
      if (reduce) break;
      ctx.strokeStyle = rgba(theme.high, pulse.life * 0.25);
      ctx.lineWidth = hair * (1 + pulse.power * 3);
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1.05 - pulse.life * 0.9), 0, TAU);
      ctx.stroke();
    }
    for (let i = seeds - 1; i >= 0; i--) {
      const f = i / seeds,
        v = level(s, f),
        r = R * Math.sqrt(f),
        a = i * GOLDEN + spin,
        dot = R * (0.012 + v * 0.03) * (0.6 + f * 0.6);
      ctx.fillStyle = rgba(mix(colorAt(theme, f), theme.high, v * 0.6), 0.45 + v * 0.55);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dot, 0, TAU);
      ctx.fill();
    }
  } else if (mode === "kaleidoscope") {
    // Twelve mirrored arms drawn from the live waveform and spectrum.
    const arms = 12,
      R = size * 1.05,
      turn = time * 0.04,
      bloom = 1 + beat * 0.06;
    const arm = new Path2D();
    for (let k = 0; k <= 48; k++) {
      const u = k / 48,
        r = R * (0.12 + u * 0.88) * bloom,
        a = (Math.PI / arms) * (0.45 + smoothWave(s, u) * 1.2) * Math.sin(u * Math.PI);
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (k) arm.lineTo(x, y);
      else arm.moveTo(x, y);
    }
    const petal = new Path2D();
    for (let k = 0; k < 4; k++) {
      const v = range(s, k / 4, (k + 1) / 4),
        r0 = R * (0.18 + k * 0.2),
        r1 = r0 + R * (0.08 + v * 0.22),
        a = (Math.PI / arms) * 0.75;
      petal.moveTo(r0, 0);
      petal.quadraticCurveTo((r0 + r1) / 2, Math.sin(a) * r1 * 0.55, r1, 0);
      petal.quadraticCurveTo((r0 + r1) / 2, -Math.sin(a) * r1 * 0.55, r0, 0);
    }
    halo(ctx, cx, cy, R * 1.25, theme.mid, 0.1 + s.energy * 0.2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(turn);
    for (let i = 0; i < arms; i++) {
      ctx.save();
      ctx.rotate((i / arms) * TAU);
      if (i % 2) ctx.scale(1, -1);
      ctx.fillStyle = rgba(colorAt(theme, 0.35 + s.mid * 0.5), 0.18 + s.mid * 0.3);
      ctx.fill(petal);
      ctx.strokeStyle = rgba(theme.high, 0.3 + s.high * 0.5);
      ctx.lineWidth = hair;
      ctx.stroke(petal);
      ctx.strokeStyle = rgba(theme.mid, 0.55 + s.energy * 0.4);
      ctx.lineWidth = hair * 1.4;
      ctx.stroke(arm);
      ctx.restore();
    }
    ctx.strokeStyle = metal(ctx, theme, -R, -R, R, R, 0.85);
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.02 * bloom, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = metal(ctx, theme, -R * 0.1, -R * 0.1, R * 0.1, R * 0.1);
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.06 + s.bass * 0.04), 0, TAU);
    ctx.fill();
    ctx.restore();
  } else {
    // Concert harp: long bass strings at the pillar, short treble strings
    // where neck and soundboard meet. Each string vibrates as a standing wave
    // whose amplitude is its band.
    const H = Math.min(usable * 0.8, size * 2.25),
      W = H * 0.62,
      x0 = cx - W * 0.42,
      x1 = cx + W * 0.46,
      base = cy + H * 0.5,
      strings = 30;
    const neck = (u: number) =>
      base - H * (0.97 - u * 0.5) + Math.sin(u * Math.PI * 1.7) * H * 0.07;
    const top1 = neck(1) + H * 0.05;
    const board = (u: number) => base - (base - top1) * u;
    halo(ctx, cx, cy, H * 0.6, theme.mid, 0.1 + s.energy * 0.16);
    for (let i = 0; i < strings; i++) {
      const u = (i + 0.5) / strings,
        v = level(s, u),
        x = x0 + (x1 - x0) * u,
        ya = neck(u) + W * 0.012,
        yb = board(u) - W * 0.02,
        amp = W * 0.022 * v,
        phase = reduce ? 0.6 : Math.sin(time * (14 + i * 1.3) + i);
      ctx.beginPath();
      for (let k = 0; k <= 14; k++) {
        const q = k / 14;
        ctx.lineTo(x + Math.sin(q * Math.PI) * amp * phase, ya + (yb - ya) * q);
      }
      const red = i % 7 === 0;
      ctx.strokeStyle = rgba(red ? theme.low : colorAt(theme, 0.4 + v * 0.6), 0.4 + v * 0.6);
      ctx.lineWidth = hair * (1.7 - u * 0.9) * (1 + v * 0.6);
      ctx.stroke();
    }
    ctx.lineCap = "round";
    ctx.strokeStyle = metal(ctx, theme, x0, base, x1, top1);
    ctx.lineWidth = W * 0.035;
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      ctx.lineTo(x0 + (x1 - x0) * u, neck(u));
    }
    ctx.lineTo(x1 + W * 0.05, top1);
    ctx.stroke();
    ctx.lineWidth = W * 0.05;
    ctx.beginPath();
    ctx.moveTo(x0 - W * 0.05, neck(0) - W * 0.03);
    ctx.quadraticCurveTo(x0 - W * 0.09, (neck(0) + base) / 2, x0 - W * 0.05, base + H * 0.03);
    ctx.stroke();
    ctx.lineWidth = W * 0.065;
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.lineTo(x1 + W * 0.05, top1);
    ctx.stroke();
    ctx.fillStyle = metal(ctx, theme, x0 - W * 0.15, 0, x0 + W * 0.15, 0);
    ctx.beginPath();
    ctx.ellipse(x0, base + H * 0.035, W * 0.13, H * 0.02, 0, 0, TAU);
    ctx.fill();
    // The crown on the pillar catches the beat.
    halo(
      ctx,
      x0 - W * 0.05,
      neck(0) - W * 0.04,
      W * (0.1 + beat * 0.12),
      theme.high,
      0.3 + beat * 0.5,
    );
  }
  ctx.restore();
}
