// AURA Pro scene transitions. Each one paints the cut between two finished
// frames (`outgoing`, `incoming`) at `progress` 0..1, with real motion blur,
// light and depth instead of a plain fade or slide.
import {
  clamp01,
  density,
  filmBurn,
  lensFlare,
  drawChromatic,
  drawSmeared,
  easeIn,
  easeInOut,
  easeOut,
  glow,
  hash,
  place,
  smooth,
  surface,
} from "./pro-paint.ts";

export const PRO_TRANSITIONS = [
  {
    id: "pro-whip",
    label: "Kamçı Savrulma",
    description: "Kamera hızla savrulur; hareket bulanıklığıyla yeni sahneye kilitlenir",
  },
  {
    id: "pro-warp",
    label: "Hız Tüneli",
    description: "Merkeze doğru ışık hızında çekilip yeni sahneden çıkar",
  },
  {
    id: "pro-burn",
    label: "Film Yanığı",
    description: "Sıcak film yanığı kareyi kaplar, yeni sahne ışığın içinden doğar",
  },
  {
    id: "pro-glitch",
    label: "Veri Bozulması",
    description: "Renk kanalları ayrılır, bloklar kayar, sinyal yeni sahneye atlar",
  },
  {
    id: "pro-ink",
    label: "Mürekkep Yayılımı",
    description: "Yeni sahne yumuşak kenarlı mürekkep lekeleri gibi yayılır",
  },
  {
    id: "pro-shatter",
    label: "Cam Kırılması",
    description: "Kare parlayan cam parçalarına ayrılıp dağılır",
  },
  {
    id: "pro-vortex",
    label: "Girdap",
    description: "Dönme bulanıklığıyla kendi etrafında savrularak geçiş",
  },
  {
    id: "pro-cube",
    label: "3D Küp",
    description: "Gerçek perspektifle dönen küpün diğer yüzüne geçiş",
  },
  {
    id: "pro-luma",
    label: "Işık Akışı",
    description: "Yeni sahne önce en parlak yerlerden süzülerek belirir",
  },
  {
    id: "pro-flare",
    label: "Anamorfik Parlama",
    description: "Mavi sinema parlaması kareyi yatay keser",
  },
  {
    id: "pro-bloom",
    label: "Işıltılı Çözülme",
    description: "Görüntü parlak bir ışıltıda erir ve yeniden netleşir",
  },
  {
    id: "pro-panels",
    label: "Kayan Paneller",
    description: "Yeni sahne kademeli panellerle hızla yerine kayar",
  },
] as const;
export type ProTransitionId = (typeof PRO_TRANSITIONS)[number]["id"];

/** Fills the frame at any turn: the zoom a rectangle needs to cover itself rotated. */
function cover(w: number, h: number, angle: number) {
  const c = Math.abs(Math.cos(angle)),
    s = Math.abs(Math.sin(angle));
  return Math.max((w * c + h * s) / w, (w * s + h * c) / h);
}

// Glass shards: a jittered grid of triangles, fixed for every frame.
const SHARDS = (() => {
  const cols = 6,
    rows = 5,
    points: number[][][] = [];
  for (let y = 0; y <= rows; y++) {
    points[y] = [];
    for (let x = 0; x <= cols; x++) {
      const edge = x === 0 || y === 0 || x === cols || y === rows;
      points[y][x] = [
        x / cols + (edge && (x === 0 || x === cols) ? 0 : (hash(x * 7 + y * 13) - 0.5) / cols),
        y / rows + (edge && (y === 0 || y === rows) ? 0 : (hash(x * 3 + y * 17) - 0.5) / rows),
      ];
    }
  }
  const shards: Array<{ points: number[][]; cx: number; cy: number; seed: number }> = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = points[y][x],
        b = points[y][x + 1],
        c = points[y + 1][x + 1],
        d = points[y + 1][x];
      for (const tri of hash(x + y * 9) > 0.5
        ? [
            [a, b, c],
            [a, c, d],
          ]
        : [
            [a, b, d],
            [b, c, d],
          ]) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3,
          cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        shards.push({ points: tri, cx, cy, seed: hash(cx * 91 + cy * 37) });
      }
    }
  return shards;
})();

export function paintProTransition(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  id: string,
  progress: number,
  w: number,
  h: number,
) {
  const p = clamp01(progress),
    short = Math.min(w, h);
  ctx.save();
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, w, h);

  if (id === "pro-whip") {
    // Accelerate out, decelerate in; the blur follows the speed.
    const first = p < 0.5,
      t = first ? easeIn(p * 2) : easeOut((p - 0.5) * 2),
      image = first ? outgoing : incoming,
      x = first ? -t * w * 0.7 : (1 - t) * w * 0.7,
      speed = Math.sin(p * Math.PI) ** 1.5,
      smear = w * 0.45 * speed;
    for (const tile of [-w, 0, w]) {
      // Only the copies that reach into the frame are drawn.
      if (x + tile + smear / 2 <= -w || x + tile - smear / 2 >= w) continue;
      drawSmeared(
        ctx,
        image,
        w,
        h,
        { x: x + tile - smear / 2, scale: 1 + speed * 0.06 },
        { x: x + tile + smear / 2, scale: 1 + speed * 0.06 },
        8,
        12,
      );
    }
    // The two shots meet in the blur.
    const meet = 1 - Math.abs(p - 0.5) / 0.08;
    if (meet > 0) {
      ctx.globalAlpha = meet * 0.5;
      drawSmeared(ctx, first ? incoming : outgoing, w, h, { x: -smear / 2 }, { x: smear / 2 });
      ctx.globalAlpha = 1;
    }
  } else if (id === "pro-warp") {
    const first = p < 0.5,
      t = first ? easeIn(p * 2) : easeOut((p - 0.5) * 2),
      image = first ? outgoing : incoming,
      scale = first ? 1 + t * 1.6 : 2.2 - t * 1.2,
      blur = Math.sin(p * Math.PI) ** 1.3 * 0.9;
    drawSmeared(ctx, image, w, h, { scale }, { scale: scale * (1 + blur) }, 10);
    // White-hot core at the jump.
    const heat = Math.max(0, 1 - Math.abs(p - 0.5) / 0.22);
    if (heat > 0) {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      g.addColorStop(0, `rgba(255,250,240,${0.95 * heat})`);
      g.addColorStop(0.35, `rgba(255,214,160,${0.45 * heat})`);
      g.addColorStop(1, "rgba(255,200,140,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (id === "pro-burn") {
    const burn = Math.sin(p * Math.PI) ** 1.2,
      mix = smooth(0.38, 0.62, p);
    ctx.filter = `brightness(${1 + burn * 0.9}) saturate(${1 + burn * 0.4})`;
    place(ctx, outgoing, w, h, { scale: 1 + burn * 0.04 });
    ctx.globalAlpha = mix;
    place(ctx, incoming, w, h, { scale: 1.04 - mix * 0.04 });
    ctx.globalAlpha = 1;
    ctx.filter = "none";
    // Organic flames of light drifting in from the left edge.
    filmBurn(ctx, w, h, burn, p);
    ctx.globalCompositeOperation = "screen";
    const blow = Math.max(0, burn - 0.75) / 0.25;
    if (blow > 0) {
      ctx.fillStyle = `rgba(255,226,180,${blow * 0.6})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (id === "pro-glitch") {
    const g = Math.sin(p * Math.PI),
      step = Math.floor(p * 26),
      // Around the cut the signal jumps between both shots.
      showIncoming = p > 0.62 || (p > 0.34 && hash(step * 3.1) > 0.5),
      image = showIncoming ? incoming : outgoing,
      split = short * 0.045 * g * (0.4 + hash(step) * 0.6);
    drawChromatic(ctx, image, w, h, split, split * 0.2 * (hash(step + 2) - 0.5));
    // Displaced horizontal blocks, some taken from the other shot.
    const blocks = Math.round(3 + g * 9);
    for (let i = 0; i < blocks; i++) {
      const seed = step * 13 + i * 7,
        y = hash(seed) * h,
        bh = h * (0.015 + hash(seed + 1) * 0.07),
        dx = (hash(seed + 2) - 0.5) * w * 0.35 * g,
        other = hash(seed + 3) > 0.6 ? (showIncoming ? outgoing : incoming) : image;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, w, bh);
      ctx.clip();
      place(ctx, other, w, h, { x: dx });
      ctx.restore();
    }
    if (g > 0.25) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(80,255,220,${0.12 * g})`;
      ctx.fillRect(0, hash(step + 9) * h, w, h * 0.012);
      ctx.fillStyle = `rgba(255,40,140,${0.12 * g})`;
      ctx.fillRect(0, hash(step + 19) * h, w, h * 0.02);
    }
  } else if (id === "pro-ink") {
    place(ctx, outgoing, w, h);
    // The drops are drawn small and softened once; scaled up they stay smooth.
    const k = 0.25,
      mw = Math.max(8, Math.round(w * k)),
      mh = Math.max(8, Math.round(h * k));
    const { canvas: drops, ctx: m } = surface("ink-drops", mw, mh);
    m.clearRect(0, 0, mw, mh);
    m.fillStyle = "#000";
    m.scale(k, k);
    const t = smooth(0, 1, p),
      reach = Math.hypot(w, h);
    for (let i = 0; i < 9; i++) {
      const delay = hash(i * 5.3) * 0.35,
        grow = clamp01((t - delay) / (1 - delay)),
        x = (0.15 + hash(i * 2.1) * 0.7) * w,
        y = (0.15 + hash(i * 4.7) * 0.7) * h;
      if (grow <= 0) continue;
      // Each drop is a cluster of circles, so the edge stays organic.
      for (let c = 0; c < 6; c++) {
        const angle = (c / 6) * Math.PI * 2 + i,
          spread = reach * 0.08 * grow * hash(i * 9 + c);
        m.beginPath();
        m.arc(
          x + Math.cos(angle) * spread,
          y + Math.sin(angle) * spread,
          reach * 0.42 * grow ** 1.1 * (0.6 + hash(i + c * 3) * 0.6),
          0,
          Math.PI * 2,
        );
        m.fill();
      }
    }
    m.setTransform(1, 0, 0, 1, 0, 0);
    const { canvas: mask, ctx: soft } = surface("ink-mask", mw, mh);
    soft.clearRect(0, 0, mw, mh);
    soft.filter = `blur(${Math.max(1, short * 0.035 * k)}px)`;
    soft.drawImage(drops, 0, 0);
    soft.filter = "none";
    const { canvas: layer, ctx: l } = surface("ink-layer", w, h, density(ctx));
    l.clearRect(0, 0, w, h);
    place(l, incoming, w, h, { scale: 1.06 - t * 0.06 });
    l.globalCompositeOperation = "destination-in";
    l.imageSmoothingQuality = "high";
    l.drawImage(mask, 0, 0, w, h);
    l.globalCompositeOperation = "source-over";
    ctx.drawImage(layer, 0, 0, w, h);
  } else if (id === "pro-shatter") {
    // The new shot waits underneath, coming forward out of the dark.
    const settle = easeOut(clamp01((p - 0.1) / 0.9));
    ctx.filter = `brightness(${0.35 + settle * 0.65})`;
    place(ctx, incoming, w, h, { scale: 1.12 - settle * 0.12 });
    ctx.filter = "none";
    const crack = Math.max(0, 1 - Math.abs(p - 0.08) / 0.08);
    for (const shard of SHARDS) {
      const distance = Math.hypot(shard.cx - 0.5, shard.cy - 0.5),
        delay = 0.08 + distance * 0.4 + shard.seed * 0.08,
        q = easeIn(clamp01((p - delay) / 0.55)),
        // The crack runs out from the centre a moment before each piece breaks away.
        crackAt = 0.02 + distance * 0.18,
        cracking = Math.max(0, 1 - Math.abs(p - crackAt) / 0.07);
      if (q >= 1) continue;
      const dx = (shard.cx - 0.5) * w * q * 1.4,
        dy = (shard.cy - 0.5) * h * q * 1.2 + h * q * q * 0.6,
        turn = (shard.seed - 0.5) * q * 2.4;
      ctx.save();
      ctx.globalAlpha = 1 - q * q;
      ctx.translate(shard.cx * w + dx, shard.cy * h + dy);
      ctx.rotate(turn);
      ctx.scale(1 - q * 0.35, 1 - q * 0.35);
      ctx.translate(-shard.cx * w, -shard.cy * h);
      ctx.beginPath();
      shard.points.forEach(([x, y], i) =>
        i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h),
      );
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(outgoing, 0, 0, w, h);
      ctx.restore();
      // Light catching the broken edges.
      const lit = q > 0 ? 0.3 + q * 0.4 : cracking * 0.75;
      if (lit < 0.02) {
        ctx.restore();
        continue;
      }
      ctx.strokeStyle = `rgba(255,255,255,${lit})`;
      ctx.lineWidth = Math.max(1, short / 260);
      ctx.stroke();
      ctx.restore();
    }
    if (crack > 0) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(220,240,255,${crack * 0.35})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (id === "pro-vortex") {
    const first = p < 0.5,
      t = first ? easeIn(p * 2) : easeOut((p - 0.5) * 2),
      image = first ? outgoing : incoming,
      angle = first ? t * Math.PI * 0.75 : -(1 - t) * Math.PI * 0.75,
      spin = Math.sin(p * Math.PI) ** 1.4 * 0.7,
      scale = cover(w, h, Math.max(Math.abs(angle), Math.abs(angle) + spin)) * (1 + spin * 0.2);
    drawSmeared(
      ctx,
      image,
      w,
      h,
      { rotate: angle - spin, scale },
      { rotate: angle + spin, scale },
      12,
    );
  } else if (id === "pro-cube") {
    const t = easeInOut(p),
      depth = w / 2,
      camera = w * 1.6,
      pull = 1 - Math.sin(p * Math.PI) * 0.16,
      strips = Math.max(16, Math.min(72, Math.round(w / 8)));
    const face = (image: CanvasImageSource, angle: number) => {
      const sw = (image as HTMLCanvasElement).width || w,
        sh = (image as HTMLCanvasElement).height || h;
      for (let i = 0; i < strips; i++) {
        const u0 = -w / 2 + (w * i) / strips,
          u1 = u0 + w / strips;
        const project = (u: number) => {
          const x = u * Math.cos(angle) + depth * Math.sin(angle),
            z = depth * Math.cos(angle) - u * Math.sin(angle),
            s = (camera / (camera + depth - z)) * pull;
          return { x: w / 2 + x * s, s };
        };
        const a = project(u0),
          b = project(u1);
        if (b.x <= a.x) continue;
        const s = (a.s + b.s) / 2;
        ctx.drawImage(
          image,
          (sw * i) / strips,
          0,
          sw / strips,
          sh,
          a.x,
          h / 2 - (h * s) / 2,
          b.x - a.x + 1,
          h * s,
        );
        // Turning away from the light darkens the side.
        const shade = (1 - Math.cos(angle)) * 0.75;
        if (shade > 0.01) {
          ctx.fillStyle = `rgba(0,0,0,${shade})`;
          ctx.fillRect(a.x, h / 2 - (h * s) / 2, b.x - a.x + 1, h * s);
        }
      }
    };
    const back = ctx.createLinearGradient(0, 0, 0, h);
    back.addColorStop(0, "#14161b");
    back.addColorStop(1, "#050507");
    ctx.fillStyle = back;
    ctx.fillRect(0, 0, w, h);
    face(outgoing, -t * (Math.PI / 2));
    face(incoming, (1 - t) * (Math.PI / 2));
  } else if (id === "pro-luma") {
    place(ctx, outgoing, w, h);
    // A small luminance map of the outgoing shot decides who comes first.
    const mw = Math.max(16, Math.round(w / 8)),
      mh = Math.max(16, Math.round(h / 8));
    const { canvas: map, ctx: c } = surface("luma-map", mw, mh);
    c.clearRect(0, 0, mw, mh);
    c.drawImage(outgoing, 0, 0, mw, mh);
    const pixels = c.getImageData(0, 0, mw, mh),
      d = pixels.data,
      edge = 1.2 - easeInOut(p) * 1.45;
    for (let i = 0; i < d.length; i += 4) {
      const luma = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      d[i + 3] = Math.round(smooth(edge - 0.12, edge + 0.12, luma) * 255);
    }
    c.putImageData(pixels, 0, 0);
    const { canvas: layer, ctx: l } = surface("luma-layer", w, h, density(ctx));
    l.clearRect(0, 0, w, h);
    place(l, incoming, w, h);
    l.globalCompositeOperation = "destination-in";
    l.imageSmoothingQuality = "high";
    l.drawImage(map, 0, 0, w, h);
    l.globalCompositeOperation = "source-over";
    ctx.drawImage(layer, 0, 0, w, h);
    // A soft glow rides the edge of the flow.
    glow(ctx, layer, w, h, Math.sin(p * Math.PI) * 0.5, short * 0.03);
  } else if (id === "pro-flare") {
    const flare = Math.max(0, 1 - Math.abs(p - 0.5) / 0.5) ** 1.5,
      mix = smooth(0.42, 0.58, p);
    place(ctx, outgoing, w, h);
    ctx.globalAlpha = mix;
    place(ctx, incoming, w, h);
    ctx.globalAlpha = 1;
    lensFlare(ctx, w, h, flare, (-0.15 + p * 1.3) * w, h * 0.46);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(210,232,255,${flare * flare * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  } else if (id === "pro-bloom") {
    const b = Math.sin(p * Math.PI),
      mix = smooth(0.3, 0.7, p);
    const { canvas: frame, ctx: f } = surface("bloom-frame", w, h, density(ctx));
    f.clearRect(0, 0, w, h);
    f.filter = `brightness(${1 + b * 0.7})`;
    place(f, outgoing, w, h, { scale: 1 + b * 0.05 });
    f.globalAlpha = mix;
    place(f, incoming, w, h, { scale: 1 + b * 0.05 });
    f.globalAlpha = 1;
    f.filter = "none";
    ctx.drawImage(frame, 0, 0, w, h);
    glow(ctx, frame, w, h, b * 1.2, short * 0.05, "#ffe2b8", 0.45);
    glow(ctx, frame, w, h, b * 0.8, short * 0.012, undefined, 0.3);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(255,238,214,${b * b * 0.4})`;
    ctx.fillRect(0, 0, w, h);
  } else if (id === "pro-panels") {
    const settle = easeOut(clamp01(p * 1.2));
    ctx.filter = `brightness(${1 - settle * 0.55})`;
    place(ctx, outgoing, w, h, { scale: 1 - settle * 0.08 });
    ctx.filter = "none";
    const panels = w > h ? 5 : 4;
    for (let i = 0; i < panels; i++) {
      const q = clamp01((p - i * 0.09) / 0.6),
        t = easeOut(q),
        y = (1 - t) * h * 1.05,
        speed = q > 0 && q < 1 ? (1 - q) ** 2 : 0;
      if (q <= 0) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect((w * i) / panels, 0, w / panels + 0.5, h);
      ctx.clip();
      if (speed > 0.02) drawSmeared(ctx, incoming, w, h, { y: y + speed * h * 0.18 }, { y }, 6, 8);
      else place(ctx, incoming, w, h, { y });
      // A bright leading edge on each panel.
      ctx.fillStyle = `rgba(255,236,206,${speed * 0.8})`;
      ctx.fillRect((w * i) / panels, y, w / panels, Math.max(1, short / 180));
      ctx.restore();
    }
  } else {
    place(ctx, incoming, w, h);
  }
  ctx.restore();
}
