import { ui } from "./interface-copy";
import { useState } from "react";
import { ChoiceStrip } from "./choice-strip";
import { Radio, SlidersHorizontal } from "lucide-react";
import { DEFAULT_MUSIC, MUSIC_PRESETS, type MusicOptions } from "./music";
import type { VisualOptions } from "./visuals";

export type MusicStats = {
  bpm: number | null;
  beats: number;
  bass: number;
  mid: number;
  high: number;
};

export function MusicPanel({
  embedded = false,
  music,
  effects,
  stats,
  active,
  onMusic,
  onEffects,
  onScene,
}: {
  embedded?: boolean;
  music: MusicOptions;
  effects: VisualOptions;
  stats: MusicStats;
  active: boolean;
  onMusic: (patch: Partial<MusicOptions>) => void;
  onEffects: (patch: Partial<VisualOptions>) => void;
  onScene: (id: "electronic" | "acoustic" | "ambient") => void;
}) {
  const [section, setSection] = useState("Ekolayzır");
  return (
    <details
      open={embedded || undefined}
      className={`aura-settings mt-2 border-t border-line ${embedded ? "is-embedded" : ""}`}
    >
      <summary className="flex min-h-11 items-center justify-between px-2 text-sm text-ink">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-mute" />
          {ui("Müzik eklentileri")}
        </span>
        <span className="text-mute" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="space-y-3 px-2 pb-3">
        <ChoiceStrip
          aria-label={ui("Ses ayarı bölümleri")}
          value={section}
          className="studio-segments"
        >
          {["Ekolayzır", "Efektler", "Ritim"].map((name) => (
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
        <div hidden={section !== "Ritim"} className="space-y-2">
          <div className="rounded-2xl border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs text-mute">
                <Radio className="size-4" />
                {ui("Ritim analizi")}
              </span>
              <output aria-label={ui("Tahmini tempo")} className="text-sm text-ink tabular-nums">
                {active
                  ? stats.bpm
                    ? `≈ ${stats.bpm} BPM`
                    : ui("Ritim bekleniyor")
                  : ui("Müzik başlatın")}
              </output>
            </div>
            <p className="mt-2 text-xs text-mute">
              <span aria-label={ui("Algılanan vuruş sayısı")} className="tabular-nums">
                {stats.beats}
              </span>{" "}
              {ui("vuruş algılandı")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Bas", value: stats.bass },
                { label: "Orta", value: stats.mid },
                { label: "Tiz", value: stats.high },
              ].map((band) => (
                <div key={band.label}>
                  <div className="flex items-center justify-between text-xs text-mute">
                    <span>{ui(band.label)}</span>
                    <span className="tabular-nums">{band.value}%</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-200"
                      style={{ width: `${band.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mute">
              {ui(
                "Tempo, tekrarlayan bas vuruşlarından tahmin edilir; düzensiz ritimde değer gösterilmez.",
              )}
            </p>
          </div>
          <div className="divide-y divide-line">
            <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-ink">
              {ui("Ritim dalgası")}
              <input
                className="size-5 accent-accent"
                type="checkbox"
                checked={effects.beatPulse ?? true}
                onChange={(event) => onEffects({ beatPulse: event.target.checked })}
              />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-ink">
              <span>
                {ui("Otomatik DJ")}
                <span className="ml-2 text-mute">{ui("16 vuruşta sahne değiştir")}</span>
              </span>
              <input
                className="size-5 shrink-0 accent-accent"
                type="checkbox"
                checked={effects.autoScene ?? false}
                onChange={(event) => onEffects({ autoScene: event.target.checked })}
              />
            </label>
          </div>
          <div className="border-t border-line pt-3">
            <p className="text-xs text-mute">{ui("Sahne reçeteleri")}</p>
            <ChoiceStrip
              className="mt-1 flex flex-wrap gap-1"

              aria-label={ui("Müzik ve sahne reçeteleri")}
            >
              {(
                [
                  { id: "electronic", label: "Elektronik" },
                  { id: "acoustic", label: "Akustik" },
                  { id: "ambient", label: "Atmosfer" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onScene(item.id)}
                  className="h-11 rounded-full border border-line px-3 text-xs text-ink hover:bg-line"
                >
                  {ui(item.label)}
                </button>
              ))}
            </ChoiceStrip>
          </div>
        </div>
        <div hidden={section !== "Ekolayzır"} className="border-t border-line pt-2">
          <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-ink">
            {ui("3 bant ekolayzır")}
            <input
              className="size-5 accent-accent"
              type="checkbox"
              checked={music.eq}
              onChange={(event) => onMusic({ eq: event.target.checked })}
            />
          </label>
          <ChoiceStrip
            className="flex flex-wrap gap-1"
            aria-label={ui("Ekolayzır hazır ayarları")}
            value={`${music.bass}:${music.mid}:${music.treble}`}
          >
            {MUSIC_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={
                  music.eq &&
                  music.bass === preset.bass &&
                  music.mid === preset.mid &&
                  music.treble === preset.treble
                }
                className={`h-11 rounded-full px-3 text-xs ${music.eq && music.bass === preset.bass && music.mid === preset.mid && music.treble === preset.treble ? "bg-accent text-accent-ink" : "text-mute"}`}
                onClick={() =>
                  onMusic({ eq: true, bass: preset.bass, mid: preset.mid, treble: preset.treble })
                }
              >
                {ui(preset.label)}
              </button>
            ))}
          </ChoiceStrip>
          <details className="easy-details panel-disclosure">
            <summary>{ui("Ekolayzır ince ayarı")}</summary>
            {(
              [
                { id: "bass", label: "Bas kazancı", hz: "180 Hz" },
                { id: "mid", label: "Orta frekans kazancı", hz: "1 kHz" },
                { id: "treble", label: "Tiz kazancı", hz: "4.2 kHz" },
              ] as const
            ).map((band) => (
              <label
                key={band.id}
                className={`flex min-h-11 items-center gap-3 text-xs ${music.eq ? "text-ink" : "text-mute"}`}
              >
                <span className="w-16 shrink-0">
                  {band.id === "bass" ? ui("Bas") : band.id === "mid" ? ui("Orta") : ui("Tiz")}
                  <span className="block text-mute">{band.hz}</span>
                </span>
                <input
                  aria-label={ui(band.label)}
                  className="aura-range min-w-0 flex-1 disabled:opacity-40"
                  type="range"
                  min={-6}
                  max={6}
                  step={0.5}
                  disabled={!music.eq}
                  value={music[band.id]}
                  onChange={(event) => onMusic({ [band.id]: Number(event.target.value) })}
                />
                <span className="w-12 text-right tabular-nums">
                  {music[band.id] > 0 ? ui("+") : ui("")}
                  {music[band.id]} {ui("dB")}
                </span>
              </label>
            ))}
          </details>
        </div>
        <div hidden={section !== "Efektler"} className="space-y-2">
          <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-ink">
            <span>
              {ui("Dinamik denge")}
              <span className="ml-2 text-mute">{ui("Ani ses yükselişlerini yumuşat")}</span>
            </span>
            <input
              className="size-5 shrink-0 accent-accent"
              type="checkbox"
              checked={music.compressor}
              onChange={(event) => onMusic({ compressor: event.target.checked })}
            />
          </label>
          <div className="border-t border-line pt-2">
            <p className="mb-1 text-xs text-mute">{ui("Ses efektleri")}</p>
            {(
              [
                { id: "echo", label: "Eko", detail: "320 ms tekrar" },
                { id: "space", label: "Oda ambiyansı", detail: "Stereo yankı" },
              ] as const
            ).map((effect) => (
              <label key={effect.id} className="flex min-h-11 items-center gap-3 text-xs text-ink">
                <span className="w-24 shrink-0">
                  {ui(effect.label)}
                  <span className="block text-mute">{effect.detail}</span>
                </span>
                <input
                  aria-label={ui(effect.label)}
                  className="aura-range min-w-0 flex-1"
                  type="range"
                  min={0}
                  max={0.4}
                  step={0.01}
                  value={music[effect.id]}
                  onChange={(event) => onMusic({ [effect.id]: Number(event.target.value) })}
                />
                <span className="w-10 text-right tabular-nums">
                  {Math.round(music[effect.id] * 100)}%
                </span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-xs text-ink">
          <span>{ui("Çıkış sesi")}</span>
          <input
            aria-label={ui("Ses paneli çıkış sesi")}
            className="aura-range min-w-0 flex-1"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={music.volume}
            onChange={(event) => onMusic({ volume: Number(event.target.value) })}
          />
          <span className="w-10 text-right tabular-nums">{Math.round(music.volume * 100)}%</span>
        </label>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
          <p className="text-xs leading-relaxed text-mute">
            {ui("Ses ayarları dinleme ve MP4 kaydına uygulanır.")}
          </p>
          <button
            type="button"
            onClick={() => onMusic(DEFAULT_MUSIC)}
            className="h-11 shrink-0 rounded-full px-3 text-xs text-ink hover:bg-line"
          >
            {ui("Sesi sıfırla")}
          </button>
        </div>
      </div>
    </details>
  );
}
