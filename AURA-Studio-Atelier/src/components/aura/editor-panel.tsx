import { ui } from "./interface-copy";
import { createId } from "./id.ts";
import { ChoiceStrip, ChoicePicker } from "./choice-strip";
import { ScenePanel } from "./scene-panel";
import { Layers } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Scissors,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ImagePlus,
  Type,
  Film,
  Star,
  Heart,
  MoveRight,
  Circle,
  Square,
  Diamond,
  Sparkles,
} from "lucide-react";
import type { useEditor } from "./use-editor";
import {
  clipDuration,
  DEFAULT_ADJUST,
  frameAt,
  LAYER_ANIMATIONS,
  VIDEO_EFFECTS,
  type Adjustment,
  type Overlay,
} from "./editor";
import { CAPTION_FONTS } from "./captions";
import { formatTime } from "./studio-panels";
type Editor = ReturnType<typeof useEditor>;
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="editor-field">
      <span>{ui(label)}</span>
      {children}
    </label>
  );
}
function NumberField({
  label,
  value,
  min = 0,
  max = 3600,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={ui(label)}>
      <input
        aria-label={ui(label)}
        key={`${label}-${value}`}
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={Number(value.toFixed(2))}
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (!e.target.value || !Number.isFinite(n)) {
            e.target.value = String(value);
            return;
          }
          const next = Math.max(min, Math.min(max, n));
          if (next !== value) onChange(next);
        }}
      />
    </Field>
  );
}
function Waveform({ file }: { file: File | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let current = true;
    const canvas = ref.current;
    if (!file || !canvas || file.size > 50 * 1024 * 1024) return;
    void (async () => {
      try {
        const context = new OfflineAudioContext(1, 1, 8000),
          buffer = await context.decodeAudioData(await file.arrayBuffer());
        if (!current) return;
        const values = buffer.getChannelData(0),
          ctx = canvas.getContext("2d")!;
        canvas.width = 600;
        canvas.height = 48;
        ctx.clearRect(0, 0, 600, 48);
        ctx.fillStyle = getComputedStyle(canvas).color;
        for (let bar = 0; bar < 120; bar++) {
          let peak = 0;
          const begin = Math.floor((bar * values.length) / 120),
            end = Math.floor(((bar + 1) * values.length) / 120);
          for (let i = begin; i < end; i += 8) peak = Math.max(peak, Math.abs(values[i]));
          const h = Math.max(2, Math.min(44, peak * 80));
          ctx.fillRect(bar * 5, 24 - h / 2, 3, h);
        }
      } catch {
        /* waveform is optional; playback remains available */
      }
    })();
    return () => {
      current = false;
    };
  }, [file]);
  return (
    <canvas ref={ref} className="editor-waveform" aria-label={ui("Kaynak ses dalga biçimi")} />
  );
}
export function CutPanel({
  editor: e,
  file,
  duration,
  disabled,
  contextual = false,
  onMotion,
  onPause,
}: {
  editor: Editor;
  file: File | null;
  duration: number;
  disabled: boolean;
  contextual?: boolean;
  onMotion?: () => void;
  onPause?: () => void;
}) {
  const clip = e.project.clips.find((c) => c.id === e.selected) ?? e.project.clips[0],
    index = e.project.clips.findIndex((c) => c.id === clip?.id);
  function move(delta: number) {
    const clips = [...e.project.clips],
      target = index + delta;
    if (target < 0 || target >= clips.length) return;
    [clips[index], clips[target]] = [clips[target], clips[index]];
    e.commit({ ...e.project, clips });
  }
  return (
    <fieldset disabled={disabled} className="editor-panel">
      {!contextual && (
        <div className="editor-heading">
          <h3>{ui("Zaman çizelgesi")}</h3>
          <span>
            {formatTime(e.time)} / {formatTime(e.total)}
          </span>
        </div>
      )}
      {!file ? (
        <p className="editor-note">{ui("Kurguya başlamak için müzik seç.")}</p>
      ) : (
        <>
          <ScenePanel editor={e} file={file} disabled={disabled} onPause={onPause} />
          {!contextual && (
            <>
              <Waveform file={file} />
              <div className="editor-timeline" role="group" aria-label={ui("Müzik kesimleri")}>
                {e.project.clips.map((c, i) => (
                  <button
                    type="button"
                    key={c.id}
                    aria-label={ui(`Kesim ${i + 1}`)}
                    aria-pressed={clip?.id === c.id}
                    style={{ flex: Math.max(0.1, clipDuration(c)) }}
                    onClick={() => {
                      e.setSelected(c.id);
                      e.seek(e.project.clips.slice(0, i).reduce((n, c) => n + clipDuration(c), 0));
                    }}
                  >
                    <span>{i + 1}</span>
                    <small>{c.rate}×</small>
                  </button>
                ))}
              </div>
              <input
                className="aura-range"
                type="range"
                aria-label={ui("Kurgu zaman çizelgesi")}
                min={0}
                max={e.total}
                step={0.01}
                value={Math.min(e.total, e.time)}
                onChange={(event) => e.seek(Number(event.target.value))}
              />
              <div className="editor-actions">
                <button
                  type="button"
                  className="studio-button"
                  onClick={e.split}
                  disabled={e.project.clips.length >= 60}
                >
                  <Scissors className="size-4" />
                  {ui("Buradan böl")}
                </button>
                <button
                  type="button"
                  className="studio-icon"
                  aria-label={ui("Kurguyu geri al")}
                  disabled={!e.canUndo}
                  onClick={e.undo}
                >
                  <Undo2 className="size-4" />
                </button>
                <button
                  type="button"
                  className="studio-icon"
                  aria-label={ui("Kurguyu yinele")}
                  disabled={!e.canRedo}
                  onClick={e.redo}
                >
                  <Redo2 className="size-4" />
                </button>
              </div>
            </>
          )}
          {clip && (
            <>
              <div className={`editor-heading ${contextual ? "contextual-clip-heading" : ""}`}>
                <h3>
                  {contextual ? ui("Klip") : ui("Kesim")} {index + 1}
                </h3>
                <div className="editor-actions">
                  {contextual && (
                    <button
                      type="button"
                      className="studio-button"
                      disabled={e.project.clips.length >= 60}
                      onClick={e.split}
                    >
                      <Scissors className="size-4" />
                      {ui("Böl")}
                    </button>
                  )}
                  <button
                    className="studio-icon"
                    type="button"
                    aria-label={ui("Kesimi sola taşı")}
                    disabled={index <= 0}
                    onClick={() => move(-1)}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    className="studio-icon"
                    type="button"
                    aria-label={ui("Kesimi sağa taşı")}
                    disabled={index >= e.project.clips.length - 1}
                    onClick={() => move(1)}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                  <button
                    className="studio-icon"
                    type="button"
                    aria-label={ui(contextual ? "Seçili klibi çoğalt" : "Kesimi çoğalt")}
                    disabled={e.project.clips.length >= 60}
                    onClick={() => {
                      const clips = [...e.project.clips];
                      clips.splice(index + 1, 0, { ...clip, id: createId() });
                      e.commit({ ...e.project, clips });
                    }}
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    className="studio-icon"
                    type="button"
                    aria-label={ui(contextual ? "Seçili klibi sil" : "Kesimi sil")}
                    disabled={e.project.clips.length <= 1}
                    onClick={() =>
                      e.commit({
                        ...e.project,
                        clips: e.project.clips.filter((c) => c.id !== clip.id),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {onMotion && (
                <button
                  type="button"
                  className="studio-button"
                  onClick={() => {
                    e.setSelected(clip.id);
                    onMotion();
                  }}
                >
                  <Sparkles className="size-4" />
                  {ui("Animasyon")}
                </button>
              )}
              <div className="editor-two">
                <NumberField
                  label={ui("Kesim başlangıcı (sn)")}
                  value={clip.in}
                  max={duration}
                  onChange={(value) => e.changeClip(clip.id, { in: value })}
                />
                <NumberField
                  label={ui("Kesim bitişi (sn)")}
                  value={clip.out}
                  max={duration}
                  onChange={(value) => e.changeClip(clip.id, { out: value })}
                />
              </div>
              <Field label={ui("Oynatma hızı")}>
                <select
                  aria-label={ui("Oynatma hızı")}
                  value={clip.rate}
                  onChange={(event) => e.changeClip(clip.id, { rate: Number(event.target.value) })}
                >
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((v) => (
                    <option key={v} value={v}>
                      {v}×{v === 1 ? ui(" · Normal") : ui("")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={ui("Kesim ses düzeyi")}>
                <input
                  aria-label={ui("Kesim ses düzeyi")}
                  type="range"
                  className="aura-range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={clip.volume}
                  onChange={(event) =>
                    e.changeClip(clip.id, { volume: Number(event.target.value) })
                  }
                />
                <output>%{Math.round(clip.volume * 100)}</output>
              </Field>
              <div className="editor-two">
                <NumberField
                  label={ui("Ses girişi (sn)")}
                  value={clip.fadeIn}
                  max={Math.min(10, clipDuration(clip) / 2)}
                  onChange={(value) => e.changeClip(clip.id, { fadeIn: value })}
                />
                <NumberField
                  label={ui("Ses çıkışı (sn)")}
                  value={clip.fadeOut}
                  max={Math.min(10, clipDuration(clip) / 2)}
                  onChange={(value) => e.changeClip(clip.id, { fadeOut: value })}
                />
              </div>
              <p className="editor-note">
                {ui(
                  "Kesim zamanları kaynak parçaya aittir. Altyazılar kesimleri ve hızı takip eder. Hız değişirken ses perdesi korunur.",
                )}
              </p>
            </>
          )}
        </>
      )}
      {e.error && (
        <p className="editor-note" role="alert">
          {e.error}
        </p>
      )}
    </fieldset>
  );
}
export function MediaPanel({
  editor: e,
  disabled,
  onMotion,
}: {
  editor: Editor;
  disabled: boolean;
  onMotion?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    media = e.project.media.find((c) => c.id === e.selected) ?? e.project.media.at(-1);
  return (
    <fieldset disabled={disabled || e.busy} className="editor-panel">
      <div className="editor-heading">
        <h3>{ui("Fotoğraf ve video sahneleri")}</h3>
        <span>
          {e.project.media.length} {ui("sahne")}
        </span>
      </div>
      <p className="editor-note">
        {ui(
          "Müziğin üzerine kendi görüntülerini yerleştir. Video sahnelerinin kendi sesi kapalıdır; projenin müziği kullanılır.",
        )}
      </p>
      <button
        type="button"
        className="studio-primary"
        disabled={!e.total}
        onClick={() => input.current?.click()}
      >
        <Film className="size-4" />
        {ui("Fotoğraf / video ekle")}
      </button>
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm"
        multiple
        aria-label={ui("Sahne medya dosyaları")}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void e.upload(files);
        }}
      />
      <Field label={ui("Spektrumu görüntülerin üzerinde göster")}>
        <input
          type="checkbox"
          checked={e.project.showSpectrum}
          onChange={(event) => e.commit({ ...e.project, showSpectrum: event.target.checked })}
        />
      </Field>
      <ChoiceStrip className="editor-list" aria-label={ui("Medya sahneleri")} value={media?.id}>
        {e.project.media.map((c, i) => (
          <button
            className="editor-list-item"
            type="button"
            key={c.id}
            aria-pressed={media?.id === c.id}
            onClick={() => {
              e.setSelected(c.id);
              e.seek(c.start);
            }}
          >
            <span>
              {i + 1}. {c.name}
            </span>
            <small>
              {formatTime(c.start)}–{formatTime(c.end)}
              {!e.assets.has(c.asset) ? ui(" · dosya eksik") : ui("")}
            </small>
          </button>
        ))}
      </ChoiceStrip>
      {media && (
        <>
          {onMotion && (
            <button
              type="button"
              className="studio-button"
              onClick={() => {
                e.setSelected(media.id);
                onMotion();
              }}
            >
              <Sparkles className="size-4" />
              {ui("Animasyon")}
            </button>
          )}
          {media.kind === "video" && (
            <button
              type="button"
              className="studio-button"
              onClick={() => void e.freezeFrame(media.id)}
            >
              {ui("Kareyi dondur")}
            </button>
          )}
          <div className="editor-actions">
            <button
              className="studio-button"
              type="button"
              onClick={() =>
                e.commit({
                  ...e.project,
                  media: [
                    ...e.project.media,
                    {
                      ...media,
                      id: createId(),
                      start: media.end,
                      end: Math.min(e.total, media.end + (media.end - media.start)),
                    },
                  ],
                })
              }
              disabled={media.end >= e.total}
            >
              {ui("Sahneyi çoğalt")}
            </button>
            <button
              className="studio-icon"
              type="button"
              aria-label={ui("Sahneyi sil")}
              onClick={() =>
                e.commit({ ...e.project, media: e.project.media.filter((c) => c.id !== media.id) })
              }
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          {media.sourceVideo ? (
            <p className="editor-note">
              {ui(
                "Ana videonun kesimleri ve hızı Müzik bölümündeki zaman çizelgesinden düzenlenir.",
              )}
            </p>
          ) : (
            <>
              <div className="editor-two">
                <NumberField
                  label={ui("Sahne başlangıcı (sn)")}
                  value={media.start}
                  max={media.end - 0.1}
                  onChange={(start) => e.changeMedia(media.id, { start })}
                />
                <NumberField
                  label={ui("Sahne bitişi (sn)")}
                  value={media.end}
                  min={media.start + 0.1}
                  max={e.total}
                  onChange={(end) => e.changeMedia(media.id, { end })}
                />
              </div>
              {media.kind === "video" && (
                <div className="editor-two">
                  <NumberField
                    label={ui("Videodan başlat (sn)")}
                    value={media.offset}
                    max={(e.assets.get(media.asset)?.duration ?? 3600) - 0.1}
                    onChange={(offset) => e.changeMedia(media.id, { offset })}
                  />
                  <NumberField
                    label={ui("Video hızı")}
                    value={media.rate}
                    min={0.25}
                    max={4}
                    onChange={(rate) => e.changeMedia(media.id, { rate })}
                  />
                </div>
              )}
            </>
          )}
          <ChoicePicker
            label={ui("Görüntü kadrajı")}
            value={media.fit}
            options={[
              { id: "cover", label: "Doldur / kırp" },
              { id: "contain", label: "Tam görüntü" },
            ]}
            onChange={(fit) => e.changeMedia(media.id, { fit: fit as typeof media.fit })}
          />
          <ChoicePicker
            label={ui("Sahne geçişi")}
            value={media.transition}
            options={[
              { id: "none", label: "Kesme" },
              { id: "fade", label: "Yumuşak geçiş" },
              { id: "slide", label: "Kaydır" },
              { id: "zoom", label: "Yakınlaş" },
            ]}
            onChange={(transition) =>
              e.changeMedia(media.id, { transition: transition as typeof media.transition })
            }
          />
          <NumberField
            label={ui("Geçiş süresi (sn)")}
            value={media.transitionDuration}
            min={0.1}
            max={3}
            onChange={(transitionDuration) => e.changeMedia(media.id, { transitionDuration })}
          />
          <details className="easy-details">
            <summary>{ui("Maske ve renk anahtarı")}</summary>
            <ChoicePicker
              label={ui("Görüntü maskesi")}
              value={media.mask}
              options={[
                { id: "none", label: "Yok" },
                { id: "circle", label: "Oval" },
                { id: "rounded", label: "Yuvarlak köşe" },
              ]}
              onChange={(mask) => e.changeMedia(media.id, { mask: mask as typeof media.mask })}
            />
            <Field label={ui("Silinecek renk")}>
              <input
                type="color"
                aria-label={ui("Silinecek renk")}
                value={media.keyColor}
                onChange={(event) => e.changeMedia(media.id, { keyColor: event.target.value })}
              />
            </Field>
            <Field label={ui("Renk silme toleransı")}>
              <input
                className="aura-range"
                aria-label={ui("Renk silme toleransı")}
                type="range"
                min={0}
                max={150}
                value={media.keyTolerance}
                onChange={(event) =>
                  e.changeMedia(media.id, { keyTolerance: Number(event.target.value) })
                }
              />
            </Field>
            <p className="editor-note">
              {ui(
                "0 renk silmeyi kapatır. Yeşil ekran gibi düz bir rengi kaldırmak için artır. Yüksek değer ayrıntıları da silebilir.",
              )}
            </p>
          </details>
        </>
      )}
      {e.busy && (
        <p role="status" className="editor-note">
          {ui("Medya hazırlanıyor…")}
        </p>
      )}
      {e.error && (
        <p className="editor-note" role="alert">
          {e.error}
        </p>
      )}
    </fieldset>
  );
}
export function LayerPanel({ editor: e, disabled }: { editor: Editor; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null),
    layer = e.project.layers.find((l) => l.id === e.selected) ?? e.project.layers.at(-1);
  const [text, setText] = useState("");
  useEffect(() => setText(layer?.text ?? ""), [layer?.id, layer?.text]);
  const [section, setSection] = useState("Katmanlar");
  const [appearance, setAppearance] = useState("Yazı tipi");
  useEffect(() => {
    if (layer) {
      setSection(layer.kind === "text" ? "İçerik" : "Görünüm");
      setAppearance(layer.kind === "text" ? "Yazı tipi" : "Renkler");
    }
  }, [layer?.id]);
  return (
    <fieldset disabled={disabled || e.busy} className="editor-panel" data-layer-view={section}>
      <ChoiceStrip
        aria-label={ui("Metin araçları")}
        value={section}
        className="studio-segments layer-mode-nav"
      >
        {["Katmanlar", "İçerik", "Görünüm", "Hareket", "Konum", "Zaman"].map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={section === name}
            onClick={() => setSection(name)}
          >
            {ui(name)}
          </button>
        ))}
      </ChoiceStrip>
      <div hidden={section !== "Katmanlar"} className="space-y-2">
        {e.project.layers.length > 0 && (
          <div className="editor-heading">
            <h3>{ui("Metin ve çıkartmalar")}</h3>
            <span>
              {e.project.layers.length} {ui("katman")}
            </span>
          </div>
        )}
        {e.project.layers.length === 0 ? (
          <div className="layer-empty-state">
            <div className="layer-empty-meta">
              <Layers className="size-6" aria-hidden="true" />
              <span>{ui("0 katman")}</span>
            </div>
            <p>{ui("Henüz katman yok")}</p>
          </div>
        ) : (
          <p className="editor-note">
            {ui("Katmanları önizlemede sürükleyerek yerleştirebilirsin.")}
          </p>
        )}
        <div className="editor-actions layer-add-actions">
          <button
            type="button"
            className="studio-button"
            disabled={!e.total}
            onClick={() => e.addLayer("text")}
          >
            <Type className="size-4" />
            {ui("Metin ekle")}
          </button>
          <button
            type="button"
            className="studio-button"
            disabled={!e.total}
            onClick={() => input.current?.click()}
          >
            <ImagePlus className="size-4" />
            {ui("PNG çıkartma")}
          </button>
        </div>
        <input
          ref={input}
          type="file"
          className="sr-only"
          accept="image/png,image/webp,image/jpeg"
          aria-label={ui("Çıkartma dosyası")}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void e.upload(files, true);
          }}
        />
        <ChoiceStrip className="editor-actions layer-shapes" aria-label={ui("Çıkartmalar")}>
          {[
            { kind: "heart", name: "Kalp", icon: Heart },
            { kind: "star", name: "Yıldız", icon: Star },
            { kind: "arrow", name: "Ok", icon: MoveRight },
            { kind: "circle", name: "Daire", icon: Circle },
            { kind: "rectangle", name: "Etiket", icon: Square },
          ].map((item) => (
            <button
              key={item.kind}
              className="studio-icon"
              type="button"
              aria-label={ui(`${item.name} çıkartması ekle`)}
              disabled={!e.total}
              onClick={() => e.addLayer(item.kind as Overlay["kind"])}
            >
              <item.icon className="size-4" />
            </button>
          ))}
        </ChoiceStrip>
        {e.project.layers.length > 0 && (
          <ChoiceStrip
            className="editor-list"
            aria-label={ui("Görsel katmanlar")}
            value={layer?.id}
          >
            {e.project.layers.map((l, i) => (
              <button
                className="editor-list-item"
                type="button"
                key={l.id}
                aria-pressed={l.id === layer?.id}
                onClick={() => {
                  e.setSelected(l.id);
                  e.seek(l.start);
                }}
              >
                <span>
                  {i + 1}. {l.kind === "text" ? l.text : ui("Çıkartma")}
                </span>
                <small>
                  {formatTime(l.start)}–{formatTime(l.end)}
                </small>
              </button>
            ))}
          </ChoiceStrip>
        )}
      </div>
      {layer && (
        <>
          <div hidden={section !== "Katmanlar"} className="editor-actions">
            <button
              className="studio-button"
              type="button"
              onClick={() =>
                e.commit({
                  ...e.project,
                  layers: [...e.project.layers, { ...layer, id: createId() }],
                })
              }
              disabled={e.project.layers.length >= 50}
            >
              <Copy className="size-4" />
              {ui("Çoğalt")}
            </button>
            <button
              className="studio-button"
              type="button"
              onClick={() => {
                const layers = e.project.layers.filter((l) => l.id !== layer.id);
                layers.push(layer);
                e.commit({ ...e.project, layers });
              }}
            >
              {ui("Öne getir")}
            </button>
            <button
              className="studio-icon"
              type="button"
              aria-label={ui("Katmanı sil")}
              onClick={() =>
                e.commit({
                  ...e.project,
                  layers: e.project.layers.filter((l) => l.id !== layer.id),
                })
              }
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div hidden={section !== "İçerik"}>
            {layer.kind === "text" && (
              <Field label={ui("Katman metni")}>
                <textarea
                  aria-label={ui("Katman metni")}
                  rows={3}
                  maxLength={300}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onBlur={() => {
                    if (text !== layer.text) e.changeLayer(layer.id, { text });
                  }}
                />
              </Field>
            )}
          </div>
          <div hidden={section !== "Zaman"}>
            <div className="editor-two">
              <NumberField
                label={ui("Katman başlangıcı (sn)")}
                value={layer.start}
                max={layer.end - 0.1}
                onChange={(start) => e.changeLayer(layer.id, { start })}
              />
              <NumberField
                label={ui("Katman bitişi (sn)")}
                value={layer.end}
                min={layer.start + 0.1}
                max={e.total}
                onChange={(end) => e.changeLayer(layer.id, { end })}
              />
            </div>
          </div>
          <div hidden={section !== "Konum"} className="space-y-2">
            <div className="editor-two">
              <NumberField
                label={ui("Yatay konum (%)")}
                value={layer.x * 100}
                max={100}
                step={1}
                onChange={(x) => e.changeLayer(layer.id, { x: x / 100 })}
              />
              <NumberField
                label={ui("Dikey konum (%)")}
                value={layer.y * 100}
                max={100}
                step={1}
                onChange={(y) => e.changeLayer(layer.id, { y: y / 100 })}
              />
            </div>
            <div className="editor-two">
              <NumberField
                label={ui("Katman boyutu")}
                value={layer.scale}
                min={0.2}
                max={4}
                onChange={(scale) => e.changeLayer(layer.id, { scale })}
              />
              <NumberField
                label={ui("Katman dönüşü (°)")}
                value={layer.rotation}
                min={-180}
                max={180}
                step={1}
                onChange={(rotation) => e.changeLayer(layer.id, { rotation })}
              />
            </div>
          </div>
          <div hidden={section !== "Görünüm"} className="space-y-2">
            <ChoiceStrip
              aria-label={ui("Katman görünümü")}
              value={appearance}
              className="studio-segments"
            >
              {(layer.kind === "text" ? ["Yazı tipi", "Stil", "Renkler"] : ["Renkler"]).map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={appearance === name}
                    onClick={() => setAppearance(name)}
                  >
                    {ui(name)}
                  </button>
                ),
              )}
            </ChoiceStrip>
            <div hidden={appearance !== "Renkler"} className="space-y-2">
              <Field label={ui("Katman rengi")}>
                <input
                  type="color"
                  aria-label={ui("Katman rengi")}
                  value={layer.color}
                  onChange={(event) => e.changeLayer(layer.id, { color: event.target.value })}
                />
              </Field>
              <Field label={ui("Katman opaklığı")}>
                <input
                  type="range"
                  className="aura-range"
                  aria-label={ui("Katman opaklığı")}
                  min={0}
                  max={1}
                  step={0.05}
                  value={layer.opacity}
                  onChange={(event) =>
                    e.changeLayer(layer.id, { opacity: Number(event.target.value) })
                  }
                />
              </Field>
            </div>
            {layer.kind === "text" && (
              <div className="space-y-2">
                <div hidden={appearance !== "Yazı tipi"}>
                  <ChoicePicker
                    label={ui("Katman yazı tipi")}
                    value={layer.font}
                    options={Object.entries(CAPTION_FONTS).map(([id, font]) => ({
                      id,
                      label: font.label,
                      family: font.family,
                    }))}
                    onChange={(font) => e.changeLayer(layer.id, { font: font as Overlay["font"] })}
                  />
                </div>
                <div hidden={appearance !== "Stil"} className="space-y-2">
                  <Field label={ui("Kalınlık")}>
                    <select
                      aria-label={ui("Katman yazı kalınlığı")}
                      value={layer.weight}
                      onChange={(event) =>
                        e.changeLayer(layer.id, {
                          weight: Number(event.target.value) as Overlay["weight"],
                        })
                      }
                    >
                      <option value={500}>{ui("Orta")}</option>
                      <option value={600}>{ui("Yarı kalın")}</option>
                      <option value={700}>{ui("Kalın")}</option>
                    </select>
                  </Field>
                  <ChoicePicker
                    label={ui("Katman yazı efekti")}
                    value={layer.textEffect}
                    options={[
                      { id: "none", label: "Orijinal" },
                      { id: "neon", label: "Neon ışık" },
                      { id: "extrude", label: "Kabartma" },
                      { id: "gold", label: "Altın yansıma" },
                    ]}
                    onChange={(textEffect) =>
                      e.changeLayer(layer.id, { textEffect: textEffect as Overlay["textEffect"] })
                    }
                  />
                  <Field label={ui("Metin arka planı")}>
                    <input
                      type="checkbox"
                      checked={layer.background}
                      onChange={(event) =>
                        e.changeLayer(layer.id, { background: event.target.checked })
                      }
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>
          <div hidden={section !== "Hareket"} className="space-y-2">
            <ChoicePicker
              label={ui("Katman animasyonu")}
              value={layer.animation}
              options={LAYER_ANIMATIONS.filter(
                (a) => layer.kind === "text" || a.id !== "typewriter",
              )}
              onChange={(animation) =>
                e.changeLayer(layer.id, { animation: animation as Overlay["animation"] })
              }
            />
            <details className="easy-details">
              <summary>{ui("Anahtar kareler ve karışım")}</summary>
              <p className="editor-note">
                {ui(
                  "Önce zaman çizelgesinde bir konuma git. Konum, boyut, dönüş ve opaklığı ayarla; o an için anahtar kare ekle. Kareler arasındaki hareket doğrusal hesaplanır.",
                )}
              </p>
              <button
                className="studio-button"
                type="button"
                disabled={
                  e.time < layer.start || e.time > layer.end || layer.keyframes.length >= 50
                }
                onClick={() => {
                  const frame = {
                    time: e.time,
                    x: layer.x,
                    y: layer.y,
                    scale: layer.scale,
                    rotation: layer.rotation,
                    opacity: layer.opacity,
                  };
                  e.changeLayer(layer.id, {
                    keyframes: [
                      ...layer.keyframes.filter((f) => Math.abs(f.time - e.time) > 0.05),
                      frame,
                    ].sort((a, b) => a.time - b.time),
                  });
                }}
              >
                <Diamond className="size-4" />
                {ui("Bu ana anahtar kare ekle")}
              </button>
              {layer.keyframes.map((f, i) => (
                <div className="editor-heading" key={i}>
                  <button
                    type="button"
                    className="studio-button"
                    onClick={() => {
                      e.seek(f.time);
                      e.changeLayer(layer.id, {
                        x: f.x,
                        y: f.y,
                        scale: f.scale,
                        opacity: f.opacity,
                        rotation: f.rotation,
                      });
                    }}
                  >
                    {f.time.toFixed(2)} {ui("sn")}
                  </button>
                  <button
                    className="studio-icon"
                    type="button"
                    aria-label={ui(`${i + 1}. anahtar kareyi sil`)}
                    onClick={() =>
                      e.changeLayer(layer.id, {
                        keyframes: layer.keyframes.filter((_, index) => index !== i),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <ChoicePicker
                label={ui("Katman karışımı")}
                value={layer.blend}
                options={[
                  { id: "source-over", label: "Normal" },
                  { id: "screen", label: "Ekran" },
                  { id: "multiply", label: "Çarp" },
                ]}
                onChange={(blend) => e.changeLayer(layer.id, { blend: blend as Overlay["blend"] })}
              />
            </details>
          </div>
        </>
      )}
    </fieldset>
  );
}
export function AdjustmentPanel({ editor: e, disabled }: { editor: Editor; disabled: boolean }) {
  const [section, setSection] = useState("Filtreler");
  const [control, setControl] = useState("brightness");
  const controls = [
    { key: "brightness", name: "Parlaklık", min: 0.25, max: 2 },
    { key: "contrast", name: "Kontrast", min: 0.25, max: 2 },
    { key: "saturation", name: "Doygunluk", min: 0, max: 2 },
    { key: "warmth", name: "Sıcaklık", min: -1, max: 1 },
    { key: "blur", name: "Bulanıklık", min: 0, max: 8 },
    { key: "vignette", name: "Vinyet", min: 0, max: 1 },
  ] as const;
  const selectedControl = controls.find((item) => item.key === control) ?? controls[0];
  const a = e.project.adjust,
    change = (patch: Partial<Adjustment>) => e.commit({ ...e.project, adjust: { ...a, ...patch } });
  return (
    <fieldset disabled={disabled} className="editor-panel">
      <div className="preset-toolbar">
        <ChoiceStrip
          aria-label={ui("Görüntü ayarı bölümleri")}
          value={section}
          className="studio-segments"
        >
          {["Filtreler", "Efektler", "Renk", "Kadraj"].map((name) => (
            <button
              type="button"
              key={name}
              aria-pressed={section === name}
              onClick={() => setSection(name)}
            >
              {ui(name)}
            </button>
          ))}
        </ChoiceStrip>
        <button type="button" className="studio-button" onClick={() => change(DEFAULT_ADJUST)}>
          {ui("Sıfırla")}
        </button>
      </div>
      <div hidden={section !== "Filtreler"}>
        <ChoicePicker
          label={ui("Görüntü filtresi")}
          value={a.filter}
          options={[
            { id: "none", label: "Orijinal" },
            { id: "mono", label: "Siyah beyaz" },
            { id: "sepia", label: "Sepya" },
            { id: "vintage", label: "Nostalji" },
            { id: "cool", label: "Soğuk" },
            { id: "vivid", label: "Canlı" },
          ]}
          onChange={(filter) => change({ filter: filter as Adjustment["filter"] })}
        />
      </div>
      <div hidden={section !== "Efektler"}>
        <ChoicePicker
          label={ui("Görüntü efekti")}
          value={a.effect}
          options={VIDEO_EFFECTS}
          onChange={(effect) => change({ effect: effect as Adjustment["effect"] })}
        />
      </div>
      {section === "Efektler" && a.effect !== "none" && (
        <>
          <p className="editor-note">
            {ui(VIDEO_EFFECTS.find((effect) => effect.id === a.effect)?.description)}
          </p>
          <Field label={ui("Efekt gücü")}>
            <input
              type="range"
              className="aura-range"
              aria-label={ui("Görüntü efekt gücü")}
              min={0}
              max={1}
              step={0.05}
              value={a.effectAmount}
              onChange={(event) => change({ effectAmount: Number(event.target.value) })}
            />
          </Field>
        </>
      )}
      <div hidden={section !== "Renk"} className="space-y-2">
        <ChoiceStrip aria-label={ui("Renk ayarları")} value={control} className="choice-chips">
          {controls.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={control === item.key}
              onClick={() => setControl(item.key)}
            >
              {item.name}
            </button>
          ))}
        </ChoiceStrip>
        <Field label={ui(selectedControl.name)}>
          <input
            type="range"
            className="aura-range"
            aria-label={ui(selectedControl.name)}
            min={selectedControl.min}
            max={selectedControl.max}
            step={0.05}
            value={a[selectedControl.key]}
            onChange={(event) => change({ [selectedControl.key]: Number(event.target.value) })}
          />
          <output>{a[selectedControl.key].toFixed(2)}</output>
        </Field>
      </div>
      <div hidden={section !== "Kadraj"} className="space-y-2">
        <Field label={ui("Kadraj yakınlığı")}>
          <input
            type="range"
            className="aura-range"
            aria-label={ui("Kadraj yakınlığı")}
            min={0.5}
            max={3}
            step={0.05}
            value={a.zoom}
            onChange={(event) => change({ zoom: Number(event.target.value) })}
          />
        </Field>
        <NumberField
          label={ui("Görüntü dönüşü (°)")}
          value={a.rotation}
          min={-180}
          max={180}
          step={1}
          onChange={(rotation) => change({ rotation })}
        />
        <div className="editor-actions">
          <button
            type="button"
            className="studio-button"
            aria-pressed={a.flipX}
            onClick={() => change({ flipX: !a.flipX })}
          >
            {ui("Yatay çevir")}
          </button>
          <button
            type="button"
            className="studio-button"
            aria-pressed={a.flipY}
            onClick={() => change({ flipY: !a.flipY })}
          >
            {ui("Dikey çevir")}
          </button>
        </div>
      </div>
    </fieldset>
  );
}

export function SoundPanel({ editor: e, disabled }: { editor: Editor; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null),
    sound = e.project.sounds.find((s) => s.id === e.selected) ?? e.project.sounds.at(-1);
  return (
    <fieldset disabled={disabled || e.busy} className="editor-panel">
      <h3>{ui("Ek ses ve seslendirme")}</h3>
      <p className="editor-note">
        {ui(
          "Müziğe ikinci bir ses dosyası veya mikrofon kaydı ekle. Seslendirmede kulaklık kullanarak müziğin mikrofona karışmasını azalt.",
        )}
      </p>
      <div className="editor-actions">
        <button
          type="button"
          className="studio-button"
          disabled={!e.total || e.voiceRecording}
          onClick={() => input.current?.click()}
        >
          {ui("Ses dosyası ekle")}
        </button>
        {e.voiceRecording ? (
          <button className="studio-primary" type="button" onClick={e.stopVoiceover}>
            {ui("Ses kaydını bitir")}
          </button>
        ) : (
          <button
            className="studio-button"
            type="button"
            disabled={!e.total}
            onClick={() => void e.startVoiceover()}
          >
            {ui("Seslendirme kaydet")}
          </button>
        )}
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        aria-label={ui("Ek ses dosyası")}
        accept="audio/*,.mp3,.wav,.m4a,.webm"
        onChange={(event) => {
          const f = event.target.files?.[0];
          event.target.value = "";
          if (f) void e.uploadSound(f);
        }}
      />
      {e.voiceRecording && (
        <p className="editor-note" role="status">
          {ui("Mikrofon kaydediliyor · en fazla 2 dakika")}
        </p>
      )}
      <ChoiceStrip className="editor-list" aria-label={ui("Ek sesler")} value={sound?.id}>
        {e.project.sounds.map((s, i) => (
          <button
            className="editor-list-item"
            key={s.id}
            type="button"
            aria-pressed={s.id === sound?.id}
            onClick={() => {
              e.setSelected(s.id);
              e.seek(s.start);
            }}
          >
            <span>
              {i + 1}. {s.name}
            </span>
            <small>
              {formatTime(s.start)}–{formatTime(s.end)}
            </small>
          </button>
        ))}
      </ChoiceStrip>
      {sound && (
        <>
          <button
            type="button"
            className="studio-button"
            onClick={() =>
              e.commit({ ...e.project, sounds: e.project.sounds.filter((s) => s.id !== sound.id) })
            }
          >
            {ui("Ek sesi sil")}
          </button>
          <div className="editor-two">
            <NumberField
              label={ui("Ek ses başlangıcı (sn)")}
              value={sound.start}
              max={sound.end - 0.1}
              onChange={(start) => e.changeSound(sound.id, { start })}
            />
            <NumberField
              label={ui("Ek ses bitişi (sn)")}
              value={sound.end}
              min={sound.start + 0.1}
              max={e.total}
              onChange={(end) => e.changeSound(sound.id, { end })}
            />
          </div>
          <NumberField
            label={ui("Ek ses kaynağından başlat (sn)")}
            value={sound.offset}
            max={(e.soundAssets.get(sound.asset)?.duration ?? 3600) - 0.1}
            onChange={(offset) => e.changeSound(sound.id, { offset })}
          />
          <Field label={ui("Ek ses düzeyi")}>
            <input
              aria-label={ui("Ek ses düzeyi")}
              type="range"
              className="aura-range"
              min={0}
              max={2}
              step={0.05}
              value={sound.volume}
              onChange={(event) => e.changeSound(sound.id, { volume: Number(event.target.value) })}
            />
          </Field>
          <div className="editor-two">
            <NumberField
              label={ui("Ek ses girişi (sn)")}
              value={sound.fadeIn}
              max={10}
              onChange={(fadeIn) => e.changeSound(sound.id, { fadeIn })}
            />
            <NumberField
              label={ui("Ek ses çıkışı (sn)")}
              value={sound.fadeOut}
              max={10}
              onChange={(fadeOut) => e.changeSound(sound.id, { fadeOut })}
            />
          </div>
        </>
      )}
    </fieldset>
  );
}
