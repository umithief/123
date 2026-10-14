import { ui } from "./interface-copy";
import { createId } from "./id.ts";
import { ChoiceStrip } from "./choice-strip";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  ImagePlus,
  Play,
  Save,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Repeat2,
  RotateCcw,
  SkipBack,
  Pause,
  Search,
  X,
} from "lucide-react";
import {
  MODES,
  isLuxuryMode,
  isSignatureSpectrum,
  THEMES,
  TITLE_PLACES,
  TITLE_STYLES,
  themeById,
  type ModeId,
  type Theme,
  type TitlePlace,
  type TitleStyle,
} from "./palette";
import { createRenderState, paint, step, type Finish } from "./render";
import type { VisualOptions } from "./visuals";
import type { CoverOptions } from "./cover";
import { downloadBlob, readSetting, writeSetting } from "./storage";
import { searchText } from "./search";
import {
  parseSnapshot,
  restoreLooks,
  VIDEO_FORMATS,
  videoSize,
  type StudioSnapshot,
  type VideoFormat,
  type Resolution,
  type SavedLook,
} from "./studio";

export function formatTime(seconds: number) {
  // The epsilon keeps 29.999999… (float sums of cut lengths) from showing as 0:29.
  const whole = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) + 1e-6);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function ModePreview({ mode, theme }: { mode: ModeId; theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const draw = () => {
      if (!active) return;
      const ctx = ref.current?.getContext("2d");
      if (!ctx) return;
      const state = createRenderState();
      // A deterministic thumbnail of the same renderer used by the stage.
      for (let i = 1; i < 90; i++) step(state, { kind: "off" }, i * 16.67, true, 1);
      if (mode === "valley") {
        for (let row = 0; row < state.history.length / 96; row++)
          for (let bin = 0; bin < 96; bin++)
            state.history[row * 96 + bin] =
              state.levels[bin] * (1.4 + Math.sin(row * 0.15 + bin * 0.08) * 0.6);
      }
      state.reserve = 4;
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      paint(
        ctx,
        200,
        120,
        theme,
        mode,
        state,
        4,
        true,
        { text: "", place: "center", style: "wide" },
        "studio",
        undefined,
        { particles: false, speed: 1 },
      );
    };
    draw();
    void document.fonts.ready.then(draw);
    return () => {
      active = false;
    };
  }, [mode, theme]);
  return <canvas ref={ref} width={400} height={240} aria-hidden="true" className="mode-preview" />;
}

export function VisualPanel({
  mode,
  themeId,
  finish,
  sensitivity,
  effects,
  onMode,
  onTheme,
  onFinish,
  onSensitivity,
  onEffects,
}: {
  simple?: boolean;
  mode: ModeId;
  themeId: string;
  finish: Finish;
  sensitivity: number;
  effects: VisualOptions;
  onMode: (v: ModeId) => void;
  onTheme: (v: string) => void;
  onFinish: (v: Finish) => void;
  onSensitivity: (v: number) => void;
  onEffects: (v: Partial<VisualOptions>) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [section, setSection] = useState("Görseller");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const matches = MODES.filter(
    (m) =>
      (filter === "all" ||
        m.kind === filter ||
        (filter === "luxury" && isLuxuryMode(m.id)) ||
        (filter === "signature" && isSignatureSpectrum(m.id))) &&
      searchText(m.label).includes(searchText(query)),
  );
  const theme = themeById(themeId);
  return (
    <div className="preset-panel">
      <ChoiceStrip
        aria-label={ui("Spektrum bölümleri")}
        value={section}
        className="studio-segments"
      >
        {["Görseller", "Renkler", "Hareket"].map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={section === name}
            onClick={() => setSection(name)}
          >
            {ui(name)}
          </button>
        ))}
      </ChoiceStrip>
      {section === "Görseller" && (
        <>
          <div className="preset-toolbar">
            {searching ? (
              <label className="studio-search">
                <Search className="size-4" />
                <input
                  aria-label={ui("Sahne ara")}
                  placeholder={ui("Sahne ara…")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </label>
            ) : (
              <ChoiceStrip
                aria-label={ui("Görselleştirme filtresi")}
                value={filter}
                className="studio-segments"
              >
                {[
                  { id: "all", label: "Tümü" },
                  { id: "signature", label: "Yeni" },
                  { id: "luxury", label: "Lüks" },
                  { id: "spectrum", label: "Spektrum" },
                  { id: "scene", label: "Sahne" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                  >
                    {ui(item.label)}
                  </button>
                ))}
              </ChoiceStrip>
            )}
            <button
              type="button"
              className="studio-icon"
              aria-label={ui(searching ? "Sahne aramasını kapat" : "Sahnelerde ara")}
              onClick={() => {
                setSearching(!searching);
                setQuery("");
              }}
            >
              {searching ? <X className="size-4" /> : <Search className="size-4" />}
            </button>
          </div>
          <ChoiceStrip className="mode-gallery" aria-label={ui("Görselleştirmeler")} value={mode}>
            {matches.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mode-card ${mode === m.id ? "is-selected" : ""}`}
                aria-label={ui(m.label)}
                aria-pressed={mode === m.id}
                onClick={() => onMode(m.id)}
              >
                <ModePreview mode={m.id} theme={theme} />
                <span className="flex min-h-11 items-center justify-between gap-1 px-3 text-xs">
                  {ui(m.label)}
                  {mode === m.id && <Check className="size-3.5 text-accent" />}
                </span>
              </button>
            ))}
          </ChoiceStrip>
          {!matches.length && (
            <p className="studio-empty-result" role="status">
              {ui("Bu aramada sahne bulunamadı.")}
            </p>
          )}
        </>
      )}
      {section === "Renkler" && (
        <ChoiceStrip className="theme-grid" aria-label={ui("Renk teması")} value={themeId}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={themeId === t.id}
              onClick={() => onTheme(t.id)}
              className={themeId === t.id ? "is-selected" : ""}
            >
              <span style={{ background: `rgb(${t.mid.join(",")})` }} />
              {t.name}
            </button>
          ))}
        </ChoiceStrip>
      )}
      {section === "Hareket" && (
        <section className="studio-section">
          <ChoiceStrip className="studio-segments" aria-label={ui("Işık dokusu")} value={finish}>
            {(
              [
                { id: "studio", label: "Stüdyo" },
                { id: "cinema", label: "Sinematik" },
                { id: "vivid", label: "Canlı" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={finish === item.id}
                onClick={() => onFinish(item.id)}
              >
                {ui(item.label)}
              </button>
            ))}
          </ChoiceStrip>
          <label className="studio-range-row">
            <span>{ui("Hassasiyet")}</span>
            <input
              aria-label={ui("Hassasiyet")}
              className="aura-range"
              type="range"
              min={0.4}
              max={3}
              step={0.05}
              value={sensitivity}
              onChange={(e) => onSensitivity(Number(e.target.value))}
            />
            <output>{sensitivity.toFixed(2)}×</output>
          </label>
          <label className="studio-range-row">
            <span>{ui("Hareket hızı")}</span>
            <input
              aria-label={ui("Hareket hızı")}
              className="aura-range"
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={effects.speed}
              onChange={(e) => onEffects({ speed: Number(e.target.value) })}
            />
            <output>{effects.speed.toFixed(2)}×</output>
          </label>
          <label className="studio-check-row">
            {ui("Parçacık alanı")}
            <input
              type="checkbox"
              checked={effects.particles}
              onChange={(e) => onEffects({ particles: e.target.checked })}
            />
          </label>
          <label className="studio-check-row">
            {ui("Ritim dalgası")}
            <input
              type="checkbox"
              checked={effects.beatPulse !== false}
              onChange={(e) => onEffects({ beatPulse: e.target.checked })}
            />
          </label>
        </section>
      )}
    </div>
  );
}

export function ArtworkPanel({
  simple = false,
  url,
  options,
  busy,
  error,
  title,
  place,
  style,
  onUpload,
  onRemove,
  onOptions,
  onTitle,
  onPlace,
  onStyle,
}: {
  simple?: boolean;
  url: string | null;
  options: CoverOptions;
  busy: boolean;
  error: string | null;
  title: string;
  place: TitlePlace;
  style: TitleStyle;
  onUpload: () => void;
  onRemove: () => void;
  onOptions: (v: Partial<CoverOptions>) => void;
  onTitle: (v: string) => void;
  onPlace: (v: TitlePlace) => void;
  onStyle: (v: TitleStyle) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="studio-section">
        <h3>{ui("Kapak fotoğrafı")}</h3>
        <div className="artwork-upload">
          {url ? (
            <img src={url} alt="Yüklenen kapak" />
          ) : (
            <div className="artwork-placeholder">
              <ImagePlus className="size-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <button className="studio-button" type="button" disabled={busy} onClick={onUpload}>
              {busy ? ui("Hazırlanıyor…") : url ? ui("Fotoğrafı değiştir") : ui("Fotoğraf yükle")}
            </button>
            <p className="mt-2 text-xs text-mute">{ui("JPG, PNG, WebP · 20 MB’a kadar")}</p>
          </div>
          {url && (
            <button
              className="studio-icon"
              type="button"
              aria-label={ui("Kapağı kaldır")}
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-xs text-ink">
            {error}
          </p>
        )}
        {url && (
          <details open={!simple || undefined} className="easy-details">
            <summary>{ui("Kapak konumu ve görünümü")}</summary>
            <ChoiceStrip
              className="studio-segments"
              aria-label={ui("Kapak konumu")}
              value={options.placement}
            >
              {(
                [
                  { id: "center", label: "Merkez" },
                  { id: "background", label: "Arka plan" },
                  { id: "both", label: "İkisi" },
                ] as const
              ).map((i) => (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={options.placement === i.id}
                  onClick={() => onOptions({ placement: i.id })}
                >
                  {ui(i.label)}
                </button>
              ))}
            </ChoiceStrip>
            {options.placement !== "background" && (
              <>
                <ChoiceStrip
                  className="studio-segments"
                  aria-label={ui("Kapak biçimi")}
                  value={options.shape}
                >
                  {(
                    [
                      { id: "circle", label: "Daire" },
                      { id: "square", label: "Kare" },
                    ] as const
                  ).map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      aria-pressed={options.shape === i.id}
                      onClick={() => onOptions({ shape: i.id })}
                    >
                      {ui(i.label)}
                    </button>
                  ))}
                </ChoiceStrip>
                <label className="studio-range-row">
                  <span>{ui("Boyut")}</span>
                  <input
                    className="aura-range"
                    type="range"
                    min={0.2}
                    max={0.7}
                    step={0.01}
                    value={options.size}
                    aria-label={ui("Kapak boyutu")}
                    onChange={(e) => onOptions({ size: Number(e.target.value) })}
                  />
                  <output>{Math.round(options.size * 100)}%</output>
                </label>
                <label className="studio-check-row">
                  {ui("Basla hareket et")}
                  <input
                    type="checkbox"
                    checked={options.pulse}
                    onChange={(e) => onOptions({ pulse: e.target.checked })}
                  />
                </label>
              </>
            )}
            {options.placement !== "center" && (
              <label className="studio-range-row">
                <span>{ui("Görünürlük")}</span>
                <input
                  className="aura-range"
                  type="range"
                  min={0.1}
                  max={0.7}
                  step={0.01}
                  value={options.opacity}
                  aria-label={ui("Arka plan görünürlüğü")}
                  onChange={(e) => onOptions({ opacity: Number(e.target.value) })}
                />
                <output>{Math.round(options.opacity * 100)}%</output>
              </label>
            )}
          </details>
        )}
        <p className="studio-note">{ui("Kapak bu tarayıcıda saklanır ve videoya eklenir.")}</p>
      </section>
      <section className="studio-section">
        <h3>{ui("Sahne başlığı")}</h3>
        <input
          className="studio-input"
          value={title}
          maxLength={64}
          placeholder={ui("Parça veya sanatçı adı")}
          aria-label={ui("Parça adı")}
          onChange={(e) => onTitle(e.target.value)}
        />
        <details open={!simple || undefined} className="easy-details">
          <summary>{ui("Başlık konumu ve yazı stili")}</summary>
          <div className="studio-segments" role="group" aria-label={ui("Yazı konumu")}>
            {TITLE_PLACES.map((i) => (
              <button
                key={i.id}
                type="button"
                aria-pressed={place === i.id}
                onClick={() => onPlace(i.id)}
              >
                {ui(i.label)}
              </button>
            ))}
          </div>
          <div className="studio-segments" role="group" aria-label={ui("Yazı stili")}>
            {TITLE_STYLES.map((i) => (
              <button
                key={i.id}
                type="button"
                aria-pressed={style === i.id}
                onClick={() => onStyle(i.id)}
              >
                {ui(i.label)}
              </button>
            ))}
          </div>
        </details>
        <p className="studio-note">
          {ui("Başlığı, altyazıdan farklı bir konuma yerleştirebilirsiniz.")}
        </p>
      </section>
    </div>
  );
}

export function Transport({
  compact = false,
  source,
  name,
  playing,
  loading,
  time,
  duration,
  volume,
  muted,
  loop,
  onPlay,
  onSeek,
  onVolume,
  onMute,
  onLoop,
}: {
  compact?: boolean;
  source: string;
  name: string | null;
  playing: boolean;
  loading: boolean;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  onPlay: () => void;
  onSeek: (v: number) => void;
  onVolume: (v: number) => void;
  onMute: () => void;
  onLoop: () => void;
}) {
  const file = source === "file";
  if (compact)
    return (
      <section className="transport compact-transport" aria-label={ui("Oynatma kontrolleri")}>
        <button
          type="button"
          className="studio-play"
          aria-label={ui(source === "mic" ? "Mikrofonu kapat" : playing ? "Duraklat" : "Oynat")}
          disabled={source === "idle" || loading}
          onClick={onPlay}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <span className="transport-time">{formatTime(time)}</span>
        <input
          className="aura-range"
          aria-label={ui("Çalma konumu")}
          aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={file ? time : 0}
          disabled={!file || duration <= 0}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <span className="transport-time">{formatTime(duration)}</span>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="studio-icon"
              aria-label={ui("Ses ve oynatma ayarları")}
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="studio-popover playback-menu"
              side="top"
              sideOffset={12}
              align="end"
            >
              <p>{ui("Oynatma ayarları")}</p>
              <label className="studio-range-row">
                {ui("Çıkış sesi")}
                <input
                  className="aura-range"
                  type="range"
                  aria-label={ui("Çıkış sesi")}
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => onVolume(Number(event.target.value))}
                />
              </label>
              <button
                type="button"
                className="studio-popover-item"
                aria-pressed={muted}
                aria-label={ui(muted ? "Sesi aç" : "Dinlemeyi sessize al")}
                onClick={onMute}
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                {muted ? ui("Sesi aç") : ui("Dinlemeyi sessize al")}
              </button>
              <button
                type="button"
                className="studio-popover-item"
                disabled={!file}
                aria-label={ui("Parçayı tekrarla")}
                aria-pressed={loop}
                onClick={onLoop}
              >
                <Repeat2 className="size-4" />
                {ui("Parçayı tekrarla")}
              </button>
              <button
                type="button"
                className="studio-popover-item"
                disabled={!file}
                aria-label={ui("Başa dön")}
                onClick={() => onSeek(0)}
              >
                <SkipBack className="size-4" />
                {ui("Başa dön")}
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </section>
    );
  return (
    <section className="transport" aria-label={ui("Oynatma kontrolleri")}>
      <div className="transport-top">
        <button
          type="button"
          className="studio-icon"
          aria-label={ui("Başa dön")}
          disabled={!file}
          onClick={() => onSeek(0)}
        >
          <SkipBack className="size-4" />
        </button>
        <button
          type="button"
          className="studio-play"
          aria-label={ui(source === "mic" ? "Mikrofonu kapat" : playing ? "Duraklat" : "Oynat")}
          disabled={source === "idle" || loading}
          onClick={onPlay}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <div className="transport-track">
          <p>
            {loading
              ? ui("Ses hazırlanıyor…")
              : source === "mic"
                ? ui("Mikrofon dinleniyor")
                : source === "demo"
                  ? ui("AURA · Örnek ritim")
                  : name || "Henüz parça yüklenmedi"}
          </p>
          <span>
            {file
              ? `${formatTime(time)} / ${formatTime(duration)}`
              : source === "idle"
                ? ui("Parça yükle veya örnek ritmi başlat")
                : source === "mic"
                  ? ui("Hoparlöre geri besleme kapalı")
                  : ui("98 BPM · Enstrümantal")}
          </span>
        </div>
        <button
          type="button"
          className={`studio-icon ${loop && file ? "text-accent" : ""}`}
          aria-label={ui("Parçayı tekrarla")}
          aria-pressed={loop}
          disabled={!file}
          onClick={onLoop}
        >
          <Repeat2 className="size-4" />
        </button>
        <div className="transport-volume">
          <button
            type="button"
            className="studio-icon"
            aria-label={ui(muted ? "Sesi aç" : "Dinlemeyi sessize al")}
            aria-pressed={muted}
            onClick={onMute}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <input
            className="aura-range"
            aria-label={ui("Çıkış sesi")}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="transport-seek">
        <span>{formatTime(time)}</span>
        <input
          className="aura-range"
          aria-label={ui("Çalma konumu")}
          aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`}
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={file ? time : 0}
          disabled={!file || duration <= 0}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </section>
  );
}

export function ProjectPanel({
  snapshot,
  locked,
  onApply,
  onFormat,
  onResolution,
  onReset,
}: {
  snapshot: StudioSnapshot;
  locked: boolean;
  onApply: (v: StudioSnapshot) => void;
  onFormat: (v: VideoFormat) => void;
  onResolution: (v: Resolution) => void;
  onReset: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setLooks(restoreLooks(readSetting("aura-saved-looks"))), []);
  function save(items: SavedLook[]) {
    if (!writeSetting("aura-saved-looks", JSON.stringify(items))) {
      setError("Tarayıcı hazır ayarı saklayamadı. Ayarlarınızı dosya olarak yedekleyin.");
      return false;
    }
    setLooks(items);
    setError("");
    return true;
  }
  const size = videoSize(snapshot.format, snapshot.resolution);
  return (
    <div className="space-y-6">
      <section className="studio-section">
        <h3>{ui("Video boyutu")}</h3>
        <ChoiceStrip className="format-grid" aria-label={ui("Video oranı")} value={snapshot.format}>
          {VIDEO_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={locked}
              aria-label={ui(`${f.label} video (${f.ratio})`)}
              aria-pressed={snapshot.format === f.id}
              onClick={() => onFormat(f.id)}
            >
              <span>{f.ratio}</span>
              {ui(f.label)}
            </button>
          ))}
        </ChoiceStrip>
        <label className="studio-check-row">
          {ui("Çözünürlük")}
          <select
            className="studio-input w-auto"
            aria-label={ui("Video çözünürlüğü")}
            disabled={locked}
            value={snapshot.resolution}
            onChange={(e) => onResolution(e.target.value as Resolution)}
          >
            <option value="720">{ui("720p")}</option>
            <option value="1080">{ui("1080p")}</option>
          </select>
        </label>
        <p className="studio-note">
          {size.width} × {size.height} {ui("· H.264 · 30 fps")}
          <br />
          {ui("MP4 kaydı, oynayan sesi ve bu sahneyi içerir.")}{" "}
          {locked
            ? ui("Boyutlar kayıt tamamlanınca değiştirilebilir.")
            : ui("Dikey video kısa video platformları için uygundur.")}
        </p>
      </section>
      <section className="studio-section">
        <h3>{ui("Hazır ayarlarım")}</h3>
        <p className="studio-note">
          {ui("Görsel, ses, kapak yerleşimi ve altyazı stilini birlikte saklayın.")}
        </p>
        <label>
          <span className="sr-only">{ui("Hazır ayar adı")}</span>
          <input
            className="studio-input"
            aria-label={ui("Hazır ayar adı")}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ui("Örn. Gece seti")}
          />
        </label>
        <button
          className="studio-button w-full"
          type="button"
          disabled={locked || looks.length >= 8}
          onClick={() => {
            const next = {
              id: createId(),
              name: name.trim() || snapshot.title || "Yeni hazır ayar",
              savedAt: new Date().toISOString(),
              settings: snapshot,
            };
            if (save([next, ...looks])) {
              setMessage("Hazır ayar kaydedildi.");
              setName("");
            }
          }}
        >
          <Save className="size-4" />
          {ui("Hazır ayarı kaydet")}
        </button>
        {looks.length === 0 && (
          <div className="studio-empty">
            {ui("Henüz hazır ayar yok. Sevdiğiniz sahneyi burada saklayabilirsiniz.")}
          </div>
        )}
        <ChoiceStrip aria-label={ui("Kayıtlı görünümler")} className="saved-look-strip">
          {looks.map((look) => (
            <div className="saved-look" key={look.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  onApply(look.settings);
                  setMessage(`“${look.name}” uygulandı.`);
                }}
              >
                <span>{look.name}</span>
                <small>
                  {ui(MODES.find((m) => m.id === look.settings.mode)?.label)} ·{" "}
                  {themeById(look.settings.theme).name}
                </small>
              </button>
              <button
                className="studio-icon"
                type="button"
                disabled={locked}
                aria-label={ui(`${look.name} hazır ayarını sil`)}
                onClick={() => {
                  if (save(looks.filter((l) => l.id !== look.id)))
                    setMessage("Hazır ayar silindi.");
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </ChoiceStrip>
        <p className="studio-note">{ui("En fazla 8 hazır ayar, bu tarayıcıda saklanır.")}</p>
      </section>
      <section className="studio-section">
        <h3>{ui("Ayar yedeği")}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="studio-button"
            type="button"
            onClick={() =>
              downloadBlob(
                new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }),
                "aura-ayarlar.json",
              )
            }
          >
            <Download className="size-4" />
            {ui("Yedekle")}
          </button>
          <button
            className="studio-button"
            type="button"
            disabled={locked}
            onClick={() => input.current?.click()}
          >
            <Upload className="size-4" />
            {ui("Yedeği yükle")}
          </button>
        </div>
        <input
          ref={input}
          className="sr-only"
          type="file"
          aria-label={ui("AURA ayar dosyası")}
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (file.size > 100_000) throw new Error("Ayar dosyası en fazla 100 KB olabilir.");
              const settings = parseSnapshot(await file.text());
              onApply(settings);
              setError("");
              setMessage("Ayar yedeği yüklendi.");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Dosya açılamadı.");
            }
          }}
        />
        <p className="studio-note">
          {ui(
            "Yedek yalnızca ayarları içerir. Ses ve kapak dosyasını ayrıca yükleyin; altyazı metnini SRT olarak saklayın.",
          )}
        </p>
      </section>
      <details className="studio-help">
        <summary>{ui("Klavye kısayolları")}</summary>
        <dl>
          <div>
            <dt>{ui("Oynat / duraklat")}</dt>
            <dd>{ui("Boşluk")}</dd>
          </div>
          <div>
            <dt>{ui("5 saniye geri / ileri")}</dt>
            <dd>← / →</dd>
          </div>
          <div>
            <dt>{ui("Dinlemeyi sessize al")}</dt>
            <dd>M</dd>
          </div>
          <div>
            <dt>{ui("Tam ekran")}</dt>
            <dd>F</dd>
          </div>
          <div>
            <dt>{ui("Sahne görünümünden çık")}</dt>
            <dd>{ui("Esc")}</dd>
          </div>
        </dl>
      </details>
      <button
        className="studio-button"
        type="button"
        disabled={locked}
        onClick={() => {
          onReset();
          setMessage("Stüdyo ayarları sıfırlandı.");
        }}
      >
        <RotateCcw className="size-4" />
        {ui("Stüdyo ayarlarını sıfırla")}
      </button>
      {message && (
        <p role="status" className="text-xs text-ink">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
