// AURA Pro "Couture" scene transitions. Like the first Pro collection, each
// one paints the cut between two finished frames (`outgoing`, `incoming`) at
// `progress` 0..1, the same code for the 120 px gallery preview and the 1080p
// export. These work with paper, light and depth: a real page turn, turning
// slats, a blade of light, a rolling film strip, a wave of tiles, a tossed
// photo print, a 3D carousel and a split that opens into depth.
import {
  clamp01,
  density,
  drawSmeared,
  easeIn,
  easeInOut,
  easeOut,
  hash,
  place,
  smooth,
} from "./pro-paint.ts";

export const COUTURE_TRANSITIONS = [
  {
    id: "pro-page",
    label: "Sayfa Çevirme",
    description: "Kare, kitap sayfası gibi köşesinden kıvrılarak çevrilir",
  },
  {
    id: "pro-slats",
    label: "3D Jaluzi",
    description: "Yatay şeritler sırayla dönüp arkalarındaki yeni sahneyi gösterir",
  },
  {
    id: "pro-blade",
    label: "Işık Bıçağı",
    description: "Prizma kenarlı ince bir ışık bıçağı kareyi çapraz keser",
  },
  {
    id: "pro-film",
    label: "Film Şeridi",
    description: "Kare film şeridine dönüşür, şerit kayarak yeni sahneyi getirir",
  },
  {
    id: "pro-tiles",
    label: "Mozaik Dönüş",
    description: "Kareler çapraz bir dalgayla tek tek dönerek yeni sahneyi kurar",
  },
  {
    id: "pro-photo",
    label: "Anı Karesi",
    description: "Görüntü beyaz çerçeveli bir fotoğrafa dönüşüp savrularak uçar",
  },
  {
    id: "pro-carousel",
    label: "3D Karusel",
    description: "İki sahne yansımalı bir döner sahnede yer değiştirir",
  },
  {
    id: "pro-split",
    label: "Derin Ayrılış",
    description: "Kare çapraz bir ışık çizgisinden ikiye ayrılır, yeni sahne derinden gelir",
  },
] as const;
export type CoutureTransitionId = (typeof COUTURE_TRANSITIONS)[number]["id"];
export const isCoutureTransition = (id: string) => COUTURE_TRANSITIONS.some((t) => t.id === id);

/** Pixel size of a frame (the studio's frames can be denser than w × h). */
const sizeOf = (image: CanvasImageSource, w: number, h: number) => ({
  sw: (image as HTMLCanvasElement).width || w,
  sh: (image as HTMLCanvasElement).height || h,
});

/** Path of the half-plane on `side` of the line through (mx, my) with normal n. */
function halfPlane(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  nx: number,
  ny: number,
  side: number,
  reach: number,
) {
  const ux = -ny,
    uy = nx;
  ctx.beginPath();
  ctx.moveTo(mx + ux * reach, my + uy * reach);
  ctx.lineTo(mx + ux * reach + nx * side * reach, my + uy * reach + ny * side * reach);
  ctx.lineTo(mx - ux * reach + nx * side * reach, my - uy * reach + ny * side * reach);
  ctx.lineTo(mx - ux * reach, my - uy * reach);
  ctx.closePath();
}

/** A band of light along the line through (x, y) with normal angle `angle`. */
function lightBand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  reach: number,
  stops: Array<[number, number, string]>,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  for (const [offset, width, colour] of stops) {
    const g = ctx.createLinearGradient(offset - width / 2, 0, offset + width / 2, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, colour);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(offset - width / 2, -reach, width, reach * 2);
  }
  ctx.restore();
}

function page(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const e = easeInOut(p),
    short = Math.min(w, h);
  place(ctx, incoming, w, h);
  if (e < 0.0005) {
    place(ctx, outgoing, w, h);
    return;
  }
  // The bottom-right corner is lifted towards P; the fold is the line halfway
  // between corner and P. Everything on the corner's side is turned over.
  const dx = -2.3 * w * e,
    dy = -2.3 * h * e ** 1.35,
    len = Math.hypot(dx, dy),
    nx = dx / len,
    ny = dy / len,
    mx = w + dx / 2,
    my = h + dy / 2,
    reach = (w + h) * 3,
    fade = Math.sin(p * Math.PI) ** 0.5;
  // The curl's shadow on the page underneath.
  ctx.save();
  halfPlane(ctx, mx, my, nx, ny, -1, reach);
  ctx.clip();
  const shade = ctx.createLinearGradient(mx, my, mx - nx * short * 0.22, my - ny * short * 0.22);
  shade.addColorStop(0, `rgba(0,0,0,${0.55 * fade})`);
  shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // The flat, still unturned part of the page, and the turned flap above it.
  ctx.save();
  halfPlane(ctx, mx, my, nx, ny, 1, reach);
  ctx.clip();
  place(ctx, outgoing, w, h);
  const k = mx * nx + my * ny,
    d = density(ctx);
  ctx.save();
  ctx.transform(
    1 - 2 * nx * nx,
    -2 * nx * ny,
    -2 * nx * ny,
    1 - 2 * ny * ny,
    2 * k * nx,
    2 * k * ny,
  );
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.shadowColor = `rgba(0,0,0,${0.5 * fade})`;
  ctx.shadowBlur = short * 0.05 * d;
  ctx.fillStyle = "#f3efe7";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.clip();
  // The print shows through the back of the paper, mirrored.
  ctx.globalAlpha = 0.2;
  place(ctx, outgoing, w, h);
  ctx.globalAlpha = 1;
  // Round light across the curl: dark at the crease, a bright roll, then paper.
  const reachBack = Math.max(short * 0.2, len / 2);
  const roll = ctx.createLinearGradient(mx, my, mx - nx * reachBack, my - ny * reachBack);
  roll.addColorStop(0, "rgba(60,48,36,0.32)");
  roll.addColorStop(0.08, "rgba(255,255,255,0.42)");
  roll.addColorStop(0.35, "rgba(255,255,255,0.08)");
  roll.addColorStop(1, "rgba(40,30,20,0.16)");
  ctx.fillStyle = roll;
  ctx.fillRect(-w * 3, -h * 3, w * 7, h * 7);
  ctx.restore();
  ctx.restore();
}

/**
 * Pieces that are not turning are drawn as one clipped picture per side, so
 * neighbouring pieces at rest never show a seam (and the ends are exact).
 */
function resting(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  rects: Array<[number, number, number, number]>,
  w: number,
  h: number,
) {
  if (!rects.length) return;
  ctx.save();
  ctx.beginPath();
  for (const [x, y, rw, rh] of rects) ctx.rect(x, y, rw, rh);
  ctx.clip();
  place(ctx, image, w, h);
  ctx.restore();
}

function slats(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const count = w >= h ? 9 : 12,
    slice = h / count,
    back = ctx.createLinearGradient(0, 0, 0, h);
  back.addColorStop(0, "#121419");
  back.addColorStop(1, "#040406");
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, w, h);
  const before: Array<[number, number, number, number]> = [],
    after: Array<[number, number, number, number]> = [],
    turning: Array<{ i: number; q: number }> = [];
  for (let i = 0; i < count; i++) {
    const q = easeInOut(clamp01((p - (i / (count - 1)) * 0.42) / 0.58));
    if (q <= 0) before.push([0, i * slice, w, slice]);
    else if (q >= 1) after.push([0, i * slice, w, slice]);
    else turning.push({ i, q });
  }
  resting(ctx, outgoing, before, w, h);
  resting(ctx, incoming, after, w, h);
  for (const { i, q } of turning) {
    const angle = q * Math.PI,
      front = angle < Math.PI / 2,
      image = front ? outgoing : incoming,
      { sw, sh } = sizeOf(image, w, h),
      tall = slice * Math.abs(Math.cos(angle)),
      turn = Math.sin(angle),
      // The slat swings towards the viewer as it turns.
      wide = w * (1 + turn * 0.045),
      cy = (i + 0.5) * slice;
    if (tall < 0.4) continue;
    ctx.drawImage(
      image,
      0,
      (sh * i) / count,
      sw,
      sh / count,
      (w - wide) / 2,
      cy - tall / 2,
      wide,
      tall + 0.6,
    );
    ctx.fillStyle = `rgba(0,0,0,${turn * (front ? 0.5 : 0.62)})`;
    ctx.fillRect((w - wide) / 2, cy - tall / 2, wide, tall + 0.6);
    // Light catches the leading edge.
    ctx.fillStyle = `rgba(255,244,228,${turn * 0.4})`;
    ctx.fillRect(
      (w - wide) / 2,
      front ? cy - tall / 2 : cy + tall / 2 - 1,
      wide,
      Math.max(1, tall * 0.07),
    );
  }
}

function blade(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const e = easeInOut(p),
    short = Math.min(w, h),
    angle = -0.38,
    nx = Math.cos(angle),
    ny = Math.sin(angle),
    along = [0, w * nx, h * ny, w * nx + h * ny],
    lo = Math.min(...along),
    hi = Math.max(...along),
    margin = short * 0.1,
    at = lo - margin + (hi - lo + margin * 2) * e;
  // A touch of parallax: the old shot drifts away, the new one settles in.
  place(ctx, outgoing, w, h, { x: -e * w * 0.035, scale: 1 + e * 0.03 });
  ctx.save();
  halfPlane(ctx, nx * at, ny * at, nx, ny, -1, (w + h) * 3);
  ctx.clip();
  place(ctx, incoming, w, h, { x: (1 - e) * w * 0.035, scale: 1.05 - e * 0.05 });
  ctx.restore();
  const k = Math.sin(p * Math.PI) ** 0.6,
    reach = Math.hypot(w, h);
  if (k < 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  lightBand(ctx, nx * at, ny * at, angle, reach, [
    [0, short * 0.34, `rgba(255,232,206,${0.34 * k})`],
    [-short * 0.012, short * 0.02, `rgba(90,226,255,${0.85 * k})`],
    [short * 0.012, short * 0.02, `rgba(255,74,196,${0.75 * k})`],
  ]);
  ctx.globalCompositeOperation = "lighter";
  lightBand(ctx, nx * at, ny * at, angle, reach, [[0, short * 0.012, `rgba(255,255,255,${k})`]]);
  // A glint runs along the blade.
  const gx = nx * at - ny * (p * 2 - 1) * reach * 0.35,
    gy = ny * at + nx * (p * 2 - 1) * reach * 0.35,
    glint = ctx.createRadialGradient(gx, gy, 0, gx, gy, short * 0.16);
  glint.addColorStop(0, `rgba(255,255,255,${0.9 * k})`);
  glint.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glint;
  ctx.fillRect(gx - short * 0.16, gy - short * 0.16, short * 0.32, short * 0.32);
  ctx.restore();
}

function film(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const gate = Math.sin(p * Math.PI) ** 0.7,
    zoom = 1 - 0.2 * gate,
    roll = smooth(0.18, 0.82, p),
    speed = Math.sin(roll * Math.PI) ** 2,
    tall = h * zoom,
    pitch = tall * 1.09,
    offset = -easeInOut(roll) * pitch,
    strip = w * zoom * 1.16,
    left = (w - strip) / 2,
    short = Math.min(w, h);
  ctx.fillStyle = "#0a0806";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#17120c";
  ctx.fillRect(left, 0, strip, h);
  // Sprocket holes, drawn longer (and fainter) the faster the strip runs.
  const hole = strip * 0.034,
    spacing = pitch / 6,
    stretch = speed * spacing * 0.75,
    first = (((offset % spacing) + spacing) % spacing) - spacing;
  ctx.fillStyle = `rgba(3,2,1,${1 - speed * 0.35})`;
  for (let y = first; y < h + spacing; y += spacing)
    for (const x of [left + strip * 0.018, left + strip - strip * 0.018 - hole]) {
      ctx.beginPath();
      ctx.roundRect(x, y, hole, hole * 0.72 + stretch, hole * 0.2);
      ctx.fill();
    }
  const blur = speed * tall * 0.28;
  for (const [image, centre] of [
    [outgoing, h / 2 + offset],
    [incoming, h / 2 + offset + pitch],
  ] as const) {
    if (centre + tall / 2 < -blur || centre - tall / 2 > h + blur) continue;
    const y = centre - h / 2;
    if (blur > 2)
      drawSmeared(
        ctx,
        image,
        w,
        h,
        { y: y - blur / 2, scale: zoom },
        { y: y + blur / 2, scale: zoom },
        6,
        10,
      );
    else place(ctx, image, w, h, { y, scale: zoom });
  }
  // Warm projector light and a gentle gate flicker.
  const flicker = (0.06 + hash(Math.floor(p * 40)) * 0.04) * gate + speed * 0.08;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255,186,112,${flicker})`;
  ctx.fillRect(left, 0, strip, h);
  ctx.restore();
  if (gate > 0.01) {
    const v = ctx.createRadialGradient(
      w / 2,
      h / 2,
      short * 0.3,
      w / 2,
      h / 2,
      Math.hypot(w, h) * 0.62,
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, `rgba(0,0,0,${0.55 * gate})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
}

function tiles(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const cols = w >= h ? 8 : 5,
    rows = Math.max(3, Math.round((cols * h) / w)),
    tw = w / cols,
    th = h / rows;
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, w, h);
  const before: Array<[number, number, number, number]> = [],
    after: Array<[number, number, number, number]> = [],
    turning: Array<{ r: number; c: number; q: number }> = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const wave = (c / (cols - 1) + r / (rows - 1)) / 2,
        q = easeInOut(clamp01((p - wave * 0.5) / 0.5));
      if (q <= 0) before.push([c * tw, r * th, tw, th]);
      else if (q >= 1) after.push([c * tw, r * th, tw, th]);
      else turning.push({ r, c, q });
    }
  resting(ctx, outgoing, before, w, h);
  resting(ctx, incoming, after, w, h);
  for (const { r, c, q } of turning) {
    const angle = q * Math.PI,
      front = angle < Math.PI / 2,
      image = front ? outgoing : incoming,
      { sw, sh } = sizeOf(image, w, h),
      lift = Math.sin(q * Math.PI),
      across = Math.abs(Math.cos(angle)) * (1 - lift * 0.06),
      down = 1 - lift * 0.08,
      dw = tw * across,
      dh = th * down,
      x = c * tw + (tw - dw) / 2,
      y = r * th + (th - dh) / 2;
    if (dw < 0.4) continue;
    ctx.drawImage(
      image,
      (sw * c) / cols,
      (sh * r) / rows,
      sw / cols,
      sh / rows,
      x,
      y,
      dw + 0.5,
      dh + 0.5,
    );
    ctx.fillStyle = `rgba(0,0,0,${Math.sin(angle) * 0.42})`;
    ctx.fillRect(x, y, dw + 0.5, dh + 0.5);
    const sheen = ctx.createLinearGradient(x, y, x + dw, y + dh);
    sheen.addColorStop(0, `rgba(255,255,255,${lift * 0.28})`);
    sheen.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, dw + 0.5, dh + 0.5);
  }
}

function photo(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const short = Math.min(w, h),
    print = smooth(0, 0.38, p),
    toss = easeIn(clamp01((p - 0.32) / 0.68)),
    reveal = smooth(0.25, 1, p);
  ctx.filter = `brightness(${0.42 + 0.58 * reveal})`;
  place(ctx, incoming, w, h, { scale: 1.08 - 0.08 * easeOut(reveal) });
  ctx.filter = "none";
  if (toss >= 1) return;
  const scale = 1 - print * 0.24 - toss * 0.1,
    border = short * 0.045 * print,
    chin = short * 0.075 * print;
  ctx.save();
  ctx.globalAlpha = 1 - smooth(0.85, 1, toss);
  ctx.translate(w / 2 + toss * w * 1.3, h / 2 - toss * h * 1.1);
  ctx.rotate(-print * 0.06 + toss * 0.5);
  ctx.scale(scale, scale);
  if (print > 0.001) {
    // A soft drop shadow from a few widening, fading layers (no blur filter).
    for (let k = 4; k >= 1; k--) {
      const spread = short * 0.016 * k * print;
      ctx.fillStyle = `rgba(0,0,0,${0.13 * print})`;
      ctx.beginPath();
      ctx.roundRect(
        -w / 2 - border - spread,
        -h / 2 - border - spread + short * 0.025 * print,
        w + (border + spread) * 2,
        h + (border + spread) * 2 + chin,
        spread,
      );
      ctx.fill();
    }
    ctx.fillStyle = "#f7f5f0";
    ctx.fillRect(-w / 2 - border, -h / 2 - border, w + border * 2, h + border * 2 + chin);
  }
  ctx.drawImage(outgoing, -w / 2, -h / 2, w, h);
  if (print > 0.001) {
    // A glossy print.
    const gloss = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    gloss.addColorStop(0, `rgba(255,255,255,${0.2 * print})`);
    gloss.addColorStop(0.45, "rgba(255,255,255,0)");
    gloss.addColorStop(1, `rgba(0,0,0,${0.12 * print})`);
    ctx.fillStyle = gloss;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

function carousel(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  if (p <= 0 || p >= 1) {
    place(ctx, p <= 0 ? outgoing : incoming, w, h);
    return;
  }
  const e = easeInOut(p),
    lift = Math.sin(p * Math.PI),
    spread = Math.PI * 0.42,
    radius = w * 0.9,
    camera = w * 1.8,
    shrink = 1 - 0.34 * lift ** 0.9,
    rise = -lift * h * 0.06,
    strips = Math.max(16, Math.min(72, Math.round(w / 8)));
  const back = ctx.createLinearGradient(0, 0, 0, h);
  back.addColorStop(0, "#171920");
  back.addColorStop(0.62, "#0b0c10");
  back.addColorStop(1, "#050507");
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, w, h);
  const cards = [
    { image: outgoing, angle: -e * spread },
    { image: incoming, angle: (1 - e) * spread },
  ].sort((a, b) => Math.abs(b.angle) - Math.abs(a.angle));
  for (const { image, angle } of cards) {
    const { sw, sh } = sizeOf(image, w, h),
      x0 = radius * Math.sin(angle),
      z0 = radius * (1 - Math.cos(angle)),
      shade = (1 - Math.cos(angle)) * 0.9;
    const project = (u: number) => {
      const x = x0 + u * Math.cos(angle),
        z = z0 + u * Math.sin(angle),
        s = (camera / (camera + z)) * shrink;
      return { x: w / 2 + x * s, s };
    };
    for (let i = 0; i < strips; i++) {
      const u0 = -w / 2 + (w * i) / strips,
        a = project(u0),
        b = project(u0 + w / strips);
      if (b.x <= a.x || b.x < 0 || a.x > w) continue;
      const s = (a.s + b.s) / 2,
        top = h / 2 - (h * s) / 2 + rise,
        tall = h * s;
      ctx.drawImage(image, (sw * i) / strips, 0, sw / strips, sh, a.x, top, b.x - a.x + 0.6, tall);
      if (lift > 0.02) {
        // Its reflection on a glossy floor.
        ctx.save();
        ctx.globalAlpha = 0.2 * lift;
        ctx.translate(0, top + tall * 2 + h * 0.012);
        ctx.scale(1, -1);
        ctx.drawImage(image, (sw * i) / strips, 0, sw / strips, sh, a.x, 0, b.x - a.x + 0.6, tall);
        ctx.restore();
      }
    }
    // Turning away from the light darkens the card: one shape, so no banding.
    const l = project(-w / 2),
      r = project(w / 2);
    if (shade > 0.01 && r.x > l.x) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.8, shade)})`;
      ctx.beginPath();
      ctx.moveTo(l.x, h / 2 - (h * l.s) / 2 + rise);
      ctx.lineTo(r.x + 0.6, h / 2 - (h * r.s) / 2 + rise);
      ctx.lineTo(r.x + 0.6, h / 2 + (h * r.s) / 2 + rise);
      ctx.lineTo(l.x, h / 2 + (h * l.s) / 2 + rise);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (lift > 0.02) {
    const floor = h / 2 + (h * shrink) / 2 + rise,
      fade = ctx.createLinearGradient(0, floor, 0, Math.min(h, floor + h * 0.32));
    fade.addColorStop(0, "rgba(5,5,7,0.15)");
    fade.addColorStop(1, "rgba(5,5,7,1)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, floor, w, h - floor + 1);
  }
}

function split(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  p: number,
  w: number,
  h: number,
) {
  const short = Math.min(w, h),
    len = Math.hypot(w, h),
    // The cut runs from the bottom-left to the top-right corner.
    nx = h / len,
    ny = w / len,
    angle = Math.atan2(ny, nx),
    reveal = smooth(0.1, 1, p),
    open = easeIn(clamp01((p - 0.12) / 0.88)),
    travel = len * 0.62 * open;
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, w, h);
  ctx.filter = `brightness(${0.5 + 0.5 * reveal})`;
  place(ctx, incoming, w, h, { scale: 1.18 - 0.18 * easeOut(reveal) });
  ctx.filter = "none";
  // Until it opens the frame is whole (two clipped halves would show a hairline).
  if (open <= 0) place(ctx, outgoing, w, h);
  for (const side of [-1, 1]) {
    if (open <= 0 || open >= 1) break;
    ctx.save();
    ctx.translate(nx * travel * side, ny * travel * side);
    ctx.translate(w / 2, h / 2);
    ctx.rotate(side * open * 0.06);
    ctx.scale(1 - open * 0.08, 1 - open * 0.08);
    ctx.translate(-w / 2, -h / 2);
    halfPlane(ctx, w / 2, h / 2, nx, ny, side, len * 2);
    ctx.clip();
    place(ctx, outgoing, w, h);
    if (open > 0.001) {
      ctx.fillStyle = `rgba(0,0,0,${0.4 * open})`;
      ctx.fillRect(0, 0, w, h);
      // The cut edge stays lit.
      ctx.globalCompositeOperation = "screen";
      lightBand(ctx, w / 2, h / 2, angle, len, [
        [0, short * 0.05, `rgba(255,236,210,${0.7 * (1 - open)})`],
      ]);
    }
    ctx.restore();
  }
  // The seam lights up a moment before the frame comes apart.
  const seam = Math.max(0, 1 - Math.abs(p - 0.12) / 0.1);
  if (seam > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    lightBand(ctx, w / 2, h / 2, angle, len, [
      [0, short * 0.22, `rgba(255,226,190,${0.4 * seam})`],
      [0, short * 0.014, `rgba(255,255,255,${seam})`],
    ]);
    ctx.restore();
  }
}

const PAINTERS: Record<CoutureTransitionId, typeof page> = {
  "pro-page": page,
  "pro-slats": slats,
  "pro-blade": blade,
  "pro-film": film,
  "pro-tiles": tiles,
  "pro-photo": photo,
  "pro-carousel": carousel,
  "pro-split": split,
};

export function paintCoutureTransition(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  id: string,
  progress: number,
  w: number,
  h: number,
) {
  const painter = PAINTERS[id as CoutureTransitionId];
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, w, h);
  if (painter) painter(ctx, outgoing, incoming, clamp01(progress), w, h);
  else place(ctx, incoming, w, h);
  ctx.restore();
}
