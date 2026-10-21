import type { MotionFrame } from "./video-motion";
import { drawChromatic, filmBurn, glow, lensFlare, smear, surface, anamorphic } from "./pro-paint";

/** The Pro looks that change the picture itself: blur along the move, colour split. */
function proSource(source: HTMLCanvasElement, f: MotionFrame): HTMLCanvasElement {
  const sw = source.width,
    sh = source.height;
  let out = source;
  if (f.zoomBlur > 0.01 || Math.abs(f.streakX) + Math.abs(f.streakY) > 0.002 || f.spinBlur > 0.01) {
    out = smear(
      source,
      sw,
      sh,
      { x: -f.streakX * sw * 0.5, y: -f.streakY * sh * 0.5, rotate: -f.spinBlur / 2 },
      {
        x: f.streakX * sw * 0.5,
        y: f.streakY * sh * 0.5,
        scale: 1 + f.zoomBlur * 0.45,
        rotate: f.spinBlur / 2,
      },
      10,
      "motion-smear",
    );
  }
  if (f.chroma > 0.01) {
    const { canvas, ctx } = surface("motion-chroma", sw, sh);
    drawChromatic(ctx, out, sw, sh, f.chroma * Math.min(sw, sh) * 0.035, 0, f.chroma * 0.012);
    out = canvas;
  }
  return out;
}

function reveal(ctx: CanvasRenderingContext2D, f: MotionFrame, w: number, h: number) {
  if (f.mask === "none" || f.reveal >= 1) return;
  const p = Math.max(0, f.reveal);
  ctx.beginPath();
  if (f.mask === "iris") ctx.arc(w / 2, h / 2, (Math.hypot(w, h) * p) / 2, 0, Math.PI * 2);
  else if (f.mask === "wipe") ctx.rect(0, 0, w * p, h);
  else if (f.mask === "curtain") ctx.rect((w * (1 - p)) / 2, 0, w * p, h);
  else if (f.mask === "diamond") {
    const r = ((w + h) * p) / 2;
    ctx.moveTo(w / 2, h / 2 - r);
    ctx.lineTo(w / 2 + r, h / 2);
    ctx.lineTo(w / 2, h / 2 + r);
    ctx.lineTo(w / 2 - r, h / 2);
    ctx.closePath();
  } else for (let i = 0; i < 8; i++) ctx.rect(0, (i * h) / 8, w, (h / 8) * p);
  ctx.clip();
}
function image(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  f: MotionFrame,
  w: number,
  h: number,
) {
  if (Math.abs(f.perspective) < 0.001) {
    ctx.drawImage(source, 0, 0, w, h);
    return;
  }
  const strips = 20;
  for (let i = 0; i < strips; i++) {
    const at = i / strips,
      scale = 1 + f.perspective * (1 - ((i + 0.5) / strips) * 2);
    if (f.axis === "x")
      ctx.drawImage(
        source,
        at * source.width,
        0,
        source.width / strips,
        source.height,
        at * w,
        (h * (1 - scale)) / 2,
        w / strips + 0.5,
        h * scale,
      );
    else
      ctx.drawImage(
        source,
        0,
        at * source.height,
        source.width,
        source.height / strips,
        (w * (1 - scale)) / 2,
        at * h,
        w * scale,
        h / strips + 0.5,
      );
  }
}
export function paintVideoMotion(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  f: MotionFrame,
  w: number,
  h: number,
  time = 0,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.globalAlpha *= f.opacity;
  ctx.translate(w / 2 + f.x * w, h / 2 + f.y * h);
  ctx.rotate(f.rotation);
  ctx.scale(f.scale * f.sx, f.scale * f.sy);
  ctx.translate(-w / 2, -h / 2);
  reveal(ctx, f, w, h);
  const inherited = ctx.filter === "none" ? "" : ctx.filter;
  ctx.filter = `${inherited} brightness(${f.brightness}) blur(${(f.blur * Math.min(w, h)) / 360}px)`;
  let picture = proSource(source, f);
  if (Math.abs(f.perspective) >= 0.001 && ctx.filter !== "none") {
    // Perspective draws many strips: filter the picture once, not every strip.
    const { canvas, ctx: c } = surface("motion-filtered", picture.width, picture.height);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.filter = ctx.filter.replace(
      /blur\(([\d.]+)px\)/,
      (_, px) => `blur(${(Number(px) * canvas.width) / w}px)`,
    );
    c.drawImage(picture, 0, 0);
    c.filter = "none";
    picture = canvas;
    ctx.filter = inherited || "none";
  }
  image(ctx, picture, f, w, h);
  if (f.split) {
    ctx.save();
    ctx.globalAlpha *= 0.4;
    ctx.globalCompositeOperation = "screen";
    for (const direction of [-1, 1]) {
      ctx.filter = `sepia(1) saturate(5) hue-rotate(${direction < 0 ? -35 : 145}deg)`;
      ctx.drawImage(source, direction * f.split * w, 0, w, h);
    }
    ctx.restore();
  }
  ctx.filter = "none";
  if (f.glitch) {
    ctx.save();
    ctx.globalAlpha *= f.glitch * 0.8;
    for (let i = 0; i < 5; i++) {
      const phase = Math.floor(time * 12) + i * 2.4;
      const y = ((i * 0.183 + Math.sin(phase) * 0.03 + 1) % 1) * h;
      const band = h * (0.025 + i * 0.012);
      ctx.drawImage(
        source,
        0,
        (y / h) * source.height,
        source.width,
        (band / h) * source.height,
        Math.sin(phase * 3) * f.glitch * w * 0.09,
        y,
        w,
        band,
      );
    }
    ctx.restore();
  }
  if (f.scan) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${f.scan * 0.45})`;
    for (let y = (time * 35) % 5; y < h; y += 5) ctx.fillRect(0, y, w, 1);
    ctx.restore();
  }
  if (f.tint) {
    ctx.fillStyle = `rgba(220,18,44,${f.tint})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (f.flash) {
    ctx.fillStyle = `rgba(255,244,224,${f.flash})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (f.bloom > 0.01) glow(ctx, picture, w, h, f.bloom, Math.min(w, h) * 0.05, "#ffe6c4", 0.5);
  if (f.burn > 0.01) filmBurn(ctx, w, h, f.burn, (time * 0.35) % 1);
  if (f.flare > 0.01) {
    anamorphic(ctx, picture, w, h, f.flare * 0.8);
    lensFlare(ctx, w, h, f.flare, (0.15 + ((time * 0.45) % 1) * 0.7) * w, h * 0.42);
  }
  if (f.light) {
    const x = (((time * 0.8) % 1.6) - 0.3) * w;
    const g = ctx.createLinearGradient(x - w * 0.25, 0, x + w * 0.25, h * 0.2);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.5, `rgba(255,236,204,${f.light * 0.6})`);
    g.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
