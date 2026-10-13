import { ui } from "./interface-copy";
import { ChoiceStrip } from "./choice-strip";
import { useEffect, useRef } from "react";
import { Download, Video } from "lucide-react";
import { VIDEO_FORMATS, type VideoFormat, type Resolution } from "./studio";
import { formatTime } from "./studio-panels";

export function EasyExportPanel({
  format,
  resolution,
  duration,
  available,
  busy,
  onFormat,
  onResolution,
  onExport,
  onUpload,
  onAudio,
  showAction = true,
}: {
  format: VideoFormat;
  resolution: Resolution;
  duration: number;
  available: boolean;
  busy: boolean;
  onFormat: (value: VideoFormat) => void;
  onResolution: (value: Resolution) => void;
  onExport: () => void;
  onUpload: () => void;
  onAudio?: () => void;
  showAction?: boolean;
}) {
  return (
    <div className="easy-export-options">
      {!available && (
        <button type="button" className="studio-primary" onClick={onUpload}>
          {ui("Önce müzik veya video seç")}
        </button>
      )}
      <fieldset disabled={busy}>
        <legend>{ui("Video boyutu")}</legend>
        <ChoiceStrip className="easy-formats" aria-label={ui("Video boyutu")} value={format}>
          {VIDEO_FORMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={format === item.id}
              onClick={() => onFormat(item.id)}
            >
              <strong>{item.ratio}</strong>
              <span>
                {item.id === "portrait"
                  ? ui("Reels / Story")
                  : item.id === "landscape"
                    ? ui("YouTube")
                    : item.id === "square"
                      ? ui("Kare")
                      : ui("Gönderi")}
              </span>
            </button>
          ))}
        </ChoiceStrip>
        <label className="studio-check-row">
          {ui("Kalite")}
          <select
            aria-label={ui("Video kalitesi")}
            value={resolution}
            onChange={(event) => onResolution(event.target.value as Resolution)}
          >
            <option value="720">{ui("720p · Daha hızlı")}</option>
            <option value="1080">{ui("1080p · Daha net")}</option>
          </select>
        </label>
      </fieldset>
      <div className="easy-export-summary">
        <Video className="size-5" />
        <div>
          <strong>
            {formatTime(Math.min(duration, 180))} {ui("· MP4")}
          </strong>
          <p>
            {duration > 180
              ? ui("İlk 3 dakika kaydedilir.")
              : ui("Parçanın başından sonuna hazırlanır.")}
          </p>
        </div>
      </div>
      {showAction && (
        <button
          type="button"
          className="studio-primary w-full"
          disabled={!available || busy}
          onClick={onExport}
        >
          <Download className="size-4" />
          {ui("Videoyu hazırla")}
        </button>
      )}
      {onAudio && (
        <button
          type="button"
          className="studio-button"
          disabled={!available || busy}
          onClick={onAudio}
        >
          {ui("Yalnızca sesi kaydet · WAV")}
        </button>
      )}
      <p className="studio-note">
        {ui(
          "İşlem video süresi kadar sürer. Hazırlanırken uygulamayı açık tut; bitince kaydetme penceresi açılır.",
        )}
      </p>
    </div>
  );
}

export function ExportProgress({
  open,
  phase,
  audioOnly = false,
  time,
  duration,
  onCancel,
}: {
  open: boolean;
  phase: string;
  audioOnly?: boolean;
  time: number;
  duration: number;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) node?.showModal();
    else if (!open && node?.open) node.close();
  }, [open]);
  const percent =
    phase === "preparing"
      ? 0
      : Math.min(99, Math.round((time / Math.max(0.01, Math.min(duration, 180))) * 100));
  return (
    <dialog
      ref={dialog}
      className="easy-export-dialog"
      aria-labelledby="export-progress-title"
      onCancel={(event) => {
        event.preventDefault();
        if (phase !== "finalizing") onCancel();
      }}
    >
      <Video className="size-8 text-accent" />
      <h2 id="export-progress-title">
        {phase === "finalizing"
          ? ui("Son dokunuşlar…")
          : audioOnly
            ? ui("Sesin hazırlanıyor")
            : ui("Videon hazırlanıyor")}
      </h2>
      <p>
        {audioOnly
          ? ui("Kesimlerin ve ses katmanların WAV dosyasında birleşiyor.")
          : ui("Görsel ve altyazılar müziğinle birleştiriliyor.")}
      </p>
      <progress
        max={100}
        value={percent}
        aria-label={ui(audioOnly ? "Ses hazırlama ilerlemesi" : "Video hazırlama ilerlemesi")}
      />
      <strong>{percent}%</strong>
      <p className="studio-note">
        {ui("Uygulamayı açık tut. İşlem tamamlanınca kaydedebilirsin.")}
      </p>
      <button
        type="button"
        className="studio-button"
        disabled={phase === "finalizing"}
        onClick={onCancel}
      >
        {ui("Hazırlamayı iptal et")}
      </button>
    </dialog>
  );
}
