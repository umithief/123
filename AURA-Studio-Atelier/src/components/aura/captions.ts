import {
  CAPTION_FINISHES,
  SIGNATURE_ANIMATIONS,
  type CaptionFinish,
} from "./caption-signatures.ts";
export type CaptionWord = { text: string; start: number; end: number };
export type CaptionCue = {
  id: string;
  text: string;
  start: number;
  end: number;
  words?: CaptionWord[];
};
export type CaptionOptions = {
  enabled: boolean;
  style: "classic" | "karaoke" | "minimal";
  place: "bottom" | "center" | "top";
  size: number;
  offset: number;
  animation: CaptionAnimation;
  textEffect: CaptionFinish;
  speed: number;
  intensity: number;
  font: CaptionFont;
  weight: 500 | 600 | 700;
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  outline: number;
  background: "auto" | "none" | "box" | "pill" | "marker";
  backgroundColor: string;
  uppercase: boolean;
  italic: boolean;
  glow: number;
  shadow: boolean;
};
export const CAPTION_ANIMATIONS = [
  ...SIGNATURE_ANIMATIONS,
  { id: "none", label: "Sabit", description: "Sade ve okunaklı" },
  { id: "fade", label: "Sinema", description: "Yumuşak giriş ve çıkış" },
  { id: "pop", label: "Pop", description: "Esnek büyüme" },
  { id: "slide", label: "Yükseliş", description: "Alttan akıcı giriş" },
  { id: "typewriter", label: "Daktilo", description: "Harf harf görünüm" },
  { id: "bounce", label: "Kelime pop", description: "Söylenen kelime zıplar" },
  { id: "spotlight", label: "Vurgu", description: "Hareketli kelime etiketi" },
  { id: "sweep", label: "Karaoke akışı", description: "Kelimeyi renk ile doldur" },
  { id: "slide-left", label: "Soldan akış", description: "Yatay ve yumuşak giriş" },
  { id: "slide-right", label: "Sağdan akış", description: "Sağdan sahneye süzül" },
  { id: "drop", label: "Düşüş", description: "Yukarıdan yerleş" },
  { id: "zoom-out", label: "Yakın plan", description: "Büyükten net ölçüye" },
  { id: "flip", label: "Çevir", description: "Dikey açılan yazı" },
  { id: "swing", label: "Salınım", description: "Eğilerek yerleş" },
  { id: "blur", label: "Netleş", description: "Bulanıklıktan netliğe" },
  { id: "wipe", label: "Perde", description: "Soldan açılan maske" },
  { id: "stagger", label: "Sıralı giriş", description: "Kelimeler peş peşe" },
  { id: "word-rise", label: "Kelime akışı", description: "Söylenirken yüksel" },
  { id: "wave", label: "Dalga", description: "Kelimelerde yumuşak dalga" },
  { id: "pulse", label: "Nabız", description: "Yavaşça büyü ve küçül" },
  { id: "shake", label: "Titreşim", description: "Aktif kelimede vurgu" },
  { id: "glitch", label: "Dijital", description: "Renk ayrışmalı vurgu" },
  { id: "underline", label: "Altını çiz", description: "Kelime altında renk akışı" },
  { id: "focus", label: "Tek kelime", description: "Her kelime tek başına" },
  { id: "elastic", label: "Elastik", description: "Esneyerek yerine oturur" },
  { id: "iris", label: "İris", description: "Ortadan iki yana açılır" },
  { id: "float", label: "Süzül", description: "Yavaş ve sinematik hareket" },
  { id: "orbit", label: "Yörünge", description: "Kelimeler yay çizerek gelir" },
  { id: "word-flip", label: "Kelime çevir", description: "Her kelime sırayla açılır" },
  { id: "tracking", label: "Harf aralığı", description: "Harfler birleşerek yerleşir" },
  { id: "shimmer", label: "Işık geçişi", description: "Yazının üzerinden ışık akar" },
  { id: "stamp", label: "Damga", description: "Kelimeyi baskı gibi vurgular" },
  { id: "mask-rise", label: "Maske yükselişi", description: "Satırlar perdeden sırayla yükselir" },
  { id: "glow-in", label: "Işıltı", description: "Parlak bir haleden netleşir" },
  { id: "skew", label: "Hız çizgisi", description: "Eğik ve hızlı giriş, sonra dikleşir" },
  { id: "cascade", label: "Harf yağmuru", description: "Harfler tek tek yukarıdan düşer" },
  { id: "marker", label: "Fosforlu kalem", description: "Söylenen kelimenin altını boyar" },
  { id: "neon", label: "Neon", description: "Kelime neon tüp gibi titreyip yanar" },
  { id: "spot-zoom", label: "Odak büyüt", description: "Söylenen kelime büyür, diğerleri soluk" },
  { id: "word-blur", label: "Kelime netleş", description: "Her kelime söylenirken netleşir" },
  { id: "heartbeat", label: "Kalp atışı", description: "Söylenen kelime çift vuruşla atar" },
  { id: "gradient", label: "Renk akışı", description: "Vurgu rengi yazıda sürekli akar" },
] as const;
export const CAPTION_FONTS = {
  sans: { label: "Modern", family: '\"Outfit\", sans-serif' },
  display: { label: "Başlık", family: '\"Syne\", sans-serif' },
  serif: { label: "Editoryal", family: '\"Cormorant Garamond\", serif' },
  mono: { label: "Monospace", family: "monospace" },
  montserrat: { label: "Montserrat · Modern", family: '"Montserrat", sans-serif' },
  oswald: { label: "Oswald · Uzun başlık", family: '"Oswald", sans-serif' },
  playfair: { label: "Playfair · Sinematik", family: '"Playfair Display", serif' },
  space: { label: "Space Grotesk · Geometrik", family: '"Space Grotesk", sans-serif' },
  caveat: { label: "Caveat · El yazısı", family: '"Caveat", cursive' },
  anton: { label: "Anton · Güçlü vurgu", family: '"Anton", sans-serif' },
} as const;
export type CaptionFont = keyof typeof CAPTION_FONTS;
export async function loadCaptionFont(font: CaptionFont, weight = 600, italic = false) {
  await document.fonts.load(
    `${italic ? "italic " : ""}${weight} 30px ${CAPTION_FONTS[font].family}`,
    "Müziğin ışığı ÇĞİÖŞÜ çğıöşü",
  );
}
export function captionAnimationGroup(id: CaptionAnimation): "Giriş" | "Kelime" | "Döngü" {
  if (["silk-flow", "wave", "pulse", "float", "shimmer", "gradient"].includes(id)) return "Döngü";
  if (
    [
      "pearl-step",
      "typewriter",
      "bounce",
      "spotlight",
      "sweep",
      "word-rise",
      "shake",
      "glitch",
      "underline",
      "focus",
      "orbit",
      "word-flip",
      "stamp",
      "marker",
      "neon",
      "spot-zoom",
      "word-blur",
      "heartbeat",
    ].includes(id)
  )
    return "Kelime";
  return "Giriş";
}
export type CaptionAnimation = (typeof CAPTION_ANIMATIONS)[number]["id"];
export const DEFAULT_CAPTIONS: CaptionOptions = {
  enabled: true,
  style: "karaoke",
  place: "bottom",
  size: 30,
  offset: 0,
  animation: "fade",
  textEffect: "none",
  speed: 1,
  intensity: 0.7,
  font: "sans",
  weight: 600,
  textColor: "#fff9ee",
  highlightColor: "theme",
  outlineColor: "#08080c",
  outline: 4,
  background: "auto",
  backgroundColor: "#08080c",
  uppercase: false,
  italic: false,
  glow: 0,
  shadow: false,
};
export const CAPTION_MAX_SECONDS = 600;

export function restoreCaptionOptions(raw: string | null): CaptionOptions {
  try {
    const v = JSON.parse(raw ?? "null");
    const color = (value: unknown, fallback: string) =>
      typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
    return {
      enabled: v?.enabled !== false,
      style: ["classic", "karaoke", "minimal"].includes(v?.style) ? v.style : "karaoke",
      place: ["bottom", "center", "top"].includes(v?.place) ? v.place : "bottom",
      size: Number.isFinite(v?.size) ? Math.max(20, Math.min(48, v.size)) : 30,
      offset: Number.isFinite(v?.offset) ? Math.max(-5, Math.min(5, v.offset)) : 0,
      animation: CAPTION_ANIMATIONS.some((a) => a.id === v?.animation) ? v.animation : "fade",
      textEffect: CAPTION_FINISHES.some((effect) => effect.id === v?.textEffect)
        ? v.textEffect
        : "none",
      speed: Number.isFinite(v?.speed) ? Math.max(0.5, Math.min(2, v.speed)) : 1,
      intensity: Number.isFinite(v?.intensity) ? Math.max(0.2, Math.min(1, v.intensity)) : 0.7,
      font: Object.hasOwn(CAPTION_FONTS, v?.font) ? v.font : "sans",
      weight: [500, 600, 700].includes(v?.weight) ? v.weight : 600,
      textColor: color(v?.textColor, "#fff9ee"),
      highlightColor: v?.highlightColor === "theme" ? "theme" : color(v?.highlightColor, "theme"),
      outlineColor: color(v?.outlineColor, "#08080c"),
      outline: Number.isFinite(v?.outline) ? Math.max(0, Math.min(8, v.outline)) : 4,
      background: ["auto", "none", "box", "pill", "marker"].includes(v?.background)
        ? v.background
        : "auto",
      backgroundColor: color(v?.backgroundColor, "#08080c"),
      uppercase: v?.uppercase === true,
      italic: v?.italic === true,
      glow: Number.isFinite(v?.glow) ? Math.max(0, Math.min(1, v.glow)) : 0,
      shadow: v?.shadow === true,
    };
  } catch {
    return { ...DEFAULT_CAPTIONS };
  }
}

// SRT/manual captions have no word timestamps. Distribute their time by text
// length; original ASR word timings remain authoritative when available.
export function timedCaptionWords(cue: CaptionCue): CaptionWord[] {
  const groups = cue.words?.length
    ? cue.words
    : [{ text: cue.text, start: cue.start, end: cue.end }];
  return groups.flatMap((group) => {
    const texts = group.text.trim().split(/\s+/).filter(Boolean);
    const total = texts.reduce((n, text) => n + Array.from(text).length, 0);
    let used = 0;
    return texts.map((text) => {
      const start = group.start + ((group.end - group.start) * used) / Math.max(1, total);
      used += Array.from(text).length;
      return {
        text,
        start,
        end: group.start + ((group.end - group.start) * used) / Math.max(1, total),
      };
    });
  });
}

export function cuesFromWords(
  chunks: Array<{ text: string; timestamp: [number | null, number | null] }>,
  duration: number,
): CaptionCue[] {
  const words: CaptionWord[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const item = chunks[i];
    const text = item.text.replace(/\s+/g, " ").trim();
    const start = item.timestamp?.[0];
    if (
      !text ||
      typeof start !== "number" ||
      !Number.isFinite(start) ||
      start < 0 ||
      start >= duration
    )
      continue;
    const next = chunks[i + 1]?.timestamp?.[0];
    const end = Math.min(
      duration,
      typeof item.timestamp[1] === "number" && Number.isFinite(item.timestamp[1])
        ? item.timestamp[1]
        : typeof next === "number" && next > start
          ? next
          : start + 0.8,
    );
    if (end > start) words.push({ text, start, end });
  }
  words.sort((a, b) => a.start - b.start);
  const cues: CaptionCue[] = [];
  let group: CaptionWord[] = [];
  const flush = () => {
    if (!group.length) return;
    cues.push({
      id: `cue-${cues.length}`,
      text: group.map((w) => w.text).join(" "),
      start: group[0].start,
      end: group[group.length - 1].end,
      words: group,
    });
    group = [];
  };
  for (const word of words) {
    if (
      group.length &&
      (group.length >= 7 ||
        word.start - group[group.length - 1].end > 0.65 ||
        word.end - group[0].start > 6)
    )
      flush();
    group.push(word);
    if (/[.!?。！？]$/.test(word.text)) flush();
  }
  flush();
  return cues;
}

export function activeCaption(cues: CaptionCue[], time: number, offset = 0): CaptionCue | null {
  const at = time - offset;
  // Last-started cue wins if manual edits introduce overlap.
  let low = 0,
    high = cues.length - 1,
    match = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cues[mid].start <= at) {
      match = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return match >= 0 && at < cues[match].end ? cues[match] : null;
}

export function subtitleTime(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
}
export function exportSrt(cues: CaptionCue[], offset = 0): string {
  return cues
    .filter((c) => c.end + offset > 0)
    .map(
      (c, i) =>
        `${i + 1}\n${subtitleTime(c.start + offset)} --> ${subtitleTime(c.end + offset)}\n${c.text}\n`,
    )
    .join("\n");
}
export function importSrt(raw: string, duration: number): CaptionCue[] {
  if (raw.length > 1024 * 1024) throw new Error("Altyazı dosyası en fazla 1 MB olabilir.");
  const parse = (v: string) => {
    const p = v.replace(",", ".").split(":").map(Number);
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : NaN;
  };
  const cues: CaptionCue[] = [];
  for (const block of raw
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const index = lines.findIndex((l) => l.includes("-->"));
    if (index < 0) continue;
    const match = lines[index].match(
      /(\d{2,}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2,}:\d{2}:\d{2}[,.]\d{3})/,
    );
    if (!match) continue;
    const start = parse(match[1]),
      end = Math.min(duration, parse(match[2]));
    const text = lines
      .slice(index + 1)
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, 500);
    if (text && start >= 0 && end > start && start < duration)
      cues.push({ id: `srt-${cues.length}`, text, start, end });
  }
  if (!cues.length) throw new Error("Geçerli zaman damgalı SRT altyazısı bulunamadı.");
  return cues.sort((a, b) => a.start - b.start).slice(0, 2000);
}

// Keep supplied lyrics verbatim. Matching words anchor timings to an existing
// transcript; unmatched words interpolate between anchors and need review.
export function lyricsToCues(raw: string, existing: CaptionCue[], duration: number): CaptionCue[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length || raw.length > 30000)
    throw new Error("1–30.000 karakter arasında şarkı sözü yapıştırın.");
  const tokens = lines.flatMap((text, line) => text.split(/\s+/).map((text) => ({ text, line })));
  if (tokens.length > 1200) throw new Error("En fazla 1.200 kelime yapıştırın.");
  const heard = existing.flatMap(timedCaptionWords).slice(0, 2000);
  const key = (text: string) => text.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
  const cols = heard.length + 1,
    grid = new Uint16Array((tokens.length + 1) * cols);
  for (let i = tokens.length - 1; i >= 0; i--)
    for (let j = heard.length - 1; j >= 0; j--)
      grid[i * cols + j] =
        key(tokens[i].text) === key(heard[j].text)
          ? 1 + grid[(i + 1) * cols + j + 1]
          : Math.max(grid[(i + 1) * cols + j], grid[i * cols + j + 1]);
  const anchors = new Map<number, { start: number; end: number }>();
  let i = 0,
    j = 0;
  while (i < tokens.length && j < heard.length) {
    if (key(tokens[i].text) === key(heard[j].text)) {
      anchors.set(i, heard[j]);
      i++;
      j++;
    } else if (grid[(i + 1) * cols + j] >= grid[i * cols + j + 1]) i++;
    else j++;
  }
  const words = tokens.map((token, index) => {
    const anchor = anchors.get(index);
    if (anchor) return { ...token, start: anchor.start, end: anchor.end };
    let before = index - 1,
      after = index + 1;
    while (before >= 0 && !anchors.has(before)) before--;
    while (after < tokens.length && !anchors.has(after)) after++;
    const start = before >= 0 ? anchors.get(before)!.end : 0,
      end = after < tokens.length ? anchors.get(after)!.start : duration;
    const size = Math.max(0.01, end - start) / (after - before - 1);
    return {
      ...token,
      start: Math.min(duration - 0.01, start + (index - before - 1) * size),
      end: Math.min(duration, start + (index - before) * size),
    };
  });
  return lines.map((text, line) => {
    const group = words.filter((w) => w.line === line);
    const start = Math.max(0, group[0].start),
      end = Math.min(duration, Math.max(start + 0.01, group.at(-1)!.end));
    return {
      id: `lyrics-${line}`,
      text,
      start,
      end,
      words: group.map(({ text, start, end }) => ({ text, start, end })),
    };
  });
}
