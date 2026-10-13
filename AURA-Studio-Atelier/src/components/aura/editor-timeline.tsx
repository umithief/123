import { ui } from "./interface-copy";
import { createId } from "./id.ts";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  Scissors,
  Copy,
  Trash2,
  Plus,
  Minus,
  Music,
  Film,
  Type,
  Captions,
  ImagePlus,
  AudioLines,
  ArrowRightLeft,
  LocateFixed,
} from "lucide-react";
import { useClipThumbnails } from "./video-frames";
import { TransitionPanel } from "./transition-panel";
import { SCENE_TRANSITIONS, sceneTransitionDuration } from "./scene-transitions";
import { Button } from "../ui/button";
import type { useEditor } from "./use-editor";
import type { CaptionCue } from "./captions";
import { clipDuration, type EditClip, type EditorProject } from "./editor";
import { captionSegments, trimmedClip } from "./timeline";
import { formatTime } from "./studio-panels";
import type { StudioTool } from "./studio-guide";
type Editor = ReturnType<typeof useEditor>;

function ClipWave({
  peaks,
  clip,
  duration,
  width,
}: {
  peaks: number[];
  clip: EditClip;
  duration: number;
  width: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node || !peaks.length || duration <= 0) return;
    node.width = Math.min(1600, Math.max(60, Math.round(width)));
    node.height = 24;
    const ctx = node.getContext("2d")!;
    ctx.fillStyle = getComputedStyle(node).color;
    for (let x = 0; x < node.width; x += 4) {
      const a = Math.floor(
        ((clip.in + (x / node.width) * (clip.out - clip.in)) / duration) * peaks.length,
      );
      const b = Math.ceil(
        ((clip.in + ((x + 4) / node.width) * (clip.out - clip.in)) / duration) * peaks.length,
      );
      let peak = 0;
      for (let i = a; i <= b && i < peaks.length; i++) peak = Math.max(peak, peaks[i] || 0);
      const h = Math.max(1, Math.min(22, peak * 36));
      ctx.fillRect(x, 12 - h / 2, 2, h);
    }
  }, [peaks, clip.in, clip.out, duration, width]);
  return peaks.length ? <canvas ref={canvas} className="clip-wave" aria-hidden="true" /> : null;
}

export function EditorTimeline({
  editor: e,
  file,
  duration,
  cues,
  captionOffset,
  playing,
  compact,
  disabled,
  onPause,
  onTool,
  onCaption,
  onUpload,
  onTransitionPreview,
}: {
  editor: Editor;
  file: File | null;
  duration: number;
  cues: CaptionCue[];
  captionOffset: number;
  playing: boolean;
  compact: boolean;
  disabled: boolean;
  onPause: () => void;
  onTool: (tool: StudioTool) => void;
  onCaption: (id: string) => void;
  onUpload: () => void;
  onTransitionPreview: (id: string) => Promise<void>;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const thumbnails = useClipThumbnails(file, e.project.clips);
  const [transitionId, setTransitionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState(360),
    [zoom, setZoom] = useState(1),
    [peaks, setPeaks] = useState<number[]>([]);
  const [trimming, setTrimming] = useState(false);
  const trim = useRef<{
    before: EditorProject;
    clip: EditClip;
    edge: "in" | "out";
    x: number;
    scale: number;
  } | null>(null);
  const scrubbing = useRef(false);
  const minimumClip = Math.min(...e.project.clips.map(clipDuration));
  const scale =
    Math.max(
      44 / Math.max(0.1, minimumClip),
      Math.max(24, Math.min(60, (viewport - 48) / Math.max(6, e.total))),
    ) * zoom;
  const trackWidth = Math.max(viewport, e.total * scale + 48);
  const selected = e.project.clips.find((clip) => clip.id === e.selected);
  const captions = useMemo(
    () => captionSegments(cues, e.project.clips, captionOffset),
    [cues, e.project.clips, captionOffset],
  );
  const media = e.project.media.filter((m) => !m.sourceVideo);
  const sourceVideo =
    file?.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file?.name || "");
  useEffect(() => {
    const node = scroll.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setViewport(node.clientWidth));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let current = true;
    setPeaks([]);
    if (!file || file.size > 50 * 1024 * 1024) return;
    void (async () => {
      try {
        const context = new OfflineAudioContext(1, 1, 8000);
        const buffer = await context.decodeAudioData(await file.arrayBuffer());
        if (!current) return;
        const samples = buffer.getChannelData(0),
          next: number[] = [];
        for (let bar = 0; bar < 2400; bar++) {
          let value = 0;
          const first = Math.floor((bar * samples.length) / 2400),
            last = Math.floor(((bar + 1) * samples.length) / 2400);
          for (let i = first; i < last; i += 4) value = Math.max(value, Math.abs(samples[i]));
          next.push(value);
        }
        setPeaks(next);
      } catch {
        /* Some video formats cannot be decoded separately; editing still works. */
      }
    })();
    return () => {
      current = false;
    };
  }, [file]);
  useEffect(() => {
    const node = scroll.current;
    if (!node || !playing || scrubbing.current || trimming) return;
    const cursor = e.time * scale;
    if (cursor < node.scrollLeft || cursor > node.scrollLeft + node.clientWidth - 40)
      node.scrollLeft = Math.max(0, cursor - node.clientWidth / 2);
  }, [e.time, scale, playing, trimming]);
  useEffect(() => {
    if (scroll.current)
      scroll.current.scrollLeft = Math.max(
        0,
        e.draw.current.time * scale - scroll.current.clientWidth / 2,
      );
  }, [zoom]);
  useEffect(
    () => () => {
      if (trim.current) e.preview(trim.current.before);
    },
    [],
  );
  function seekPointer(event: PointerEvent<HTMLElement>) {
    const node = scroll.current;
    if (!node) return;
    const at = (event.clientX - node.getBoundingClientRect().left + node.scrollLeft) / scale;
    e.seek(Math.max(0, Math.min(e.total, at)));
  }
  function startScrub(event: PointerEvent<HTMLElement>) {
    if (disabled || !file || event.button !== 0) return;
    onPause();
    scrubbing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekPointer(event);
  }
  function stopScrub(event: PointerEvent<HTMLElement>) {
    scrubbing.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function startTrim(event: PointerEvent<HTMLButtonElement>, clip: EditClip, edge: "in" | "out") {
    if (disabled || event.button !== 0) return;
    event.stopPropagation();
    onPause();
    e.setSelected(clip.id);
    trim.current = { before: e.draw.current.project, clip, edge, x: event.clientX, scale };
    setTrimming(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveTrim(event: PointerEvent<HTMLButtonElement>) {
    const action = trim.current;
    if (!action) return;
    const clip = trimmedClip(
      action.clip,
      action.edge,
      ((event.clientX - action.x) / action.scale) * action.clip.rate,
      duration,
    );
    e.preview({
      ...action.before,
      clips: action.before.clips.map((c) => (c.id === clip.id ? clip : c)),
    });
  }
  function stopTrim(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const action = trim.current;
    if (!action) return;
    trim.current = null;
    setTrimming(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const next = e.draw.current.project;
    if (cancelled) e.preview(action.before);
    else if (JSON.stringify(next.clips) !== JSON.stringify(action.before.clips))
      e.commit(next, action.before);
  }
  let at = 0;
  const clips = e.project.clips.map((clip, i) => {
    const start = at;
    at += clipDuration(clip);
    return { clip, start, index: i };
  });
  const tick = scale >= 45 ? 1 : scale >= 20 ? 2 : 5;
  const ticks = Array.from(
    { length: Math.min(200, Math.ceil(Math.min(e.total + 1, viewport / scale + 1) / tick) + 1) },
    (_, i) => i * tick,
  );
  // Ruler labels follow the visible section rather than allocating thousands of nodes.
  const [scrollAt, setScrollAt] = useState(0);
  const firstTick = Math.floor(scrollAt / scale / tick) * tick;
  return (
    <section
      className={`edit-timeline ${compact ? "is-compact" : ""}`}
      aria-label={ui("Proje zaman çizelgesi")}
    >
      <div className="timeline-actions">
        <strong>
          {formatTime(e.time)} <span>/ {formatTime(e.total)}</span>
        </strong>
        <div>
          <Button
            variant="ghost"
            aria-label={ui("Oynatma başlığına git")}
            disabled={!file}
            onClick={() => {
              if (scroll.current)
                scroll.current.scrollLeft = Math.max(
                  0,
                  e.time * scale - scroll.current.clientWidth / 2,
                );
            }}
          >
            <LocateFixed className="size-4" />
          </Button>
          <Button
            variant="ghost"
            aria-label={ui("Zaman çizelgesini uzaklaştır")}
            disabled={zoom <= 1}
            onClick={() => setZoom(Math.max(1, zoom / 1.5))}
          >
            <Minus className="size-4" />
          </Button>
          <span className="timeline-zoom">{zoom.toFixed(1)}×</span>
          <Button
            variant="ghost"
            aria-label={ui("Zaman çizelgesini yakınlaştır")}
            disabled={zoom >= 4}
            onClick={() => setZoom(Math.min(4, zoom * 1.5))}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            disabled={disabled || !file || e.project.clips.length >= 60}
            className="timeline-split"
            onClick={e.split}
          >
            <Scissors className="size-4" />
            {ui("Böl")}
          </Button>
          <Button
            variant="ghost"
            aria-label={ui("Seçili klibi çoğalt")}
            disabled={disabled || !selected || e.project.clips.length >= 60}
            onClick={() => {
              if (!selected) return;
              const next = [...e.project.clips],
                index = next.indexOf(selected);
              next.splice(index + 1, 0, { ...selected, id: createId() });
              e.commit({ ...e.project, clips: next });
            }}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            variant="ghost"
            aria-label={ui("Seçili klibi sil")}
            disabled={disabled || !selected || e.project.clips.length <= 1}
            onClick={() =>
              e.commit({
                ...e.project,
                clips: e.project.clips.filter((c) => c.id !== selected?.id),
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scroll}
        className="timeline-scroll"
        onScroll={(event) => setScrollAt(event.currentTarget.scrollLeft)}
      >
        <div className="timeline-tracks" style={{ width: trackWidth }}>
          <div
            className="timeline-ruler"
            role="slider"
            tabIndex={file ? 0 : -1}
            aria-label={ui("Zaman çizelgesinde gezin")}
            aria-valuemin={0}
            aria-valuemax={e.total}
            aria-valuenow={Number(e.time.toFixed(2))}
            aria-valuetext={formatTime(e.time)}
            aria-disabled={disabled || !file}
            onPointerDown={startScrub}
            onPointerMove={(event) => {
              if (scrubbing.current) seekPointer(event);
            }}
            onPointerUp={stopScrub}
            onPointerCancel={stopScrub}
            onKeyDown={(event) => {
              if (
                disabled ||
                !file ||
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              onPause();
              e.seek(
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? e.total
                    : Math.max(
                        0,
                        Math.min(
                          e.total,
                          e.draw.current.time + (event.key === "ArrowLeft" ? -0.1 : 0.1),
                        ),
                      ),
              );
            }}
          >
            {ticks.map((value) => (
              <span key={value} style={{ left: (value + firstTick) * scale }}>
                {formatTime(value + firstTick)}
              </span>
            ))}
          </div>
          <div
            className="timeline-track timeline-source"
            role="group"
            aria-label={ui("Ana klipler")}
          >
            {clips.map(({ clip, start, index }) => (
              <div
                key={clip.id}
                className={`timeline-clip ${e.selected === clip.id ? "is-selected" : ""}`}
                style={{ left: start * scale, width: clipDuration(clip) * scale }}
              >
                <Button
                  disabled={disabled}
                  aria-label={ui(`Klip ${index + 1} · ${file?.name || "Kaynak"}`)}
                  aria-pressed={e.selected === clip.id}
                  className="source-clip-button"
                  onClick={() => {
                    e.setSelected(clip.id);
                    onPause();
                    e.seek(start);
                    onTool("cuts");
                  }}
                >
                  {thumbnails[clip.id]?.length ? (
                    <span className="clip-filmstrip" aria-hidden="true">
                      {thumbnails[clip.id].map((url, i) => (
                        <img key={i} src={url} alt="" />
                      ))}
                    </span>
                  ) : null}
                  <span className="clip-name">
                    {sourceVideo ? <Film className="size-3" /> : <Music className="size-3" />}
                    {index + 1} · {file?.name}
                  </span>
                  <ClipWave
                    peaks={peaks}
                    clip={clip}
                    duration={duration}
                    width={clipDuration(clip) * scale}
                  />
                  <small>
                    {clip.rate}× · {clipDuration(clip).toFixed(1)} {ui("sn")}
                  </small>
                </Button>
                {e.selected === clip.id &&
                  (["in", "out"] as const).map((edge) => (
                    <button
                      key={edge}
                      type="button"
                      disabled={disabled}
                      aria-label={ui(
                        `Klip ${index + 1} ${edge === "in" ? "başlangıcını" : "bitişini"} kırp`,
                      )}
                      className={`clip-trim clip-trim-${edge}`}
                      onPointerDown={(event) => startTrim(event, clip, edge)}
                      onPointerMove={moveTrim}
                      onPointerUp={(event) => stopTrim(event)}
                      onPointerCancel={(event) => stopTrim(event, true)}
                      onLostPointerCapture={(event) => {
                        if (trim.current) stopTrim(event, true);
                      }}
                      onKeyDown={(event) => {
                        if (!disabled && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
                          event.preventDefault();
                          const next = trimmedClip(
                            clip,
                            edge,
                            event.key === "ArrowLeft" ? -0.1 : 0.1,
                            duration,
                          );
                          e.changeClip(clip.id, { [edge]: next[edge] });
                        }
                      }}
                    >
                      <span />
                    </button>
                  ))}
              </div>
            ))}
            {clips.slice(1).map(({ clip, start, index }) => {
              const value = clip.transition,
                active = value && value.id !== "none";
              const title = SCENE_TRANSITIONS.find((item) => item.id === value?.id)?.label || "Yok";
              return (
                <div
                  key={`transition-${clip.id}`}
                  className="timeline-boundary"
                  style={{ left: start * scale }}
                >
                  {active && (
                    <span
                      className="timeline-transition-span"
                      aria-hidden="true"
                      style={{
                        width: sceneTransitionDuration(e.project.clips[index - 1], clip) * scale,
                      }}
                    />
                  )}
                  <Button
                    className={`timeline-transition ${active ? "has-transition" : ""}`}
                    aria-label={`${ui("Sahne geçişi")} ${index} → ${index + 1}`}
                    title={ui(title)}
                    disabled={disabled}
                    onClick={() => {
                      onPause();
                      setTransitionId(clip.id);
                    }}
                  >
                    <ArrowRightLeft className="size-4" />
                  </Button>
                </div>
              );
            })}
            {!file && (
              <Button className="timeline-add-source" onClick={onUpload}>
                <Plus className="size-4" />
                {ui("Video veya müzik ekle")}
              </Button>
            )}
            {file && (
              <Button
                className="timeline-source-settings"
                aria-label={ui("Kaynak klip ayarlarını aç")}
                style={{ left: e.total * scale + 4 }}
                onClick={() => onTool("cuts")}
              >
                <Scissors className="size-4" />
              </Button>
            )}
          </div>
          <div className="timeline-secondary">
            {media.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Görüntü satırı")}>
                {media.map((item) => (
                  <div className="timeline-track" key={item.id}>
                    <Button
                      key={item.id}
                      disabled={disabled}
                      className="timeline-item track-media"
                      style={{
                        left: item.start * scale,
                        width: Math.max(12, (Math.min(e.total, item.end) - item.start) * scale),
                      }}
                      aria-label={ui(`Görüntü: ${item.name}`)}
                      aria-pressed={e.selected === item.id}
                      onClick={() => {
                        e.setSelected(item.id);
                        onPause();
                        e.seek(item.start);
                        onTool("media");
                      }}
                    >
                      <ImagePlus className="size-3" />
                      <span>{item.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {e.project.layers.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Yazı ve şekil satırı")}>
                {e.project.layers.map((item) => (
                  <div className="timeline-track" key={item.id}>
                    <Button
                      key={item.id}
                      disabled={disabled}
                      className="timeline-item track-text"
                      style={{
                        left: item.start * scale,
                        width: Math.max(12, (Math.min(e.total, item.end) - item.start) * scale),
                      }}
                      aria-label={ui(`Katman: ${item.text || item.kind}`)}
                      aria-pressed={e.selected === item.id}
                      onClick={() => {
                        e.setSelected(item.id);
                        onPause();
                        e.seek(item.start);
                        onTool("layers");
                      }}
                    >
                      <Type className="size-3" />
                      <span>{item.text || item.kind}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {captions.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Altyazı satırı")}>
                {captions.map((item) => (
                  <Button
                    key={item.id}
                    disabled={disabled}
                    className="timeline-item track-caption"
                    style={{
                      left: item.start * scale,
                      width: Math.max(12, (item.end - item.start) * scale),
                    }}
                    aria-label={ui(`Altyazı: ${item.text}`)}
                    onClick={() => {
                      onPause();
                      e.seek(item.start);
                      onCaption(item.cue);
                    }}
                  >
                    <Captions className="size-3" />
                    <span>{item.text}</span>
                  </Button>
                ))}
              </div>
            )}
            {e.project.sounds.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Ek ses satırı")}>
                {e.project.sounds.map((item) => (
                  <div className="timeline-track" key={item.id}>
                    <Button
                      key={item.id}
                      disabled={disabled}
                      className="timeline-item track-sound"
                      style={{
                        left: item.start * scale,
                        width: Math.max(12, (Math.min(e.total, item.end) - item.start) * scale),
                      }}
                      aria-label={ui(`Ek ses: ${item.name}`)}
                      aria-pressed={e.selected === item.id}
                      onClick={() => {
                        e.setSelected(item.id);
                        onPause();
                        e.seek(item.start);
                        onTool("voice");
                      }}
                    >
                      <AudioLines className="size-3" />
                      <span>{item.name}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {file &&
              !media.length &&
              !e.project.layers.length &&
              !captions.length &&
              !e.project.sounds.length && (
                <p className="timeline-empty-hint">
                  {ui("Alttaki araçlardan yazı, görüntü veya altyazı ekle.")}
                </p>
              )}
          </div>
          {file && (
            <div className="timeline-playhead" style={{ left: Math.min(e.time, e.total) * scale }}>
              <div />
            </div>
          )}
        </div>
      </div>
      {!compact && file && (
        <p className="timeline-hint">{ui("Klip: seç · Kenarlar: kırp · Aradaki simge: geçiş")}</p>
      )}
      <TransitionPanel
        editor={e}
        incomingId={transitionId}
        onClose={() => setTransitionId(null)}
        onSelect={setTransitionId}
        disabled={disabled}
        thumbnails={thumbnails}
        onPreview={onTransitionPreview}
      />
    </section>
  );
}
