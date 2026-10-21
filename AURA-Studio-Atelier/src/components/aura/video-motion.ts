export const VIDEO_MOTIONS = [
  { id: "none", label: "Yok", group: "Temel", description: "Görüntüyü sabit tut" },
  // AURA Pro: real motion blur, light and lens effects.
  {
    id: "pro-warp",
    label: "Hız Bükülmesi",
    group: "Pro",
    description: "Işık hızından yavaşlayarak gelir; merkeze doğru hız bulanıklığı",
  },
  {
    id: "pro-whip",
    label: "Savrularak Gir",
    group: "Pro",
    description: "Kamera savrulması ve gerçek hareket bulanıklığıyla kadraja kilitlenir",
  },
  {
    id: "pro-bloom",
    label: "Işıltılı Doğuş",
    group: "Pro",
    description: "Beyaz ışıltının içinden netleşerek doğar",
  },
  {
    id: "pro-prism",
    label: "Prizma Vuruşu",
    group: "Pro",
    description: "Renk kanalları ayrışır, görüntü güçlü bir vuruşla yerine oturur",
  },
  {
    id: "pro-depth",
    label: "3D Derinlik",
    group: "Pro",
    description: "Derinlikten perspektifle dönerek öne çıkar",
  },
  {
    id: "pro-burn",
    label: "Film Yanığı",
    group: "Pro",
    description: "Sıcak film yanığı ışığıyla açılır",
  },
  {
    id: "pro-vortex",
    label: "Girdap",
    group: "Pro",
    description: "Dönme bulanıklığıyla girdaptan çıkar",
  },
  {
    id: "pro-flare",
    label: "Anamorfik Işık",
    group: "Pro",
    description: "Mavi sinema parlaması kadrajı tarar",
  },
  {
    id: "pro-pulse",
    label: "Bas Vuruşu",
    group: "Pro",
    description: "Karma için: ritimle atan zoom, ışıltı ve renk ayrışması",
  },
  {
    id: "impact",
    label: "Ani Etki",
    group: "Titreşim",
    trend: true,
    description: "Hızlı yakınlaşma, titreşim ve netleşme",
  },
  {
    id: "illuminate",
    label: "Aydınlanma",
    group: "Işık",
    trend: true,
    description: "Karanlıktan sıcak ışığa açıl",
  },
  {
    id: "red-lens",
    label: "Kırmızı Mercek",
    group: "Işık",
    trend: true,
    description: "Kırmızı ışık ve mercek yakınlaşması",
  },
  { id: "fade", label: "Yumuşak Geçiş", group: "Temel", description: "Saydamlıkla açıl ve kapan" },
  {
    id: "zoom-in",
    label: "Yaklaş",
    group: "Temel",
    trend: true,
    description: "Küçük kadrajdan tam görüntüye",
  },
  { id: "zoom-out", label: "Uzaklaş", group: "Temel", description: "Yakın plandan tam görüntüye" },
  { id: "slide-left", label: "Soldan Kaydır", group: "Temel", description: "Soldan kadraja gir" },
  { id: "slide-right", label: "Sağdan Kaydır", group: "Temel", description: "Sağdan kadraja gir" },
  { id: "slide-up", label: "Yukarı Kaydır", group: "Temel", description: "Aşağıdan kadraja gir" },
  { id: "slide-down", label: "Aşağı Kaydır", group: "Temel", description: "Yukarıdan kadraja gir" },
  { id: "spin", label: "Dönerek Açıl", group: "Temel", description: "Dönerek büyüyen kadraj" },
  { id: "blur", label: "Netleş", group: "Temel", description: "Bulanık görüntüden net kadraja" },
  {
    id: "elastic",
    label: "Esnek Zoom",
    group: "Temel",
    trend: true,
    description: "Yaylanarak yerleşen yakınlaşma",
  },
  {
    id: "flash",
    label: "Işık Patlaması",
    group: "Işık",
    trend: true,
    description: "Tek bir ışık patlamasıyla açıl",
  },
  {
    id: "soft-focus",
    label: "Rüya Odağı",
    group: "Işık",
    description: "Yumuşak odak ve parlaklık",
  },
  {
    id: "light-sweep",
    label: "Işık Taraması",
    group: "Işık",
    description: "Kadrajın üzerinden ışık geçir",
  },
  {
    id: "glitch",
    label: "Dijital Arıza",
    group: "Arıza",
    trend: true,
    description: "Yatay şeritler ve renk ayrılması",
  },
  {
    id: "rgb-split",
    label: "Renk Ayrılması",
    group: "Arıza",
    description: "Renkli görüntü yankıları",
  },
  {
    id: "scan",
    label: "Sinyal Taraması",
    group: "Arıza",
    description: "Kayarak açılan sinyal çizgileri",
  },
  { id: "shutter", label: "Kesik Kare", group: "Arıza", description: "Kademeli kadraj açılması" },
  {
    id: "signal",
    label: "Sinyal Kayması",
    group: "Arıza",
    description: "Hızlı yatay sinyal hareketi",
  },
  {
    id: "iris",
    label: "Dairesel Açılış",
    group: "Maske",
    trend: true,
    description: "Merkezden genişleyen daire",
  },
  { id: "wipe", label: "Yatay Açılış", group: "Maske", description: "Soldan açılan görüntü" },
  { id: "curtain", label: "Perde", group: "Maske", description: "Ortadan iki yana açılan kadraj" },
  {
    id: "diamond",
    label: "Elmas Açılış",
    group: "Maske",
    description: "Elmas biçiminde açılan görüntü",
  },
  { id: "blinds", label: "Panjur", group: "Maske", description: "Birlikte açılan yatay şeritler" },
  {
    id: "flip-x",
    label: "Dikey Dönüş",
    group: "3D",
    description: "Perspektifle dikey eksende dönüş",
  },
  {
    id: "flip-y",
    label: "Yatay Dönüş",
    group: "3D",
    trend: true,
    description: "Perspektifle yatay eksende dönüş",
  },
  { id: "cube", label: "Küp Dönüşü", group: "3D", description: "Yana dönen perspektifli yüzey" },
  {
    id: "orbit",
    label: "Yörünge",
    group: "3D",
    trend: true,
    description: "Yakınlaşan ve eğilen kadraj",
  },
  {
    id: "shake",
    label: "Kamera Sarsıntısı",
    group: "Titreşim",
    description: "Kısa ve güçlü kamera hareketi",
  },
  { id: "rock", label: "Salınım", group: "Titreşim", description: "İki yana eğilen kadraj" },
  {
    id: "bounce",
    label: "Sekme",
    group: "Titreşim",
    description: "Dikey sekerek yerleşen görüntü",
  },
  {
    id: "handheld",
    label: "Elde Kamera",
    group: "Titreşim",
    description: "Yumuşak doğal kamera hareketi",
  },
] as const;
export type VideoMotionId = (typeof VIDEO_MOTIONS)[number]["id"];
export type MotionSection = "in" | "out" | "combo";
export type VideoMotion = {
  in: { id: VideoMotionId; duration: number };
  out: { id: VideoMotionId; duration: number };
  combo: { id: VideoMotionId; duration: number };
  amount: number;
};
export const motionDefaults = (): VideoMotion => ({
  in: { id: "none", duration: 0.8 },
  out: { id: "none", duration: 0.8 },
  combo: { id: "none", duration: 1.6 },
  amount: 1,
});
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function parseVideoMotion(value: unknown): VideoMotion {
  const result = motionDefaults();
  if (!value || typeof value !== "object") return result;
  const raw = value as Record<string, unknown>;
  for (const section of ["in", "out", "combo"] as const) {
    const item = raw[section];
    if (!item || typeof item !== "object") continue;
    const setting = item as Record<string, unknown>;
    result[section] = {
      id: VIDEO_MOTIONS.some((p) => p.id === setting.id) ? (setting.id as VideoMotionId) : "none",
      duration:
        typeof setting.duration === "number" && Number.isFinite(setting.duration)
          ? clamp(setting.duration, 0.1, 3)
          : result[section].duration,
    };
  }
  if (typeof raw.amount === "number" && Number.isFinite(raw.amount))
    result.amount = clamp(raw.amount, 0, 1);
  return result;
}
export function motionWindows(m: VideoMotion, total: number) {
  const start = m.in.id === "none" ? 0 : m.in.duration;
  const end = m.out.id === "none" ? 0 : m.out.duration;
  const scale = start + end > total ? Math.max(0, total) / (start + end) : 1;
  return { in: start * scale, out: end * scale };
}
export type MotionFrame = {
  x: number;
  y: number;
  scale: number;
  sx: number;
  sy: number;
  rotation: number;
  opacity: number;
  blur: number;
  brightness: number;
  tint: number;
  flash: number;
  light: number;
  split: number;
  glitch: number;
  scan: number;
  mask: "none" | "iris" | "wipe" | "curtain" | "diamond" | "blinds";
  reveal: number;
  perspective: number;
  axis: "x" | "y";
  /** Pro: radial zoom blur (0..1). */
  zoomBlur: number;
  /** Pro: directional motion blur, as a share of the frame. */
  streakX: number;
  streakY: number;
  /** Pro: rotational blur in radians. */
  spinBlur: number;
  /** Pro: true colour-channel separation (0..1). */
  chroma: number;
  /** Pro: highlight glow (0..1). */
  bloom: number;
  /** Pro: film-burn light (0..1). */
  burn: number;
  /** Pro: anamorphic flare (0..1). */
  flare: number;
};
export const identityMotion = (): MotionFrame => ({
  x: 0,
  y: 0,
  scale: 1,
  sx: 1,
  sy: 1,
  rotation: 0,
  opacity: 1,
  blur: 0,
  brightness: 1,
  tint: 0,
  flash: 0,
  light: 0,
  split: 0,
  glitch: 0,
  scan: 0,
  mask: "none",
  reveal: 1,
  perspective: 0,
  axis: "x",
  zoomBlur: 0,
  streakX: 0,
  streakY: 0,
  spinBlur: 0,
  chroma: 0,
  bloom: 0,
  burn: 0,
  flare: 0,
});
export function motionEffect(
  id: VideoMotionId,
  section: MotionSection,
  progress: number,
  amount: number,
): MotionFrame {
  const f = identityMotion();
  if (id === "none" || amount <= 0) return f;
  const p = clamp(progress, 0, 1);
  const ease = 1 - (1 - p) ** 3;
  const u = section === "combo" ? Math.sin(p * Math.PI) ** 2 : section === "in" ? 1 - ease : p ** 3;
  const a = u * clamp(amount, 0, 1),
    reveal = 1 - a;
  if (a < 1e-8) return f;
  const oscillate = (speed: number) => Math.sin(p * Math.PI * speed);
  if (id === "pro-warp") {
    f.scale = 1 + a * 1.4;
    f.zoomBlur = a * 0.9;
    f.chroma = a * 0.5;
    f.brightness = 1 + a * 0.35;
    f.opacity = Math.min(1, reveal * 3);
  } else if (id === "pro-whip") {
    f.x = a * 0.9;
    f.streakX = a * 0.45;
    f.rotation = a * 0.04;
    f.scale = 1 + a * 0.06;
  } else if (id === "pro-bloom") {
    f.bloom = a;
    f.brightness = 1 + a * 1.3;
    f.blur = a * 5;
    f.scale = 1 + a * 0.08;
  } else if (id === "pro-prism") {
    f.chroma = a;
    f.scale = 1 + a * 0.22;
    f.x = oscillate(9) * a * 0.02;
    f.zoomBlur = a * 0.25;
    f.flash = a * 0.15;
  } else if (id === "pro-depth") {
    f.perspective = -a * 0.42;
    f.scale = 1 - a * 0.3;
    f.rotation = a * 0.06;
    f.brightness = 1 - a * 0.45;
    f.opacity = Math.min(1, reveal * 2.5);
    f.zoomBlur = a * 0.15;
  } else if (id === "pro-burn") {
    f.burn = a;
    f.brightness = 1 + a * 0.5;
    f.opacity = 1 - a * 0.55;
  } else if (id === "pro-vortex") {
    f.rotation = -a * Math.PI * 0.9;
    f.scale = 1 - a * 0.65;
    f.spinBlur = a * 0.7;
    f.opacity = Math.min(1, reveal * 2);
  } else if (id === "pro-flare") {
    f.flare = a;
    f.brightness = 1 + a * 0.3;
    f.bloom = a * 0.4;
  } else if (id === "pro-pulse") {
    f.scale = 1 + a * 0.12;
    f.zoomBlur = a * 0.3;
    f.bloom = a * 0.35;
    f.chroma = a * 0.25;
  } else if (id === "fade") f.opacity = reveal;
  else if (id === "zoom-in") {
    f.scale = 1 - a * 0.55;
    f.opacity = reveal;
  } else if (id === "zoom-out") f.scale = 1 + a * 0.8;
  else if (id.startsWith("slide-")) {
    f.x = id === "slide-left" ? -a : id === "slide-right" ? a : 0;
    f.y = id === "slide-up" ? a : id === "slide-down" ? -a : 0;
  } else if (id === "spin") {
    f.scale = 1 - a * 0.7;
    f.rotation = -a * Math.PI * 0.75;
    f.opacity = reveal;
  } else if (id === "blur") {
    f.blur = a * 16;
    f.opacity = reveal;
  } else if (id === "elastic") f.scale = 1 + oscillate(4) * a * 0.4 - a * 0.3;
  else if (id === "impact") {
    f.scale = 1 + a * 0.35;
    f.x = oscillate(15) * a * 0.04;
    f.blur = a * 6;
  } else if (id === "illuminate") {
    f.brightness = 1 - a * 0.8;
    f.tint = a * 0.08;
  } else if (id === "red-lens") {
    f.tint = a * 0.65;
    f.scale = 1 + a * 0.3;
    f.blur = a * 4;
  } else if (id === "flash") {
    f.flash = a * 0.85;
    f.scale = 1 + a * 0.12;
  } else if (id === "soft-focus") {
    f.blur = a * 10;
    f.brightness = 1 + a * 0.45;
  } else if (id === "light-sweep") {
    f.light = a;
    f.x = oscillate(2) * a * 0.02;
  } else if (id === "glitch") {
    f.glitch = a;
    f.split = a * 0.03;
    f.scale = 1 + a * 0.06;
  } else if (id === "rgb-split") f.split = a * 0.06;
  else if (id === "scan") {
    f.scan = a;
    f.y = oscillate(4) * a * 0.08;
  } else if (id === "shutter") {
    f.mask = "blinds";
    f.reveal = 1 - Math.ceil(a * 5) / 5;
  } else if (id === "signal") {
    f.x = oscillate(17) * a * 0.13;
    f.glitch = a * 0.6;
  } else if (["iris", "wipe", "curtain", "diamond", "blinds"].includes(id)) {
    f.mask = id as MotionFrame["mask"];
    f.reveal = reveal;
  } else if (id === "flip-x" || id === "flip-y" || id === "cube") {
    const cosine = Math.max(0.05, Math.cos((a * Math.PI) / 2));
    f.axis = id === "flip-y" ? "y" : "x";
    f.sx = f.axis === "x" ? cosine : 1;
    f.sy = f.axis === "y" ? cosine : 1;
    f.perspective = a * 0.28;
    f.opacity = reveal;
    if (id === "cube") {
      f.x = -a * 0.35;
      f.perspective = -a * 0.3;
    }
  } else if (id === "orbit") {
    f.scale = 1 + a * 0.2;
    f.rotation = oscillate(2) * a * 0.1;
    f.perspective = oscillate(2) * a * 0.12;
  } else if (id === "shake") {
    f.scale = 1 + a * 0.1;
    f.x = oscillate(16) * a * 0.035;
    f.y = Math.cos(p * Math.PI * 13) * a * 0.025;
  } else if (id === "rock") {
    f.scale = 1 + a * 0.08;
    f.rotation = oscillate(5) * a * 0.12;
  } else if (id === "bounce") {
    f.y = -Math.abs(oscillate(4)) * a * 0.15;
    f.scale = 1 + a * 0.03;
  } else if (id === "handheld") {
    f.scale = 1 + a * 0.06;
    f.x = oscillate(3) * a * 0.02;
    f.y = oscillate(5) * a * 0.015;
    f.rotation = oscillate(2) * a * 0.025;
  }
  return f;
}
function combine(a: MotionFrame, b: MotionFrame): MotionFrame {
  return {
    ...a,
    x: a.x + b.x,
    y: a.y + b.y,
    scale: a.scale * b.scale,
    sx: a.sx * b.sx,
    sy: a.sy * b.sy,
    rotation: a.rotation + b.rotation,
    opacity: a.opacity * b.opacity,
    blur: Math.max(a.blur, b.blur),
    brightness: a.brightness * b.brightness,
    tint: Math.max(a.tint, b.tint),
    flash: Math.max(a.flash, b.flash),
    light: Math.max(a.light, b.light),
    split: Math.max(a.split, b.split),
    glitch: Math.max(a.glitch, b.glitch),
    scan: Math.max(a.scan, b.scan),
    mask: b.mask === "none" ? a.mask : b.mask,
    reveal: b.mask === "none" ? a.reveal : b.reveal,
    perspective: a.perspective + b.perspective,
    axis: b.perspective ? b.axis : a.axis,
    zoomBlur: Math.max(a.zoomBlur, b.zoomBlur),
    streakX: a.streakX + b.streakX,
    streakY: a.streakY + b.streakY,
    spinBlur: Math.max(a.spinBlur, b.spinBlur),
    chroma: Math.max(a.chroma, b.chroma),
    bloom: Math.max(a.bloom, b.bloom),
    burn: Math.max(a.burn, b.burn),
    flare: Math.max(a.flare, b.flare),
  };
}
export function videoMotionAt(
  m: VideoMotion | undefined,
  local: number,
  total: number,
  reduced = false,
): MotionFrame {
  if (!m || reduced || total <= 0 || local < 0 || local > total) return identityMotion();
  let result = identityMotion();
  const windows = motionWindows(m, total);
  if (m.combo.id !== "none") {
    const envelope = Math.min(
      1,
      local / Math.min(0.15, total / 2),
      (total - local) / Math.min(0.15, total / 2),
    );
    result = motionEffect(m.combo.id, "combo", (local / m.combo.duration) % 1, m.amount * envelope);
  }
  if (windows.in > 0 && local < windows.in)
    result = combine(result, motionEffect(m.in.id, "in", local / windows.in, m.amount));
  if (windows.out > 0 && local > total - windows.out)
    result = combine(
      result,
      motionEffect(m.out.id, "out", (local - total + windows.out) / windows.out, m.amount),
    );
  return result;
}
export function motionIsActive(f: MotionFrame) {
  const base = identityMotion();
  return Object.keys(base).some(
    (key) => f[key as keyof MotionFrame] !== base[key as keyof MotionFrame],
  );
}
