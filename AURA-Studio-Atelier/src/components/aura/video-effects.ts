import type { Adjustment } from "./editor";

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
