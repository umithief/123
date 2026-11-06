import { colorAt, mix, rgba, type ModeId, type RGB, type Theme } from "./palette";
import type { RenderState } from "./render";

// The AURA Pro "Couture" spectra: eight scenes driven by the analysed music
// (96 log bands, held peaks, waveform, bass/mid/high, beat envelope and
// count). Like the Signature collection they are fully deterministic, so the
// gallery thumbnail, the preview and the MP4 export draw the same picture,
// and they use no shadows, extra canvases or pixel reads.
const TAU = Math.PI * 2;

function level(s: RenderState, f: number) {
  const at = Math.max(0, Math.min(s.levels.length - 1, f * (s.levels.length - 1)));
  const a = Math.floor(at),
    b = Math.min(a + 1, s.levels.length - 1);
  return (s.levels[a] ?? 0) + ((s.levels[b] ?? 0) - (s.levels[a] ?? 0)) * (at - a);
}
function peak(s: RenderState, f: number) {
  return s.peaks[Math.round(Math.max(0, Math.min(1, f)) * (s.peaks.length - 1))] ?? 0;
}
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function halo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: RGB, a: number) {
  if (a <= 0.002 || r <= 1) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(0.4, rgba(c, a * 0.3));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
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

export function paintCoutureSpectrum(
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

  if (mode === "saturn") {
    // A ringed planet: each ringlet carries one part of the spectrum around it.
    const r = size * 0.56,
      tilt = 0.3,
      ringlets = 4,
      dots = 150;
    halo(ctx, cx, cy, size * 1.6, theme.mid, 0.08 + s.bass * 0.16);
    const ring = (front: boolean) => {
      for (let k = 0; k < ringlets; k++) {
        const radius = r * (1.4 + k * 0.17),
          spin = time * (0.05 + k * 0.012);
        for (let i = 0; i < dots; i++) {
          const a = (i / dots) * TAU + spin,
            sin = Math.sin(a);
          if (front !== sin > 0) continue;
          const f = (k + Math.abs((((i / dots) * 2) % 2) - 1)) / ringlets,
            v = level(s, f),
            lift = v * size * 0.07,
            x = cx + Math.cos(a) * (radius + lift),
            y = cy + sin * (radius + lift) * tilt;
          ctx.fillStyle = rgba(colorAt(theme, 0.25 + f * 0.75), 0.18 + v * 0.75);
          ctx.beginPath();
          ctx.arc(x, y, hair * (0.8 + v * 2.6), 0, TAU);
          ctx.fill();
        }
        ctx.strokeStyle = rgba(theme.mid, 0.08 + level(s, k / ringlets) * 0.2);
        ctx.lineWidth = hair;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * tilt, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
        ctx.stroke();
      }
    };
    ring(false);
    // The planet, lit from the upper left, with bands that swell with the mids.
    const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    body.addColorStop(0, rgba(theme.high, 1));
    body.addColorStop(0.45, rgba(theme.mid, 1));
    body.addColorStop(1, rgba(mix(theme.low, [0, 0, 0], 0.55), 1));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 + s.bass * 0.04), 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let b = 0; b < 9; b++) {
      const y = cy - r * 0.9 + ((b + 0.5) / 9) * r * 1.8,
        v = level(s, 0.12 + b * 0.07);
      ctx.fillStyle = rgba(b % 2 ? mix(theme.low, [0, 0, 0], 0.3) : theme.high, 0.06 + v * 0.14);
      ctx.fillRect(cx - r, y - r * (0.035 + v * 0.03), r * 2, r * (0.07 + v * 0.06));
    }
    // The night side.
    const night = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    night.addColorStop(0.45, "rgba(0,0,0,0)");
    night.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = night;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ring(true);
    // Two moons keep time.
    for (let m = 0; m < 2; m++) {
      const a = time * (0.35 - m * 0.12) + m * 2.4 + s.rhythm.count * 0.05,
        mr = r * (2.1 + m * 0.28),
        x = cx + Math.cos(a) * mr,
        y = cy + Math.sin(a) * mr * tilt;
      halo(ctx, x, y, size * 0.08, theme.high, 0.25 + beat * 0.4);
      ctx.fillStyle = rgba(theme.high, 0.85);
      ctx.beginPath();
      ctx.arc(x, y, hair * (2.4 - m * 0.6), 0, TAU);
      ctx.fill();
    }
  } else if (mode === "plasma") {
    // A plasma globe: filaments reach from the electrode to the glass, one per band group.
    const r = size * 0.92,
      core = size * 0.12,
      tick = reduce ? 0 : Math.floor(s.t * 18),
      filaments = 11;
    const inside = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    inside.addColorStop(0, rgba(theme.low, 0.25));
    inside.addColorStop(1, rgba(theme.low, 0.04));
    ctx.fillStyle = inside;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < filaments; i++) {
      const f = i / (filaments - 1),
        v = level(s, f),
        p = peak(s, f),
        a = (i / filaments) * TAU + Math.sin(time * 0.35 + i * 1.7) * 0.6 + time * 0.08,
        reach = r * (0.55 + 0.45 * Math.min(1, v * 1.6 + beat * 0.2)),
        steps = 14;
      ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const t = k / steps,
          wobble = (hash(i * 31 + k * 7 + tick * 3) - 0.5) * size * 0.09 * Math.sin(t * Math.PI),
          bend = Math.sin(t * 3 + time + i) * size * 0.05 * t,
          d = core + (reach - core) * t,
          x = cx + Math.cos(a) * d - Math.sin(a) * (wobble + bend),
          y = cy + Math.sin(a) * d + Math.cos(a) * (wobble + bend);
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      const c = colorAt(theme, 0.35 + f * 0.6);
      ctx.strokeStyle = rgba(c, 0.12 + v * 0.25);
      ctx.lineWidth = hair * (5 + v * 7);
      ctx.stroke();
      ctx.strokeStyle = rgba(mix(c, theme.high, 0.6), 0.45 + v * 0.55);
      ctx.lineWidth = hair * (1 + v * 1.6);
      ctx.stroke();
      // Where it touches the glass it blooms.
      if (reach > r * 0.9)
        halo(
          ctx,
          cx + Math.cos(a) * reach,
          cy + Math.sin(a) * reach,
          size * (0.08 + p * 0.12),
          theme.high,
          0.3 + v * 0.5,
        );
    }
    halo(ctx, cx, cy, size * (0.35 + s.bass * 0.25), theme.high, 0.55 + beat * 0.3);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = rgba(theme.high, 0.95);
    ctx.beginPath();
    ctx.arc(cx, cy, core * (0.6 + s.bass * 0.3), 0, TAU);
    ctx.fill();
    // The glass: rim and a curved highlight.
    ctx.strokeStyle = rgba(theme.high, 0.35);
    ctx.lineWidth = hair * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(theme.high, 0.22);
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, Math.PI * 1.08, Math.PI * 1.38);
    ctx.stroke();
  } else if (mode === "galaxy") {
    // A spiral galaxy seen at an angle: the core is the bass, the arms' tips the treble.
    const arms = 3,
      perArm = 220,
      tilt = 0.58,
      turn = time * 0.06,
      span = Math.min(size * 1.25, w * 0.47);
    halo(ctx, cx, cy, span * (0.45 + s.bass * 0.25), theme.high, 0.45 + beat * 0.25);
    halo(ctx, cx, cy, span * 1.1, theme.low, 0.14 + s.energy * 0.1);
    ctx.globalCompositeOperation = "lighter";
    for (let arm = 0; arm < arms; arm++)
      for (let i = 0; i < perArm; i++) {
        const t = i / perArm,
          f = t,
          v = level(s, f),
          spread = (hash(arm * 977 + i * 13) - 0.5) * (0.12 + t * 0.35),
          a = (arm / arms) * TAU + t * 4.2 + turn + spread,
          rr = span * (0.05 + t * 0.95) * (1 + (hash(i * 3.3 + arm) - 0.5) * 0.12),
          x = cx + Math.cos(a) * rr,
          y = cy + Math.sin(a) * rr * tilt,
          c = colorAt(theme, 0.3 + t * 0.7);
        ctx.fillStyle = rgba(c, 0.25 + v * 0.75);
        const dot = hair * (1.2 + v * 3 + (1 - t) * 1.2);
        ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
        // Soft light along the arms.
        if (i % 6 === 0) halo(ctx, x, y, span * (0.06 + v * 0.06), c, 0.05 + v * 0.1);
        if (i % 25 === 7)
          glint(ctx, x, y, size * 0.04 * (0.4 + peak(s, f)), theme.high, 0.25 + v * 0.6);
      }
  } else if (mode === "iznik") {
    // An İznik tile: an eight-pointed star medallion (bass), tulips and carnations
    // on its axes (low and middle bands), curling saz leaves (mids) and a beaded
    // border (treble), all framed like a glazed ceramic tile.
    const turn = time * 0.035,
      breathe = 1 + s.bass * 0.05 + beat * 0.03,
      R = size * 1.02,
      line = (a: number) => rgba(theme.high, a),
      glaze = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
    glaze.addColorStop(0, rgba(theme.high, 0.1 + s.energy * 0.06));
    glaze.addColorStop(1, rgba(theme.mid, 0.03));
    ctx.fillStyle = glaze;
    ctx.beginPath();
    ctx.roundRect(cx - R * 1.08, cy - R * 1.08, R * 2.16, R * 2.16, size * 0.06);
    ctx.fill();
    ctx.strokeStyle = rgba(theme.mid, 0.45);
    ctx.lineWidth = hair * 1.4;
    ctx.stroke();
    ctx.strokeStyle = rgba(theme.mid, 0.2);
    ctx.lineWidth = hair;
    ctx.beginPath();
    ctx.roundRect(cx - R * 1.01, cy - R * 1.01, R * 2.02, R * 2.02, size * 0.05);
    ctx.stroke();
    // Quarter rosettes in the corners.
    for (const [qx, qy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const x = cx + qx * R * 1.01,
        y = cy + qy * R * 1.01,
        base = Math.atan2(-qy, -qx);
      for (let k = -2; k <= 2; k++) {
        const a = base + k * 0.3,
          v = level(s, 0.6 + (k + 2) * 0.08);
        ctx.fillStyle = rgba(colorAt(theme, 0.4 + v * 0.6), 0.35 + v * 0.5);
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(a) * R * 0.14,
          y + Math.sin(a) * R * 0.14,
          R * (0.09 + v * 0.03),
          R * 0.03,
          a,
          0,
          TAU,
        );
        ctx.fill();
      }
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(breathe, breathe);
    ctx.rotate(turn);
    // Saz leaves: long, curling leaves with a vein, sweeping round the medallion.
    for (let i = 0; i < 16; i++) {
      const f = 0.3 + (Math.abs(i - 8) / 8) * 0.3,
        v = level(s, f),
        len = R * (0.42 + v * 0.16),
        wide = R * 0.07;
      ctx.save();
      ctx.rotate((i / 16) * TAU + 0.2);
      ctx.translate(0, -R * 0.42);
      ctx.rotate(0.5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(wide * 1.5, -len * 0.3, wide * 1.1, -len * 0.8, len * 0.14, -len);
      ctx.bezierCurveTo(-wide * 0.1, -len * 0.78, -wide * 0.9, -len * 0.38, 0, 0);
      ctx.fillStyle = rgba(colorAt(theme, 0.2 + v * 0.35), 0.55 + v * 0.35);
      ctx.fill();
      ctx.strokeStyle = line(0.3 + v * 0.4);
      ctx.lineWidth = hair;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wide * 0.5, -len * 0.55, len * 0.12, -len * 0.96);
      ctx.strokeStyle = line(0.2 + v * 0.3);
      ctx.stroke();
      ctx.restore();
    }
    // Tulips and carnations alternate on the sixteen axes.
    for (let i = 0; i < 8; i++) {
      const v = level(s, (Math.abs(i - 4) / 4) * 0.25),
        c = level(s, 0.25 + (Math.abs(i - 4) / 4) * 0.2);
      // Tulip: a stem, a cup and three pointed petals.
      ctx.save();
      ctx.rotate((i / 8) * TAU);
      const stem = R * (0.32 + v * 0.1),
        cup = R * (0.15 + v * 0.05);
      ctx.strokeStyle = line(0.55);
      ctx.lineWidth = hair * 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.2);
      ctx.lineTo(0, -stem);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-cup * 0.55, -stem);
      ctx.quadraticCurveTo(-cup * 0.75, -stem - cup * 0.7, -cup * 0.5, -stem - cup * 1.25);
      ctx.lineTo(-cup * 0.2, -stem - cup * 0.75);
      ctx.lineTo(0, -stem - cup * 1.5);
      ctx.lineTo(cup * 0.2, -stem - cup * 0.75);
      ctx.lineTo(cup * 0.5, -stem - cup * 1.25);
      ctx.quadraticCurveTo(cup * 0.75, -stem - cup * 0.7, cup * 0.55, -stem);
      ctx.quadraticCurveTo(0, -stem + cup * 0.25, -cup * 0.55, -stem);
      ctx.fillStyle = rgba(colorAt(theme, 0.6 + v * 0.4), 0.8 + v * 0.2);
      ctx.fill();
      ctx.stroke();
      // Carnation between two tulips: a fan of five petals.
      ctx.rotate(TAU / 16);
      const reach = R * (0.27 + c * 0.1);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.2);
      ctx.lineTo(0, -reach);
      ctx.stroke();
      for (let k = -2; k <= 2; k++) {
        ctx.fillStyle = rgba(colorAt(theme, 0.45 + c * 0.5), 0.65 + c * 0.3);
        ctx.beginPath();
        ctx.ellipse(
          Math.sin(k * 0.45) * R * 0.06,
          -reach - Math.cos(k * 0.45) * R * 0.06,
          R * (0.022 + c * 0.012),
          R * 0.055,
          k * 0.45,
          0,
          TAU,
        );
        ctx.fill();
      }
      ctx.restore();
    }
    // Eight-pointed star medallion.
    const star = R * (0.2 + s.bass * 0.05);
    ctx.fillStyle = rgba(theme.mid, 0.9);
    ctx.strokeStyle = line(0.8);
    ctx.lineWidth = hair * 1.4;
    for (const offset of [0, Math.PI / 4]) {
      ctx.save();
      ctx.rotate(offset);
      ctx.beginPath();
      ctx.rect(-star * 0.7, -star * 0.7, star * 1.4, star * 1.4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = rgba(theme.high, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, star * 0.42, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(theme.low, 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, star * 0.28, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // Beaded border: one bead per pair of treble bands.
    for (let i = 0; i < 48; i++) {
      const f = 0.55 + ((i % 24) / 24) * 0.45,
        v = level(s, f),
        a = (i / 48) * TAU - turn * 0.5,
        x = cx + Math.cos(a) * R * 0.94,
        y = cy + Math.sin(a) * R * 0.94;
      ctx.fillStyle = rgba(colorAt(theme, 0.5 + v * 0.5), 0.35 + v * 0.65);
      ctx.beginPath();
      ctx.arc(x, y, hair * (1.6 + v * 3), 0, TAU);
      ctx.fill();
    }
  } else if (mode === "skyline") {
    // A night skyline: towers rise with their bands, windows light with the music,
    // and the whole city is mirrored in the water.
    const horizon = usable * 0.7,
      n = Math.max(18, Math.min(48, Math.round(w / 30))),
      bw = w / n,
      sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, rgba(theme.low, 0.02));
    sky.addColorStop(1, rgba(theme.low, 0.22 + s.energy * 0.12));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);
    const mx = w * 0.78,
      my = usable * 0.2;
    halo(ctx, mx, my, size * (0.35 + s.bass * 0.2), theme.high, 0.25 + beat * 0.2);
    ctx.fillStyle = rgba(theme.high, 0.9);
    ctx.beginPath();
    ctx.arc(mx, my, size * 0.09, 0, TAU);
    ctx.fill();
    const towers: Array<{ x: number; width: number; top: number; v: number; f: number }> = [];
    for (let i = 0; i < n; i++) {
      // Bass in the middle of the city, treble at its edges.
      const f = Math.abs((i + 0.5) / n - 0.5) * 2,
        v = level(s, f),
        gap = bw * (0.08 + hash(i * 3.1) * 0.12),
        tall = usable * (0.08 + hash(i * 7.7) * 0.08 + v * 0.42);
      towers.push({ x: i * bw + gap / 2, width: bw - gap, top: horizon - tall, v, f });
    }
    for (const t of towers) {
      const g = ctx.createLinearGradient(0, t.top, 0, horizon);
      g.addColorStop(0, rgba(mix(theme.low, theme.mid, 0.3), 0.95));
      g.addColorStop(1, rgba(mix(theme.low, [0, 0, 0], 0.6), 0.98));
      ctx.fillStyle = g;
      ctx.fillRect(t.x, t.top, t.width, horizon - t.top);
      // Windows.
      const cols = Math.max(1, Math.floor(t.width / Math.max(3, size * 0.035))),
        cw = t.width / cols,
        rows = Math.floor((horizon - t.top) / (cw * 1.4));
      for (let r = 1; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const seed = hash(t.x * 0.37 + r * 7.1 + c * 13.3);
          if (seed > 0.18 + t.v * 0.7) continue;
          ctx.fillStyle = rgba(seed < 0.08 ? theme.high : theme.mid, 0.45 + t.v * 0.5);
          ctx.fillRect(t.x + c * cw + cw * 0.25, t.top + r * cw * 1.4, cw * 0.5, cw * 0.7);
        }
      // Rooftop beacons blink on the beat.
      if (hash(t.x) > 0.6) {
        ctx.fillStyle = rgba(theme.high, 0.4 + beat * 0.6);
        ctx.fillRect(t.x + t.width / 2 - hair, t.top - size * 0.05, hair * 2, size * 0.05);
        halo(
          ctx,
          t.x + t.width / 2,
          t.top - size * 0.05,
          size * 0.04,
          theme.high,
          0.2 + beat * 0.5,
        );
      }
    }
    // Water: a broken reflection that drifts.
    const depth = Math.min(h, usable) - horizon;
    for (const t of towers) {
      const tall = Math.min(depth, (horizon - t.top) * 0.75);
      for (let y = 0; y < tall; y += Math.max(2, size * 0.02)) {
        const shift = Math.sin(y * 0.12 + time * 1.4 + t.x * 0.01) * size * 0.012;
        ctx.fillStyle = rgba(theme.mid, (0.18 + t.v * 0.25) * (1 - y / tall));
        ctx.fillRect(t.x + shift, horizon + y, t.width, Math.max(1, size * 0.008));
      }
    }
    ctx.fillStyle = rgba(theme.high, 0.5);
    ctx.fillRect(0, horizon, w, hair);
  } else if (mode === "synthwave") {
    // A retro sunset: striped sun, spectrum mountains and a grid running in time.
    const horizon = usable * 0.6,
      sunR = size * 0.62,
      sunY = horizon - sunR * 0.15;
    for (let k = 0; k < 40; k++) {
      const x = hash(k * 3.7) * w,
        y = hash(k * 9.1) * horizon * 0.8;
      ctx.fillStyle = rgba(theme.high, 0.2 + 0.5 * Math.max(0, Math.sin(time * 1.5 + k)));
      ctx.fillRect(x, y, hair * 1.4, hair * 1.4);
    }
    halo(ctx, cx, sunY, sunR * 1.9, theme.mid, 0.18 + s.bass * 0.2 + beat * 0.1);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, sunY, sunR * (1 + s.bass * 0.03), 0, TAU);
    ctx.clip();
    const sun = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sun.addColorStop(0, rgba(theme.high, 1));
    sun.addColorStop(0.55, rgba(theme.mid, 1));
    sun.addColorStop(1, rgba(theme.low, 1));
    ctx.fillStyle = sun;
    // Bands thin out towards the bottom, the classic striped sun.
    let y = sunY - sunR;
    for (let k = 0; y < horizon; k++) {
      const band = sunR * (0.26 - k * 0.022),
        gap = sunR * (0.012 + k * 0.016);
      if (band <= 0) break;
      ctx.fillRect(cx - sunR, y, sunR * 2, Math.min(band, horizon - y));
      y += band + gap;
    }
    ctx.restore();
    // Mountains: the spectrum, mirrored with the bass in the middle.
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    const points = 48;
    for (let i = 0; i <= points; i++) {
      const u = i / points,
        f = Math.abs(u - 0.5) * 2,
        v = level(s, f),
        ridge = horizon - usable * (0.04 + v * 0.22) * (0.4 + 0.6 * Math.sin(u * Math.PI));
      ctx.lineTo(u * w, ridge);
    }
    ctx.lineTo(w, horizon);
    ctx.closePath();
    ctx.fillStyle = rgba(mix(theme.low, [0, 0, 0], 0.65), 0.96);
    ctx.fill();
    ctx.strokeStyle = rgba(theme.mid, 0.6 + s.energy * 0.4);
    ctx.lineWidth = hair * 1.6;
    ctx.stroke();
    // The floor grid, scrolling one line per beat-ish.
    const floor = Math.min(h, usable) - horizon,
      scroll = (time * 0.6) % 1,
      lines = ctx.createLinearGradient(0, horizon, 0, horizon + floor);
    lines.addColorStop(0, rgba(theme.mid, 0.15));
    lines.addColorStop(1, rgba(theme.mid, 0.6 + beat * 0.4));
    ctx.strokeStyle = lines;
    ctx.lineWidth = hair * 1.2;
    ctx.beginPath();
    for (let k = 0; k < 12; k++) {
      const yy = horizon + floor * ((k + scroll) / 12) ** 2.2;
      ctx.moveTo(0, yy);
      ctx.lineTo(w, yy);
    }
    for (let k = -12; k <= 12; k++) {
      ctx.moveTo(cx + k * w * 0.02, horizon);
      ctx.lineTo(cx + k * w * 0.16, horizon + floor);
    }
    ctx.stroke();
  } else if (mode === "hyperspace") {
    // Hyperspace: stars streak out of the centre; the louder their band, the longer.
    const reach = Math.hypot(w, usable) * 0.55,
      stars = 170;
    halo(ctx, cx, cy, size * (0.3 + s.bass * 0.3), theme.high, 0.3 + beat * 0.35);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < stars; i++) {
      const f = hash(i * 1.37),
        v = level(s, f),
        a = hash(i * 7.31) * TAU,
        z = (hash(i * 3.9) + time * (0.18 + hash(i * 5.3) * 0.12)) % 1,
        r = z * z * reach,
        streak = Math.min(r, r * (0.08 + v * 0.55 + s.energy * 0.2)),
        x0 = cx + Math.cos(a) * (r - streak),
        y0 = cy + Math.sin(a) * (r - streak),
        x1 = cx + Math.cos(a) * r,
        y1 = cy + Math.sin(a) * r;
      ctx.strokeStyle = rgba(
        colorAt(theme, 0.35 + f * 0.65),
        (0.15 + v * 0.75) * Math.min(1, z * 3),
      );
      ctx.lineWidth = hair * (0.6 + z * 2.4);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    // The jump ring pulses with each beat.
    if (beat > 0.02) {
      ctx.strokeStyle = rgba(theme.high, beat * 0.5);
      ctx.lineWidth = hair * (1 + beat * 3);
      ctx.beginPath();
      ctx.arc(cx, cy, size * (0.25 + (1 - beat) * 0.9), 0, TAU);
      ctx.stroke();
    }
  } else if (mode === "led") {
    // A club LED wall: a dot-matrix spectrum with held peaks and a glossy panel.
    const cols = w >= usable ? 32 : 20,
      rows = 16,
      panelW = Math.min(w * 0.9, size * 2.4),
      pitch = panelW / cols,
      panelH = pitch * rows,
      left = cx - panelW / 2,
      top = cy - panelH / 2,
      dot = pitch * 0.34;
    ctx.fillStyle = rgba(mix(theme.low, [0, 0, 0], 0.85), 0.85);
    ctx.beginPath();
    ctx.roundRect(
      left - pitch * 0.6,
      top - pitch * 0.6,
      panelW + pitch * 1.2,
      panelH + pitch * 1.2,
      pitch * 0.6,
    );
    ctx.fill();
    ctx.strokeStyle = rgba(theme.mid, 0.3);
    ctx.lineWidth = hair;
    ctx.stroke();
    for (let c = 0; c < cols; c++) {
      const f = c / (cols - 1),
        lit = Math.round(Math.min(1, level(s, f) * 1.25) * rows),
        held = Math.min(rows - 1, Math.round(Math.min(1, peak(s, f) * 1.25) * rows));
      for (let r = 0; r < rows; r++) {
        const on = r < lit,
          isPeak = r === held && held > 0,
          x = left + (c + 0.5) * pitch,
          y = top + panelH - (r + 0.5) * pitch,
          colour = colorAt(theme, r / (rows - 1));
        if (on || isPeak) {
          ctx.fillStyle = rgba(colour, 0.18);
          ctx.beginPath();
          ctx.arc(x, y, dot * 1.9, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = on
          ? rgba(colour, 0.95)
          : isPeak
            ? rgba(theme.high, 1)
            : rgba(theme.low, 0.12);
        ctx.beginPath();
        ctx.arc(x, y, dot, 0, TAU);
        ctx.fill();
      }
    }
    // Gloss across the top of the panel.
    const gloss = ctx.createLinearGradient(0, top, 0, top + panelH * 0.5);
    gloss.addColorStop(0, "rgba(255,255,255,0.08)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(left - pitch * 0.4, top - pitch * 0.4, panelW + pitch * 0.8, panelH * 0.5);
  }
  ctx.restore();
}
