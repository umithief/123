import type { Adjustment } from "./editor";
import {
  anamorphic,
  density,
  drawChromatic,
  glow,
  hash,
  highlights,
  smear,
  surface,
} from "./pro-paint";

/** A still copy of what is painted so far (the effect reads it back). */
function snapshot(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { canvas, ctx: c } = surface("effect-snapshot", w, h, density(ctx));
  c.clearRect(0, 0, w, h);
  c.drawImage(ctx.canvas, 0, 0, w, h);
  return canvas;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, at: number, amount: number) {
  let seed = Math.floor(at * 24) + 77;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const dot = Math.max(1, Math.min(w, h) / 360);
  ctx.save();
  ctx.globalAlpha = amount;
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 2 ? "rgba(255,248,236,0.22)" : "rgba(0,0,0,0.28)";
    ctx.fillRect(rand() * w, rand() * h, dot, dot);
  }
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.25,
    w / 2,
    h / 2,
    Math.hypot(w, h) * 0.55,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintProEffect(
  ctx: CanvasRenderingContext2D,
  id: string,
  amount: number,
  at: number,
  w: number,
  h: number,
) {
  const short = Math.min(w, h);
  ctx.save();
  if (id === "pro-anamorphic") {
    const frame = snapshot(ctx, w, h);
    anamorphic(ctx, frame, w, h, amount);
    glow(ctx, frame, w, h, amount * 0.35, short * 0.03, "#7fc3ff", 0.65);
  } else if (id === "pro-bloom") {
    const frame = snapshot(ctx, w, h);
    glow(ctx, frame, w, h, amount * 0.9, short * 0.06, "#ffd9a8", 0.5);
    glow(ctx, frame, w, h, amount * 0.5, short * 0.015, undefined, 0.62);
  } else if (id === "pro-halation") {
    const frame = snapshot(ctx, w, h);
    // Red light bleeding around the highlights, as on colour negative film.
    const bright = highlights(frame, w, h, 0.62);
    const { canvas, ctx: c } = surface("halation", bright.width, bright.height);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(bright, 0, 0);
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "#ff3a1e";
    c.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = amount * 0.9;
    ctx.filter = `blur(${short * 0.025}px)`;
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = amount * 0.35;
    ctx.fillStyle = "#e8a060";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    vignette(ctx, w, h, 0.45 * amount);
    grain(ctx, w, h, at, amount);
  } else if (id === "pro-chroma") {
    const frame = snapshot(ctx, w, h);
    drawChromatic(ctx, frame, w, h, 0, 0, amount * 0.02);
    vignette(ctx, w, h, 0.3 * amount);
  } else if (id === "pro-rays") {
    const frame = snapshot(ctx, w, h);
    // Volumetric rays: the highlights blurred outward from a light above.
    const bright = highlights(frame, w, h, 0.6);
    const rays = smear(
      bright,
      bright.width,
      bright.height,
      { scale: 1 },
      { scale: 1.9, y: bright.height * 0.25 },
      14,
      "rays",
    );
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = Math.min(1, amount);
    ctx.filter = `brightness(${1.3 + amount * 0.6}) sepia(0.3)`;
    ctx.drawImage(rays, 0, -h * 0.1, w, h);
    ctx.filter = "none";
  } else if (id === "pro-neon") {
    const frame = snapshot(ctx, w, h);
    const { canvas, ctx: c } = surface("neon", w, h, density(ctx));
    c.filter = "grayscale(1) contrast(1.25)";
    c.drawImage(frame, 0, 0, w, h);
    c.filter = "none";
    // Duotone: shadows to deep violet, highlights to hot pink and cyan.
    c.globalCompositeOperation = "multiply";
    c.fillStyle = "#5a2bff";
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "screen";
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#ff2fa0");
    g.addColorStop(1, "#18e0ff");
    c.globalAlpha = 0.45;
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    ctx.globalAlpha = amount;
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.globalAlpha = 1;
    glow(ctx, canvas, w, h, amount * 0.8, short * 0.04, undefined, 0.5);
  } else if (id === "pro-vhs") {
    const frame = snapshot(ctx, w, h);
    drawChromatic(ctx, frame, w, h, short * 0.006 * amount + short * 0.002, 0);
    // Tape colour: a little washed out.
    ctx.globalCompositeOperation = "saturation";
    ctx.globalAlpha = 0.25 * amount;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    // Tracking noise: a rolling band of torn lines.
    const band = ((at * 0.18) % 1.2) * h - h * 0.1;
    for (let i = 0; i < 6; i++) {
      const y = band + i * short * 0.012,
        shift = (hash(Math.floor(at * 30) + i) - 0.5) * w * 0.05 * amount;
      const bh = short * 0.01,
        sy = (y / h) * frame.height,
        sbh = (bh / h) * frame.height;
      if (sy < 0 || sy + sbh > frame.height) continue;
      ctx.drawImage(frame, 0, sy, frame.width, sbh, shift, y, w, bh);
      ctx.fillStyle = `rgba(255,255,255,${0.12 * amount})`;
      ctx.fillRect(0, y, w, bh);
    }
    ctx.fillStyle = `rgba(0,0,0,${0.18 * amount})`;
    for (let y = 0; y < h; y += Math.max(2, short / 220)) ctx.fillRect(0, y, w, 1);
    // The recorder's on-screen display.
    ctx.globalAlpha = 0.85 * amount;
    ctx.fillStyle = "#f4f4f4";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = short * 0.01;
    ctx.font = `600 ${short * 0.045}px ui-monospace, "Courier New", monospace`;
    ctx.fillText("PLAY ▶", short * 0.06, short * 0.1);
    const seconds = Math.floor(at),
      clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    ctx.textAlign = "right";
    ctx.fillText(`SP  0:${clock}`, w - short * 0.06, h - short * 0.07);
  } else if (id === "pro-scope") {
    const frame = snapshot(ctx, w, h);
    // Teal shadows, warm highlights.
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = 0.55 * amount;
    ctx.fillStyle = "#14707a";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    glow(ctx, frame, w, h, amount * 0.45, short * 0.03, "#ff9a4a", 0.55);
    vignette(ctx, w, h, 0.35 * amount);
    grain(ctx, w, h, at, amount * 0.6);
    // 2.39:1 bars on a landscape frame; a narrower band on tall frames.
    const inner = w / h > 1.2 ? Math.min(h, w / 2.39) : h * 0.86,
      bar = ((h - inner) / 2) * Math.min(1, amount * 1.4);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, bar);
    ctx.fillRect(0, h - bar, w, bar);
  }
  ctx.restore();
}

// The composition clock keeps seeking, preview and export in sync. Dimensions
// are relative to the actual frame, so portrait and landscape retain proportions.
export function paintVideoEffect(
  ctx: CanvasRenderingContext2D,
  a: Adjustment,
  time: number,
  w: number,
  h: number,
  reducedMotion = false,
) {
  if (a.effect === "none" || a.effectAmount <= 0) return;
  const amount = a.effectAmount,
    short = Math.min(w, h),
    at = reducedMotion ? 0 : time;
  if (a.effect.startsWith("pro-")) {
    paintProEffect(ctx, a.effect, amount, at, w, h);
    return;
  }
  ctx.save();
  ctx.globalAlpha = amount;
  if (a.effect === "grain") {
    let seed = Math.floor(at * 18) + 1931;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const dot = short / 240;
    for (let i = 0; i < 650; i++) {
      ctx.fillStyle = i % 2 ? "rgba(255,249,235,0.25)" : "rgba(0,0,0,0.3)";
      ctx.fillRect(rand() * w, rand() * h, dot, dot);
    }
  } else if (a.effect === "leak" || a.effect === "prism") {
    ctx.globalCompositeOperation = "screen";
    const colors = a.effect === "leak" ? ["#ff672a", "#ffdba3"] : ["#ff66cc", "#66ddff", "#ffdd88"];
    colors.forEach((color, index) => {
      const x = (0.08 + index * 0.45 + Math.sin(at * 0.35 + index * 2) * 0.14) * w;
      const y = (0.1 + index * 0.35 + Math.cos(at * 0.25 + index) * 0.1) * h;
      const light = ctx.createRadialGradient(x, y, 0, x, y, short * 0.9);
      light.addColorStop(0, color + "88");
      light.addColorStop(0.45, color + "22");
      light.addColorStop(1, color + "00");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, w, h);
    });
  } else if (a.effect === "scanlines") {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    const pitch = short / 90;
    for (let y = (at * 5) % pitch; y < h; y += pitch) ctx.fillRect(0, y, w, pitch * 0.3);
    const band = ctx.createLinearGradient(0, 0, 0, h);
    band.addColorStop(0, "transparent");
    band.addColorStop(0.5, "rgba(160,220,255,0.07)");
    band.addColorStop(1, "transparent");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);
  } else if (a.effect === "frame") {
    const inset = short * 0.025;
    ctx.strokeStyle = "#fff3d7";
    ctx.lineWidth = short * 0.003;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, inset * 0.7);
    ctx.fillRect(0, h - inset * 0.7, w, inset * 0.7);
  } else if (a.effect === "dream") {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = amount * 0.24;
    ctx.filter = `blur(${short * 0.018}px)`;
    ctx.drawImage(ctx.canvas, 0, 0, w, h);
    ctx.filter = "none";
    ctx.globalAlpha = amount * 0.15;
    ctx.fillStyle = "#ffe2bd";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
