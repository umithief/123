import { useEffect, useMemo, useRef, useState } from "react";
import { ScanLine, Play, Scissors } from "lucide-react";
import { Button } from "../ui/button";
import { ui } from "./interface-copy";
import { timelineTime } from "./editor";
import {
  detectVideoScenes,
  splitSourceScenes,
  type SceneCut,
  type SceneSensitivity,
} from "./scene-detection";
import type { useEditor } from "./use-editor";

const stamp = (time: number) =>
  `${Math.floor(time / 60)}:${(time % 60).toFixed(2).padStart(5, "0")}`;
export function ScenePanel({
  editor: e,
  file,
  disabled,
  onPause,
  embedded = false,
}: {
  editor: ReturnType<typeof useEditor>;
  file: File | null;
  disabled: boolean;
  onPause?: () => void;
  embedded?: boolean;
}) {
  const [sensitivity, setSensitivity] = useState<SceneSensitivity>("normal");
  const [minimum, setMinimum] = useState(0.5),
    [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ cuts: SceneCut[]; interval: number } | null>(null);
  const [selected, setSelected] = useState<number[]>([]),
    [error, setError] = useState<string | null>(null),
    [message, setMessage] = useState<string | null>(null);
  const job = useRef<AbortController | null>(null);
  const signature = JSON.stringify(e.project.clips.map((c) => [c.id, c.in, c.out, c.rate]));
  const sourceSignature = useRef(signature);
  sourceSignature.current = signature;
  const video =
    !!file && (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv)$/i.test(file.name));
  useEffect(() => {
    job.current?.abort();
    job.current = null;
    setProgress(null);
    setResult(null);
    setSelected([]);
    setError(null);
    return () => {
      job.current?.abort();
      job.current = null;
    };
  }, [file, signature, sensitivity, minimum]);
  useEffect(() => {
    if (disabled) {
      job.current?.abort();
      job.current = null;
      setProgress(null);
    }
  }, [disabled]);
  async function scan() {
    if (!file || !video || disabled || job.current) return;
    onPause?.();
    const controller = new AbortController(),
      before = signature;
    job.current = controller;
    setProgress(0);
    setResult(null);
    setSelected([]);
    setError(null);
    setMessage(null);
    try {
      const found = await detectVideoScenes(file, {
        sensitivity,
        minimum,
        signal: controller.signal,
        onProgress: (value) => {
          if (job.current === controller) setProgress(value);
        },
      });
      if (
        job.current !== controller ||
        controller.signal.aborted ||
        before !== sourceSignature.current
      )
        return;
      const clips = e.draw.current.project.clips;
      const cuts = found.cuts.filter((cut) =>
        clips.some(
          (clip) =>
            (cut.time - clip.in) / clip.rate >= 0.1 && (clip.out - cut.time) / clip.rate >= 0.1,
        ),
      );
      setResult({ cuts, interval: found.interval });
      setSelected(cuts.map((cut) => cut.time));
    } catch (err) {
      if (job.current === controller && !controller.signal.aborted)
        setError(err instanceof Error ? ui(err.message) : ui("Sahne analizi tamamlanamadı."));
    } finally {
      if (job.current === controller) {
        job.current = null;
        setProgress(null);
      }
    }
  }
  const next = useMemo(
    () => (result ? splitSourceScenes(e.project.clips, selected) : e.project.clips),
    [result, e.project.clips, selected],
  );
  const extra = next.length - e.project.clips.length;
  const overLimit = next.length > 60;
  function preview(source: number) {
    onPause?.();
    const i = e.project.clips.findIndex((c) => source >= c.in && source < c.out);
    if (i >= 0) {
      e.setSelected(e.project.clips[i].id);
      e.seek(timelineTime(e.project.clips, i, source));
    }
  }
  function apply() {
    if (disabled || !result || !extra || overLimit || signature !== sourceSignature.current) return;
    const current = e.draw.current.project,
      clips = splitSourceScenes(current.clips, selected);
    if (clips.length > 60 || clips === current.clips) return;
    e.commit({ ...current, clips });
    setResult(null);
    setSelected([]);
    setMessage(ui("Sahneler ayrı kliplere bölündü. Tek adımda geri alabilirsiniz."));
  }
  return (
    <details
      open={embedded || undefined}
      className={`scene-panel ${embedded ? "is-embedded" : ""}`}
      onToggle={(event) => {
        if (!event.currentTarget.open && job.current) {
          job.current.abort();
          job.current = null;
          setProgress(null);
        }
      }}
    >
      <summary>
        <ScanLine className="size-4" />
        <span>{ui("Otomatik sahne ayırma")}</span>
      </summary>
      <div className="scene-panel-body">
        {!result && (
          <p className="editor-note">
            {ui("Sahne değişimlerini cihazda bulur ve ayrı kliplere böler.")}
          </p>
        )}
        {!video && (
          <p className="editor-note">
            {ui("Sahne algılama için ana kaynak olarak video yükleyin.")}
          </p>
        )}
        {(!result || result.cuts.length === 0) && (
          <fieldset className="scene-options" disabled={disabled || progress !== null || !video}>
            <label className="editor-field">
              <span>{ui("Algılama hassasiyeti")}</span>
              <select
                aria-label={ui("Algılama hassasiyeti")}
                value={sensitivity}
                onChange={(event) => setSensitivity(event.target.value as SceneSensitivity)}
              >
                <option value="low">{ui("Düşük · daha az kesim")}</option>
                <option value="normal">{ui("Dengeli")}</option>
                <option value="high">{ui("Yüksek · daha fazla kesim")}</option>
              </select>
            </label>
            <label className="editor-field">
              <span>{ui("En kısa sahne")}</span>
              <select
                aria-label={ui("En kısa sahne")}
                value={minimum}
                onChange={(event) => setMinimum(Number(event.target.value))}
              >
                {[0.25, 0.5, 1, 2, 3].map((value) => (
                  <option value={value} key={value}>
                    {value} {ui("sn")}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        )}
        {!result &&
          (progress === null ? (
            <Button
              type="button"
              variant="outline"
              className="scene-scan"
              onClick={() => void scan()}
              disabled={disabled || !video}
            >
              <ScanLine className="size-4" />
              {ui("Sahneleri bul")}
            </Button>
          ) : (
            <div className="scene-progress">
              <span role="status">
                {ui("Sahneler taranıyor")} · %{Math.round(progress * 100)}
              </span>
              <progress max={1} value={progress} aria-label={ui("Sahne analizi ilerlemesi")} />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  job.current?.abort();
                  job.current = null;
                  setProgress(null);
                }}
              >
                {ui("İptal")}
              </Button>
            </div>
          ))}
        {result && (
          <div className="scene-results" aria-label={ui("Bulunan sahne kesimleri")}>
            <div className="scene-result-heading">
              <strong>
                {result.cuts.length} {ui("sahne değişimi bulundu")}
              </strong>
              <button type="button" onClick={() => void scan()} disabled={disabled}>
                {ui("Yeniden tara")}
              </button>
            </div>
            {result.cuts.length === 0 ? (
              <p className="editor-note" role="status">
                {ui(
                  "Belirgin bir sahne değişimi bulunamadı. Hassasiyeti artırarak yeniden deneyebilirsiniz.",
                )}
              </p>
            ) : (
              <>
                {overLimit && (
                  <p className="scene-warning" role="alert">
                    {ui(
                      "Zaman çizelgesi en fazla 60 klip destekliyor. Bazı kesimleri kaldırın veya en kısa sahne süresini artırın.",
                    )}
                  </p>
                )}
                <Button
                  type="button"
                  className="scene-apply"
                  onClick={apply}
                  disabled={disabled || !extra || overLimit}
                >
                  <Scissors className="size-4" />
                  {extra} {ui("kesimi uygula")}
                </Button>
                <p className="editor-note">
                  {ui("Kesimleri kontrol edin; istemediklerinizi kaldırın.")} ±
                  {result.interval.toFixed(2)} {ui("sn")}
                </p>
                <div className="scene-selection">
                  <button type="button" onClick={() => setSelected(result.cuts.map((c) => c.time))}>
                    {ui("Tümünü seç")}
                  </button>
                  <button type="button" onClick={() => setSelected([])}>
                    {ui("Seçimi temizle")}
                  </button>
                </div>
                <div
                  className="scene-cut-strip"
                  tabIndex={0}
                  aria-label={ui("Sahne kesimlerini yatay kaydır")}
                >
                  {result.cuts.map((cut, i) => (
                    <div className="scene-cut" key={cut.time}>
                      <button
                        type="button"
                        className="scene-thumbnail"
                        aria-label={`${ui("Kesimi önizle")} ${i + 1}`}
                        onClick={() => preview(cut.time + 0.04)}
                      >
                        {cut.thumbnail ? (
                          <img src={cut.thumbnail} alt="" />
                        ) : (
                          <ScanLine className="size-5" />
                        )}
                        <Play className="size-4" />
                      </button>
                      <label>
                        <input
                          type="checkbox"
                          aria-label={`${ui("Sahne kesimini seç")} ${i + 1}`}
                          checked={selected.includes(cut.time)}
                          onChange={(event) =>
                            setSelected((values) =>
                              event.target.checked
                                ? [...values, cut.time]
                                : values.filter((value) => value !== cut.time),
                            )
                          }
                        />
                        <span>{stamp(cut.time)}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="scene-settings">
                  <label>
                    {ui("Hassasiyet")}
                    <select
                      aria-label={ui("Algılama hassasiyeti")}
                      value={sensitivity}
                      onChange={(event) => setSensitivity(event.target.value as SceneSensitivity)}
                    >
                      <option value="low">{ui("Düşük")}</option>
                      <option value="normal">{ui("Dengeli")}</option>
                      <option value="high">{ui("Yüksek")}</option>
                    </select>
                  </label>
                </div>
                <p className="editor-note">
                  {ui(
                    "Süre, hız, ses ve altyazı zamanları korunur. Mevcut kesimler tekrar bölünmez.",
                  )}
                </p>
              </>
            )}
          </div>
        )}
        {error && (
          <p className="scene-warning" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="editor-note" role="status">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}
