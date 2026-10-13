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
    let alive = true;
    const draw = () => {
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
        1.25,
        "#ff6a2a",
        false,
        1.6,
      );
    };
    draw();
    void loadCaptionFont(
      preset.options.font ?? "sans",
      preset.options.weight,
      preset.options.italic,
    )
      .then(draw)
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [preset]);
  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={180}
      className="h-auto w-full rounded-lg bg-canvas"
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
  const shown = CAPTION_TEMPLATES.filter(
    (preset) =>
      (category === "Tümü" || preset.category === category) &&
      `${preset.name} ${preset.description}`
        .toLocaleLowerCase("tr")
        .includes(search.toLocaleLowerCase("tr")),
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
          {["Tümü", "Sosyal", "Müzik", "Sinema", "Sade"].map((name) => (
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
            aria-label={ui(`${preset.name} şablonu`)}
            aria-pressed={selected?.id === preset.id}
            onClick={() => apply(preset.options)}
            className={`min-w-0 rounded-xl border p-2 text-left ${selected?.id === preset.id ? "border-accent bg-glass" : "border-line"}`}
          >
            <TemplateThumbnail preset={preset} />
            <span className="mt-2 block text-xs font-medium text-ink">{preset.name}</span>
            <span className="mt-1 block text-xs leading-relaxed text-mute">
              {ui(preset.description)}
            </span>
          </button>
        ))}
      </ChoiceStrip>
      <div className="caption-template-status flex items-center justify-between gap-2 text-xs">
        <span role="status" className="text-mute">
          {selected?.name ?? "Özel görünüm"}
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
        {["Yazı tipi", "Stil", "Renkler"].map((name) => (
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
