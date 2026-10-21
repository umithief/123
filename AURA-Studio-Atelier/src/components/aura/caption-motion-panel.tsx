import { ui } from "./interface-copy";
import { ChoiceStrip } from "./choice-strip";
import { useEffect, useMemo, useRef, useState } from "react";
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
  previewRound,
  type CaptionMotion,
} from "./caption-motion";
import { MotionTiles } from "./caption-motion-tiles";
import { paintCaptions } from "./caption-paint";
import { CaptionTemplateGallery, CaptionAppearancePanel } from "./caption-template-panel";

const SAMPLE = "Müziğin ritmini hisset";
const KINDS = [
  { id: "in", label: "Giriş" },
  { id: "out", label: "Çıkış" },
  { id: "loop", label: "Döngü" },
  { id: "combo", label: "Kombo" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

/**
 * Plays `text` with `options` (and `motion`, when given) on a loop: an empty
 * lead-in, the entrance, a readable hold, the exit and a pause. The bar under
 * it shows the phases and where the round is. Still when motion is reduced.
 */
function CaptionPreview({
  options,
  text,
  motion,
  label,
}: {
  options: CaptionOptions;
  text: string;
  motion?: CaptionMotion;
  label: string;
}) {
  const preview = useRef<HTMLCanvasElement>(null),
    playhead = useRef<HTMLSpanElement>(null);
  const active = motion ?? options.motion;
  const round = previewRound(active);
  const cue = useMemo<CaptionCue>(() => {
    // Words share the caption's time, so word-by-word styles play in full.
    const words = text.split(/\s+/).filter(Boolean),
      step = (round.end - round.start) / Math.max(1, words.length);
    return {
      id: "preview",
      text,
      start: round.start,
      end: round.end,
      words: words.map((word, i) => ({
        text: word,
        start: round.start + i * step,
        end: round.start + (i + 1) * step,
      })),
      ...(motion ? { motion } : {}),
    };
  }, [text, motion, round.start, round.end]);
  // The studio re-renders several times a second (music meters); the round's
  // clock and the drawing loop must not restart with it, or only the first
  // instant of the animation would ever be seen. The loop reads the latest
  // values here and starts a fresh round only when what it shows changes.
  const latest = useRef({ options, cue, active, round });
  latest.current = { options, cue, active, round };
  const clock = useRef(0),
    redraw = useRef(() => {});
  const shown = JSON.stringify([options, text, active]);
  useEffect(() => {
    clock.current = performance.now();
    redraw.current();
  }, [shown]);
  useEffect(() => {
    void loadCaptionFont(options.font, options.weight, options.italic)
      .then(() => redraw.current())
      .catch(() => {});
  }, [options.font, options.weight, options.italic]);
  useEffect(() => {
    const canvas = preview.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    let alive = true;
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() ||
      "#ff6b00";
    const draw = (now: number) => {
      const { options, cue, active, round } = latest.current;
      const still = reduced.matches || (options.animation === "none" && !hasMotion(active));
      const t = still
        ? round.start + round.enter + round.hold / 2
        : ((now - clock.current) / 1000) % round.total;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paintCaptions(
        ctx,
        canvas.width,
        canvas.height,
        0,
        [cue],
        { ...options, enabled: true, place: "center", offset: 0, position: null },
        t,
        accent,
        reduced.matches,
      );
      if (playhead.current) {
        playhead.current.hidden = still;
        playhead.current.style.left = `${(t / round.total) * 100}%`;
      }
      if (visible && !document.hidden && !still) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      if (alive) draw(performance.now());
    };
    redraw.current = restart;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restart();
    });
    observer.observe(canvas);
    reduced.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);
    restart();
    return () => {
      alive = false;
      redraw.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", restart);
    };
  }, []);
  const share = (seconds: number) => `${(seconds / round.total) * 100}%`;
  return (
    <div className="caption-preview">
      <canvas
        ref={preview}
        width={640}
        height={200}
        className="h-auto w-full rounded-xl border border-line bg-canvas"
        role="img"
        aria-label={label}
      />
      <div className="caption-preview-phases" aria-hidden="true">
        <i style={{ left: share(round.start), width: share(round.enter) }} data-phase="in" />
        <i
          style={{ left: share(round.start + round.enter), width: share(round.hold) }}
          data-phase="hold"
        />
        <i
          style={{ left: share(round.start + round.enter + round.hold), width: share(round.leave) }}
          data-phase="out"
        />
        <span ref={playhead} />
      </div>
      <p className="caption-preview-time">
        {round.enter > 0 && `${ui("Giriş")} ${round.enter.toFixed(1)} ${ui("sn")} · `}
        {`${ui("Ekranda")} ${round.hold.toFixed(1)} ${ui("sn")}`}
        {round.leave > 0 && ` · ${ui("Çıkış")} ${round.leave.toFixed(1)} ${ui("sn")}`}
      </p>
    </div>
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
  const previewText = perCue ? target!.text : SAMPLE;
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
            text={previewText}
            motion={perCue ? motion : undefined}
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
            text={SAMPLE}
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
