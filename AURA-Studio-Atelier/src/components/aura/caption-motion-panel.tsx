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
import {
  CAPTION_IN,
  CAPTION_LOOP,
  CAPTION_OUT,
  MOTION_LIMITS,
  NO_MOTION,
  hasMotion,
  type CaptionMotion,
} from "./caption-motion";
import { MotionTiles } from "./caption-motion-tiles";
import { paintCaptions } from "./caption-paint";
import { CaptionTemplateGallery, CaptionAppearancePanel } from "./caption-template-panel";

const SAMPLE: CaptionCue = {
  id: "preview",
  text: "Müziğin ritmini hisset",
  start: 0,
  end: 3,
  words: [
    { text: "Müziğin", start: 0, end: 1 },
    { text: "ritmini", start: 1, end: 2 },
    { text: "hisset", start: 2, end: 3 },
  ],
};
const LOOP = 3.6;
const KINDS = [
  { id: "in", label: "Giriş" },
  { id: "out", label: "Çıkış" },
  { id: "loop", label: "Döngü" },
  { id: "combo", label: "Kombo" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

/** Plays `cue` with `options` on a loop; still when motion is reduced or absent. */
function CaptionPreview({
  options,
  cue,
  label,
}: {
  options: CaptionOptions;
  cue: CaptionCue;
  label: string;
}) {
  const preview = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = preview.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const moving = options.animation !== "none" || hasMotion(cue.motion ?? options.motion);
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
        [cue],
        { ...options, enabled: true, place: "center", offset: 0 },
        reduced.matches || !moving ? 1.5 : ((now - start) / 1000) % LOOP,
        accent,
        reduced.matches,
      );
      if (visible && !document.hidden && !reduced.matches && moving)
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
  }, [options, cue]);
  return (
    <canvas
      ref={preview}
      width={640}
      height={180}
      className="h-auto w-full rounded-xl border border-line bg-canvas"
      role="img"
      aria-label={label}
    />
  );
}

function Slider({
  label,
  ariaLabel,
  value,
  min,
  max,
  step,
  shown,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  shown: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-xs text-ink">
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel ?? label}
        className="aura-range min-w-0 flex-1"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="w-12 text-right tabular-nums">{shown}</span>
    </label>
  );
}

export function CaptionMotionPanel({
  options,
  onChange,
  onCreate,
  onEdit,
  target,
  onCueMotion,
  onClearCueMotions,
  customCount = 0,
}: {
  options: CaptionOptions;
  onChange: (patch: Partial<CaptionOptions>) => void;
  onCreate?: () => void;
  onEdit?: () => void;
  /** The caption "Bu altyazı" edits: the one at the playhead or last opened. */
  target?: CaptionCue | null;
  onCueMotion?: (id: string, motion: CaptionMotion | undefined) => void;
  onClearCueMotions?: () => void;
  /** How many captions have their own motion. */
  customCount?: number;
}) {
  const [section, setSection] = useState("Şablonlar");
  const [group, setGroup] = useState("Tümü");
  const [kind, setKind] = useState<Kind>("in");
  const [scope, setScope] = useState<"all" | "cue">("all");
  const perCue = scope === "cue" && !!target && !!onCueMotion;
  const motion: CaptionMotion = perCue
    ? (target!.motion ?? options.motion)
    : (options.motion ?? NO_MOTION);
  function setMotion(patch: Partial<CaptionMotion>) {
    const next = { ...motion, ...patch };
    if (perCue) onCueMotion!(target!.id, next);
    else onChange({ motion: next });
  }
  // The preview plays the caption being edited, with the motion being edited.
  const previewCue: CaptionCue = perCue
    ? { id: "preview", text: target!.text, start: 0, end: 3, motion }
    : SAMPLE;
  const previewOptions = perCue ? options : { ...options, motion };
  const picked = (list: readonly { id: string; label: string }[], id: string) =>
    ui(list.find((item) => item.id === id)?.label);
  const selected = CAPTION_ANIMATIONS.find((effect) => effect.id === options.animation);
  const hasMotionControls = !["none", "typewriter", "spotlight", "sweep", "underline"].includes(
    options.animation,
  );
  const comboEntrance = captionAnimationGroup(options.animation) === "Giriş";
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
        <div className="caption-motion space-y-2">
          <CaptionPreview
            options={previewOptions}
            cue={previewCue}
            label={ui("Animasyon önizlemesi")}
          />
          {onCueMotion && (
            <ChoiceStrip
              className="studio-segments"
              aria-label={ui("Animasyonun uygulanacağı altyazılar")}
              value={scope}
            >
              <button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>
                {ui("Tüm altyazılar")}
              </button>
              <button type="button" aria-pressed={scope === "cue"} onClick={() => setScope("cue")}>
                {ui("Bu altyazı")}
              </button>
            </ChoiceStrip>
          )}
          {scope === "cue" && !target && (
            <p className="text-xs text-mute" role="status">
              {ui(
                "Oynatma başlığını bir altyazının üzerine getirin ya da çizelgede bir altyazıya dokunun.",
              )}
            </p>
          )}
          {perCue && (
            <div className="caption-motion-target" role="status">
              <span>
                «{target!.text.length > 42 ? `${target!.text.slice(0, 40)}…` : target!.text}»
                <small>
                  {target!.motion ? ui("Kendi animasyonu var") : ui("Ortak animasyonu kullanıyor")}
                </small>
              </span>
              {target!.motion && (
                <button type="button" onClick={() => onCueMotion!(target!.id, undefined)}>
                  {ui("Ortak animasyona dön")}
                </button>
              )}
            </div>
          )}
          {(scope === "all" || perCue) && (
            <>
              <ChoiceStrip
                className="studio-segments caption-motion-kinds"
                aria-label={ui("Animasyon türü")}
                value={kind}
              >
                {KINDS.map((item) => {
                  const current =
                    item.id === "in"
                      ? motion.in !== "none" && picked(CAPTION_IN, motion.in)
                      : item.id === "out"
                        ? motion.out !== "none" && picked(CAPTION_OUT, motion.out)
                        : item.id === "loop"
                          ? motion.loop !== "none" && picked(CAPTION_LOOP, motion.loop)
                          : options.animation !== "none" && ui(selected?.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={kind === item.id}
                      onClick={() => setKind(item.id)}
                    >
                      {ui(item.label)}
                      {current && <small>{current}</small>}
                    </button>
                  );
                })}
              </ChoiceStrip>
              {kind === "in" && (
                <>
                  <MotionTiles
                    kind="in"
                    items={CAPTION_IN}
                    value={motion.in}
                    label={ui("Giriş animasyonları")}
                    onPick={(id) => setMotion({ in: id as CaptionMotion["in"] })}
                  />
                  {motion.in !== "none" && (
                    <Slider
                      label={ui("Giriş süresi")}
                      value={motion.inDuration}
                      min={MOTION_LIMITS.duration[0]}
                      max={MOTION_LIMITS.duration[1]}
                      step={0.1}
                      shown={`${motion.inDuration.toFixed(1)} ${ui("sn")}`}
                      onChange={(inDuration) => setMotion({ inDuration })}
                    />
                  )}
                </>
              )}
              {kind === "out" && (
                <>
                  <MotionTiles
                    kind="out"
                    items={CAPTION_OUT}
                    value={motion.out}
                    label={ui("Çıkış animasyonları")}
                    onPick={(id) => setMotion({ out: id as CaptionMotion["out"] })}
                  />
                  {motion.out !== "none" && (
                    <Slider
                      label={ui("Çıkış süresi")}
                      value={motion.outDuration}
                      min={MOTION_LIMITS.duration[0]}
                      max={MOTION_LIMITS.duration[1]}
                      step={0.1}
                      shown={`${motion.outDuration.toFixed(1)} ${ui("sn")}`}
                      onChange={(outDuration) => setMotion({ outDuration })}
                    />
                  )}
                </>
              )}
              {kind === "loop" && (
                <>
                  <MotionTiles
                    kind="loop"
                    items={CAPTION_LOOP}
                    value={motion.loop}
                    label={ui("Döngü animasyonları")}
                    onPick={(id) => setMotion({ loop: id as CaptionMotion["loop"] })}
                  />
                  {motion.loop !== "none" && (
                    <Slider
                      label={ui("Döngü hızı")}
                      value={motion.loopSpeed}
                      min={MOTION_LIMITS.speed[0]}
                      max={MOTION_LIMITS.speed[1]}
                      step={0.05}
                      shown={`${motion.loopSpeed.toFixed(2)}×`}
                      onChange={(loopSpeed) => setMotion({ loopSpeed })}
                    />
                  )}
                </>
              )}
              {kind !== "combo" && (
                <>
                  <Slider
                    label={ui("Hareket gücü")}
                    value={options.intensity}
                    min={0.2}
                    max={1}
                    step={0.05}
                    shown={`%${Math.round(options.intensity * 100)}`}
                    onChange={(intensity) => onChange({ intensity })}
                  />
                  <div className="caption-motion-actions">
                    <button
                      type="button"
                      disabled={!hasMotion(motion)}
                      onClick={() => setMotion({ ...NO_MOTION })}
                    >
                      {perCue ? ui("Bu altyazıda kapat") : ui("Animasyonları kaldır")}
                    </button>
                    {perCue && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ motion: { ...motion } });
                          onClearCueMotions?.();
                        }}
                      >
                        {ui("Tüm altyazılara uygula")}
                      </button>
                    )}
                    {!perCue && customCount > 0 && onClearCueMotions && (
                      <button type="button" onClick={onClearCueMotions}>
                        {customCount} {ui("altyazının kendi animasyonunu kaldır")}
                      </button>
                    )}
                  </div>
                  {comboEntrance &&
                    options.animation !== "none" &&
                    (motion.in !== "none" || motion.out !== "none") && (
                      <p className="text-xs text-mute">
                        {ui(
                          "Giriş veya çıkış seçiliyken Kombo'nun kendi girişi yerine bunlar oynar.",
                        )}
                      </p>
                    )}
                </>
              )}
            </>
          )}
          {kind === "combo" && (scope === "all" || perCue) && (
            <>
              <p className="text-xs text-mute">
                {ui(
                  "Kombo, kelime vurguları ve hazır hareketler içerir; tüm altyazılara uygulanır ve Giriş/Çıkış/Döngü ile birlikte çalışır.",
                )}
              </p>
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
                <Slider
                  label={ui("Geçiş hızı")}
                  ariaLabel={ui("Altyazı animasyon hızı")}
                  value={options.speed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  shown={`${options.speed.toFixed(1)}×`}
                  onChange={(speed) => onChange({ speed })}
                />
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
                <Slider
                  label={ui("Hareket gücü")}
                  ariaLabel={ui("Altyazı hareket gücü")}
                  value={options.intensity}
                  min={0.2}
                  max={1}
                  step={0.05}
                  shown={`%${Math.round(options.intensity * 100)}`}
                  onChange={(intensity) => onChange({ intensity })}
                />
              )}
            </>
          )}
        </div>
      )}
      {section !== "Animasyonlar" && (
        <details className="easy-details">
          <summary>{ui("Örnek metinde önizle")}</summary>
          <CaptionPreview
            options={options}
            cue={SAMPLE}
            label={ui(`${selected?.label} animasyonu: Müziğin ritmini hisset`)}
          />
        </details>
      )}
      <p className="text-xs leading-relaxed text-mute">
        {ui("Animasyonlar videoya işlenir. SRT dosyaları yalnızca metin ve zamanları içerir.")}
      </p>
    </div>
  );
}
