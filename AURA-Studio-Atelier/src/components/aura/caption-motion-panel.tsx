import { ui } from "./interface-copy";
import { ChoiceStrip } from "./choice-strip";
import { useEffect, useRef, useState } from "react";
import {
  CAPTION_ANIMATIONS,
  loadCaptionFont,
  captionAnimationGroup,
  type CaptionOptions,
  type CaptionCue,
} from "./captions";
import { paintCaptions } from "./caption-paint";
import { CaptionTemplateGallery, CaptionAppearancePanel } from "./caption-template-panel";

const SAMPLE: CaptionCue[] = [
  {
    id: "preview",
    text: "Müziğin ritmini hisset",
    start: 0,
    end: 3,
    words: [
      { text: "Müziğin", start: 0, end: 1 },
      { text: "ritmini", start: 1, end: 2 },
      { text: "hisset", start: 2, end: 3 },
    ],
  },
];

export function CaptionMotionPanel({
  options,
  onChange,
  onCreate,
  onEdit,
}: {
  options: CaptionOptions;
  onChange: (patch: Partial<CaptionOptions>) => void;
  onCreate?: () => void;
  onEdit?: () => void;
}) {
  const preview = useRef<HTMLCanvasElement>(null);
  const [section, setSection] = useState("Şablonlar");
  const [group, setGroup] = useState("Tümü");
  useEffect(() => {
    const canvas = preview.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    let alive = true;
    const start = performance.now();
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() ||
      "#ff6b00";
    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paintCaptions(
        ctx,
        canvas.width,
        canvas.height,
        0,
        SAMPLE,
        { ...options, enabled: true, place: "center", offset: 0 },
        reduced.matches || options.animation === "none" ? 1.5 : ((now - start) / 1000) % 3.5,
        accent,
        reduced.matches,
      );
      if (visible && !document.hidden && !reduced.matches && options.animation !== "none")
        frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      if (alive) draw(performance.now());
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restart();
    });
    observer.observe(canvas);
    reduced.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);
    void loadCaptionFont(options.font, options.weight, options.italic)
      .then(restart)
      .catch(() => {});
    restart();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", restart);
    };
  }, [options]);

  const selected = CAPTION_ANIMATIONS.find((effect) => effect.id === options.animation);
  const hasMotionControls = !["none", "typewriter", "spotlight", "sweep", "underline"].includes(
    options.animation,
  );
  return (
    <div className="caption-design space-y-2">
      <ChoiceStrip
        className="studio-segments"
        aria-label={ui("Altyazı tasarım bölümleri")}
        value={section}
      >
        {onCreate && (
          <button type="button" onClick={onCreate}>
            {ui("Oluştur")}
          </button>
        )}
        {["Şablonlar", "Animasyonlar", "Özelleştir"].map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={section === name}
            onClick={() => setSection(name)}
          >
            {ui(name)}
          </button>
        ))}
        {onEdit && (
          <button type="button" onClick={onEdit}>
            {ui("Metni düzenle")}
          </button>
        )}
      </ChoiceStrip>
      <div hidden={section !== "Şablonlar"}>
        <CaptionTemplateGallery options={options} onChange={onChange} />
      </div>
      {section === "Özelleştir" && <CaptionAppearancePanel options={options} onChange={onChange} />}
      {section === "Animasyonlar" && (
        <>
          <ChoiceStrip
            className="flex flex-wrap gap-1"
            aria-label={ui("Animasyon kategorisi")}
            value={group}
          >
            {["Tümü", "Giriş", "Kelime", "Döngü"].map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={group === name}
                onClick={() => setGroup(name)}
                className={`min-h-11 rounded-full border px-3 text-xs ${group === name ? "border-accent text-ink" : "border-line text-mute"}`}
              >
                {ui(name)}
              </button>
            ))}
          </ChoiceStrip>
          <p className="text-xs text-mute">
            {CAPTION_ANIMATIONS.length} {ui("seçenek ·")}
            {ui(selected?.label)}
          </p>
          <ChoiceStrip
            className="caption-animation-strip"
            aria-label={ui("Altyazı animasyonları")}
            value={options.animation}
          >
            {CAPTION_ANIMATIONS.filter(
              (effect) => group === "Tümü" || captionAnimationGroup(effect.id) === group,
            ).map((effect) => (
              <button
                key={effect.id}
                type="button"
                title={ui(effect.description)}
                aria-pressed={options.animation === effect.id}
                onClick={() => onChange({ animation: effect.id })}
                className={`min-h-11 rounded-xl border px-3 py-2 text-left ${options.animation === effect.id ? "border-accent bg-glass text-ink" : "border-line text-mute enabled:hover:text-ink"}`}
              >
                <span className="block text-xs font-medium">{ui(effect.label)}</span>
                <span className="mt-1 block text-xs text-mute">{ui(effect.description)}</span>
              </button>
            ))}
          </ChoiceStrip>
          {hasMotionControls && (
            <label className="flex min-h-11 items-center gap-3 text-xs text-ink">
              {ui("Geçiş hızı")}
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={options.speed}
                aria-label={ui("Altyazı animasyon hızı")}
                className="aura-range min-w-0 flex-1"
                onChange={(event) => onChange({ speed: Number(event.target.value) })}
              />
              <span className="w-10 text-right tabular-nums">{options.speed.toFixed(1)}×</span>
            </label>
          )}
          {![
            "none",
            "fade",
            "typewriter",
            "spotlight",
            "sweep",
            "underline",
            "focus",
            "flip",
            "wipe",
            "marker",
            "gradient",
          ].includes(options.animation) && (
            <label className="flex min-h-11 items-center gap-3 text-xs text-ink">
              {ui("Hareket gücü")}
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={options.intensity}
                aria-label={ui("Altyazı hareket gücü")}
                className="aura-range min-w-0 flex-1"
                onChange={(event) => onChange({ intensity: Number(event.target.value) })}
              />
              <span className="w-10 text-right tabular-nums">
                %{Math.round(options.intensity * 100)}
              </span>
            </label>
          )}
        </>
      )}
      <details className="easy-details">
        <summary>{ui("Örnek metinde önizle")}</summary>
        <canvas
          ref={preview}
          width={640}
          height={180}
          className="h-auto w-full rounded-xl border border-line bg-canvas"
          role="img"
          aria-label={ui(`${selected?.label} animasyonu: Müziğin ritmini hisset`)}
        />
      </details>
      <p className="text-xs leading-relaxed text-mute">
        {ui("Animasyonlar videoya işlenir. SRT dosyaları yalnızca metin ve zamanları içerir.")}
      </p>
    </div>
  );
}
