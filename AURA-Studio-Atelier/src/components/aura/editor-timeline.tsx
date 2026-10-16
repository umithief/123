import { ui } from "./interface-copy";
import { createId } from "./id.ts";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
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
  Magnet,
  Wand2,
  SkipBack,
  SkipForward,
  BetweenVerticalStart,
  BetweenVerticalEnd,
  FoldVertical,
  Crop,
  ArrowRightToLine,
  ArrowLeftToLine,
  X,
  Settings2,
} from "lucide-react";
import { orderedSpan, extractRange, keepRange, trimToPlayhead } from "./clip-edits";
import { useClipThumbnails } from "./video-frames";
import { TransitionPanel } from "./transition-panel";
import { SCENE_TRANSITIONS, sceneTransitionDuration } from "./scene-transitions";
import { Button } from "../ui/button";
import type { useEditor } from "./use-editor";
import type { CaptionCue } from "./captions";
import {
  clipDuration,
  type EditClip,
  type EditorProject,
  type MediaClip,
  type Overlay,
  type SoundLayer,
} from "./editor";
import { BeatSplitPanel } from "./beat-split-panel";
import { BeatImagesPanel } from "./beat-images-panel";
import { QuickToolsPanel } from "./quick-tools-panel";
import type { AudioAnalysis } from "./use-audio-analysis";
import {
  captionSegments,
  draggedItem,
  snapTo,
  retimedCues,
  timelineMarks,
  trimmedClip,
  type ItemDrag,
  type TimelineItemKind,
} from "./timeline";
import { formatTime } from "./studio-panels";
import type { StudioTool } from "./studio-guide";
type Editor = ReturnType<typeof useEditor>;
type TrackItem = MediaClip | Overlay | SoundLayer;
type CaptionSegment = ReturnType<typeof captionSegments>[number];
type DragTarget =
  | { kind: TimelineItemKind; id: string; item: TrackItem }
  | { kind: "caption"; id: string; segment: CaptionSegment; cue: CaptionCue; rate: number };
const LIST = { media: "media", layer: "layers", sound: "sounds" } as const;
const SNAP_KEY = "aura-timeline-snap";

/** m:ss.t — precise enough for placing a cut on a beat. */
function preciseTime(seconds: number) {
  const tenths = Math.round(Math.max(0, seconds) * 10);
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}

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
  onCaptionsPreview,
  onCaptionsCommit,
  quickToolsSignal = 0,
  analysis,
  onTemplates,
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
  onCaptionsPreview: (next: CaptionCue[]) => void;
  onCaptionsCommit: (next: CaptionCue[], before: CaptionCue[]) => void;
  /** Incremented to open the ready-made tools from outside the timeline. */
  quickToolsSignal?: number;
  /** Shared decode of the source: waveform, onsets and the steady beat grid
   *  (marks, snapping and beat cuts use the grid rather than every onset). */
  analysis: AudioAnalysis;
  onTemplates: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const thumbnails = useClipThumbnails(file, e.project.clips);
  const [toolGroup, setToolGroup] = useState<"clip" | "range" | "view">("clip");
  const [transitionId, setTransitionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState(360),
    [zoom, setZoom] = useState(1);
  const { peaks, grid } = analysis;
  const [trimming, setTrimming] = useState(false);
  // In/out marks for range edits (ripple-delete or crop), in timeline seconds.
  const [rangeIn, setRangeIn] = useState<number | null>(null),
    [rangeOut, setRangeOut] = useState<number | null>(null);
  const [beatSplitOpen, setBeatSplitOpen] = useState(false),
    [beatImagesOpen, setBeatImagesOpen] = useState(false),
    [quickToolsOpen, setQuickToolsOpen] = useState(false);
  // The Edit workspace's "Ready-made tools" button asks for the dialog.
  useEffect(() => {
    if (quickToolsSignal) setQuickToolsOpen(true);
  }, [quickToolsSignal]);
  const [snap, setSnap] = useState(() => {
    try {
      return localStorage.getItem(SNAP_KEY) !== "off";
    } catch {
      return true;
    }
  });
  // Time bubble above the playhead or the edge being dragged.
  const [bubble, setBubble] = useState<{ at: number; snapped: boolean } | null>(null);
  const itemDrag = useRef<{
    target: DragTarget;
    mode: ItemDrag;
    x: number;
    before: EditorProject;
    beforeCues: CaptionCue[];
    cues: CaptionCue[] | null;
    moved: boolean;
  } | null>(null);
  // Captions are selected here; clips and layers use the editor's selection.
  const [captionSelected, setCaptionSelected] = useState<string | null>(null);
  const pointerKind = useRef("mouse");
  // A finished drag must not also count as a tap on the item.
  const suppressClick = useRef(0);
  const anchor = useRef<{ time: number; x: number } | null>(null);
  const zoomRef = useRef(zoom),
    scaleRef = useRef(1);
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
  zoomRef.current = zoom;
  scaleRef.current = scale;
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
    const node = scroll.current;
    if (!node || !playing || scrubbing.current || trimming) return;
    const cursor = e.time * scale;
    if (cursor < node.scrollLeft || cursor > node.scrollLeft + node.clientWidth - 40)
      node.scrollLeft = Math.max(0, cursor - node.clientWidth / 2);
  }, [e.time, scale, playing, trimming]);
  // Zooming keeps the anchored moment (playhead, pinch centre or pointer) in place.
  useLayoutEffect(() => {
    const node = scroll.current,
      point = anchor.current;
    if (!node || !point) return;
    anchor.current = null;
    node.scrollLeft = Math.max(0, point.time * scale - point.x);
  }, [scale]);
  function zoomTo(next: number, point?: { time: number; x: number }) {
    const node = scroll.current,
      value = Math.max(1, Math.min(8, next));
    if (Math.abs(value - zoomRef.current) < 0.001) return;
    anchor.current = point ?? {
      time: e.draw.current.time,
      x: (node?.clientWidth ?? viewport) / 2,
    };
    setZoom(value);
  }
  // Native listeners are attached once; they reach the latest render through refs.
  const live = useRef({ zoomTo, cancelDrag: () => {} });
  live.current = {
    zoomTo,
    cancelDrag: () => {
      if (!itemDrag.current) return;
      if (itemDrag.current.target.kind === "caption")
        onCaptionsPreview(itemDrag.current.beforeCues);
      else e.preview(itemDrag.current.before);
      itemDrag.current = null;
      setBubble(null);
    },
  };
  useEffect(() => {
    const node = scroll.current;
    if (!node) return;
    let pinch: { distance: number; zoom: number; time: number; x: number } | null = null;
    const spread = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      // A second finger turns any scrub or drag into a pinch.
      scrubbing.current = false;
      live.current.cancelDrag();
      const x =
        (event.touches[0].clientX + event.touches[1].clientX) / 2 -
        node.getBoundingClientRect().left;
      pinch = {
        distance: Math.max(1, spread(event.touches)),
        zoom: zoomRef.current,
        time: (x + node.scrollLeft) / scaleRef.current,
        x,
      };
    };
    const move = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      live.current.zoomTo((pinch.zoom * spread(event.touches)) / pinch.distance, {
        time: pinch.time,
        x: pinch.x,
      });
    };
    const end = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null;
    };
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const x = event.clientX - node.getBoundingClientRect().left;
      live.current.zoomTo(zoomRef.current * Math.exp(-event.deltaY * 0.002), {
        time: (x + node.scrollLeft) / scaleRef.current,
        x,
      });
    };
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end);
    node.addEventListener("touchcancel", end);
    node.addEventListener("wheel", wheel, { passive: false });
    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end);
      node.removeEventListener("touchcancel", end);
      node.removeEventListener("wheel", wheel);
    };
  }, []);
  useEffect(
    () => () => {
      if (trim.current) e.preview(trim.current.before);
    },
    [],
  );
  function seekPointer(event: PointerEvent<HTMLElement>) {
    const node = scroll.current;
    if (!node) return;
    let at = (event.clientX - node.getBoundingClientRect().left + node.scrollLeft) / scale;
    at = Math.max(0, Math.min(e.total, at));
    // Scrubbing with the magnet on settles on cuts and item edges.
    const snapped = snap ? snapTo(at, editPoints(), 8 / scale) : null;
    if (snapped !== null) at = snapped;
    e.seek(at);
    setBubble({ at, snapped: snapped !== null });
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
    setBubble(null);
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
    let clip = trimmedClip(
      action.clip,
      action.edge,
      ((event.clientX - action.x) / action.scale) * action.clip.rate,
      duration,
    );
    // The end of a cut can land on the playhead, a beat or another edge.
    const start = clipStart(action.before.clips, clip.id);
    if (snap && action.edge === "out") {
      // Targets come from the project before the drag; cuts after this one move with it.
      const index = action.before.clips.findIndex((c) => c.id === clip.id),
        head = action.before.clips.slice(0, index),
        end = start + clipDuration(clip);
      const targets = [
        0,
        ...head.map((c) => clipStart(action.before.clips, c.id)),
        start,
        e.draw.current.time,
        ...[...action.before.media, ...action.before.layers, ...action.before.sounds].flatMap(
          (item) => [item.start, item.end],
        ),
        ...timelineMarks(grid.beats, [...head, { ...clip, out: duration }]),
      ];
      const target = snapTo(end, targets, 8 / action.scale);
      if (target !== null && target > start)
        clip = trimmedClip(clip, "out", (target - end) * clip.rate, duration);
    }
    setBubble({
      at: action.edge === "out" ? start + clipDuration(clip) : start,
      snapped: false,
    });
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
    setBubble(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const next = e.draw.current.project;
    if (cancelled) e.preview(action.before);
    else if (JSON.stringify(next.clips) !== JSON.stringify(action.before.clips))
      e.commit(next, action.before);
  }
  function clipStart(list: EditClip[], id: string) {
    let at = 0;
    for (const clip of list) {
      if (clip.id === id) return at;
      at += clipDuration(clip);
    }
    return at;
  }
  /** Cut points and item edges in timeline time. */
  function editPoints(except = "") {
    const project = e.draw.current.project,
      points = [0];
    let at = 0;
    for (const clip of project.clips) points.push((at += clipDuration(clip)));
    for (const item of [...project.media, ...project.layers, ...project.sounds])
      if (item.id !== except && !("sourceVideo" in item && item.sourceVideo))
        points.push(item.start, item.end);
    return points;
  }
  function snapTargets(except = "") {
    return [
      ...editPoints(except),
      ...captions.filter((c) => c.cue !== except).flatMap((c) => [c.start, c.end]),
      e.draw.current.time,
      ...timelineMarks(grid.beats, e.draw.current.project.clips),
    ];
  }
  function jump(direction: -1 | 1) {
    const now = e.draw.current.time,
      points = [...new Set(editPoints().map((p) => Math.min(e.total, p)))].sort((a, b) => a - b);
    const next =
      direction > 0
        ? points.find((p) => p > now + 0.02)
        : [...points].reverse().find((p) => p < now - 0.02);
    if (next === undefined) return;
    onPause();
    e.seek(next);
    const node = scroll.current;
    if (
      node &&
      (next * scale < node.scrollLeft || next * scale > node.scrollLeft + node.clientWidth - 40)
    )
      node.scrollLeft = Math.max(0, next * scale - node.clientWidth / 2);
  }
  function toggleSnap() {
    const next = !snap;
    setSnap(next);
    try {
      localStorage.setItem(SNAP_KEY, next ? "on" : "off");
    } catch {
      /* The choice simply is not remembered. */
    }
  }
  function replaceItem(project: EditorProject, kind: TimelineItemKind, item: TrackItem) {
    const key = LIST[kind];
    return {
      ...project,
      [key]: (project[key] as TrackItem[]).map((c) => (c.id === item.id ? item : c)),
    } as EditorProject;
  }
  /** Applies a drag of `delta` seconds, pulled onto the nearest snap target. */
  function draggedWithSnap(
    kind: TimelineItemKind,
    item: TrackItem,
    mode: ItemDrag,
    delta: number,
    threshold: number,
  ) {
    let next = draggedItem(item, kind, mode, delta, e.total);
    let snapped = false;
    if (snap) {
      const targets = snapTargets(item.id);
      const edges =
        mode === "move"
          ? (["start", "end"] as const)
          : mode === "start"
            ? (["start"] as const)
            : (["end"] as const);
      let best: { shift: number } | null = null;
      for (const edge of edges) {
        const target = snapTo(next[edge], targets, threshold);
        if (target !== null && (!best || Math.abs(target - next[edge]) < Math.abs(best.shift)))
          best = { shift: target - next[edge] };
      }
      if (best) {
        next = draggedItem(item, kind, mode, delta + best.shift, e.total);
        snapped = true;
      }
    }
    return { next, snapped };
  }
  function isSelected(target: DragTarget) {
    return target.kind === "caption" ? captionSelected === target.cue.id : e.selected === target.id;
  }
  function select(target: DragTarget) {
    if (target.kind === "caption") {
      setCaptionSelected(target.cue.id);
      e.setSelected("");
    } else {
      setCaptionSelected(null);
      e.setSelected(target.id);
    }
  }
  function startItemDrag(event: PointerEvent<HTMLElement>, target: DragTarget, mode: ItemDrag) {
    pointerKind.current = event.pointerType;
    if (disabled || event.button !== 0) return;
    // On touch an item is dragged once selected; until then a swipe scrolls.
    if (mode === "move" && event.pointerType === "touch" && !isSelected(target)) return;
    if (mode !== "move") event.stopPropagation();
    itemDrag.current = {
      target,
      mode,
      x: event.clientX,
      before: e.draw.current.project,
      beforeCues: cues,
      cues: null,
      moved: false,
    };
    if (mode !== "move" || event.pointerType !== "mouse")
      event.currentTarget.setPointerCapture(event.pointerId);
  }
  /** Caption drags are measured on the timeline and applied in source time. */
  function draggedCaption(
    target: Extract<DragTarget, { kind: "caption" }>,
    mode: ItemDrag,
    delta: number,
  ) {
    const span = { start: target.segment.start, end: target.segment.end };
    let shift = 0,
      snapped = false;
    if (snap) {
      const moved = draggedItem(span, "layer", mode, delta, Infinity),
        targets = snapTargets(target.cue.id);
      const edges =
        mode === "move"
          ? (["start", "end"] as const)
          : mode === "start"
            ? (["start"] as const)
            : (["end"] as const);
      let best: number | null = null;
      for (const edge of edges) {
        const hit = snapTo(moved[edge], targets, 8 / scale);
        if (hit !== null && (best === null || Math.abs(hit - moved[edge]) < Math.abs(best)))
          best = hit - moved[edge];
      }
      if (best !== null) {
        shift = best;
        snapped = true;
      }
    }
    const list = retimedCues(
        itemDrag.current?.beforeCues ?? cues,
        target.cue.id,
        mode,
        (delta + shift) * target.rate,
        duration,
      ),
      cue = list.find((c) => c.id === target.cue.id)!;
    const at =
      mode === "end"
        ? target.segment.end + (cue.end - target.cue.end) / target.rate
        : target.segment.start + (cue.start - target.cue.start) / target.rate;
    return { list, at, snapped };
  }
  function moveItemDrag(event: PointerEvent<HTMLElement>) {
    const drag = itemDrag.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 6) return;
      drag.moved = true;
      onPause();
      select(drag.target);
      if (!event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.setPointerCapture(event.pointerId);
    }
    const target = drag.target;
    if (target.kind === "caption") {
      const { list, at, snapped } = draggedCaption(target, drag.mode, dx / scale);
      drag.cues = list;
      onCaptionsPreview(drag.cues);
      setBubble({ at, snapped });
      return;
    }
    const { next, snapped } = draggedWithSnap(
      target.kind,
      target.item,
      drag.mode,
      dx / scale,
      8 / scale,
    );
    e.preview(replaceItem(drag.before, target.kind, next));
    setBubble({ at: drag.mode === "end" ? next.end : next.start, snapped });
  }
  function stopItemDrag(event: PointerEvent<HTMLElement>, cancelled = false) {
    const drag = itemDrag.current;
    if (!drag) return;
    itemDrag.current = null;
    setBubble(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag.moved) return;
    suppressClick.current = performance.now() + 400;
    if (drag.target.kind === "caption") {
      if (cancelled || !drag.cues) onCaptionsPreview(drag.beforeCues);
      else onCaptionsCommit(drag.cues, drag.beforeCues);
    } else if (cancelled) e.preview(drag.before);
    else e.commit(e.draw.current.project, drag.before);
  }
  /** Mouse: a click opens the item's settings. Touch: the first tap selects
   *  (so the item can be dragged), a tap on the selected item opens them. */
  function tapItem(target: DragTarget, open: () => void) {
    if (performance.now() < suppressClick.current) return;
    const first = !isSelected(target);
    select(target);
    onPause();
    e.seek(target.kind === "caption" ? target.segment.start : target.item.start);
    if (pointerKind.current === "touch" && first) return;
    open();
  }
  function nudgeItem(event: KeyboardEvent<HTMLElement>, target: DragTarget, mode: ItemDrag) {
    if (disabled || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    if (mode === "move" && !event.altKey) return;
    event.preventDefault();
    const step = (event.shiftKey ? 1 : 0.1) * (event.key === "ArrowLeft" ? -1 : 1);
    if (target.kind === "caption") {
      onCaptionsCommit(retimedCues(cues, target.cue.id, mode, step * target.rate, duration), cues);
      return;
    }
    const current = e.draw.current.project;
    e.commit(
      replaceItem(current, target.kind, draggedItem(target.item, target.kind, mode, step, e.total)),
    );
  }
  function trimHandles(target: DragTarget, left: number, width: number) {
    return (["start", "end"] as const).map((edge) => (
      <button
        key={edge}
        type="button"
        disabled={disabled}
        className={`item-trim item-trim-${edge}`}
        style={{ left: edge === "start" ? left : left + width }}
        aria-label={ui(edge === "start" ? "Başlangıcı sürükle" : "Bitişi sürükle")}
        onPointerDown={(event) => startItemDrag(event, target, edge)}
        onPointerMove={moveItemDrag}
        onPointerUp={(event) => stopItemDrag(event)}
        onPointerCancel={(event) => stopItemDrag(event, true)}
        onKeyDown={(event) => nudgeItem(event, target, edge)}
      >
        <span />
      </button>
    ));
  }
  function trackItem(
    kind: TimelineItemKind,
    item: TrackItem,
    options: { className: string; icon: ReactNode; label: string; text: string; tool: StudioTool },
  ) {
    const left = item.start * scale,
      width = Math.max(12, (Math.min(e.total, item.end) - item.start) * scale),
      chosen = e.selected === item.id,
      target: DragTarget = { kind, id: item.id, item };
    return (
      <div className="timeline-track" key={item.id}>
        <Button
          disabled={disabled}
          className={`timeline-item ${options.className}`}
          style={{ left, width }}
          aria-label={options.label}
          aria-pressed={chosen}
          aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
          onPointerDown={(event) => startItemDrag(event, target, "move")}
          onPointerMove={moveItemDrag}
          onPointerUp={(event) => stopItemDrag(event)}
          onPointerCancel={(event) => stopItemDrag(event, true)}
          onKeyDown={(event) => nudgeItem(event, target, "move")}
          onClick={() => tapItem(target, () => onTool(options.tool))}
        >
          {options.icon}
          <span>{options.text}</span>
        </Button>
        {chosen && trimHandles(target, left, width)}
      </div>
    );
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
  const beatMarks = useMemo(
    () => timelineMarks(grid.beats, e.project.clips),
    [grid.beats, e.project.clips],
  );
  const visibleBeats = beatMarks.filter(
    (b) => b * scale >= scrollAt - 20 && b * scale <= scrollAt + viewport + 20,
  );
  const span = rangeIn != null && rangeOut != null ? orderedSpan(rangeIn, rangeOut, e.total) : null;
  const selectedSpan = (() => {
    const found = selected && clips.find((c) => c.clip.id === selected.id);
    return found ? { start: found.start, end: found.start + clipDuration(found.clip) } : null;
  })();
  const canTrim =
    !!selectedSpan && e.time > selectedSpan.start + 0.1 && e.time < selectedSpan.end - 0.1;
  // Marks past the end (after an undo or a shorter edit) clamp to the total via
  // orderedSpan and the display below, so there is no stale state to clear.
  function applyRange(fn: (clips: EditClip[], from: number, to: number) => EditClip[], at: number) {
    if (!span) return;
    const next = fn(e.project.clips, span[0], span[1]);
    if (next === e.project.clips) return;
    onPause();
    e.commit({ ...e.project, clips: next });
    e.seek(at);
    setRangeIn(null);
    setRangeOut(null);
  }
  function trimEdge(edge: "in" | "out") {
    if (!selected || !canTrim) return;
    const next = trimToPlayhead(e.project.clips, selected.id, edge, e.draw.current.time);
    if (next === e.project.clips) return;
    onPause();
    e.commit({ ...e.project, clips: next });
  }
  return (
    <section
      className={`edit-timeline focused-timeline ${compact ? "is-compact" : ""}`}
      data-controls={toolGroup}
      aria-label={ui("Proje zaman çizelgesi")}
    >
      <div className="timeline-mode-bar">
        <div role="group" aria-label={ui("Zaman çizelgesi araç grupları")}>
          {(
            [
              ["clip", "Klip"],
              ["range", "Aralık"],
              ["view", "Görünüm"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={toolGroup === id}
              onClick={() => setToolGroup(id)}
            >
              {ui(label)}
            </button>
          ))}
        </div>
        <strong>
          {preciseTime(e.time)} <span>/ {formatTime(e.total)}</span>
        </strong>
      </div>
      <div className="timeline-actions" hidden={toolGroup === "range"}>
        <div
          className={`timeline-command-strip ${toolGroup === "view" ? "is-view" : "is-clip"}`}
          role="group"
          aria-label={ui(toolGroup === "view" ? "Görünüm araçları" : "Klip araçları")}
        >
          <span className="timeline-view-commands" hidden={toolGroup !== "view"}>
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
              {ui("Başlığa git")}
            </Button>
            <Button
              variant="ghost"
              aria-label={ui("Önceki kesim noktası")}
              title={ui("Önceki kesim noktası")}
              disabled={!file}
              onClick={() => jump(-1)}
            >
              <SkipBack className="size-4" />
            </Button>
            <Button
              variant="ghost"
              aria-label={ui("Sonraki kesim noktası")}
              title={ui("Sonraki kesim noktası")}
              disabled={!file}
              onClick={() => jump(1)}
            >
              <SkipForward className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="timeline-snap"
              aria-label={ui("Mıknatıs: kenarları ve vuruşları yakala")}
              title={ui("Mıknatıs: kenarları ve vuruşları yakala")}
              aria-pressed={snap}
              disabled={!file}
              onClick={toggleSnap}
            >
              <Magnet className="size-4" />
              {ui("Mıknatıs")}
            </Button>
            <Button
              variant="ghost"
              className="timeline-zoom-button"
              aria-label={ui("Zaman çizelgesini uzaklaştır")}
              disabled={zoom <= 1}
              onClick={() => zoomTo(zoom / 1.5)}
            >
              <Minus className="size-4" />
            </Button>
            <span className="timeline-zoom">{zoom.toFixed(1)}×</span>
            <Button
              variant="ghost"
              className="timeline-zoom-button"
              aria-label={ui("Zaman çizelgesini yakınlaştır")}
              disabled={zoom >= 8}
              onClick={() => zoomTo(zoom * 1.5)}
            >
              <Plus className="size-4" />
            </Button>
            <Button className="timeline-fit" onClick={() => zoomTo(1)} disabled={!file}>
              {ui("Tümünü göster")}
            </Button>
          </span>
          <span className="timeline-clip-commands" hidden={toolGroup !== "clip"}>
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
              className="timeline-quick-tools"
              aria-label={ui("Hazır araçlar")}
              title={ui("Hazır araçlar")}
              disabled={disabled || !file}
              onClick={() => {
                onPause();
                setQuickToolsOpen(true);
              }}
            >
              <Wand2 className="size-4" />
              {ui("Hazır araçlar")}
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
              {ui("Çoğalt")}
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
              {ui("Sil")}
            </Button>
            <Button disabled={disabled || !selected} onClick={() => onTool("cuts")}>
              <Settings2 className="size-4" />
              {ui("Klip ayarları")}
            </Button>
          </span>
        </div>
      </div>
      <div
        className="timeline-range"
        hidden={toolGroup !== "range"}
        role="group"
        aria-label={ui("Aralık ve kırpma araçları")}
      >
        <Button
          variant="ghost"
          className="timeline-range-mark"
          disabled={disabled || !file}
          title={ui("Giriş işaretini oynatma başlığına koy")}
          onClick={() => {
            onPause();
            setRangeIn(Number(e.draw.current.time.toFixed(3)));
          }}
        >
          <BetweenVerticalStart className="size-4" />
          {ui("Giriş")}
        </Button>
        <Button
          variant="ghost"
          className="timeline-range-mark"
          disabled={disabled || !file}
          title={ui("Çıkış işaretini oynatma başlığına koy")}
          onClick={() => {
            onPause();
            setRangeOut(Number(e.draw.current.time.toFixed(3)));
          }}
        >
          <BetweenVerticalEnd className="size-4" />
          {ui("Çıkış")}
        </Button>

        <Button
          variant="ghost"
          className="timeline-range-act"
          disabled={disabled || !span}
          title={ui("İşaretli aralığı çıkar ve boşluğu kapat")}
          onClick={() => applyRange(extractRange, span ? span[0] : 0)}
        >
          <FoldVertical className="size-4" />
          {ui("Aralığı çıkar")}
        </Button>
        <Button
          variant="ghost"
          className="timeline-range-act"
          disabled={disabled || !span}
          title={ui("Yalnızca işaretli aralığı tut")}
          onClick={() => applyRange(keepRange, 0)}
        >
          <Crop className="size-4" />
          {ui("Aralığı tut")}
        </Button>
        <Button
          variant="ghost"
          aria-label={ui("İşaretleri temizle")}
          title={ui("İşaretleri temizle")}
          disabled={rangeIn == null && rangeOut == null}
          onClick={() => {
            setRangeIn(null);
            setRangeOut(null);
          }}
        >
          <X className="size-4" />
        </Button>
        <span className="timeline-range-sep" aria-hidden="true" />
        <Button
          variant="ghost"
          className="timeline-range-act"
          disabled={disabled || !canTrim}
          title={ui("Seçili kesimin başını oynatma başlığına çek")}
          onClick={() => trimEdge("in")}
        >
          <ArrowRightToLine className="size-4" />
          {ui("Başı çek")}
        </Button>
        <Button
          variant="ghost"
          className="timeline-range-act"
          disabled={disabled || !canTrim}
          title={ui("Seçili kesimin sonunu oynatma başlığına çek")}
          onClick={() => trimEdge("out")}
        >
          <ArrowLeftToLine className="size-4" />
          {ui("Sonu çek")}
        </Button>
      </div>
      {toolGroup === "range" && (
        <div className="timeline-range-guidance">
          {" "}
          <span className="timeline-range-info" role="status">
            {span
              ? `${preciseTime(span[0])} – ${preciseTime(span[1])} · ${(span[1] - span[0]).toFixed(1)} ${ui("sn")}`
              : ui("Giriş ve çıkış işaretleyin")}
          </span>
        </div>
      )}
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
                          e.draw.current.time +
                            (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 1 : 0.1),
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
            {visibleBeats.map((b) => (
              <i key={b} className="timeline-beat" style={{ left: b * scale }} aria-hidden="true" />
            ))}
            {file && span && (
              <span
                className="timeline-range-band"
                style={{ left: span[0] * scale, width: (span[1] - span[0]) * scale }}
                aria-hidden="true"
              />
            )}
            {file && rangeIn != null && (
              <i
                className="timeline-range-edge is-in"
                style={{ left: Math.min(rangeIn, e.total) * scale }}
                aria-hidden="true"
              />
            )}
            {file && rangeOut != null && (
              <i
                className="timeline-range-edge is-out"
                style={{ left: Math.min(rangeOut, e.total) * scale }}
                aria-hidden="true"
              />
            )}
            {file && bubble && (
              <span
                className={`timeline-bubble ${bubble.snapped ? "is-snapped" : ""}`}
                style={{ left: Math.max(24, Math.min(trackWidth - 24, bubble.at * scale)) }}
                aria-hidden="true"
              >
                {preciseTime(bubble.at)}
              </span>
            )}
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
                {media.map((item) =>
                  trackItem("media", item, {
                    className: "track-media",
                    icon: <ImagePlus className="size-3" />,
                    label: ui(`Görüntü: ${item.name}`),
                    text: item.name,
                    tool: "media",
                  }),
                )}
              </div>
            )}
            {e.project.layers.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Yazı ve şekil satırı")}>
                {e.project.layers.map((item) =>
                  trackItem("layer", item, {
                    className: "track-text",
                    icon: <Type className="size-3" />,
                    label: ui(`Katman: ${item.text || item.kind}`),
                    text: item.text || item.kind,
                    tool: "layers",
                  }),
                )}
              </div>
            )}
            {captions.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Altyazı satırı")}>
                {captions.map((item) => {
                  const cue = cues.find((c) => c.id === item.cue),
                    clip = e.project.clips.find((c) => item.id === `${c.id}-${item.cue}`);
                  if (!cue || !clip) return null;
                  const target: DragTarget = {
                      kind: "caption",
                      id: item.id,
                      segment: item,
                      cue,
                      rate: clip.rate,
                    },
                    left = item.start * scale,
                    width = Math.max(12, (item.end - item.start) * scale),
                    chosen = captionSelected === item.cue;
                  return (
                    <div className="timeline-caption" key={item.id}>
                      <Button
                        disabled={disabled}
                        className="timeline-item track-caption"
                        style={{ left, width }}
                        aria-label={ui(`Altyazı: ${item.text}`)}
                        aria-pressed={chosen}
                        aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
                        onPointerDown={(event) => startItemDrag(event, target, "move")}
                        onPointerMove={moveItemDrag}
                        onPointerUp={(event) => stopItemDrag(event)}
                        onPointerCancel={(event) => stopItemDrag(event, true)}
                        onKeyDown={(event) => nudgeItem(event, target, "move")}
                        onClick={() => tapItem(target, () => onCaption(item.cue))}
                      >
                        <Captions className="size-3" />
                        <span>{item.text}</span>
                      </Button>
                      {chosen && trimHandles(target, left, width)}
                    </div>
                  );
                })}
              </div>
            )}
            {e.project.sounds.length > 0 && (
              <div className="timeline-track" role="group" aria-label={ui("Ek ses satırı")}>
                {e.project.sounds.map((item) =>
                  trackItem("sound", item, {
                    className: "track-sound",
                    icon: <AudioLines className="size-3" />,
                    label: ui(`Ek ses: ${item.name}`),
                    text: item.name,
                    tool: "voice",
                  }),
                )}
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
        <p className="timeline-hint">
          {ui(
            "Klip: seç · Kenarlar: kırp · Aradaki simge: geçiş · Katman ve altyazıları sürükleyerek taşı",
          )}
        </p>
      )}
      <QuickToolsPanel
        open={quickToolsOpen}
        onClose={() => setQuickToolsOpen(false)}
        clips={e.project.clips}
        duration={duration}
        peaks={peaks}
        beats={grid.beats}
        disabled={disabled || !file}
        onApply={(next) => {
          e.commit({ ...e.draw.current.project, clips: next });
          e.setSelected(next[0]?.id ?? "");
        }}
        onBeatSplit={() => setBeatSplitOpen(true)}
        onBeatImages={() => setBeatImagesOpen(true)}
        onTemplates={onTemplates}
      />
      <BeatSplitPanel
        open={beatSplitOpen}
        onClose={() => setBeatSplitOpen(false)}
        clips={e.project.clips}
        selected={e.selected}
        beats={grid.beats}
        bpm={grid.bpm}
        disabled={disabled}
        onApply={(next) => e.commit({ ...e.draw.current.project, clips: next })}
      />
      <BeatImagesPanel
        open={beatImagesOpen}
        onClose={() => setBeatImagesOpen(false)}
        media={e.project.media}
        thumbnail={(asset) => e.assets.get(asset)?.url}
        marks={beatMarks}
        bpm={grid.bpm}
        time={e.time}
        total={e.total}
        busy={e.busy}
        disabled={disabled}
        onUpload={(files) => void e.upload(files)}
        onApply={(media) => e.commit({ ...e.draw.current.project, media })}
      />
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
