/** Signature typography: deterministic Canvas effects shared by preview and export. */
export const CAPTION_FINISHES = [
  { id: "none", label: "Orijinal" },
  { id: "gold-foil", label: "Altın folyo" },
  { id: "prism-glass", label: "Prizma cam" },
  { id: "velvet", label: "Kadife plaka" },
  { id: "silk", label: "İpek şerit" },
  { id: "platinum", label: "Platin çerçeve" },
  { id: "chrome", label: "Krom yansıma" },
  { id: "pearl", label: "İnci noktası" },
  { id: "constellation", label: "Yıldız hattı" },
  { id: "blueprint", label: "Mimari köşe" },
  { id: "laser", label: "Lazer çizgi" },
] as const;
export type CaptionFinish = (typeof CAPTION_FINISHES)[number]["id"];
export const SIGNATURE_ANIMATIONS = [
  {
    id: "foil-reveal",
    label: "Folyo açılışı",
    description: "Ortadan açılan, eğimi azalarak yerleşen kelimeler",
  },
  {
    id: "prism-turn",
    label: "Prizma dönüşü",
    description: "Çapraz perspektiften net bir satıra dönüşür",
  },
  { id: "velvet-fold", label: "Kadife perde", description: "Her kelime yatay bir perdeden açılır" },
  {
    id: "silk-flow",
    label: "İpek salınım",
    description: "Satır boyunca sakin, sürekli bir ipek hareketi",
  },
  {
    id: "platinum-spread",
    label: "Platin yayılım",
    description: "Kelimeler satırın merkezinden yerlerine yayılır",
  },
  {
    id: "chrome-drift",
    label: "Krom süzülme",
    description: "Diyagonal iz bırakarak dengeli biçimde yerleşir",
  },
  {
    id: "pearl-step",
    label: "İnci vurgusu",
    description: "Söylenen kelime yatayda genişler, dikeyde sıkışır",
  },
  {
    id: "star-weave",
    label: "Yıldız örgüsü",
    description: "Kelimeler sırayla hafifçe dönerek bir araya gelir",
  },
  {
    id: "architect-build",
    label: "Mimari kurulum",
    description: "Dört ölçülü adımda çizgiden başlığa açılır",
  },
  {
    id: "laser-trace",
    label: "Lazer taraması",
    description: "İnce bir tarama kenarı kelimeleri ortaya çıkarır",
  },
] as const;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export type SignatureWord = {
  x: number;
  y: number;
  width: number;
  size: number;
  elapsed: number;
  cueDuration: number;
  sequence: number;
  count: number;
  speed: number;
  intensity: number;
  active: boolean;
  progress: number;
};
/** Called inside the caller's per-word save/restore pair. */
export function moveSignatureWord(ctx: CanvasRenderingContext2D, id: string, w: SignatureWord) {
  if (!SIGNATURE_ANIMATIONS.some((a) => a.id === id)) return;
  const delay = Math.min((w.sequence * 0.035) / w.speed, w.cueDuration * 0.15);
  const t = clamp(
    (w.elapsed - delay) / Math.max(0.01, Math.min(0.55 / w.speed, w.cueDuration * 0.35)),
  );
  const ease = 1 - Math.pow(1 - t, 3),
    rest = 1 - ease,
    amount = w.intensity;
  const center = w.x + w.width / 2;
  ctx.globalAlpha *= Math.min(1, t * 3);
  if (id === "foil-reveal") {
    ctx.beginPath();
    ctx.rect(
      center - (w.width / 2 + w.size * 0.1) * ease,
      w.y - w.size,
      w.width * ease + w.size * 0.2 * ease,
      w.size * 2,
    );
    ctx.clip();
    ctx.translate(center, w.y);
    ctx.transform(1, 0, -rest * 0.15 * amount, 1, 0, 0);
    ctx.translate(-center, -w.y);
  } else if (id === "prism-turn") {
    ctx.translate(center, w.y);
    ctx.transform(1, rest * 0.16 * amount, -rest * 0.3 * amount, Math.max(0.1, ease), 0, 0);
    ctx.translate(-center, -w.y);
  } else if (id === "velvet-fold") {
    ctx.beginPath();
    ctx.rect(
      w.x - w.size * 0.1,
      w.y - w.size * 0.7 * ease,
      w.width + w.size * 0.2,
      w.size * 1.4 * ease,
    );
    ctx.clip();
  } else if (id === "silk-flow") {
    ctx.translate(
      rest * w.size * 0.2 * amount,
      Math.sin(w.elapsed * w.speed * 2 - w.sequence * 0.6) * w.size * 0.055 * amount,
    );
  } else if (id === "platinum-spread") {
    const spread = w.count > 1 ? w.sequence / (w.count - 1) - 0.5 : 0;
    ctx.translate(spread * rest * w.size * 0.6 * amount, 0);
    ctx.translate(center, w.y);
    ctx.scale(1 + rest * 0.18 * amount, 1);
    ctx.translate(-center, -w.y);
  } else if (id === "chrome-drift") {
    ctx.translate(rest * w.size * 0.65 * amount, rest * w.size * 0.22 * amount);
    ctx.translate(center, w.y);
    ctx.rotate(rest * 0.08 * amount);
    ctx.translate(-center, -w.y);
  } else if (id === "pearl-step") {
    const pulse = w.active ? Math.sin(w.progress * Math.PI) : 0;
    ctx.translate(center, w.y);
    ctx.scale(1 + pulse * 0.09 * amount, 1 - pulse * 0.055 * amount);
    ctx.translate(-center, -w.y);
  } else if (id === "star-weave") {
    const sign = w.sequence % 2 ? 1 : -1;
    ctx.translate(center, w.y);
    ctx.rotate(rest * sign * 0.22 * amount);
    ctx.translate(-center, -w.y - rest * w.size * 0.3 * amount);
  } else if (id === "architect-build") {
    const step = Math.ceil(rest * 4) / 4;
    ctx.translate(step * w.size * 0.25 * amount, 0);
    ctx.beginPath();
    ctx.rect(w.x - w.size * 0.1, w.y - w.size, w.width * ease + w.size * 0.2, w.size * 2);
    ctx.clip();
  } else if (id === "laser-trace") {
    ctx.beginPath();
    ctx.rect(w.x - w.size * 0.05, w.y - w.size, (w.width + w.size * 0.1) * ease, w.size * 2);
    ctx.clip();
  }
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
/** Decorations stay outside glyphs, keeping the words legible. */
export function paintSignatureLine(
  ctx: CanvasRenderingContext2D,
  effect: CaptionFinish,
  x: number,
  y: number,
  width: number,
  size: number,
  accent: string,
  phase: number,
  amount: number,
) {
  if (!effect || effect === "none") return;
  ctx.save();
  const inheritedAlpha = ctx.globalAlpha;
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(0.8, size * 0.027);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  const pad = size * 0.24,
    below = y + size * 0.7;
  if (effect === "velvet") {
    const g = ctx.createLinearGradient(x, y - size, x + width, y + size);
    g.addColorStop(0, "#170d18");
    g.addColorStop(0.5, "#422435");
    g.addColorStop(1, "#170d18");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x - pad, y - size * 0.72, width + pad * 2, size * 1.5, size * 0.18);
    ctx.fill();
    ctx.globalAlpha *= 0.7;
    ctx.stroke();
  } else if (effect === "gold-foil") {
    ctx.globalAlpha *= 0.6;
    line(ctx, x, below, x + width, below);
    ctx.globalAlpha *= 0.65;
    line(ctx, x, y - size * 0.72, x + width, y - size * 0.72);
  } else if (effect === "silk") {
    ctx.lineWidth = size * 0.055;
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    ctx.moveTo(x, below);
    ctx.bezierCurveTo(
      x + width * 0.3,
      below + Math.sin(phase) * size * 0.12 * amount,
      x + width * 0.7,
      below - Math.sin(phase) * size * 0.12 * amount,
      x + width,
      below,
    );
    ctx.stroke();
  } else if (effect === "platinum" || effect === "blueprint") {
    const h = size * 0.75,
      n = size * 0.24;
    for (const side of [-1, 1]) {
      const edge = side < 0 ? x - pad : x + width + pad;
      line(ctx, edge, y - h, edge - side * n, y - h);
      line(ctx, edge, y - h, edge, y - h + n);
      line(ctx, edge, y + h, edge - side * n, y + h);
      line(ctx, edge, y + h, edge, y + h - n);
    }
    if (effect === "blueprint") {
      ctx.globalAlpha *= 0.45;
      ctx.setLineDash([size * 0.08, size * 0.12]);
      line(ctx, x, below + size * 0.14, x + width, below + size * 0.14);
    }
  } else if (effect === "constellation") {
    ctx.globalAlpha *= 0.6;
    line(ctx, x, below, x + width, below);
    for (let i = 0; i < 5; i++) {
      const px = x + (width * i) / 4,
        py = below + Math.sin(i * 2.1) * size * 0.12;
      ctx.globalAlpha = inheritedAlpha * (0.5 + 0.2 * Math.sin(phase + i));
      ctx.beginPath();
      ctx.arc(px, py, size * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effect === "laser") {
    ctx.globalAlpha *= 0.3;
    line(ctx, x, below, x + width, below);
    ctx.globalAlpha = inheritedAlpha;
    const px = x + width * ((phase * 0.18) % 1);
    ctx.shadowColor = accent;
    ctx.shadowBlur = size * 0.12;
    line(ctx, px, y - size * 0.68, px, y + size * 0.7);
  }
  ctx.restore();
}
export function signatureInk(
  ctx: CanvasRenderingContext2D,
  effect: CaptionFinish,
  x: number,
  y: number,
  width: number,
  size: number,
  base: string | CanvasGradient | CanvasPattern,
  accent: string,
  phase: number,
): string | CanvasGradient | CanvasPattern {
  if (
    !effect ||
    effect === "none" ||
    ["velvet", "silk", "constellation", "blueprint", "laser"].includes(effect)
  )
    return base;
  const palettes: Partial<Record<CaptionFinish, string[]>> = {
    "gold-foil": ["#fff5cc", "#c79435", "#fff4c0", "#98702b"],
    "prism-glass": ["#e8fcff", accent, "#f5d8ff", "#ffffff"],
    platinum: ["#ffffff", "#b1bbc9", "#f2f4f8", "#939ba7"],
    chrome: ["#e6edf5", "#6f7a8a", "#ffffff", "#a3afbe", "#f3f7fc"],
    pearl: ["#ffffff", "#eee7e0", accent, "#ffffff"],
  };
  const colours = palettes[effect];
  if (!colours) return base;
  const shimmer = Math.sin(phase * 0.7) * size * 0.08;
  const g =
    effect === "prism-glass"
      ? ctx.createLinearGradient(x, y - size * 0.5, x + Math.max(1, width), y + size * 0.5)
      : ctx.createLinearGradient(x, y - size * 0.55 + shimmer, x, y + size * 0.55 + shimmer);
  colours.forEach((colour, i) => g.addColorStop(i / (colours.length - 1), colour));
  return g;
}
export function paintSignatureWord(
  ctx: CanvasRenderingContext2D,
  effect: CaptionFinish,
  text: string,
  w: SignatureWord,
  accent: string,
  phase: number,
) {
  ctx.save();
  ctx.shadowOffsetY = 0;
  if (effect === "chrome") {
    ctx.globalAlpha *= 0.13 * w.intensity;
    ctx.fillStyle = accent;
    ctx.fillText(text, w.x - w.size * 0.07, w.y + w.size * 0.05);
  } else if (effect === "prism-glass") {
    ctx.globalAlpha *= 0.3 * w.intensity;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(0.7, w.size * 0.018);
    ctx.strokeText(text, w.x + w.size * 0.035, w.y - w.size * 0.02);
  } else if (effect === "pearl" && w.active) {
    const px = w.x + w.width * (0.2 + 0.6 * w.progress),
      py = w.y + w.size * 0.77;
    const g = ctx.createRadialGradient(
      px - w.size * 0.015,
      py - w.size * 0.02,
      0,
      px,
      py,
      w.size * 0.07,
    );
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, accent);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, w.size * 0.065, 0, Math.PI * 2);
    ctx.fill();
  } else if (effect === "laser" && w.active) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = w.size * 0.04;
    ctx.shadowColor = accent;
    ctx.shadowBlur = w.size * 0.1;
    line(ctx, w.x, w.y + w.size * 0.68, w.x + w.width * w.progress, w.y + w.size * 0.68);
  }
  ctx.restore();
}
