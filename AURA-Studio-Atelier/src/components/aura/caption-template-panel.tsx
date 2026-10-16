import { CAPTION_FINISHES } from "./caption-signatures";
import { ui } from "./interface-copy";
import { Search, X } from "lucide-react";
import { ChoiceStrip, ChoicePicker } from "./choice-strip";
import { useEffect, useRef, useState } from "react";
import { CAPTION_FONTS, DEFAULT_CAPTIONS, loadCaptionFont, type CaptionOptions } from "./captions";
import {
  CAPTION_TEMPLATES,
  matchingCaptionTemplate,
  type CaptionTemplate,
} from "./caption-templates";
import { paintCaptions } from "./caption-paint";

function TemplateThumbnail({ preset }: { preset: CaptionTemplate }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true,
      visible = false,
      raf = 0,
      last = -Infinity;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    const animated = preset.category === "İmza";
    const draw = (now = performance.now()) => {
      const canvas = canvasRef.current,
        ctx = canvas?.getContext("2d");
      if (!alive || !canvas || !ctx) return;
      ctx.clearRect(0, 0, 480, 180);
      paintCaptions(
        ctx,
        480,
        180,
        0,
        [{ id: "sample", text: "Ritmi hisset", start: 0, end: 3 }],
        { ...DEFAULT_CAPTIONS, ...preset.options, place: "center" },
        animated && !reduced.matches ? 0.05 + (((now - start) / 1000) % 2.9) : 1.25,
        "#dfb76a",
        reduced.matches,
        1.6,
      );
    };
    const loop = (now: number) => {
      if (!alive || !visible || document.hidden || reduced.matches) return;
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden && now - last > 1000 / 24) {
        draw(now);
        last = now;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      motion();
    });
    if (canvasRef.current) observer.observe(canvasRef.current);
    const motion = () => {
      cancelAnimationFrame(raf);
      draw();
      if (animated && !reduced.matches && visible && !document.hidden)
        raf = requestAnimationFrame(loop);
    };
    reduced.addEventListener("change", motion);
    document.addEventListener("visibilitychange", motion);
    motion();
    void loadCaptionFont(
      preset.options.font ?? "sans",
      preset.options.weight,
      preset.options.italic,
    )
      .then(() => {
        if (alive) draw();
      })
      .catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      reduced.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", motion);
    };
  }, [preset]);
  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={180}
      className="h-auto w-full rounded-lg bg-[#16130f]"
      aria-hidden="true"
    />
  );
}

const selectClass =
  "min-h-11 min-w-0 max-w-full rounded-xl border border-line bg-canvas px-3 text-ink";
const labelClass = "flex min-h-11 items-center justify-between gap-3 text-xs text-ink";
export function CaptionTemplateGallery({
  options,
  onChange,
}: {
  options: CaptionOptions;
  onChange: (patch: Partial<CaptionOptions>) => void;
}) {
  const [category, setCategory] = useState("Tümü");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [previous, setPrevious] = useState<Partial<CaptionOptions> | null>(null);
  const selected = matchingCaptionTemplate(options);
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase("tr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i");
  const shown = CAPTION_TEMPLATES.filter(
    (preset) =>
      (category === "Tümü" || preset.category === category) &&
      normalize(
        `${preset.name} ${ui(preset.name)} ${preset.description} ${ui(preset.description)}`,
      ).includes(normalize(search)),
  );
  function apply(patch: Partial<CaptionOptions>) {
    const { enabled: _enabled, offset: _offset, place: _place, ...appearance } = options;
    setPrevious(appearance);
    onChange(patch);
  }
  return (
    <div className="caption-template-panel space-y-2">
      {searching && (
        <input
          className="studio-input w-full"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={ui("Şablon ara")}
          aria-label={ui("Altyazı şablonu ara")}
          autoFocus
        />
      )}
      <div className="preset-toolbar">
        <ChoiceStrip
          className="flex flex-wrap gap-1"
          aria-label={ui("Şablon kategorisi")}
          value={category}
        >
          {["Tümü", "İmza", "Türler", "Sosyal", "Müzik", "Sinema", "Sade"].map((name) => (
            <button
              type="button"
              key={name}
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className={`min-h-11 rounded-full border px-3 text-xs ${category === name ? "border-accent text-ink" : "border-line text-mute"}`}
            >
              {ui(name)}
            </button>
          ))}
        </ChoiceStrip>
        <button
          type="button"
          className="studio-icon"
          aria-label={ui(searching ? "Şablon aramasını kapat" : "Şablonlarda ara")}
          onClick={() => {
            setSearching(!searching);
            setSearch("");
          }}
        >
          {searching ? <X className="size-4" /> : <Search className="size-4" />}
        </button>
      </div>
      <ChoiceStrip
        className="caption-template-strip"
        aria-label={ui("Altyazı şablonları")}
        value={selected?.id}
      >
        {shown.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={ui(preset.description)}
            aria-label={`${ui(preset.name)} ${ui("şablonu")}`}
            aria-pressed={selected?.id === preset.id}
            onClick={() => apply(preset.options)}
            className={`min-w-0 rounded-xl border p-2 text-left ${selected?.id === preset.id ? "border-accent bg-glass" : "border-line"}`}
          >
            <TemplateThumbnail preset={preset} />
            <span className="mt-2 block text-xs font-medium text-ink">{ui(preset.name)}</span>
            <span className="mt-1 block text-xs leading-relaxed text-mute">
              {ui(preset.description)}
            </span>
          </button>
        ))}
      </ChoiceStrip>
      <div className="caption-template-status flex items-center justify-between gap-2 text-xs">
        <span role="status" className="text-mute">
          {ui(selected?.name ?? "Özel görünüm")}
        </span>
        <button
          type="button"
          disabled={!previous}
          className="min-h-11 px-2 text-ink disabled:opacity-40"
          onClick={() => {
            if (previous) onChange(previous);
            setPrevious(null);
          }}
        >
          {ui("Görünümü geri al")}
        </button>
      </div>
      {!shown.length && <p className="text-xs text-mute">{ui("Bu aramaya uygun şablon yok.")}</p>}
    </div>
  );
}

export function CaptionAppearancePanel({
  options,
  onChange,
}: {
  options: CaptionOptions;
  onChange: (patch: Partial<CaptionOptions>) => void;
}) {
  const [page, setPage] = useState("Yazı tipi");
  return (
    <div className="space-y-2">
      <ChoiceStrip aria-label={ui("Altyazı görünümü")} value={page} className="studio-segments">
        {["Yazı tipi", "Stil", "Efekt", "Renkler"].map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={page === name}
            onClick={() => setPage(name)}
          >
            {ui(name)}
          </button>
        ))}
      </ChoiceStrip>
      <div hidden={page !== "Efekt"}>
        <ChoicePicker
          label={ui("Altyazı yazı efekti")}
          value={options.textEffect}
          options={CAPTION_FINISHES}
          onChange={(textEffect) =>
            onChange({ textEffect: textEffect as CaptionOptions["textEffect"] })
          }
        />
      </div>
      <div hidden={page !== "Yazı tipi"}>
        <ChoicePicker
          label={ui("Altyazı yazı tipi")}
          value={options.font}
          options={Object.entries(CAPTION_FONTS).map(([id, font]) => ({
            id,
            label: font.label,
            family: font.family,
          }))}
          onChange={(font) => onChange({ font: font as CaptionOptions["font"] })}
        />
      </div>
      <div hidden={page !== "Stil"} className="space-y-2">
        <label className={labelClass}>
          {ui("Kalınlık")}
          <select
            className={selectClass}
            aria-label={ui("Altyazı kalınlığı")}
            value={options.weight}
            onChange={(event) =>
              onChange({ weight: Number(event.target.value) as CaptionOptions["weight"] })
            }
          >
            <option value={500}>{ui("Normal")}</option>
            <option value={600}>{ui("Yarı kalın")}</option>
            <option value={700}>{ui("Kalın")}</option>
          </select>
        </label>
        {(
          [
            ["uppercase", "Büyük harf"],
            ["italic", "İtalik"],
            ["shadow", "Yumuşak gölge"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className={labelClass}>
            {ui(label)}
            <input
              type="checkbox"
              className="size-5 accent-accent"
              checked={options[key]}
              onChange={(event) => onChange({ [key]: event.target.checked })}
            />
          </label>
        ))}
      </div>
      <div hidden={page !== "Renkler"} className="space-y-2">
        {(
          [
            ["textColor", "Yazı rengi"],
            ["outlineColor", "Kontur rengi"],
            ["backgroundColor", "Arka plan rengi"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className={labelClass}>
            {ui(label)}
            <input
              className="h-11 w-12 rounded-lg border border-line bg-canvas p-1"
              type="color"
              aria-label={ui(`Altyazı ${label.toLocaleLowerCase("tr")}`)}
              value={options[key]}
              onChange={(event) => onChange({ [key]: event.target.value })}
            />
          </label>
        ))}
        <label className={labelClass}>
          {ui("Vurguda sahne rengini kullan")}
          <input
            type="checkbox"
            className="size-5 accent-accent"
            checked={options.highlightColor === "theme"}
            onChange={(event) =>
              onChange({ highlightColor: event.target.checked ? "theme" : "#ff6a2a" })
            }
          />
        </label>
        {options.highlightColor !== "theme" && (
          <label className={labelClass}>
            {ui("Vurgu rengi")}
            <input
              type="color"
              className="h-11 w-12 rounded-lg border border-line bg-canvas p-1"
              aria-label={ui("Altyazı vurgu rengi")}
              value={options.highlightColor}
              onChange={(event) => onChange({ highlightColor: event.target.value })}
            />
          </label>
        )}
      </div>
      <div hidden={page !== "Stil"} className="space-y-2">
        <ChoicePicker
          label={ui("Altyazı arka planı")}
          value={options.background}
          options={[
            { id: "auto", label: "Stile göre" },
            { id: "none", label: "Yok" },
            { id: "box", label: "Kutu" },
            { id: "pill", label: "Kapsül" },
            { id: "marker", label: "İşaretleyici" },
          ]}
          onChange={(background) =>
            onChange({ background: background as CaptionOptions["background"] })
          }
        />
        <label className={labelClass}>
          {ui("Kontur")}
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            aria-label={ui("Altyazı kontur kalınlığı")}
            className="aura-range min-w-0 flex-1"
            value={options.outline}
            onChange={(event) => onChange({ outline: Number(event.target.value) })}
          />
          <span className="w-8 text-right tabular-nums">{options.outline}</span>
        </label>
        <label className={labelClass}>
          {ui("Parıltı")}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            aria-label={ui("Altyazı parıltısı")}
            className="aura-range min-w-0 flex-1"
            value={options.glow}
            onChange={(event) => onChange({ glow: Number(event.target.value) })}
          />
          <span className="w-8 text-right tabular-nums">%{Math.round(options.glow * 100)}</span>
        </label>
      </div>
    </div>
  );
}
