// AURA Pro Couture animations: the drawing behind the new MotionFrame
// controls. The picture-level looks (neon outline, kaleidoscope, water
// ripple, holographic sheen) turn the clip's frame into a new picture before
// it is placed; fold and triptych change how it is placed; echoes are drawn
// behind it and bokeh discs on top. Gallery previews and the export share
// this code.
import type { MotionFrame } from "./video-motion";
import { clamp01, hash, surface } from "./pro-paint";

const TAU = Math.PI * 2;

function neon(picture: HTMLCanvasElement, amount: number, time: number) {
  const sw = picture.width,
    sh = picture.height,
    k = 0.5,
    nw = Math.max(8, Math.round(sw * k)),
    nh = Math.max(8, Math.round(sh * k));
  // Edges: the picture minus itself nudged by a pixel and a half.
  const edge = surface("couture-neon-edge", nw, nh);
  edge.ctx.clearRect(0, 0, nw, nh);
  edge.ctx.filter = "grayscale(1) contrast(1.6)";
  edge.ctx.drawImage(picture, 0, 0, nw, nh);
  edge.ctx.globalCompositeOperation = "difference";
  edge.ctx.drawImage(picture, 1.5, 1.5, nw, nh);
  edge.ctx.globalCompositeOperation = "source-over";
  edge.ctx.filter = "none";
  const lit = surface("couture-neon-lit", nw, nh);
  lit.ctx.fillStyle = "#000";
  lit.ctx.fillRect(0, 0, nw, nh);
  lit.ctx.filter = "brightness(4.5) contrast(2.4)";
  lit.ctx.drawImage(edge.canvas, 0, 0);
  lit.ctx.filter = "none";
  // Tube colours drift slowly across the frame.
  const shift = (time * 0.15) % 1,
    tube = lit.ctx.createLinearGradient(nw * (shift - 0.5), 0, nw * (shift + 1), nh);
  tube.addColorStop(0, "#38f4ff");
  tube.addColorStop(0.45, "#ff42d6");
  tube.addColorStop(0.75, "#ffe356");
  tube.addColorStop(1, "#38f4ff");
  lit.ctx.globalCompositeOperation = "multiply";
  lit.ctx.fillStyle = tube;
  lit.ctx.fillRect(0, 0, nw, nh);
  lit.ctx.globalCompositeOperation = "source-over";
  // The glow is blurred at half size: same look, a fraction of the work.
  const soft = surface("couture-neon-glow", nw, nh);
  soft.ctx.clearRect(0, 0, nw, nh);
  soft.ctx.filter = `blur(${Math.max(1, nw * 0.008)}px)`;
  soft.ctx.drawImage(lit.canvas, 0, 0);
  soft.ctx.filter = "none";
  const out = surface("couture-neon", sw, sh),
    o = out.ctx,
    flicker = 0.88 + hash(Math.floor(time * 18)) * 0.12;
  o.fillStyle = "#05040b";
  o.fillRect(0, 0, sw, sh);
  o.globalAlpha = 1 - amount;
  o.drawImage(picture, 0, 0);
  o.globalCompositeOperation = "lighter";
  o.globalAlpha = Math.min(1, amount * 1.2) * flicker;
  o.imageSmoothingQuality = "high";
  o.drawImage(soft.canvas, 0, 0, sw, sh);
  o.drawImage(lit.canvas, 0, 0, sw, sh);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  return out.canvas;
}

function kaleidoscope(picture: HTMLCanvasElement, amount: number, time: number) {
  const sw = picture.width,
    sh = picture.height,
    out = surface("couture-kaleido", sw, sh),
    o = out.ctx,
    wedges = 8,
    step = TAU / wedges,
    reach = Math.hypot(sw, sh) / 2 + 2,
    spin = time * 0.25 + amount * 0.8;
  // The picture with mirrored copies all round (at half size), so a turning
  // wedge always finds picture without zooming in on the middle.
  const pw = Math.max(4, Math.round(sw / 2)),
    ph = Math.max(4, Math.round(sh / 2)),
    pad = surface("couture-kaleido-pad", pw * 3, ph * 3);
  for (let gx = -1; gx <= 1; gx++)
    for (let gy = -1; gy <= 1; gy++) {
      pad.ctx.save();
      pad.ctx.translate((gx + 1.5) * pw, (gy + 1.5) * ph);
      pad.ctx.scale(gx ? -1 : 1, gy ? -1 : 1);
      pad.ctx.drawImage(picture, -pw / 2, -ph / 2, pw, ph);
      pad.ctx.restore();
    }
  o.clearRect(0, 0, sw, sh);
  o.drawImage(picture, 0, 0);
  o.globalAlpha = Math.min(1, amount * 1.3);
  for (let i = 0; i < wedges; i++) {
    o.save();
    o.translate(sw / 2, sh / 2);
    // Every other wedge is mirrored, so neighbours meet seamlessly.
    if (i % 2) {
      o.rotate((i + 1) * step);
      o.scale(1, -1);
    } else o.rotate(i * step);
    o.beginPath();
    o.moveTo(0, 0);
    o.arc(0, 0, reach, -0.004, step + 0.004);
    o.closePath();
    o.clip();
    o.rotate(spin);
    o.drawImage(pad.canvas, -sw * 1.5, -sh * 1.5, sw * 3, sh * 3);
    o.restore();
  }
  o.globalAlpha = 1;
  return out.canvas;
}

function ripple(picture: HTMLCanvasElement, amount: number, time: number) {
  const sw = picture.width,
    sh = picture.height,
    out = surface("couture-ripple", sw, sh),
    o = out.ctx,
    rows = Math.max(48, Math.min(240, Math.round(sh / 2))),
    band = sh / rows,
    swing = sw * 0.035 * amount;
  o.clearRect(0, 0, sw, sh);
  for (let i = 0; i < rows; i++) {
    const y = i * band,
      v = y / sh,
      wave =
        Math.sin(v * TAU * 3.2 - time * 4) * (0.65 + 0.35 * Math.sin(v * TAU * 1.3 + time * 1.7)),
      dx = wave * swing;
    o.drawImage(picture, 0, y, sw, band, dx - swing, y, sw + swing * 2, band + 1);
    // Light caught on the crests.
    const crest = Math.max(0, wave) ** 8;
    if (crest > 0.02) {
      o.fillStyle = `rgba(222,246,255,${crest * 0.3 * amount})`;
      o.fillRect(0, y, sw, band + 1);
    }
  }
  return out.canvas;
}

function hologram(picture: HTMLCanvasElement, amount: number, time: number) {
  const sw = picture.width,
    sh = picture.height,
    out = surface("couture-holo", sw, sh),
    o = out.ctx,
    // The sheen sweeps across as the card settles, then keeps passing in loops.
    at = ((time * 0.45 + (1 - amount) * 1.1) % 1.6) - 0.3;
  o.clearRect(0, 0, sw, sh);
  o.drawImage(picture, 0, 0);
  const sheen = o.createLinearGradient(0, 0, sw, sh),
    stop = (offset: number, colour: string) => sheen.addColorStop(clamp01(at + offset), colour);
  sheen.addColorStop(0, "rgba(0,0,0,0)");
  stop(-0.22, "rgba(0,0,0,0)");
  stop(-0.14, `rgba(255,110,214,${0.42 * amount})`);
  stop(-0.05, `rgba(116,224,255,${0.48 * amount})`);
  stop(0, `rgba(255,255,255,${0.62 * amount})`);
  stop(0.05, `rgba(255,236,140,${0.4 * amount})`);
  stop(0.14, `rgba(150,255,190,${0.3 * amount})`);
  stop(0.22, "rgba(0,0,0,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0)");
  o.globalCompositeOperation = "screen";
  o.fillStyle = sheen;
  o.fillRect(0, 0, sw, sh);
  // A thin iridescent rim.
  const rim = o.createLinearGradient(0, 0, sw, sh);
  rim.addColorStop(0, "#ff7ad9");
  rim.addColorStop(0.35, "#7fe3ff");
  rim.addColorStop(0.7, "#fff08a");
  rim.addColorStop(1, "#b7a4ff");
  o.globalAlpha = amount * 0.9;
  o.strokeStyle = rim;
  o.lineWidth = Math.max(1, Math.min(sw, sh) * 0.014);
  o.strokeRect(o.lineWidth / 2, o.lineWidth / 2, sw - o.lineWidth, sh - o.lineWidth);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  return out.canvas;
}

/** The new picture-level looks, applied to the clip's frame before it is placed. */
export function coutureSource(picture: HTMLCanvasElement, f: MotionFrame, time: number) {
  let out = picture;
  if (f.neon > 0.005) out = neon(out, f.neon, time);
  if (f.kaleido > 0.005) out = kaleidoscope(out, f.kaleido, time);
  if (f.ripple > 0.005) out = ripple(out, f.ripple, time);
  if (f.holo > 0.005) out = hologram(out, f.holo, time);
  return out;
}

/**
 * Coloured echoes of the picture: behind it along a move (`behind`), or as
 * growing copies laid over it in a loop.
 */
export function paintEchoes(
  ctx: CanvasRenderingContext2D,
  picture: HTMLCanvasElement,
  f: MotionFrame,
  w: number,
  h: number,
  behind: boolean,
) {
  if (f.echo <= 0.01 || behind !== (f.echoZoom === 0)) return;
  // Two tinted copies (warm and cool) at half size feed all five echoes.
  const ew = Math.max(8, Math.round(picture.width / 2)),
    eh = Math.max(8, Math.round(picture.height / 2)),
    tints = [20, -20].map((hue, i) => {
      const t = surface(`couture-echo-${i}`, ew, eh);
      t.ctx.clearRect(0, 0, ew, eh);
      t.ctx.filter = `hue-rotate(${hue}deg) saturate(1.35)`;
      t.ctx.drawImage(picture, 0, 0, ew, eh);
      t.ctx.filter = "none";
      return t.canvas;
    });
  const ghosts = 5;
  for (let i = ghosts; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha *= f.echo * (behind ? 0.5 : 0.3) * (1 - (i - 1) / ghosts);
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "none";
    ctx.translate(w / 2 + f.echoX * w * i, h / 2 + f.echoY * h * i);
    const s = 1 + f.echoZoom * i;
    ctx.scale(s, s);
    ctx.drawImage(tints[i % 2], -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

function folded(
  ctx: CanvasRenderingContext2D,
  picture: HTMLCanvasElement,
  f: MotionFrame,
  w: number,
  h: number,
) {
  const panels = 4,
    sub = 6,
    angle = f.fold * (Math.PI / 2) * 0.92,
    cos = Math.cos(angle),
    sin = Math.sin(angle),
    pw = (w / panels) * cos,
    left = (w - pw * panels) / 2,
    sw = picture.width,
    sh = picture.height,
    depth = (t: number) => 1 + (t - 0.5) * 2 * sin * 0.12;
  for (let i = 0; i < panels; i++) {
    const x0 = left + i * pw,
      // Mountain and valley creases alternate: the near edge flips each panel.
      near = (t: number) => (i % 2 ? 1 - t : t);
    for (let j = 0; j < sub; j++) {
      const t0 = j / sub,
        t1 = (j + 1) / sub,
        s = depth(near((t0 + t1) / 2));
      ctx.drawImage(
        picture,
        ((i + t0) * sw) / panels,
        0,
        sw / panels / sub,
        sh,
        x0 + t0 * pw,
        h / 2 - (h * s) / 2,
        pw / sub + 0.5,
        h * s,
      );
    }
    if (sin > 0.01) {
      const a = depth(near(0)),
        b = depth(near(1));
      ctx.fillStyle = i % 2 ? `rgba(0,0,0,${sin * 0.42})` : `rgba(255,248,236,${sin * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(x0, h / 2 - (h * a) / 2);
      ctx.lineTo(x0 + pw + 0.5, h / 2 - (h * b) / 2);
      ctx.lineTo(x0 + pw + 0.5, h / 2 + (h * b) / 2);
      ctx.lineTo(x0, h / 2 + (h * a) / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function triptych(
  ctx: CanvasRenderingContext2D,
  picture: HTMLCanvasElement,
  f: MotionFrame,
  w: number,
  h: number,
) {
  const pw = w / 3,
    gap = Math.min(1, f.panels + f.panelDrift * 6) * Math.min(w, h) * 0.02;
  for (let i = 0; i < 3; i++) {
    // Panels arrive one after another, from alternating sides.
    const local = clamp01((f.panels - (2 - i) * 0.15) / 0.7),
      dir = i % 2 ? 1 : -1,
      y = dir * h * (1.05 * local + f.panelDrift);
    if (Math.abs(y) >= h) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(i * pw + gap / 2, y, pw - gap + 0.5, h);
    ctx.clip();
    ctx.drawImage(picture, 0, y, w, h);
    if (local > 0.001) {
      ctx.fillStyle = `rgba(255,240,222,${Math.min(1, local * 4) * 0.7})`;
      ctx.fillRect(
        i * pw,
        dir > 0 ? y : y + h - Math.max(1, h * 0.006),
        pw,
        Math.max(1, h * 0.006),
      );
    }
    ctx.restore();
  }
}

/** Draws the picture folded or in panels; false when neither applies. */
export function coutureImage(
  ctx: CanvasRenderingContext2D,
  picture: HTMLCanvasElement,
  f: MotionFrame,
  w: number,
  h: number,
) {
  if (f.fold > 0.001) folded(ctx, picture, f, w, h);
  else if (f.panels > 0.001 || f.panelDrift > 0.0005) triptych(ctx, picture, f, w, h);
  else return false;
  return true;
}

/** Soft bokeh discs where the picture's lights are. */
export function paintBokeh(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  amount: number,
  w: number,
  h: number,
  time: number,
) {
  if (amount <= 0.01) return;
  const gw = 12,
    gh = 8,
    sample = surface("couture-bokeh", gw, gh, 1);
  sample.ctx.clearRect(0, 0, gw, gh);
  sample.ctx.drawImage(source, 0, 0, gw, gh);
  const d = sample.ctx.getImageData(0, 0, gw, gh).data,
    cells: Array<{ i: number; luma: number }> = [];
  for (let i = 0; i < gw * gh; i++)
    cells.push({
      i,
      luma: (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255,
    });
  cells.sort((a, b) => b.luma - a.luma);
  const short = Math.min(w, h);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.filter = "none";
  for (const [k, { i, luma }] of cells.slice(0, 16).entries()) {
    if (luma < 0.3) break;
    const col = i % gw,
      row = Math.floor(i / gw),
      x =
        ((col + 0.5 + (hash(i * 3.1) - 0.5) * 0.9) / gw) * w +
        Math.sin(time * 0.5 + k) * short * 0.01,
      y =
        ((row + 0.5 + (hash(i * 5.7) - 0.5) * 0.9) / gh) * h +
        Math.cos(time * 0.4 + k) * short * 0.01,
      r = short * (0.035 + 0.065 * hash(i * 9.3)) * (0.45 + 0.55 * amount),
      boost = (n: number) => Math.min(255, Math.round(n * 1.25 + 30)),
      rgb = `${boost(d[i * 4])},${boost(d[i * 4 + 1])},${boost(d[i * 4 + 2])}`,
      alpha = amount * (0.25 + 0.6 * luma);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha * 0.5})`);
    g.addColorStop(0.72, `rgba(${rgb},${alpha * 0.62})`);
    g.addColorStop(0.9, `rgba(${rgb},${alpha * 0.95})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
