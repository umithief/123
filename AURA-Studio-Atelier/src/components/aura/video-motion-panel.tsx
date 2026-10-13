import { ui } from "./interface-copy";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Ban, Play, Pause, Search, X, SlidersHorizontal, Film, Check } from "lucide-react";
import { Button } from "../ui/button";
import type { useEditor } from "./use-editor";
import { clipDuration, locateTime, type EditorProject } from "./editor";
import {
  VIDEO_MOTIONS,
  motionDefaults,
  motionEffect,
  motionWindows,
  type VideoMotion,
  type VideoMotionId,
  type MotionSection,
} from "./video-motion";
import { paintVideoMotion } from "./video-motion-paint";
import { searchText } from "./search";

type Editor = ReturnType<typeof useEditor>;
const SECTIONS = [
  { id: "in", label: "Giriş" },
  { id: "out", label: "Çıkış" },
  { id: "combo", label: "Karma" },
] as const;
const GROUPS = ["Trend", "Temel", "Işık", "Arıza", "Maske", "3D", "Titreşim", "Tümü"];
const seconds = (value: number) =>
  `${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} sn`;

function Thumbnail({
  source,
  id,
  section,
  duration,
  amount,
  selected,
}: {
  source: HTMLCanvasElement | null;
  id: VideoMotionId;
  section: MotionSection;
  duration: number;
  amount: number;
  selected: boolean;
}) {
  const node = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const canvas = node.current,
      ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !source) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true;
    let frame = 0,
      visible = false,
      last = 0;
    const started = performance.now();
    const draw = (now: number) => {
      const animated = (selected || hovered) && !reduce.matches && id !== "none";
      if (now - last > 50 || !animated) {
        last = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const progress = animated ? ((now - started) / 1000 / (duration + 0.35)) % 1 : 0.5;
        paintVideoMotion(
          ctx,
          source,
          motionEffect(id, section, progress, amount),
          canvas.width,
          canvas.height,
          progress * duration,
        );
      }
      if (animated && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      if (alive && visible && !document.hidden) draw(performance.now());
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restart();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", restart);
    reduce.addEventListener("change", restart);
    return () => {
      alive = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", restart);
      reduce.removeEventListener("change", restart);
    };
  }, [source, id, section, duration, amount, selected, hovered]);
  return (
    <span
      className="video-motion-thumbnail"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <canvas ref={node} width={160} height={120} aria-hidden="true" />
      {id === "none" && <Ban className="size-7" />}
    </span>
  );
}
function withMotion(
  project: EditorProject,
  kind: "clip" | "media",
  id: string,
  motion: VideoMotion,
): EditorProject {
  return kind === "clip"
    ? { ...project, clips: project.clips.map((c) => (c.id === id ? { ...c, motion } : c)) }
    : { ...project, media: project.media.map((c) => (c.id === id ? { ...c, motion } : c)) };
}
export function VideoMotionPanel({
  editor: e,
  canvas,
  fileName,
  disabled,
  playing,
  onPreview,
  onPause,
  onDone,
}: {
  editor: Editor;
  canvas: RefObject<HTMLCanvasElement | null>;
  fileName: string;
  disabled: boolean;
  playing: boolean;
  onPreview: (start: number, end: number) => void;
  onPause: () => void;
  onDone?: () => void;
}) {
  const [section, setSection] = useState<MotionSection>("in"),
    [group, setGroup] = useState("Trend");
  const [searching, setSearching] = useState(false),
    [query, setQuery] = useState(""),
    [showAmount, setShowAmount] = useState(false);
  const [sample, setSample] = useState<HTMLCanvasElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ before: EditorProject; kind: "clip" | "media"; id: string } | null>(
    null,
  );
  const media = e.project.media.find((c) => c.id === e.selected && !c.sourceVideo);
  const clip =
    e.project.clips.find((c) => c.id === e.selected) ?? locateTime(e.project.clips, e.time)?.clip;
  const target = media
    ? {
        kind: "media" as const,
        id: media.id,
        start: media.start,
        total: media.end - media.start,
        motion: media.motion,
        name: media.name,
      }
    : clip
      ? {
          kind: "clip" as const,
          id: clip.id,
          start: e.project.clips
            .slice(0, e.project.clips.indexOf(clip))
            .reduce((sum, c) => sum + clipDuration(c), 0),
          total: clipDuration(clip),
          motion: clip.motion,
          name: `Klip ${e.project.clips.indexOf(clip) + 1}`,
        }
      : null;
  const motion = target?.motion ?? motionDefaults(),
    setting = motion[section];
  function revealPreset(button: HTMLElement) {
    const strip = gallery.current;
    if (!strip) return;
    const edge = strip.getBoundingClientRect(),
      item = button.getBoundingClientRect();
    if (item.left < edge.left + 4) strip.scrollLeft += item.left - edge.left - 4;
    else if (item.right > edge.right - 4) strip.scrollLeft += item.right - edge.right + 4;
  }
  const selectedId = useRef(setting.id);
  selectedId.current = setting.id;
  // A new clip, section, category or search starts the gallery at its beginning.
  useEffect(() => {
    const strip = gallery.current;
    if (!strip) return;
    strip.scrollLeft = 0;
    const selected = strip.querySelector<HTMLElement>(`[data-motion="${selectedId.current}"]`);
    if (selected) revealPreset(selected);
  }, [target?.id, section, group, query]);
  // Picking an animation leaves the gallery in place under the finger.
  useEffect(() => {
    const selected = gallery.current?.querySelector<HTMLElement>(`[data-motion="${setting.id}"]`);
    if (selected) revealPreset(selected);
  }, [setting.id]);
  const sourceId = media?.asset ?? e.project.media.find((c) => c.sourceVideo)?.asset;
  const source = e.assets.get(sourceId ?? "")?.element;
  useEffect(() => {
    if (!target) {
      setSample(null);
      return;
    }
    const image = source ?? canvas.current;
    if (!image) return;
    const next = document.createElement("canvas");
    next.width = 160;
    next.height = 120;
    const ctx = next.getContext("2d")!;
    const w = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
    const h = image instanceof HTMLVideoElement ? image.videoHeight : image.height;
    if (w && h) {
      const scale = Math.max(next.width / w, next.height / h);
      ctx.drawImage(
        image,
        (next.width - w * scale) / 2,
        (next.height - h * scale) / 2,
        w * scale,
        h * scale,
      );
      setSample(next);
    }
  }, [target?.id, source, canvas]);
  useEffect(() => {
    if (searching) searchInput.current?.focus();
  }, [searching]);
  useEffect(
    () => () => {
      if (gesture.current) e.preview(gesture.current.before);
    },
    [],
  );
  function update(next: VideoMotion, preview = false) {
    if (!target || disabled) return;
    const p = withMotion(e.draw.current.project, target.kind, target.id, next);
    if (preview) e.preview(p);
    else e.commit(p);
  }
  function preview(next = motion) {
    if (!target || disabled || next[section].id === "none") return;
    const windows = motionWindows(next, target.total);
    const start = section === "out" ? target.start + target.total - windows.out : target.start;
    const length =
      section === "combo"
        ? Math.min(target.total, next.combo.duration * 1.5)
        : section === "in"
          ? windows.in + 0.15
          : windows.out;
    onPreview(start, Math.min(target.start + target.total, start + length));
  }
  function choose(id: VideoMotionId) {
    onPause();
    const next = { ...motion, [section]: { ...setting, id } };
    update(next);
    if (id !== "none" && !matchMedia("(prefers-reduced-motion: reduce)").matches) preview(next);
  }
  function startGesture() {
    if (!target || disabled) return;
    onPause();
    gesture.current = { before: e.draw.current.project, kind: target.kind, id: target.id };
  }
  function finishGesture(cancelled = false) {
    const action = gesture.current;
    if (!action) return;
    gesture.current = null;
    if (cancelled) e.preview(action.before);
    else if (JSON.stringify(e.draw.current.project) !== JSON.stringify(action.before))
      e.commit(e.draw.current.project, action.before);
  }
  function rangeChange(value: number, amount = false) {
    const current =
      target?.kind === "clip"
        ? e.draw.current.project.clips.find((c) => c.id === target.id)
        : e.draw.current.project.media.find((c) => c.id === target?.id);
    const m = current?.motion ?? motionDefaults();
    update(
      amount ? { ...m, amount: value } : { ...m, [section]: { ...m[section], duration: value } },
      Boolean(gesture.current),
    );
  }
  const results = VIDEO_MOTIONS.filter(
    (preset) =>
      preset.id === "none" ||
      ((query
        ? true
        : group === "Tümü" || (group === "Trend" && "trend" in preset) || preset.group === group) &&
        searchText(`${preset.label} ${preset.description} ${preset.group}`).includes(
          searchText(query),
        )),
  );
  const active = VIDEO_MOTIONS.find((p) => p.id === setting.id)!;
  const actual =
    section === "combo"
      ? Math.min(setting.duration, target?.total ?? 0)
      : motionWindows(motion, target?.total ?? 0)[section];
  if (!target)
    return (
      <p className="editor-note">{ui("Animasyon eklemek için bir müzik veya video yükle.")}</p>
    );
  return (
    <fieldset
      disabled={disabled}
      className="video-motion-panel"
      aria-label={ui("Video animasyonları")}
    >
      <div className="video-motion-navigation">
        <label className="video-motion-target" title={ui(`Klip seç · ${target.name}`)}>
          <Film className="size-5" aria-hidden="true" />
          <select
            aria-label={ui("Animasyon uygulanacak klip")}
            value={`${target.kind}:${target.id}`}
            onChange={(event) => {
              onPause();
              const [kind, id] = event.target.value.split(":");
              e.setSelected(id);
              if (kind === "media") e.seek(e.project.media.find((c) => c.id === id)?.start ?? 0);
              else
                e.seek(
                  e.project.clips
                    .slice(
                      0,
                      e.project.clips.findIndex((c) => c.id === id),
                    )
                    .reduce((sum, c) => sum + clipDuration(c), 0),
                );
            }}
          >
            {e.project.clips.map((c, i) => (
              <option key={c.id} value={`clip:${c.id}`}>
                {ui("Klip")}
                {i + 1} · {fileName || "Ana görüntü"}
              </option>
            ))}
            {e.project.media
              .filter((c) => !c.sourceVideo)
              .map((c) => (
                <option key={c.id} value={`media:${c.id}`}>
                  {ui("Görüntü ·")}
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <div
          className="video-motion-tabs"
          role="tablist"
          aria-label={ui("Video animasyonu türü")}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const index = SECTIONS.findIndex((s) => s.id === section);
            const at =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? 2
                  : (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3;
            setSection(SECTIONS[at].id);
            event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[at]?.focus();
          }}
        >
          {SECTIONS.map((s) => (
            <Button
              key={s.id}
              role="tab"
              id={`motion-tab-${s.id}`}
              aria-selected={section === s.id}
              aria-controls="motion-gallery"
              tabIndex={section === s.id ? 0 : -1}
              onClick={() => {
                onPause();
                setSection(s.id);
              }}
            >
              {ui(s.label)}
              {motion[s.id].id !== "none" && (
                <span className="motion-configured" aria-label={ui("Animasyon seçildi")} />
              )}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          aria-label={ui(searching ? "Animasyon aramasını kapat" : "Video animasyonlarında ara")}
          aria-expanded={searching}
          onClick={() => {
            setSearching(!searching);
            setQuery("");
          }}
        >
          {searching ? <X className="size-4" /> : <Search className="size-4" />}
        </Button>
        {onDone && (
          <Button
            variant="ghost"
            className="video-motion-done"
            aria-label={ui("Tamam")}
            title={ui("Zaman çizelgesine dön")}
            onClick={onDone}
          >
            <Check className="size-5" />
          </Button>
        )}
      </div>
      {searching ? (
        <input
          ref={searchInput}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={ui("Video animasyonu ara")}
          placeholder={ui("Animasyon ara…")}
        />
      ) : (
        <div
          className="video-motion-groups"
          role="group"
          aria-label={ui("Video animasyon kategorileri")}
        >
          {GROUPS.map((name) => (
            <Button key={name} aria-pressed={group === name} onClick={() => setGroup(name)}>
              {ui(name)}
            </Button>
          ))}
        </div>
      )}
      <div
        ref={gallery}
        id="motion-gallery"
        className="video-motion-gallery"
        role="tabpanel"
        aria-labelledby={`motion-tab-${section}`}
        onFocusCapture={(event) => {
          const button = (event.target as HTMLElement).closest<HTMLElement>(".video-motion-preset");
          if (button) revealPreset(button);
        }}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>(".video-motion-preset"),
          );
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (index < 0) return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : Math.max(
                    0,
                    Math.min(buttons.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)),
                  );
          buttons[next]?.focus({ preventScroll: true });
        }}
      >
        {results.map((preset) => (
          <Button
            key={preset.id}
            data-motion={preset.id}
            className="video-motion-preset"
            aria-label={ui(preset.label)}
            aria-pressed={setting.id === preset.id}
            title={ui(preset.description)}
            onClick={() => choose(preset.id)}
          >
            <Thumbnail
              source={sample}
              id={preset.id}
              section={section}
              duration={setting.duration}
              amount={motion.amount}
              selected={setting.id === preset.id}
            />
            <span>{ui(preset.label)}</span>
          </Button>
        ))}
        {query && results.length === 1 && (
          <p className="editor-note">{ui("Bu aramada animasyon bulunamadı.")}</p>
        )}
      </div>
      <div className="video-motion-controls">
        <div className="video-motion-control-row">
          <output title={ui(showAmount ? "Şiddet" : "Süre")}>
            {showAmount ? `${Math.round(motion.amount * 100)}%` : seconds(setting.duration)}
          </output>
          <input
            type="range"
            className="aura-range"
            min={showAmount ? 0 : 0.1}
            max={showAmount ? 1 : 3}
            step={showAmount ? 0.05 : 0.1}
            value={showAmount ? motion.amount : setting.duration}
            disabled={(!showAmount && setting.id === "none") || disabled}
            aria-label={ui(
              showAmount
                ? "Video animasyon şiddeti"
                : section === "combo"
                  ? "Karma animasyon döngü süresi"
                  : "Video animasyon süresi",
            )}
            onPointerDown={startGesture}
            onPointerUp={() => finishGesture()}
            onPointerCancel={() => finishGesture(true)}
            onBlur={() => finishGesture()}
            onChange={(event) => rangeChange(Number(event.target.value), showAmount)}
          />
          <Button
            variant="ghost"
            aria-label={ui(playing ? "Animasyon önizlemesini durdur" : "Animasyonu önizle")}
            disabled={setting.id === "none"}
            onClick={() => (playing ? onPause() : preview())}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            aria-label={ui(showAmount ? "Animasyon süresini ayarla" : "Animasyon şiddetini ayarla")}
            aria-expanded={showAmount}
            onClick={() => setShowAmount(!showAmount)}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
        <p
          className="video-motion-status"
          role="status"
          title={ui(`${target.name} · ${active.description}`)}
        >
          {target.name} · {ui(active.label)}
          {setting.id !== "none" &&
            ` · ${section === "combo" ? "döngü" : SECTIONS.find((s) => s.id === section)!.label.toLocaleLowerCase("tr")}`}
          {setting.id !== "none" &&
            actual + 0.005 < setting.duration &&
            section !== "combo" &&
            ` · Bu klipte ${seconds(actual)}`}
        </p>
      </div>
    </fieldset>
  );
}
