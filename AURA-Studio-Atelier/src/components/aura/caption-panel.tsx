import { ui } from "./interface-copy";
import { ChoiceStrip } from "./choice-strip";
import {
  Captions,
  Download,
  Sparkles,
  Trash2,
  Upload,
  Plus,
  Undo2,
  Redo2,
  Play,
  ChevronLeft,
  ChevronRight,
  FileText,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { activeCaption, exportSrt, type CaptionCue } from "./captions";
import type { useCaptions } from "./use-captions";
import { downloadBlob } from "./storage";
import { CaptionMotionPanel } from "./caption-motion-panel";

export function CaptionPanel({
  embedded = false,
  simple = false,
  studio,
  time,
  duration,
  onSeek,
  focusCue,
}: {
  embedded?: boolean;
  simple?: boolean;
  studio: ReturnType<typeof useCaptions>;
  time: number;
  duration: number;
  onSeek: (time: number) => void;
  focusCue?: { id: string; serial: number } | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [view, setView] = useState("create");
  const [method, setMethod] = useState("auto");
  const hasCues = studio.cues.length > 0;
  useEffect(() => {
    setView((current) => (hasCues ? (current === "create" ? "style" : current) : "create"));
  }, [hasCues]);
  const [lyrics, setLyrics] = useState("");
  const [editError, setEditError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const focusedCue = useRef("");
  useEffect(() => {
    if (!focusCue) return;
    const key = `${focusCue.id}:${focusCue.serial}`;
    if (focusedCue.current === key) return;
    const index = studio.cues.findIndex((cue) => cue.id === focusCue.id);
    if (index < 0) return;
    focusedCue.current = key;
    setSearch("");
    setPage(Math.floor(index / 8));
    setView("edit");
  }, [focusCue, studio.cues]);
  const filtered = studio.cues
    .map((cue, index) => ({ cue, index }))
    .filter(({ cue }) => cue.text.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages - 1);
  const shown = filtered.slice(currentPage * 8, currentPage * 8 + 8);
  const busy = studio.status !== "idle";
  const active = activeCaption(studio.cues, time, studio.options.offset);
  // "Bu altyazı" animates the caption under the playhead, else the one last
  // opened from the timeline.
  const motionTarget =
    active ?? (focusCue ? studio.cues.find((cue) => cue.id === focusCue.id) : undefined) ?? null;
  const button =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line px-3 text-xs disabled:opacity-40 enabled:hover:brightness-110";
  function download() {
    downloadBlob(
      new Blob([exportSrt(studio.cues, studio.options.offset)], {
        type: "application/x-subrip;charset=utf-8",
      }),
      `${studio.file?.name.replace(/\.[^.]+$/, "") || "aura"}.srt`,
    );
  }
  function updateTime(cue: CaptionCue, field: "start" | "end", target: HTMLInputElement) {
    const value = Number(target.value);
    if (
      !target.value ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > (duration || 600) ||
      (field === "start" ? value >= cue.end : value <= cue.start)
    ) {
      setEditError("Başlangıç bitişten önce, zamanlar da parça süresi içinde olmalı.");
      target.value = String(cue[field]);
      return;
    }
    setEditError("");
    studio.edit(cue.id, { [field]: value });
  }
  return (
    <details
      data-caption-view={view}
      open={embedded || undefined}
      className="aura-settings mt-2 border-t border-line"
    >
      <summary className="flex min-h-11 items-center justify-between px-2 text-sm text-ink">
        <span className="inline-flex items-center gap-2">
          <Captions className="size-4 text-mute" />
          {ui("Otomatik altyazı")}
        </span>
        <span className="text-mute" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="space-y-3 px-2 pb-3">
        {simple && view !== "style" && (
          <ChoiceStrip className="studio-segments" aria-label={ui("Altyazı adımları")} value={view}>
            {[
              { id: "create", label: "Oluştur" },
              { id: "style", label: "Görünüm" },
              { id: "edit", label: "Metni düzenle" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={view === item.id}
                disabled={(busy && item.id !== "create") || (item.id !== "create" && !hasCues)}
                onClick={() => setView(item.id)}
              >
                {ui(item.label)}
              </button>
            ))}
          </ChoiceStrip>
        )}
        {simple && view === "create" && !hasCues && !busy && (
          <p className="caption-steps-hint text-xs leading-relaxed text-mute">
            {ui("Görünüm ve metin düzenleme, altyazı oluşturulunca açılır.")}
          </p>
        )}
        <div hidden={simple && view !== "create"} className="space-y-3">
          {!simple && (
            <p className="text-xs leading-relaxed text-mute">
              {ui("Parçanın vokallerini yazıya dönüştür, zamanları düzenle ve videoya ekle.")}
            </p>
          )}
          {simple && (
            <ChoiceStrip
              className="caption-methods"
              aria-label={ui("Altyazı ekleme yöntemi")}
              value={method}
            >
              {[
                {
                  id: "auto",
                  label: "Otomatik oluştur",
                  description: "Sesi dinleyip yazıya dönüştür",
                  icon: Captions,
                },
                {
                  id: "lyrics",
                  label: "Sözleri yapıştır",
                  description: "Elindeki doğru metni kullan",
                  icon: Type,
                },
                {
                  id: "srt",
                  label: "SRT dosyası yükle",
                  description: "Zamanlanmış altyazıyı içe aktar",
                  icon: FileText,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={method === item.id}
                  disabled={busy}
                  onClick={() => setMethod(item.id)}
                >
                  <item.icon className="size-5" />
                  <span>
                    <strong>{ui(item.label)}</strong>
                    <small>{ui(item.description)}</small>
                  </span>
                </button>
              ))}
            </ChoiceStrip>
          )}
          {!studio.file && (
            <p className="text-xs text-mute">
              {ui(
                "Başlamak için bir müzik dosyası yükleyin. Otomatik altyazı yüklenen parçalar içindir.",
              )}
            </p>
          )}
          <div hidden={simple && method !== "auto"} className="space-y-3">
            <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-ink">
              {ui("Altyazı dili")}
              <select
                aria-label={ui("Altyazı dili")}
                value={studio.language}
                disabled={busy}
                onChange={(e) => studio.setLanguage(e.target.value)}
                className="min-h-11 rounded-xl border border-line bg-canvas px-3 text-ink"
              >
                <option value="turkish">{ui("Türkçe")}</option>
                <option value="english">{ui("İngilizce")}</option>
                <option value="auto">{ui("Otomatik algıla")}</option>
              </select>
            </label>
            <label className="editor-field">
              {ui("Tanıma kalitesi")}
              <select
                aria-label={ui("Tanıma kalitesi")}
                value={studio.quality}
                disabled={busy}
                onChange={(e) => studio.setQuality(e.target.value as "accurate" | "fast")}
              >
                <option value="accurate">{ui("Daha doğru")}</option>
                <option value="fast">{ui("Daha hızlı")}</option>
              </select>
            </label>
            <p className="editor-note">
              {ui(
                "Daha doğru model ilk kullanımda yaklaşık 250 MB indirir ve daha yavaş çalışır. Şarkıda doğru dili seçin; yoğun enstrümanlar kelime hatalarına yol açabilir.",
              )}
            </p>
            <details className="easy-details">
              <summary>{ui("Eksik bölümü yeniden tara")}</summary>
              <label className="editor-field">
                {ui("Sadece seçilen bölüm")}
                <input
                  type="checkbox"
                  checked={!!studio.range}
                  disabled={busy}
                  onChange={(e) =>
                    studio.setRange(
                      e.target.checked
                        ? { start: Math.max(0, time - 5), end: Math.min(duration, time + 15) }
                        : null,
                    )
                  }
                />
              </label>
              {studio.range && (
                <div className="editor-two">
                  <label className="editor-field">
                    {ui("Başlangıç (sn)")}
                    <input
                      aria-label={ui("Tarama başlangıcı")}
                      type="number"
                      min={0}
                      max={duration}
                      value={studio.range.start}
                      disabled={busy}
                      onChange={(e) =>
                        studio.setRange({ ...studio.range!, start: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="editor-field">
                    {ui("Bitiş (sn)")}
                    <input
                      aria-label={ui("Tarama bitişi")}
                      type="number"
                      min={0}
                      max={duration}
                      value={studio.range.end}
                      disabled={busy}
                      onChange={(e) =>
                        studio.setRange({ ...studio.range!, end: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
              )}
              <p className="editor-note">
                {ui(
                  "Altyazı oluştur düğmesiyle bu bölümü yeniden tarayın. Diğer bölümlerin satırları korunur.",
                )}
              </p>
            </details>
          </div>
          <details
            open={(simple && method === "lyrics") || undefined}
            hidden={simple && method !== "lyrics"}
            className={`easy-details ${simple ? "caption-lyrics-form" : ""}`}
          >
            <summary>{ui("Doğru şarkı sözlerini yapıştır")}</summary>
            <label className="editor-field">
              {ui("Her satıra bir cümle")}
              <textarea
                aria-label={ui("Şarkı sözleri")}
                rows={5}
                maxLength={30000}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder={ui("Şarkının doğru sözlerini buraya yapıştır")}
              />
            </label>
            <p className="editor-note">
              {ui(
                "Metin aynen kullanılır. Mevcut altyazıda eşleşen kelimeler zamanları belirler; diğer zamanlar tahmin edilir. Metni düzenle adımında dinleyip düzeltebilirsiniz.",
              )}
            </p>
            <button
              type="button"
              className="studio-button"
              disabled={!studio.file || busy || !lyrics.trim()}
              onClick={() => {
                studio.applyLyrics(lyrics);
                setView("edit");
              }}
            >
              {ui("Sözleri altyazıya ekle")}
            </button>
          </details>
          <div className="flex flex-wrap gap-2">
            {busy ? (
              <button className={button} type="button" onClick={studio.cancel}>
                {ui("İptal et")}
              </button>
            ) : (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-xs text-accent-ink disabled:opacity-40"
                type="button"
                hidden={simple && method !== "auto"}
                disabled={!studio.file}
                onClick={() => void studio.generate()}
              >
                <Sparkles className="size-4" />
                {ui("Altyazı oluştur")}
              </button>
            )}
            <button
              type="button"
              className={button}
              hidden={simple && method !== "srt"}
              disabled={!studio.file || busy}
              onClick={() => input.current?.click()}
            >
              <Upload className="size-4" />
              {ui("SRT yükle")}
            </button>
            <button
              type="button"
              className={button}
              hidden={simple && !hasCues}
              disabled={!studio.cues.length || busy}
              onClick={download}
            >
              <Download className="size-4" />
              {ui("SRT indir")}
            </button>
          </div>
          <input
            ref={input}
            className="sr-only"
            type="file"
            aria-label={ui("SRT altyazı dosyası")}
            accept=".srt,application/x-subrip,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void studio.importFile(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              disabled={!studio.file || busy}
              onClick={() => {
                studio.add(time, duration);
                setView("edit");
                setSearch("");
                setPage(
                  Math.floor(
                    studio.cues.filter((c) => c.start <= Math.max(0, Math.min(time, duration - 1)))
                      .length / 8,
                  ),
                );
              }}
            >
              <Plus className="size-4" />
              {ui("Satır ekle")}
            </button>
            <button
              type="button"
              className={button}
              disabled={!studio.canUndo || busy}
              onClick={studio.undo}
            >
              <Undo2 className="size-4" />
              {ui("Geri al")}
            </button>
            <button
              type="button"
              className={button}
              disabled={!studio.canRedo || busy}
              onClick={studio.redo}
            >
              <Redo2 className="size-4" />
              {ui("Yinele")}
            </button>
          </div>
          {studio.message && (
            <p role="status" className="text-xs leading-relaxed text-ink">
              {studio.message}
            </p>
          )}
          {busy && (
            <div className="space-y-1">
              <progress
                aria-label={ui("Altyazı oluşturma ilerlemesi")}
                max={100}
                value={studio.progress}
                className="h-2 w-full accent-accent"
              />
              <p className="text-xs tabular-nums text-mute">
                {studio.progress}
                {ui("% · İlk model indirmesi ve işlem birkaç dakika sürebilir.")}
              </p>
            </div>
          )}
          {studio.error && (
            <p role="alert" className="text-xs leading-relaxed text-ink">
              {studio.error}
            </p>
          )}
          <p hidden={simple && method !== "auto"} className="text-xs leading-relaxed text-mute">
            {ui(
              "Ses cihazınızda işlenir. İlk kullanımda model indirilir. En fazla 10 dakika / 50 MB. Vokaller, çalgılarla karıştığında hatalar olabilir; sonucu kontrol edin.",
            )}
          </p>
        </div>
        <div hidden={simple && view !== "style"}>
          <CaptionMotionPanel
            options={studio.options}
            onChange={studio.changeOptions}
            onCreate={simple ? () => setView("create") : undefined}
            onEdit={simple ? () => setView("edit") : undefined}
            target={hasCues ? motionTarget : null}
            onCueMotion={hasCues ? studio.cueMotion : undefined}
            onClearCueMotions={studio.clearCueMotions}
            customCount={studio.cues.filter((cue) => cue.motion).length}
          />
        </div>
        {studio.cues.length > 0 && (
          <>
            <div hidden={simple && view !== "style"}>
              <details open={!simple || undefined} className="easy-details">
                <summary>{ui("Konum, boyut ve zamanlama")}</summary>
                <label className="flex min-h-11 items-center justify-between text-xs text-ink">
                  {ui("Altyazıları göster")}
                  <input
                    type="checkbox"
                    className="size-5 accent-accent"
                    checked={studio.options.enabled}
                    onChange={(e) => studio.changeOptions({ enabled: e.target.checked })}
                  />
                </label>
                <ChoiceStrip
                  className="flex flex-wrap gap-1"
                  aria-label={ui("Altyazı stili")}
                  value={studio.options.style}
                >
                  {(
                    [
                      { id: "classic", label: "Klasik" },
                      { id: "karaoke", label: "Karaoke" },
                      { id: "minimal", label: "Minimal" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={studio.options.style === s.id}
                      onClick={() => studio.changeOptions({ style: s.id })}
                      className={`${button} ${studio.options.style === s.id ? "bg-accent text-accent-ink" : ""}`}
                    >
                      {ui(s.label)}
                    </button>
                  ))}
                </ChoiceStrip>
                <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-ink">
                  {ui("Altyazı konumu")}
                  <select
                    aria-label={ui("Altyazı konumu")}
                    value={studio.options.position ? "free" : studio.options.place}
                    onChange={(e) =>
                      e.target.value !== "free" &&
                      studio.changeOptions({ place: e.target.value as typeof studio.options.place })
                    }
                    className="min-h-11 rounded-xl border border-line bg-canvas px-3 text-ink"
                  >
                    <option value="bottom">{ui("Alt")}</option>
                    <option value="center">{ui("Orta")}</option>
                    <option value="top">{ui("Üst")}</option>
                    {studio.options.position && (
                      <option value="free">{ui("Serbest (sürüklendi)")}</option>
                    )}
                  </select>
                </label>
                <p className="text-xs leading-relaxed text-mute">
                  {ui(
                    "Önizlemede altyazıya dokunup sürükleyerek istediğin yere taşı; iki kez dokunarak metnini düzenle.",
                  )}
                </p>
                <label className="flex min-h-11 items-center gap-3 text-xs text-ink">
                  {ui("Yazı boyutu")}
                  <input
                    aria-label={ui("Altyazı yazı boyutu")}
                    className="aura-range min-w-0 flex-1"
                    type="range"
                    min={20}
                    max={48}
                    step={1}
                    value={studio.options.size}
                    onChange={(e) => studio.changeOptions({ size: Number(e.target.value) })}
                  />
                  <span className="w-8 text-right tabular-nums">{studio.options.size}</span>
                </label>
                <label className="flex min-h-11 items-center gap-3 text-xs text-ink">
                  {ui("Zaman kaydır")}
                  <input
                    aria-label={ui("Altyazı zaman kaydırma")}
                    className="aura-range min-w-0 flex-1"
                    type="range"
                    min={-5}
                    max={5}
                    step={0.1}
                    value={studio.options.offset}
                    onChange={(e) => studio.changeOptions({ offset: Number(e.target.value) })}
                  />
                  <span className="w-12 text-right tabular-nums">
                    {studio.options.offset > 0 ? ui("+") : ui("")}
                    {studio.options.offset.toFixed(1)} {ui("sn")}
                  </span>
                </label>
                <p className="text-xs text-mute">
                  {ui("Pozitif kaydırma altyazıyı geciktirir. MP4’e ekrandaki altyazı işlenir.")}
                </p>
              </details>
            </div>
            <div hidden={simple && view !== "edit"} className="space-y-3">
              {simple && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    onClick={() => studio.add(time, duration)}
                  >
                    {ui("Satır ekle")}
                  </button>
                  <button
                    type="button"
                    className={button}
                    disabled={!studio.canUndo || busy}
                    onClick={studio.undo}
                  >
                    {ui("Geri al")}
                  </button>
                  <button
                    type="button"
                    className={button}
                    disabled={!studio.canRedo || busy}
                    onClick={studio.redo}
                  >
                    {ui("Yinele")}
                  </button>
                  <button type="button" className={button} onClick={download}>
                    {ui("SRT indir")}
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-line pt-2">
                <p className="text-xs text-ink">
                  {studio.cues.length} {ui("satır · düzenle ve dinle")}
                </p>
                <button type="button" className={button} onClick={studio.clear}>
                  {ui("Tümünü temizle")}
                </button>
              </div>
              {editError && (
                <p role="alert" className="text-xs text-ink">
                  {editError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="studio-input min-w-0 flex-1"
                  placeholder={ui("Altyazılarda ara")}
                  aria-label={ui("Altyazılarda ara")}
                />
                <button
                  type="button"
                  className={button}
                  disabled={!active}
                  onClick={() => {
                    setSearch("");
                    setPage(Math.floor(studio.cues.findIndex((c) => c.id === active?.id) / 8));
                  }}
                >
                  {ui("Çalan satır")}
                </button>
              </div>
              <div className="space-y-2" aria-label={ui("Altyazı satırları")}>
                {shown.map(({ cue, index }) => (
                  <div
                    key={cue.id}
                    className={`space-y-2 rounded-xl border p-2 ${active?.id === cue.id ? "border-accent" : "border-line"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
                      <button
                        type="button"
                        className="min-h-11 px-2 text-ink"
                        aria-label={ui(`${index + 1}. altyazıya git`)}
                        onClick={() => onSeek(Math.max(0, cue.start + studio.options.offset))}
                      >
                        <Play className="mr-1 inline size-3.5" /> {index + 1}
                      </button>
                      <input
                        key={`s-${cue.start}`}
                        type="number"
                        min={0}
                        step={0.01}
                        defaultValue={cue.start.toFixed(2)}
                        aria-label={ui(`${index + 1}. altyazı başlangıcı`)}
                        className="min-h-11 w-20 rounded-lg border border-line bg-canvas px-2 text-ink"
                        onBlur={(e) => updateTime(cue, "start", e.target)}
                      />
                      <span>→</span>
                      <input
                        key={`e-${cue.end}`}
                        type="number"
                        min={0}
                        step={0.01}
                        defaultValue={cue.end.toFixed(2)}
                        aria-label={ui(`${index + 1}. altyazı bitişi`)}
                        className="min-h-11 w-20 rounded-lg border border-line bg-canvas px-2 text-ink"
                        onBlur={(e) => updateTime(cue, "end", e.target)}
                      />
                      <button
                        type="button"
                        className="ml-auto flex size-11 items-center justify-center text-mute"
                        aria-label={ui(`${index + 1}. altyazıyı sil`)}
                        onClick={() => studio.remove(cue.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="studio-button"
                      aria-label={ui(`${index + 1}. satırı şimdi başlat`)}
                      disabled={busy}
                      onClick={() => studio.stamp(cue.id, time)}
                    >
                      {ui("Bu satırı şimdi başlat")}
                    </button>
                    <textarea
                      rows={2}
                      maxLength={500}
                      aria-label={ui(`${index + 1}. altyazı metni`)}
                      value={cue.text}
                      onChange={(e) => studio.edit(cue.id, { text: e.target.value })}
                      className="w-full resize-y rounded-lg border border-line bg-canvas p-2 text-sm text-ink"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className={button}
                  disabled={currentPage === 0}
                  aria-label={ui("Önceki altyazı sayfası")}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs text-mute">
                  {filtered.length} {ui("satır ·")}
                  {currentPage + 1} / {pages}
                </span>
                <button
                  type="button"
                  className={button}
                  disabled={currentPage + 1 >= pages}
                  aria-label={ui("Sonraki altyazı sayfası")}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              {filtered.length === 0 && (
                <p className="text-xs text-mute">{ui("Aramanıza uygun satır bulunamadı.")}</p>
              )}
              <p className="text-xs text-mute">
                {ui(
                  "Kelime efektleri otomatik tanınan zamanları kullanır. SRT ve düzenlenen satırlarda kelime süreleri yaklaşık hesaplanır.",
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
