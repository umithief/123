// AURA Pro "Couture" captions: eight text finishes and eight motions, each
// pair made for one Pro template. Everything is deterministic Canvas drawing
// shared by the template thumbnails, the preview and the exported video.
// Decorations stay behind or beside the glyphs so the words stay legible.

export const COUTURE_FINISHES = [
  { id: "holo", label: "Holografik" },
  { id: "neon-tube", label: "Neon tüp" },
  { id: "ember", label: "Kor" },
  { id: "brush", label: "Fırça darbesi" },
  { id: "cutout", label: "Kolaj kâğıdı" },
  { id: "frosted", label: "Buzlu cam" },
  { id: "retro", label: "Retro krom" },
  { id: "stardust", label: "Yıldız tozu" },
] as const;

export const COUTURE_CAPTION_ANIMATIONS = [
  {
    id: "spectral-merge",
    label: "Spektral birleşme",
    description: "Camgöbeği ve pembe yansımalar kelimede birleşir",
  },
  { id: "spark-ignite", label: "Kıvılcım", description: "Bir kıvılcım harfleri soldan sağa yakar" },
  {
    id: "heat-rise",
    label: "Sıcak hava",
    description: "Kelimeler titreşen sıcak havayla aşağıdan yükselir",
  },
  {
    id: "brush-reveal",
    label: "Fırça açılışı",
    description: "Fırça satırı boyarken kelimeler ortaya çıkar",
  },
  {
    id: "paper-drop",
    label: "Kâğıt düşüşü",
    description: "Kelimeler dönerek düşer ve yerine oturur",
  },
  {
    id: "glass-unfold",
    label: "Cam açılış",
    description: "Cam panel açılır, kelimeler bulanıktan netleşir",
  },
  {
    id: "retro-zoom",
    label: "Retro uçuş",
    description: "Kelimeler uzaktan gelir, 3D derinlikleri büyür",
  },
  {
    id: "twinkle-in",
    label: "Yıldız parıltısı",
    description: "Harfler rastgele sırayla parıldayarak belirir",
  },
] as const;
export type CoutureCaptionAnimation = (typeof COUTURE_CAPTION_ANIMATIONS)[number]["id"];

/** One word as the caption painter lays it out. */
export type CoutureWord = {
  x: number;
  y: number;
  width: number;
  size: number;
  /** Seconds since the caption appeared. */
  elapsed: number;
  cueDuration: number;
  speed: number;
  intensity: number;
  /** Position of the word in the whole caption. */
  order: number;
  /** Shown line the word sits on, and that line's extent. */
  line: number;
  lineX: number;
  lineWidth: number;
  active: boolean;
  progress: number;
  /** Index of the word's first letter in the caption, and the caption's letter count. */
  letterStart: number;
  letters: number;
};
export type CoutureLine = {
  x: number;
  y: number;
  width: number;
  size: number;
  /** This line among the shown lines, how many are shown, and the block they make. */
  index: number;
  lines: number;
  lineHeight: number;
  blockWidth: number;
  elapsed: number;
  cueDuration: number;
  speed: number;
  intensity: number;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const isCouture = (id: string) => COUTURE_CAPTION_ANIMATIONS.some((a) => a.id === id);

/** 0..1 entrance of a word, staggered through the caption. */
function enter(w: CoutureWord, step: number, length: number, delay = 0) {
  const start = Math.min((delay + w.order * step) / w.speed, w.cueDuration * 0.3);
  return clamp(
    (w.elapsed - start) / Math.max(0.01, Math.min(length / w.speed, w.cueDuration * 0.35)),
  );
}
/** How far the brush has painted a line (0..1). */
function brushed(line: number, elapsed: number, speed: number, cueDuration: number) {
  return easeOut(
    clamp(
      (elapsed - (line * 0.18) / speed) / Math.max(0.01, Math.min(0.75 / speed, cueDuration * 0.5)),
    ),
  );
}
/** How far the glass panel has opened (0..1). */
const opened = (elapsed: number, speed: number, cueDuration: number) =>
  easeOut(clamp(elapsed / Math.max(0.01, Math.min(0.35 / speed, cueDuration * 0.25))));

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
const TILES = [
  ["#f5efe3", "#141414"],
  ["accent", "#ffffff"],
  ["#ffd94a", "#141414"],
  ["#9ad7ff", "#0f1a24"],
  ["#161616", "#f5efe3"],
] as const;
function tile(order: number, accent: string) {
  const [paper, ink] = TILES[Math.floor(hash(order * 3.31 + 0.7) * TILES.length) % TILES.length];
  return { paper: paper === "accent" ? accent : paper, ink };
}

/** Decorations behind a whole line: brush swash, glass panel, sign frame, glow, dust. */
export function paintCoutureLine(
  ctx: CanvasRenderingContext2D,
  effect: string,
  animation: string,
  l: CoutureLine,
  accent: string,
  phase: number,
) {
  if (!["brush", "frosted", "neon-tube", "ember", "retro", "stardust"].includes(effect)) return;
  const { x, width, size } = l;
  let { y } = l;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.setLineDash([]);
  if (effect === "brush") {
    const reveal =
      animation === "brush-reveal" ? brushed(l.index, l.elapsed, l.speed, l.cueDuration) : 1;
    const pad = size * 0.38,
      left = x - pad,
      right = x + width + pad,
      top = y - size * 0.46,
      bottom = y + size * 0.44,
      steps = Math.max(3, Math.round((right - left) / (size * 0.5)));
    if (reveal > 0) {
      ctx.beginPath();
      ctx.rect(
        left - size,
        y - size * 1.5,
        (right - left + size * 1.4) * reveal + size * 0.2,
        size * 3,
      );
      ctx.clip();
      // A hand-painted stroke: wavering edges, a round start and a tapered end.
      ctx.beginPath();
      ctx.moveTo(left + size * 0.1, top + size * 0.1);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        ctx.lineTo(
          left + (right - left) * t,
          top + (hash(l.index * 31 + i) - 0.5) * size * 0.09 + t * size * 0.04,
        );
      }
      ctx.quadraticCurveTo(right + size * 0.32, y, right - size * 0.05, bottom - size * 0.08);
      for (let i = steps - 1; i >= 0; i--) {
        const t = i / steps;
        ctx.lineTo(
          left + (right - left) * t,
          bottom + (hash(l.index * 17 + i + 50) - 0.5) * size * 0.09,
        );
      }
      ctx.quadraticCurveTo(left - size * 0.2, y, left + size * 0.1, top + size * 0.1);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.clip();
      // Bristle streaks.
      for (let k = 0; k < 7; k++) {
        const yy = top + ((k + 0.5) / 7) * (bottom - top);
        ctx.strokeStyle = k % 2 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.13)";
        ctx.lineWidth = Math.max(0.6, size * 0.022);
        ctx.setLineDash([size * (0.6 + hash(k * 9.1) * 1.4), size * (0.1 + hash(k * 4.3) * 0.25)]);
        ctx.beginPath();
        ctx.moveTo(left + size * hash(k * 2.7) * 0.3, yy);
        ctx.lineTo(right - size * hash(k * 5.9) * 0.6, yy + (hash(k) - 0.5) * size * 0.05);
        ctx.stroke();
      }
    }
  } else if (effect === "frosted" && l.index === 0) {
    // One glass panel behind the whole caption block.
    const open = animation === "glass-unfold" ? opened(l.elapsed, l.speed, l.cueDuration) : 1,
      padX = size * 0.55,
      padY = size * 0.16,
      full = l.lines * l.lineHeight + padY * 2,
      tall = Math.max(size * 0.06, full * open),
      middle = y + ((l.lines - 1) * l.lineHeight) / 2,
      left = x + width / 2 - l.blockWidth / 2 - padX,
      span = l.blockWidth + padX * 2,
      radius = Math.min(size * 0.45, tall / 2);
    y = middle;
    ctx.fillStyle = `rgba(0,0,0,${0.2 * open})`;
    ctx.beginPath();
    ctx.roundRect(left + size * 0.04, y - tall / 2 + size * 0.1, span, tall, radius);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(left, y - tall / 2, span, tall, radius);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    const sheen = ctx.createLinearGradient(0, y - tall / 2, 0, y + tall / 2);
    sheen.addColorStop(0, "rgba(255,255,255,0.3)");
    sheen.addColorStop(0.45, "rgba(255,255,255,0.04)");
    sheen.addColorStop(1, "rgba(255,255,255,0.1)");
    ctx.fillStyle = sheen;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = Math.max(0.8, size * 0.03);
    ctx.stroke();
  } else if (effect === "neon-tube" && l.index === 0) {
    // The sign's frame goes round the whole block.
    const lit = animation === "spark-ignite" ? clamp(l.elapsed * l.speed * 1.5) : 1,
      pad = size * 0.45,
      left = x + width / 2 - l.blockWidth / 2,
      right = left + l.blockWidth,
      top = y - size * 0.82,
      bottom = y + (l.lines - 1) * l.lineHeight + size * 0.82;
    ctx.globalAlpha *= 0.32 * lit;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = size * 0.35;
    ctx.lineWidth = Math.max(0.8, size * 0.028);
    ctx.beginPath();
    ctx.roundRect(left - pad, top, right - left + pad * 2, bottom - top, size * 0.22);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (const [px, py] of [
      [left - pad * 0.6, top + size * 0.2],
      [right + pad * 0.6, top + size * 0.2],
      [left - pad * 0.6, bottom - size * 0.2],
      [right + pad * 0.6, bottom - size * 0.2],
    ]) {
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.8, size * 0.03), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effect === "ember") {
    const cx = x + width / 2,
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, width / 2 + size);
    g.addColorStop(0, `rgba(255,120,36,${0.3 * l.intensity})`);
    g.addColorStop(1, "rgba(255,90,20,0)");
    ctx.translate(cx, y + size * 0.3);
    ctx.scale(1, 0.32);
    ctx.fillStyle = g;
    ctx.fillRect(-(width / 2 + size), -(width / 2 + size), width + size * 2, width + size * 2);
  } else if (effect === "retro" && l.index === l.lines - 1) {
    const pad = size * 0.4;
    for (const [dy, colour, thick] of [
      [0.74, accent, 0.045],
      [0.88, "#5ee7ff", 0.026],
    ] as const) {
      const g = ctx.createLinearGradient(x - pad, 0, x + width + pad, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.2, colour);
      g.addColorStop(0.8, colour);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - pad, y + size * dy, width + pad * 2, Math.max(1, size * thick));
    }
  } else if (effect === "stardust" && l.index === l.lines - 1) {
    const pad = size * 0.3;
    ctx.fillStyle = "#fff3cf";
    for (let k = 0; k < 18; k++) {
      const twinkle = 0.25 + 0.55 * Math.max(0, Math.sin(phase * 2.2 + k * 1.7));
      ctx.globalAlpha = twinkle * (0.5 + 0.5 * l.intensity);
      ctx.beginPath();
      ctx.arc(
        x - pad + ((width + pad * 2) * (k + hash(k * 3.3 + l.index))) / 18,
        y + size * 0.64 + (hash(k * 7.7 + l.index) - 0.5) * size * 0.3,
        Math.max(0.6, size * 0.022 * (0.5 + hash(k * 1.9))),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Word motion, applied inside the caller's per-word save/restore pair. */
export function moveCoutureWord(ctx: CanvasRenderingContext2D, animation: string, w: CoutureWord) {
  if (!isCouture(animation)) return;
  const cx = w.x + w.width / 2,
    amount = w.intensity;
  if (animation === "spectral-merge") {
    const t = enter(w, 0.05, 0.55),
      rest = 1 - easeOut(t);
    ctx.globalAlpha *= Math.min(1, t * 2);
    ctx.translate(rest * w.size * 0.25 * amount, 0);
  } else if (animation === "heat-rise") {
    const t = enter(w, 0.07, 0.6),
      rest = 1 - easeOut(t),
      haze = Math.sin(w.elapsed * 18 + w.order * 1.3) * 0.14 * rest * amount;
    ctx.globalAlpha *= t;
    ctx.translate(cx, w.y + rest * w.size * 0.9 * amount);
    ctx.transform(1, 0, haze, 1 + rest * 0.15 * amount, 0, 0);
    ctx.translate(-cx, -w.y);
  } else if (animation === "brush-reveal") {
    const reveal = brushed(w.line, w.elapsed, w.speed, w.cueDuration),
      pad = w.size * 0.38;
    ctx.beginPath();
    ctx.rect(w.lineX - pad, w.y - w.size, (w.lineWidth + pad * 2) * reveal, w.size * 2);
    ctx.clip();
  } else if (animation === "paper-drop") {
    const t = enter(w, 0.08, 0.55),
      // Falls, overshoots a little and settles like a piece of paper.
      back = 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2,
      sign = hash(w.order * 5.1) > 0.5 ? 1 : -1;
    ctx.globalAlpha *= Math.min(1, t * 4);
    ctx.translate(cx, w.y - (1 - back) * w.size * 1.4 * amount);
    ctx.rotate((1 - t) ** 2 * 0.6 * sign * amount);
    ctx.translate(-cx, -w.y);
  } else if (animation === "glass-unfold") {
    const t = enter(w, 0.06, 0.45, 0.18),
      rest = 1 - easeOut(t);
    ctx.globalAlpha *= t;
    ctx.translate(0, rest * w.size * 0.3 * amount);
    if (rest > 0.01) ctx.filter = `blur(${rest * w.size * 0.22 * amount}px)`;
  } else if (animation === "retro-zoom") {
    const t = enter(w, 0.07, 0.6),
      e = easeOut(t),
      scale = 0.25 + 0.75 * e;
    ctx.globalAlpha *= Math.min(1, t * 2.5);
    ctx.translate(cx, w.y + w.size * 0.5 + (1 - e) * w.size * 0.7 * amount);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -w.y - w.size * 0.5);
  }
}

/** Finish-specific pose of a word (the collage tilt); applied before drawing it. */
export function poseCoutureWord(ctx: CanvasRenderingContext2D, effect: string, w: CoutureWord) {
  if (effect !== "cutout") return;
  const cx = w.x + w.width / 2;
  ctx.translate(cx, w.y);
  ctx.rotate((hash(w.order * 3.7) - 0.5) * 0.1);
  ctx.translate(-cx, -w.y);
}

/** Layers under a word's glyphs: collage paper, 3D extrusion, neon tube, spectral echoes. */
export function paintCoutureUnder(
  ctx: CanvasRenderingContext2D,
  effect: string,
  animation: string,
  text: string,
  w: CoutureWord,
  accent: string,
) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (effect === "cutout") {
    const { paper } = tile(w.order, accent),
      padX = w.size * 0.12,
      padY = w.size * 0.12;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(
      w.x - padX + w.size * 0.06,
      w.y - w.size * 0.5 - padY + w.size * 0.08,
      w.width + padX * 2,
      w.size + padY * 2,
    );
    ctx.fillStyle = paper;
    ctx.fillRect(w.x - padX, w.y - w.size * 0.5 - padY, w.width + padX * 2, w.size + padY * 2);
  } else if (effect === "retro") {
    const depth = animation === "retro-zoom" ? easeOut(enter(w, 0.07, 0.6)) : 1,
      layers = 6,
      step = w.size * 0.017 * depth;
    for (let i = layers; i >= 1 && step > 0.05; i--) {
      const k = i / layers;
      ctx.fillStyle = k > 0.5 ? "#2a0838" : accent;
      ctx.globalAlpha = k > 0.5 ? 1 : 0.95;
      ctx.fillText(text, w.x + i * step, w.y + i * step);
    }
  } else if (effect === "neon-tube" && animation !== "spark-ignite") {
    ctx.strokeStyle = accent;
    ctx.lineJoin = "round";
    ctx.shadowColor = accent;
    ctx.shadowBlur = w.size * 0.55;
    ctx.lineWidth = w.size * 0.11;
    ctx.strokeText(text, w.x, w.y);
    ctx.shadowBlur = w.size * 0.18;
    ctx.lineWidth = w.size * 0.07;
    ctx.strokeText(text, w.x, w.y);
  }
  if (animation === "spectral-merge") {
    const t = enter(w, 0.05, 0.55),
      rest = 1 - easeOut(t);
    if (rest > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha *= rest * 0.85;
      ctx.fillStyle = "#3fe6ff";
      ctx.fillText(text, w.x - rest * w.size * 0.7 * w.intensity, w.y);
      ctx.fillStyle = "#ff4fd2";
      ctx.fillText(text, w.x + rest * w.size * 0.7 * w.intensity, w.y);
    }
  }
  ctx.restore();
}

/** The fill of a word's glyphs for the gradient finishes; otherwise `base`. */
export function coutureInk(
  ctx: CanvasRenderingContext2D,
  effect: string,
  w: CoutureWord,
  base: string | CanvasGradient | CanvasPattern,
  accent: string,
  phase: number,
): string | CanvasGradient | CanvasPattern {
  const top = w.y - w.size * 0.55,
    bottom = w.y + w.size * 0.55;
  const vertical = (stops: Array<[number, string]>) => {
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    for (const [at, colour] of stops) g.addColorStop(at, colour);
    return g;
  };
  if (effect === "holo") {
    // Two turns of an iridescent cycle slide across the word.
    const span = Math.max(w.width, w.size * 2),
      start = w.x - span + ((phase * 0.22) % 1) * span,
      g = ctx.createLinearGradient(start, top, start + span * 2, bottom),
      cycle = ["#ffd1f4", "#c7b6ff", "#9fe9ff", "#c8ffe4", "#fff1b8"];
    for (let i = 0; i <= 10; i++) g.addColorStop(i / 10, cycle[i % cycle.length]);
    return g;
  }
  if (effect === "ember")
    return vertical([
      [0, "#fff6dc"],
      [0.42, "#ffcf6b"],
      [0.72, "#ff7a22"],
      [1, "#d1300f"],
    ]);
  if (effect === "retro")
    return vertical([
      [0, "#f2fdff"],
      [0.44, "#8fe3ff"],
      [0.5, "#2b2f7a"],
      [0.53, "#ff7ac6"],
      [1, "#ffd36e"],
    ]);
  if (effect === "stardust")
    return vertical([
      [0, "#ffffff"],
      [0.55, "#fff1cf"],
      [1, "#efcf86"],
    ]);
  if (effect === "cutout") return tile(w.order, accent).ink;
  if (effect === "neon-tube") return "#fff7fc";
  return base;
}

/** Light on top of the glyphs: holographic glint, rising embers, star sparkles. */
export function paintCoutureOver(
  ctx: CanvasRenderingContext2D,
  effect: string,
  animation: string,
  text: string,
  w: CoutureWord,
  phase: number,
) {
  if (!["holo", "ember", "stardust"].includes(effect)) return;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (effect === "holo") {
    // A narrow glint crosses each word on its own rhythm.
    const sweep = ((phase * 0.5 + hash(w.order) * 0.8) % 1.6) - 0.3,
      at = w.x + w.width * sweep,
      g = ctx.createLinearGradient(at - w.size * 0.5, 0, at + w.size * 0.5, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillText(text, w.x, w.y);
  } else if (effect === "ember") {
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 6; k++) {
      const seed = hash(w.order * 13 + k * 3.1),
        life = (phase * 0.45 + hash(k * 7.3 + w.order)) % 1,
        px = w.x + seed * w.width + Math.sin(phase * 3 + k) * w.size * 0.08,
        py = w.y - w.size * 0.35 - life * w.size * 1.3,
        r = Math.max(0.5, w.size * 0.05 * (1 - life)),
        g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.2);
      g.addColorStop(0, `rgba(255,236,170,${(1 - life) * 0.95 * w.intensity})`);
      g.addColorStop(0.4, `rgba(255,128,40,${(1 - life) * 0.6 * w.intensity})`);
      g.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - r * 2.2, py - r * 2.2, r * 4.4, r * 4.4);
    }
  } else if (effect === "stardust") {
    // Sparkles wait until a twinkling entrance has shown every letter.
    const shown =
      animation === "twinkle-in"
        ? clamp((w.elapsed - Math.min(0.9 / w.speed, w.cueDuration * 0.5)) / 0.3)
        : 1;
    ctx.fillStyle = "#fffaf0";
    ctx.shadowColor = "#ffe3a3";
    ctx.shadowBlur = w.size * 0.15;
    for (let k = 0; k < 3; k++) {
      const seed = hash(w.order * 9.7 + k * 2.3),
        twinkle = Math.max(0, Math.sin(phase * 3 + seed * 12)) ** 3;
      if (twinkle < 0.05) continue;
      ctx.globalAlpha = twinkle * shown * w.intensity;
      star(
        ctx,
        w.x + hash(k * 5.1 + w.order) * w.width,
        w.y + (hash(k * 8.3 + w.order * 2) - 0.5) * w.size * 0.9,
        w.size * 0.14 * twinkle,
      );
    }
  }
  ctx.restore();
}

/** Letter-by-letter motions draw the glyphs themselves; false when not one of them. */
export function drawCoutureLetters(
  ctx: CanvasRenderingContext2D,
  animation: string,
  effect: string,
  text: string,
  w: CoutureWord,
  accent: string,
  outline: boolean,
) {
  if (animation !== "spark-ignite" && animation !== "twinkle-in") return false;
  const characters = Array.from(text);
  let cursor = w.x;
  if (animation === "spark-ignite") {
    const run = Math.max(0.01, Math.min(1.1 / w.speed, w.cueDuration * 0.6)),
      front = (w.elapsed / run) * (w.letters + 2);
    characters.forEach((character, j) => {
      const index = w.letterStart + j,
        lit = clamp(front - index),
        glyph = ctx.measureText(character).width,
        flicker =
          lit > 0 && lit < 1 ? [1, 0.35, 0.9, 0.45, 1][Math.floor(w.elapsed * 30 + index) % 5] : 1,
        on = lit * flicker;
      ctx.save();
      if (effect === "neon-tube" && on > 0.02) {
        ctx.save();
        ctx.globalAlpha *= on;
        ctx.strokeStyle = accent;
        ctx.lineJoin = "round";
        ctx.shadowColor = accent;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = w.size * 0.55;
        ctx.lineWidth = w.size * 0.11;
        ctx.strokeText(character, cursor, w.y);
        ctx.shadowBlur = w.size * 0.18;
        ctx.lineWidth = w.size * 0.07;
        ctx.strokeText(character, cursor, w.y);
        ctx.restore();
      }
      // Unlit letters are a faint glass tube.
      ctx.globalAlpha *= 0.18 + 0.82 * on;
      if (outline) ctx.strokeText(character, cursor, w.y);
      ctx.fillText(character, cursor, w.y);
      ctx.restore();
      // The spark rides the ignition front.
      if (index === Math.floor(front) && front < w.letters) {
        const sx = cursor + glyph * (front - index),
          sy = w.y + w.size * 0.42;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, w.size * 0.3);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,230,160,0.8)");
        g.addColorStop(1, "rgba(255,140,60,0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - w.size * 0.3, sy - w.size * 0.3, w.size * 0.6, w.size * 0.6);
        ctx.restore();
      }
      cursor += glyph;
    });
  } else {
    const spread = Math.min(0.9 / w.speed, w.cueDuration * 0.5);
    characters.forEach((character, j) => {
      const index = w.letterStart + j,
        appear = hash(index * 7.13 + 0.3) * spread,
        local = clamp(((w.elapsed - appear) * w.speed) / 0.22),
        glyph = ctx.measureText(character).width;
      if (local > 0) {
        const grow = 1 + (1 - easeOut(local)) * 0.5,
          mid = cursor + glyph / 2;
        ctx.save();
        ctx.globalAlpha *= local;
        ctx.translate(mid, w.y);
        ctx.scale(grow, grow);
        ctx.translate(-mid, -w.y);
        if (outline) ctx.strokeText(character, cursor, w.y);
        ctx.fillText(character, cursor, w.y);
        ctx.restore();
        const flash = local < 1 ? Math.sin(local * Math.PI) : 0;
        if (flash > 0.02) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.fillStyle = "#fffaf0";
          ctx.shadowColor = "#ffe3a3";
          ctx.shadowBlur = w.size * 0.2;
          ctx.globalAlpha *= flash;
          star(ctx, mid, w.y - w.size * 0.05, w.size * 0.32 * flash);
          ctx.restore();
        }
      }
      cursor += glyph;
    });
  }
  return true;
}
