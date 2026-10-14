import { VideoTemplatesPanel } from "./video-templates-panel";
import { templateAdjust, templateClips, type VideoTemplate } from "./video-templates";
import { CAPTION_TEMPLATES } from "./caption-templates";
import { useAudioAnalysis } from "./use-audio-analysis";
import { ui } from "./interface-copy";
import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Captions,
  ChevronLeft,
  Eye,
  FolderOpen,
  Save,
  Maximize2,
  Mic,
  Minimize2,
  Music,
  Pause,
  Play,
  Settings2,
  Square,
  Upload,
  Video,
  X,
  Download,
  Camera,
  ImagePlus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Undo2,
  Redo2,
  Type,
  SlidersHorizontal,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { type StudioTool } from "./studio-guide";
import { EditorTimeline } from "./editor-timeline";
import {
  AtelierHome,
  ToolLibrary,
  WorkspaceNav,
  workspaceForTool,
  toolName,
  useInterfaceLanguage,
  type Workspace,
  type ProjectIntent,
} from "./atelier";
import { VideoMotionPanel } from "./video-motion-panel";
import { ArtworkPanel, VisualPanel, Transport, ProjectPanel, formatTime } from "./studio-panels";
import {
  VIDEO_FORMATS,
  videoSize,
  parseSnapshot,
  type VideoFormat,
  type Resolution,
  type StudioSnapshot,
} from "./studio";
import * as Dialog from "@radix-ui/react-dialog";
import {
  readSetting,
  writeSetting,
  downloadBlob,
  keepScreenAwake,
  setShellLanguage,
  takeIncomingFiles,
} from "./storage";
import { AudioEngine, type SourceKind } from "./engine";
import {
  MODES,
  LUXURY_MODES,
  isLuxuryMode,
  THEMES,
  isMode,
  isTitlePlace,
  isTitleStyle,
  themeById,
  type ModeId,
  type TitlePlace,
  type TitleStyle,
} from "./palette";
import { Mp4Recorder } from "./record";
import {
  createRenderState,
  paint,
  step,
  type CoverDraw,
  type Finish,
  type Signal,
  type TitleDraw,
} from "./render";

import {
  DEFAULT_COVER,
  loadCover,
  prepareCover,
  restoreCoverOptions,
  saveCover,
  type CoverOptions,
} from "./cover";
import type { VisualOptions } from "./visuals";
import { DEFAULT_MUSIC, restoreMusic, type MusicOptions } from "./music";
import { MusicPanel, type MusicStats } from "./music-panel";
import { createRhythmState } from "./rhythm";
import { useCaptions } from "./use-captions";
import { CaptionPanel } from "./caption-panel";
import { paintCaptions } from "./caption-paint";
import { useEditor } from "./use-editor";
import { CutPanel, MediaPanel, LayerPanel, AdjustmentPanel, SoundPanel } from "./editor-panel";
import { paintEditorBase, paintEditorLayers } from "./editor-paint";
import { projectDuration, parseEditorProject, frameAt, type EditorProject } from "./editor";
import { clipDuration } from "./editor";
import { sceneTransitionDuration } from "./scene-transitions";
import { packProject, unpackProject } from "./project-archive";
import {
  clearAutosave,
  readAutosave,
  readAutosaveInfo,
  sameStoredBlob,
  writeAutosave,
  type AutosaveInfo,
} from "./autosave";
import { exportSrt, importSrt, restoreCaptionOptions, loadCaptionFont } from "./captions";
import { EasyExportPanel, ExportProgress } from "./easy-export";

const STUDIO_TABS = [
  { id: "visual", label: "Görsel", icon: Eye },
  { id: "music", label: "Ses", icon: AudioLines },
  { id: "artwork", label: "Kapak", icon: ImagePlus },
  { id: "captions", label: "Altyazı", icon: Captions },
  { id: "project", label: "Proje", icon: FolderOpen },
] as const;
type StudioTab = (typeof STUDIO_TABS)[number]["id"];
// A file shared into AURA while a project is open starts a fresh editor
// session; it is handed over to the new session here.
let carriedFile: File | null = null;

export function AuraStage() {
  const [session, setSession] = useState(0);
  return <StudioEditor key={session} onNewProject={() => setSession((value) => value + 1)} />;
}
function StudioEditor({ onNewProject }: { onNewProject: () => void }) {
  const [language, setLanguage] = useInterfaceLanguage();
  const en = language === "en";
  const [homeView, setHomeView] = useState(true);
  const homeViewRef = useRef(homeView);
  homeViewRef.current = homeView;
  const [workspace, setWorkspace] = useState<Workspace>("design");
  const pendingIntent = useRef<ProjectIntent | null>(null);
  const pendingLook = useRef<{ mode: ModeId; theme: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const inspectorScrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef({ format: "landscape" as VideoFormat, resolution: "720" as Resolution });
  const resizeRenderRef = useRef<(() => void) | null>(null);
  const recStatusRef = useRef("idle");
  const coverFileRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLImageElement | null>(null);
  const coverDrawRef = useRef<CoverDraw>({ ...DEFAULT_COVER, image: null });
  const analysisResetRef = useRef(true);
  const effectsRef = useRef<VisualOptions>({
    particles: true,
    speed: 1,
    beatPulse: true,
    autoScene: false,
  });
  const coverGenRef = useRef(0);
  const coverWriteRef = useRef<Promise<void>>(Promise.resolve());
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = fileRef.current;
    const cancel = () => {
      pendingIntent.current = null;
      pendingLook.current = null;
    };
    input?.addEventListener("cancel", cancel);
    return () => input?.removeEventListener("cancel", cancel);
  }, []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<AudioEngine | null>(null);
  const finishRef = useRef<Finish>("cinema");
  const modeRef = useRef<ModeId>("ring");
  const themeRef = useRef(THEMES[0]);
  const sensRef = useRef(1.35);

  const sourceRef = useRef<SourceKind>("idle");

  const titleRef = useRef("");
  const placeRef = useRef<TitlePlace>("center");
  const styleRef = useRef<TitleStyle>("serif");
  const recorderRef = useRef<Mp4Recorder | null>(null);
  const recordingSceneRef = useRef(false);
  const recGenRef = useRef(0);
  const recTimerRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [easy, setEasy] = useState(true);
  const [activeTool, setActiveTool] = useState<StudioTool | null>(null);
  const [captionFocus, setCaptionFocus] = useState<{ id: string; serial: number } | null>(null);
  const motionPreviewEnd = useRef<number | null>(null);
  const [compactPreview, setCompactPreview] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  // Phones: the open tool can take most of the screen, remembered on the device.
  const [panelTall, setPanelTall] = useState(() => readSetting("aura-panel-tall") === "1");
  function togglePanelTall() {
    const next = !panelTall;
    setPanelTall(next);
    writeSetting("aura-panel-tall", next ? "1" : "0");
  }
  const [autoExport, setAutoExport] = useState(false);
  const autoExportRef = useRef(false);
  const audioExportRef = useRef(false);
  const exportLoopRef = useRef(false);
  const editorTabs = STUDIO_TABS;
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverOptions, setCoverOptions] = useState<CoverOptions>({ ...DEFAULT_COVER });
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [effects, setEffects] = useState<VisualOptions>({
    particles: true,
    speed: 1,
    beatPulse: true,
    autoScene: false,
  });
  const [music, setMusic] = useState<MusicOptions>({ ...DEFAULT_MUSIC });
  const [musicStats, setMusicStats] = useState<MusicStats>({
    bpm: null,
    beats: 0,
    bass: 0,
    mid: 0,
    high: 0,
  });
  const [source, setSource] = useState<SourceKind>("idle");
  const [playing, setPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const onExportError = (event: Event) =>
      setError(String((event as CustomEvent).detail || "Dosya kaydedilemedi."));
    window.addEventListener("aura-export-error", onExportError);
    return () => window.removeEventListener("aura-export-error", onExportError);
  }, []);
  const [finish, setFinish] = useState<Finish>("cinema");
  const [mode, setMode] = useState<ModeId>("ring");
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [sensitivity, setSensitivity] = useState(1.35);
  const [hud, setHud] = useState(true);
  const [tab, setTab] = useState<StudioTab>("visual");
  const [format, setFormat] = useState<VideoFormat>("landscape");
  const [resolution, setResolution] = useState<Resolution>("720");
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [looping, setLooping] = useState(false);
  const [recStatus, setRecStatus] = useState("idle");
  const [lastVideo, setLastVideo] = useState<{ blob: Blob; name: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [title, setTitle] = useState("");
  const [titlePlace, setTitlePlace] = useState<TitlePlace>("center");
  const [titleStyle, setTitleStyle] = useState<TitleStyle>("serif");
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const captions = useCaptions(audioRef, source);
  const analysis = useAudioAnalysis(captions.file, duration);
  const editor = useEditor(
    audioRef,
    engineRef,
    captions.file,
    duration,
    looping,
    autoExport,
    (w, h) => {
      const ratio = w / h;
      const closest = [...VIDEO_FORMATS].sort(
        (a, b) =>
          Math.abs(Math.log(ratio / (a.width / a.height))) -
          Math.abs(Math.log(ratio / (b.width / b.height))),
      )[0];
      changeFormat(closest.id);
    },
  );
  useEffect(() => {
    void Promise.all([
      loadCaptionFont(captions.options.font, captions.options.weight, captions.options.italic),
      ...editor.project.layers
        .filter((l) => l.kind === "text")
        .map((l) => loadCaptionFont(l.font, l.weight)),
    ]).catch(() => setError("Yazı tipi yüklenemedi. Yeniden deneyin."));
  }, [
    captions.options.font,
    captions.options.weight,
    captions.options.italic,
    editor.project.layers,
  ]);
  const archiveInputRef = useRef<HTMLInputElement>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const overlayDrag = useRef<{
    id: string;
    before: EditorProject;
    dx: number;
    dy: number;
    time: number;
  } | null>(null);
  const [visualView, setVisualView] = useState("scenes");
  const soundDetailsRef = useRef<HTMLDetailsElement>(null);
  const voiceDetailsRef = useRef<HTMLDetailsElement>(null);
  const backupDetailsRef = useRef<HTMLDetailsElement>(null);
  function openTool(tool: StudioTool) {
    if (tool !== "motion") pauseMotionPreview();
    setHomeView(false);
    setWorkspace(workspaceForTool(tool));
    setActiveTool(tool);
    setTimelineExpanded(tool === "cuts" && !window.matchMedia("(max-width: 700px)").matches);
    if (["scenes", "media", "layers", "adjust", "motion"].includes(tool)) {
      setTab("visual");
      setVisualView(tool);
    } else if (tool === "sound" || tool === "cuts" || tool === "voice") {
      setTab("music");
      if (soundDetailsRef.current) soundDetailsRef.current.open = tool === "sound";
      if (voiceDetailsRef.current) voiceDetailsRef.current.open = tool === "voice";
    } else if (tool === "backup") {
      setTab("project");
      if (backupDetailsRef.current) backupDetailsRef.current.open = true;
    } else setTab(tool as StudioTab);
    requestAnimationFrame(() => {
      const target =
        tool === "sound"
          ? soundDetailsRef.current
          : tool === "voice"
            ? voiceDetailsRef.current
            : tool === "backup"
              ? backupDetailsRef.current
              : null;
      target?.scrollIntoView({ block: "start" });
    });
  }
  function closeTool() {
    pauseMotionPreview();
    setActiveTool(null);
    setTimelineExpanded(workspace === "edit" && !window.matchMedia("(max-width: 700px)").matches);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(`.atelier-navigation [data-workspace="${workspace}"]`)
        ?.focus({ preventScroll: true }),
    );
  }
  function selectWorkspace(next: Workspace) {
    pauseMotionPreview();
    setWorkspace(next);
    setActiveTool(null);
    setTimelineExpanded(next === "edit" && !window.matchMedia("(max-width: 700px)").matches);
  }
  function startIntent(intent: ProjectIntent) {
    if (source !== "idle") {
      setHomeView(false);
      openTool(intent === "music" ? "scenes" : intent === "video" ? "cuts" : "captions");
      return;
    }
    pendingIntent.current = intent;
    fileRef.current?.click();
  }
  async function loadPrimary(file: File) {
    await engineRef.current?.useFile(file);
    if (easy) engineRef.current?.pause();
  }
  useEffect(() => {
    inspectorScrollRef.current?.scrollTo({ top: 0 });
  }, [tab, visualView]);
  async function playTimeline() {
    motionPreviewEnd.current = null;
    if (!playing) {
      try {
        await editor.waitForTransitions();
      } catch {
        setError("Geçiş görüntüleri hazırlanamadı. Geçişi kaldırıp yeniden deneyin.");
        return;
      }
    }
    if (editor.draw.current.time >= projectDuration(editor.draw.current.project) - 0.05)
      editor.seek(0);
    engineRef.current?.togglePlay();
  }
  function pauseMotionPreview() {
    if (motionPreviewEnd.current !== null) engineRef.current?.pause();
    motionPreviewEnd.current = null;
  }
  function previewMotion(start: number, end: number) {
    if (recStatusRef.current !== "idle" || sourceRef.current !== "file" || loading) return;
    const limit = projectDuration(editor.draw.current.project);
    const from = Math.max(0, Math.min(start, limit)),
      to = Math.min(end, limit);
    if (to <= from) return;
    editor.seek(from);
    motionPreviewEnd.current = to;
    void engineRef.current?.playFile().catch(() => {
      motionPreviewEnd.current = null;
      setError("Önizlemeyi başlatmak için Oynat düğmesine dokunun.");
    });
  }

  useEffect(() => {
    if (fileName) {
      motionPreviewEnd.current = null;
      setTab("visual");
      const intent = pendingIntent.current;
      pendingIntent.current = null;
      if (intent)
        openTool(intent === "music" ? "scenes" : intent === "video" ? "cuts" : "captions");
      else setActiveTool(null);
      if (pendingLook.current) {
        chooseMode(pendingLook.current.mode);
        chooseTheme(pendingLook.current.theme);
        pendingLook.current = null;
      }
      setCaptionFocus(null);
    }
  }, [fileName]);
  const theme = themeById(themeId);
  videoRef.current = { format, resolution };
  coverDrawRef.current = { ...coverOptions, image: coverImageRef.current };
  effectsRef.current = effects;
  themeRef.current = theme;
  finishRef.current = finish;
  modeRef.current = mode;
  sensRef.current = sensitivity;
  sourceRef.current = source;
  titleRef.current = title;
  placeRef.current = titlePlace;
  styleRef.current = titleStyle;

  useEffect(() => {
    setReady(true);
    rootRef.current?.classList.toggle(
      "native-shell",
      !!(window as Window & { AuraAndroid?: unknown }).AuraAndroid,
    );
    setEasy(true);
    setMusic(restoreMusic(readSetting("aura-music")));
    const savedFormat = readSetting("aura-video-format");
    if (VIDEO_FORMATS.some((f) => f.id === savedFormat)) setFormat(savedFormat as VideoFormat);
    // Phones mostly make Reels/Stories: start vertical until the user picks a size.
    else if (window.matchMedia("(max-width: 700px)").matches) setFormat("portrait");
    if (readSetting("aura-video-resolution") === "1080") setResolution("1080");
    setCoverOptions(restoreCoverOptions(readSetting("aura-cover-options")));
    try {
      const saved = JSON.parse(readSetting("aura-effects") ?? "null");
      if (saved)
        setEffects({
          particles: saved.particles !== false,
          speed: Number.isFinite(saved.speed) ? Math.min(2, Math.max(0.25, saved.speed)) : 1,
          beatPulse: saved.beatPulse !== false,
          autoScene: saved.autoScene === true,
        });
    } catch {
      /* keep defaults */
    }
    const savedFinish = readSetting("aura-finish");
    if (savedFinish === "studio" || savedFinish === "cinema" || savedFinish === "vivid")
      setFinish(savedFinish);
    const savedMode = readSetting("aura-mode");
    const savedTheme = readSetting("aura-theme");
    const savedSens = Number(readSetting("aura-sens"));
    const savedTitle = readSetting("aura-title");
    const savedPlace = readSetting("aura-place");
    const savedStyle = readSetting("aura-style");
    if (savedMode && isMode(savedMode)) setMode(savedMode);
    if (savedTheme && THEMES.some((item) => item.id === savedTheme)) setThemeId(savedTheme);
    if (Number.isFinite(savedSens) && savedSens >= 0.4 && savedSens <= 3) setSensitivity(savedSens);
    if (savedTitle) setTitle(savedTitle);
    if (savedPlace && isTitlePlace(savedPlace)) setTitlePlace(savedPlace);
    if (savedStyle && isTitleStyle(savedStyle)) setTitleStyle(savedStyle);
  }, []);

  useEffect(() => {
    let active = true;
    const generation = coverGenRef.current;
    void loadCover()
      .then((blob) => {
        if (active && coverGenRef.current === generation) setCoverBlob(blob);
      })
      .catch(() => {
        /* local persistence may be unavailable */
      });
    return () => {
      active = false;
      coverGenRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!coverBlob) {
      coverImageRef.current = null;
      coverDrawRef.current.image = null;
      setCoverUrl(null);
      return;
    }
    let active = true;
    const url = URL.createObjectURL(coverBlob);
    const image = new Image();
    image.src = url;
    void image
      .decode()
      .then(() => {
        if (!active) return;
        coverImageRef.current = image;
        coverDrawRef.current.image = image;
        setCoverUrl(url);
      })
      .catch(() => {
        if (active) setCoverError("Kapak fotoğrafı açılamadı. Yeniden yükleyin.");
      });
    return () => {
      active = false;
      URL.revokeObjectURL(url);
    };
  }, [coverBlob]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const engine = new AudioEngine({
      onSource: (next) => {
        setSource(next);
        if (next !== "idle") setHomeView(false);
      },
      onLoading: setLoading,
      onTrack: captions.loadTrack,
      onPlay: setPlaying,
      onFile: (name, nextDuration) => {
        setFileName(name);
        setDuration(nextDuration);
      },
      onTime: setTime,
      onError: setError,
    });
    engine.attach(audio);
    engineRef.current = engine;
    return () => {
      window.clearInterval(recTimerRef.current);
      recGenRef.current += 1;
      const rec = recorderRef.current;
      recorderRef.current = null;
      void rec?.cancel();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMusic(music);
  }, [music]);
  useEffect(() => {
    analysisResetRef.current = true;
  }, [source, fileName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    const baseCanvas = document.createElement("canvas");
    const baseContext = baseCanvas.getContext("2d", { alpha: false })!;
    const state = createRenderState();
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = reduceQuery.matches;
    const onReduce = () => {
      reduce = reduceQuery.matches;
    };
    reduceQuery.addEventListener("change", onReduce);

    const resize = () => {
      const { format, resolution } = videoRef.current;
      const size = videoSize(format, resolution);
      const width = size.width;
      const height = size.height;
      // Both surfaces must have the same dimensions. Resizing only the output
      // stretched a landscape intermediate into portrait and clipped its bottom.
      for (const surface of [canvas, baseCanvas]) {
        if (surface.width !== width) surface.width = width;
        if (surface.height !== height) surface.height = height;
      }
    };
    resizeRenderRef.current = resize;
    resize();

    let frame = 0;
    let statsAt = 0;
    let paintedAt = 0;
    let nextSceneBeat = 0;
    let wasAutomatic = false;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (recStatusRef.current !== "idle") motionPreviewEnd.current = null;
      if (
        motionPreviewEnd.current !== null &&
        editor.draw.current.time >= motionPreviewEnd.current
      ) {
        engineRef.current?.pause();
        motionPreviewEnd.current = null;
      }
      if ((document.hidden || homeViewRef.current) && !recordingSceneRef.current) return;
      const frameDuration = 1000 / 30;
      if (now - paintedAt < frameDuration) return;
      // Preserve the remainder: resetting to `now` skipped every third screen
      // refresh when two 60 Hz frames were fractionally short of 33.33 ms.
      paintedAt = now - ((now - paintedAt) % frameDuration);
      resize();
      const reading = engineRef.current?.read() ?? null;
      let signal: Signal = { kind: "off" };
      if (reading) {
        signal = reading.audible
          ? {
              kind: "live",
              freq: reading.freq,
              time: reading.time,
              sampleRate: reading.sampleRate,
              fftSize: reading.fftSize,
              sensitivity: sensRef.current,
              bass: reading.bass,
            }
          : { kind: "silent" };
      }
      if (analysisResetRef.current) {
        analysisResetRef.current = false;
        state.rhythm = createRhythmState();
        state.history.fill(0);
        state.historyHead = 0;
        state.historySequence += 1;
        state.levels.fill(0);
        state.peaks.fill(0);
        state.peakHold.fill(0);
        state.wave.fill(0);
        state.pulses.length = 0;
        nextSceneBeat = 0;
        wasAutomatic = false;
      }
      step(state, signal, now, reduce, effectsRef.current.speed);
      if (now - statsAt > 300) {
        statsAt = now;
        setMusicStats({
          bpm: state.rhythm.bpm,
          beats: state.rhythm.count,
          bass: reading?.audible ? Math.round(state.bass * 100) : 0,
          mid: reading?.audible ? Math.round(state.mid * 100) : 0,
          high: reading?.audible ? Math.round(state.high * 100) : 0,
        });
      }
      const automatic = effectsRef.current.autoScene === true;
      if (automatic && !wasAutomatic) nextSceneBeat = state.rhythm.count + 16;
      wasAutomatic = automatic;
      if (automatic && !reduce && state.rhythm.count >= nextSceneBeat) {
        const playlist: readonly ModeId[] = isLuxuryMode(modeRef.current)
          ? LUXURY_MODES
          : ["prism", "constellation", "helix", "flow", "tunnel", "ring"];
        const next = playlist[(playlist.indexOf(modeRef.current) + 1) % playlist.length] ?? "prism";
        modeRef.current = next;
        setMode(next);
        writeSetting("aura-mode", next);
        nextSceneBeat = state.rhythm.count + 16;
      }
      const size = videoSize(videoRef.current.format, "720");
      const width = size.width / 2;
      const height = size.height / 2;
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      const reserve = 16;
      const titleDraw: TitleDraw = {
        text: titleRef.current,
        place: placeRef.current,
        style: styleRef.current,
      };
      baseContext.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      paint(
        baseContext,
        width,
        height,
        themeRef.current,
        modeRef.current,
        state,
        reserve,
        reduce,
        titleDraw,
        finishRef.current,
        coverDrawRef.current,
        effectsRef.current,
      );
      paintEditorBase(
        context,
        baseCanvas,
        editor.draw.current.project,
        editor.draw.current.assets,
        editor.draw.current.time,
        width,
        height,
        reduce && recStatusRef.current === "idle",
        editor.draw.current.transitionFrames,
      );
      if (sourceRef.current === "file") {
        const subtitles = captions.draw.current;
        paintCaptions(
          context,
          width,
          height,
          state.reserve,
          subtitles.cues,
          subtitles.options,
          audioRef.current?.currentTime ?? 0,
          `rgb(${themeRef.current.mid.join(",")})`,
          reduce && recStatusRef.current === "idle",
        );
      }
      paintEditorLayers(
        context,
        editor.draw.current.project,
        editor.draw.current.assets,
        editor.draw.current.time,
        width,
        height,
        reduce && recStatusRef.current === "idle",
      );
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      resizeRenderRef.current = null;
      reduceQuery.removeEventListener("change", onReduce);
    };
  }, []);

  useEffect(() => {
    const fit = fitRef.current,
      frame = frameRef.current,
      canvas = canvasRef.current;
    if (!fit || !frame || !canvas) return;
    const output = videoSize(format, resolution);
    const measure = () => {
      const ratio = output.width / output.height;
      const style = getComputedStyle(fit);
      const availableWidth =
        fit.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availableHeight =
        fit.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const width = Math.max(0, Math.min(availableWidth, availableHeight * ratio));
      frame.style.width = `${Math.max(1, width)}px`;
      frame.style.height = `${Math.max(1, width / ratio)}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(fit);
    return () => observer.disconnect();
  }, [format, resolution, hud]);

  useEffect(() => {
    engineRef.current?.setMuted(muted);
  }, [muted]);
  useEffect(() => {
    engineRef.current?.setLoop(source === "file" ? false : looping);
  }, [looping, source]);

  useEffect(() => {
    inspectorScrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDrag(true);
    };
    const onOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    };
    const onLeave = () => {
      depth -= 1;
      if (depth <= 0) {
        depth = 0;
        setDrag(false);
      }
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDrag(false);
      if (recStatusRef.current !== "idle") return;
      const file = event.dataTransfer?.files?.[0];
      if (file?.type.startsWith("image/")) void uploadCover(file);
      else if (file) void loadPrimary(file);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        !!target.closest("input, textarea, select, [contenteditable]");
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        // Text fields keep their own undo/redo; the project shortcuts apply elsewhere.
        const key = event.key.toLowerCase();
        const actions = shortcutsRef.current;
        if (key === "s") {
          event.preventDefault();
          void actions.save();
        } else if (!typing && key === "z") {
          event.preventDefault();
          if (event.shiftKey) actions.redo();
          else actions.undo();
        } else if (!typing && key === "y") {
          event.preventDefault();
          actions.redo();
        }
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (typing || (target instanceof HTMLElement && target.closest("[role='tablist']"))) return;
      if (event.code === "Space") {
        if (target instanceof HTMLElement && target.closest("button, summary")) return;
        event.preventDefault();
        void shortcutsRef.current.play();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        setMuted((v) => !v);
      } else if (event.key === "Escape") {
        setHud(true);
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (target instanceof HTMLElement && target.closest("button, summary")) return;
        event.preventDefault();
        editor.seek(editor.draw.current.time + (event.key === "ArrowRight" ? 5 : -5));
      }
    };
    const onFs = () => setFullscreen(document.fullscreenElement === rootRef.current);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  // The window key listener is installed once; it reads the current handlers
  // here so it never acts on state captured by the first render.
  // Project and caption edits share one undo/redo, in the order they were made.
  const [quickToolsSignal, setQuickToolsSignal] = useState(0);
  const canUndoAny = editor.canUndo || captions.canUndo,
    canRedoAny = editor.canRedo || captions.canRedo;
  function undoLast() {
    if (captions.undoAt > editor.undoAt) captions.undo();
    else editor.undo();
  }
  function redoNext() {
    if (captions.redoAt > editor.redoAt) captions.redo();
    else editor.redo();
  }
  const shortcutsRef = useRef({
    play: playTimeline,
    undo: () => {},
    redo: () => {},
    save: saveEditingProject,
  });
  shortcutsRef.current = {
    play: playTimeline,
    undo: () => {
      if (recStatusRef.current === "idle" && !loading) undoLast();
    },
    redo: () => {
      if (recStatusRef.current === "idle" && !loading) redoNext();
    },
    save: async () => {
      if (recStatusRef.current === "idle" && !loading) await saveEditingProject();
    },
  };

  // Projects are not stored between sessions: warn before a reload or tab
  // close discards edits that were never saved to a project file.
  const savedWorkRef = useRef<{ project: EditorProject; cues: unknown } | null>(null);
  const unsavedWork =
    source === "file" &&
    (editor.canUndo || captions.cues.length > 0) &&
    !(
      savedWorkRef.current?.project === editor.project &&
      savedWorkRef.current?.cues === captions.cues
    );
  useEffect(() => {
    if (!unsavedWork) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsavedWork]);

  function persistCover(blob: Blob | null) {
    coverWriteRef.current = coverWriteRef.current.catch(() => {}).then(() => saveCover(blob));
    void coverWriteRef.current.catch(() =>
      setCoverError("Kapak bu oturumda kullanılabilir; tarayıcıya kaydedilemedi."),
    );
  }

  async function uploadCover(file: File) {
    const generation = ++coverGenRef.current;
    setCoverBusy(true);
    setCoverError(null);
    try {
      const blob = await prepareCover(file);
      if (generation !== coverGenRef.current) return;
      setCoverBlob(blob);
      persistCover(blob);
    } catch (err) {
      if (generation === coverGenRef.current)
        setCoverError(err instanceof Error ? err.message : "Fotoğraf yüklenemedi.");
    } finally {
      if (generation === coverGenRef.current) setCoverBusy(false);
    }
  }

  function removeCover() {
    coverGenRef.current += 1;
    setCoverBlob(null);
    setCoverBusy(false);
    setCoverError(null);
    persistCover(null);
  }

  function changeCover(patch: Partial<CoverOptions>) {
    const next = { ...coverOptions, ...patch };
    setCoverOptions(next);
    writeSetting("aura-cover-options", JSON.stringify(next));
  }

  function changeEffects(patch: Partial<VisualOptions>) {
    const next = { ...effects, ...patch };
    setEffects(next);
    writeSetting("aura-effects", JSON.stringify(next));
  }

  function changeMusic(patch: Partial<MusicOptions>) {
    const next = { ...music, ...patch };
    setMusic(next);
    engineRef.current?.setMusic(next);
    writeSetting("aura-music", JSON.stringify(next));
  }

  function chooseRecipe(id: "electronic" | "acoustic" | "ambient") {
    if (id === "electronic") {
      chooseMode("prism");
      chooseTheme("kor");
      changeSensitivity(1.5);
      changeEffects({ speed: 1.2, particles: true, beatPulse: true, autoScene: false });
      changeMusic({ eq: true, bass: 3, mid: -1, treble: 1, compressor: true });
    } else if (id === "acoustic") {
      chooseMode("helix");
      chooseTheme("altin");
      changeSensitivity(1.2);
      changeEffects({ speed: 0.65, particles: false, beatPulse: false, autoScene: false });
      changeMusic({ eq: true, bass: -1, mid: 2, treble: 0, compressor: false });
    } else {
      chooseMode("constellation");
      chooseTheme("buz");
      changeSensitivity(1.1);
      changeEffects({ speed: 0.4, particles: true, beatPulse: false, autoScene: false });
      changeMusic({ eq: true, bass: 1, mid: 0, treble: -1, compressor: true });
    }
  }

  function chooseMode(next: ModeId) {
    if (!editor.draw.current.project.showSpectrum && editor.draw.current.project.media.length)
      editor.commit({ ...editor.draw.current.project, showSpectrum: true });
    setMode(next);
    if (effects.autoScene) changeEffects({ autoScene: false });
    writeSetting("aura-mode", next);
  }

  function chooseTheme(next: string) {
    setThemeId(next);
    writeSetting("aura-theme", next);
  }

  function changeSensitivity(next: number) {
    setSensitivity(next);
    writeSetting("aura-sens", String(next));
  }

  async function toggleFullscreen() {
    const node = rootRef.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
    } catch {
      setError("Tam ekran bu ortamda açılamadı.");
    }
  }

  function changeTitle(next: string) {
    setTitle(next);
    writeSetting("aura-title", next);
  }

  function changePlace(next: TitlePlace) {
    setTitlePlace(next);
    writeSetting("aura-place", next);
  }

  function changeStyle(next: TitleStyle) {
    setTitleStyle(next);
    writeSetting("aura-style", next);
  }

  function setRecordStatus(next: string) {
    recStatusRef.current = next;
    setRecStatus(next);
  }

  async function toggleRecord() {
    if (recStatusRef.current === "preparing" || recStatusRef.current === "finalizing") return;
    const current = recorderRef.current;
    if (current) {
      setRecordStatus("finalizing");
      recorderRef.current = null;
      window.clearInterval(recTimerRef.current);
      try {
        const blob = await current.stop();
        const safe =
          (titleRef.current.trim() || "aura").replace(/[^\p{L}\p{N}\- ]+/gu, "").trim() || "aura";
        const name = `${safe}.${audioExportRef.current ? "wav" : "mp4"}`;
        setLastVideo({ blob, name });
        downloadBlob(blob, name);
      } catch {
        await current.cancel();
        setError("MP4 kaydı tamamlanamadı. Yeniden deneyebilirsiniz.");
      } finally {
        if (autoExportRef.current) {
          engineRef.current?.pause();
          engineRef.current?.setLoop(false);
          autoExportRef.current = false;
          setAutoExport(false);
        }
        recordingSceneRef.current = false;
        setRecording(false);
        setRecordStatus("idle");
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || (!playing && !autoExportRef.current) || loading) return;
    resizeRenderRef.current?.();
    if (!autoExportRef.current) audioExportRef.current = false;
    setRecordStatus("preparing");
    const gen = ++recGenRef.current;
    recordingSceneRef.current = true;
    const rec = new Mp4Recorder(
      canvas,
      () => {
        const stream = engineRef.current?.tapRecording();
        if (!stream) throw new Error("Ses hattı yok");
        return stream;
      },
      () => titleRef.current,
      audioExportRef.current,
    );
    try {
      await editor.waitForTransitions();
      await Promise.all([
        loadCaptionFont(
          captions.draw.current.options.font,
          captions.draw.current.options.weight,
          captions.draw.current.options.italic,
        ),
        ...editor.draw.current.project.layers
          .filter((l) => l.kind === "text")
          .map((l) => loadCaptionFont(l.font, l.weight)),
      ]);
      if (gen !== recGenRef.current) {
        await rec.cancel();
        return;
      }
      await rec.start();
      if (gen !== recGenRef.current) {
        await rec.cancel();
        return;
      }
      recorderRef.current = rec;
      setRecording(true);
      setRecordStatus("recording");
      setRecSeconds(0);
      setError(null);
      if (autoExportRef.current) await engineRef.current?.playFile();
      if (gen !== recGenRef.current) return;
      const started = performance.now();
      recTimerRef.current = window.setInterval(() => {
        const seconds = Math.floor((performance.now() - started) / 1000);
        setRecSeconds(seconds);
        const audio = audioRef.current;
        const finished =
          autoExportRef.current &&
          audio &&
          (editor.ended.current ||
            editor.draw.current.time >=
              Math.min(projectDuration(editor.draw.current.project), 180));
        if (finished || seconds >= 180) void toggleRecord();
      }, 250);
    } catch (err) {
      console.error("Export preparation failed:", err);
      await rec.cancel();
      if (gen !== recGenRef.current) return;
      recorderRef.current = null;
      setRecording(false);
      if (autoExportRef.current) {
        engineRef.current?.pause();
        engineRef.current?.setLoop(false);
        autoExportRef.current = false;
        setAutoExport(false);
      }
      recordingSceneRef.current = false;
      if (gen === recGenRef.current) {
        setRecordStatus("idle");
        setError(
          "MP4 kaydı başlatılamadı. H.264 ve WebCodecs destekleyen güncel bir tarayıcı kullanın.",
        );
      }
    }
  }

  async function exportVideo(audioOnly = false) {
    if (
      source !== "file" ||
      recStatusRef.current !== "idle" ||
      autoExportRef.current ||
      editor.voiceRecording
    )
      return;
    autoExportRef.current = true;
    audioExportRef.current = audioOnly;
    setAutoExport(true);
    exportLoopRef.current = looping;
    engineRef.current?.pause();
    engineRef.current?.setLoop(false);
    editor.seek(0);
    setTime(audioRef.current?.currentTime ?? 0);
    await toggleRecord();
  }
  async function cancelExport() {
    if (recStatusRef.current === "finalizing") return;
    recGenRef.current++;
    const current = recorderRef.current;
    recorderRef.current = null;
    window.clearInterval(recTimerRef.current);
    engineRef.current?.pause();
    engineRef.current?.setLoop(false);
    autoExportRef.current = false;
    setAutoExport(false);
    recordingSceneRef.current = false;
    setRecording(false);
    setRecordStatus("idle");
    await current?.cancel();
  }

  const snapshot: StudioSnapshot = {
    version: 1,
    title,
    mode,
    theme: themeId,
    sensitivity,
    titlePlace,
    titleStyle,
    finish,
    effects,
    music,
    cover: coverOptions,
    captions: captions.options,
    format,
    resolution,
  };
  const locked = recStatus !== "idle";

  // The latest edit is kept on this device, so a closed app, a stopped
  // WebView or a reload can be resumed from the home screen.
  const [autosaved, setAutosaved] = useState<AutosaveInfo | null>(null);
  useEffect(() => {
    if (source === "idle") void readAutosaveInfo().then(setAutosaved);
  }, [source]);
  const autosaveRef = useRef({
    file: null as File | null,
    timer: 0,
    dirty: false,
    writing: 0,
    failed: false,
    queue: Promise.resolve(),
  });
  const autosaveNowRef = useRef(() => {});
  autosaveNowRef.current = () => {
    const state = autosaveRef.current;
    window.clearTimeout(state.timer);
    state.timer = 0;
    if (!state.dirty || state.failed || source !== "file" || !captions.file) return;
    // Recording and archive work own the media; try again when they finish.
    if (recStatusRef.current !== "idle" || archiveBusy) {
      state.timer = window.setTimeout(() => autosaveNowRef.current(), 3000);
      return;
    }
    let entries: Array<{ name: string; blob: Blob }>;
    try {
      entries = collectProjectEntries().entries;
    } catch {
      return;
    }
    state.dirty = false;
    state.writing += 1;
    const name = fileName || captions.file.name;
    state.queue = state.queue
      .then(() => writeAutosave(name, entries))
      .catch((err) => {
        state.dirty = true;
        // A full device is not retried on every edit.
        if (err instanceof DOMException && err.name === "QuotaExceededError") state.failed = true;
      })
      .finally(() => {
        state.writing -= 1;
      });
  };
  const snapshotKey = JSON.stringify(snapshot);
  useEffect(() => {
    const state = autosaveRef.current;
    if (source !== "file" || !captions.file) return;
    // A freshly opened file has nothing to recover yet.
    if (state.file !== captions.file) {
      state.file = captions.file;
      return;
    }
    state.dirty = true;
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => autosaveNowRef.current(), 2500);
  }, [source, captions.file, editor.project, captions.cues, snapshotKey, coverBlob]);
  useEffect(() => {
    const state = autosaveRef.current;
    const flush = () => {
      if (document.visibilityState === "hidden") autosaveNowRef.current();
    };
    const leave = () => autosaveNowRef.current();
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", leave);
      window.clearTimeout(state.timer);
    };
  }, []);
  async function discardAutosave() {
    setAutosaved(null);
    await clearAutosave().catch(() => {});
  }

  // Android back button: close the innermost layer first and never leave
  // with an edit that is still being written to the device.
  const backRef = useRef<() => string>(() => "exit");
  backRef.current = () => {
    const open = document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
    );
    if (open) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      return "handled";
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return "handled";
    }
    if (!hud) {
      setHud(true);
      return "handled";
    }
    if (recStatusRef.current !== "idle") return "busy";
    if (easy && activeTool) {
      closeTool();
      return "handled";
    }
    if (!homeView) {
      engineRef.current?.pause();
      setHomeView(true);
      return "handled";
    }
    const state = autosaveRef.current;
    if (state.dirty) autosaveNowRef.current();
    if (state.writing > 0) return "saving";
    return unsavedWork ? "unsaved" : "exit";
  };
  useEffect(() => {
    const target = window as Window & { auraBack?: () => string };
    target.auraBack = () => `${backRef.current()}|${en ? "en" : "tr"}`;
    return () => {
      delete target.auraBack;
    };
  }, [en]);
  const keepAwake = playing || recStatus !== "idle" || loading || captions.status !== "idle";
  useEffect(() => {
    keepScreenAwake(keepAwake);
  }, [keepAwake]);
  useEffect(() => () => keepScreenAwake(false), []);
  useEffect(() => setShellLanguage(language), [language]);

  // Android "Share" / "Open with": media starts a project, a project ZIP opens.
  const [incomingFile, setIncomingFile] = useState<File | null>(null);
  const isProjectFile = (file: File) => /\.zip$/i.test(file.name) || file.type.includes("zip");
  function openIncoming(file: File, confirmed = false) {
    if (recStatusRef.current !== "idle" || archiveBusy) {
      setError(
        en
          ? "Wait for the current export to finish, then share the file again."
          : "Dışa aktarma bitince dosyayı yeniden paylaş.",
      );
      return;
    }
    if (source !== "idle" && !confirmed) {
      setIncomingFile(file);
      return;
    }
    if (isProjectFile(file)) {
      void openEditingProject(file);
      return;
    }
    if (source !== "idle") {
      autosaveNowRef.current();
      carriedFile = file;
      void startNewProject();
      return;
    }
    pendingIntent.current =
      file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm|mkv|3gp)$/i.test(file.name)
        ? "video"
        : "music";
    void loadPrimary(file);
  }
  const incomingRef = useRef(openIncoming);
  incomingRef.current = openIncoming;
  useEffect(() => {
    if (!ready) return;
    const pull = () =>
      void takeIncomingFiles()
        .then((files) => {
          if (files[0]) incomingRef.current(files[0]);
        })
        .catch(() =>
          setError(
            en
              ? "The shared file could not be read. Save it to the phone and open it here."
              : "Paylaşılan dosya okunamadı. Dosyayı telefona kaydedip buradan seç.",
          ),
        );
    if (carriedFile) {
      const file = carriedFile;
      carriedFile = null;
      incomingRef.current(file, true);
    }
    pull();
    window.addEventListener("aura-incoming", pull);
    return () => window.removeEventListener("aura-incoming", pull);
  }, [ready, en]);
  function changeFormat(next: VideoFormat) {
    if (recStatusRef.current !== "idle") return;
    setFormat(next);
    writeSetting("aura-video-format", next);
  }
  function changeResolution(next: Resolution) {
    if (recStatusRef.current !== "idle") return;
    setResolution(next);
    writeSetting("aura-video-resolution", next);
  }
  function changeFinish(next: Finish) {
    setFinish(next);
    writeSetting("aura-finish", next);
  }
  function applySnapshot(next: StudioSnapshot) {
    if (recStatusRef.current !== "idle") return;
    chooseMode(next.mode);
    chooseTheme(next.theme);
    changeSensitivity(next.sensitivity);
    changeTitle(next.title);
    changePlace(next.titlePlace);
    changeStyle(next.titleStyle);
    changeFinish(next.finish);
    changeEffects(next.effects);
    changeMusic(next.music);
    changeCover(next.cover);
    captions.changeOptions(next.captions);
    changeFormat(next.format);
    changeResolution(next.resolution);
  }
  // Video templates. Switching between templates always starts from the look
  // and cuts the project had when the dialog opened, so they never compound.
  const [templatesOpen, setTemplatesOpen] = useState(false),
    [appliedTemplate, setAppliedTemplate] = useState<string | null>(null),
    [templateBefore, setTemplateBefore] = useState<{
      snapshot: StudioSnapshot;
      project: EditorProject;
    } | null>(null);
  function openTemplates() {
    setTemplateBefore(null);
    setTemplatesOpen(true);
  }
  function applyVideoTemplate(t: VideoTemplate, withEdit: boolean) {
    if (recStatusRef.current !== "idle") return;
    const before = templateBefore ?? { snapshot, project: editor.draw.current.project };
    if (!templateBefore) setTemplateBefore(before);
    chooseMode(t.mode);
    chooseTheme(t.theme);
    changeSensitivity(t.sensitivity);
    changeFinish(t.finish);
    changeEffects(t.effects);
    changeFormat(t.format);
    changePlace(t.title.place);
    changeStyle(t.title.style);
    const caption = CAPTION_TEMPLATES.find((c) => c.id === t.caption);
    if (caption) captions.changeOptions(caption.options);
    const project = editor.draw.current.project;
    editor.commit({
      ...project,
      clips: withEdit
        ? templateClips(t, before.project.clips, duration, analysis.peaks, analysis.grid.beats)
        : before.project.clips,
      adjust: templateAdjust(t, before.project.adjust),
    });
    setAppliedTemplate(t.id);
  }
  function revertVideoTemplate() {
    if (!templateBefore || recStatusRef.current !== "idle") return;
    applySnapshot(templateBefore.snapshot);
    editor.commit(templateBefore.project);
    setTemplateBefore(null);
    setAppliedTemplate(null);
  }
  async function startNewProject() {
    if (archiveBusy) return;
    // The closing project stays recoverable from the home screen.
    autosaveNowRef.current();
    setArchiveBusy(true);
    removeCover();
    await coverWriteRef.current.catch(() => {});
    resetStudio();
    onNewProject();
  }
  function resetStudio() {
    applySnapshot(parseSnapshot(JSON.stringify({ version: 1, mode: "ring", theme: "kor" })));
  }
  // Shared by the project file and the on-device autosave so both restore
  // through the same validated path.
  function collectProjectEntries() {
    const source = captions.file;
    if (!source) throw new Error("Kaydedilecek kaynak dosya yok.");
    const project = editor.project,
      cues = captions.cues;
    // Only media the current edit uses: deleted clips and replaced frames
    // stay loaded for undo but do not belong in the backup.
    const usedMedia = new Set<string>([
      ...project.media.map((m) => m.asset),
      ...project.layers.flatMap((l) => (l.asset ? [l.asset] : [])),
    ]);
    const usedSounds = new Set(project.sounds.map((s) => s.asset));
    const sourceIds = new Set(project.media.filter((m) => m.sourceVideo).map((m) => m.asset));
    const mediaAssets = [...editor.assets].filter(([id]) => usedMedia.has(id));
    const soundAssets = [...editor.soundAssets].filter(([id]) => usedSounds.has(id));
    const metadata = {
      version: 1,
      source: { name: source.name, type: source.type, duration },
      settings: snapshot,
      editor: project,
      srt: exportSrt(cues),
      wordCues: cues,
      // The primary video is already stored as "source"; reference it
      // instead of writing the same file into the archive twice.
      assets: mediaAssets.map(([id, a]) => ({
        id,
        name: a.file.name,
        type: a.file.type,
        ...(sourceIds.has(id) ? { source: true } : {}),
      })),
      sounds: soundAssets.map(([id, a]) => ({
        id,
        name: a.file.name,
        type: a.file.type,
      })),
      cover: !!coverBlob,
    };
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    if (metadataBlob.size > 600000)
      throw new Error("Kurgu bilgileri çok büyük; katman veya altyazı sayısını azaltın.");
    const entries = [
      {
        name: "project.json",
        blob: metadataBlob,
      },
      { name: "source", blob: source },
      ...mediaAssets
        .filter(([id]) => !sourceIds.has(id))
        .map(([id, a]) => ({ name: `asset-${id}`, blob: a.file })),
      ...soundAssets.map(([id, a]) => ({ name: `asset-${id}`, blob: a.file })),
      ...(coverBlob ? [{ name: "asset-cover", blob: coverBlob }] : []),
    ];
    return { entries, project, cues };
  }
  async function saveEditingProject() {
    if (!captions.file || archiveBusy) return;
    setArchiveBusy(true);
    setError(null);
    try {
      const { entries, project, cues } = collectProjectEntries();
      downloadBlob(await packProject(entries), "aura-kurgu.aura.zip");
      savedWorkRef.current = { project, cues };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kurgu yedeği kaydedilemedi.");
    } finally {
      setArchiveBusy(false);
    }
  }
  async function openEditingProject(file: File) {
    await restoreProject(() => unpackProject(file));
  }
  async function restoreAutosavedProject() {
    await restoreProject(readAutosave);
  }
  async function restoreProject(load: () => Promise<Map<string, Blob>>) {
    if (archiveBusy || recStatusRef.current !== "idle") return;
    setArchiveBusy(true);
    setError(null);
    engineRef.current?.pause();
    try {
      const entries = await load(),
        metadataBlob = entries.get("project.json");
      if (!metadataBlob) throw new Error("Bu dosya bir AURA kurgu yedeği değil.");
      if (metadataBlob.size > 600000) throw new Error("Kurgu bilgileri çok büyük.");
      const data = JSON.parse(await metadataBlob.text());
      if (
        data?.version !== 1 ||
        !data.source ||
        !Number.isFinite(data.source.duration) ||
        data.source.duration <= 0 ||
        data.source.duration > 3600 ||
        !Array.isArray(data.assets) ||
        data.assets.length > 30
      )
        throw new Error("Kurgu yedeği geçersiz.");
      const next = parseEditorProject(JSON.stringify(data.editor), data.source.duration);
      const nextSettings = parseSnapshot(JSON.stringify(data.settings));
      const nextCues =
        typeof data.srt === "string" && data.srt.trim()
          ? importSrt(data.srt, data.source.duration)
          : [];
      if (Array.isArray(data.wordCues) && data.wordCues.length === nextCues.length) {
        nextCues.forEach((cue, index) => {
          const original = data.wordCues[index];
          if (
            original?.text !== cue.text ||
            !Array.isArray(original.words) ||
            original.words.length > 100
          )
            return;
          cue.words = original.words.flatMap(
            (w: { text: unknown; start: unknown; end: unknown }) =>
              typeof w.text === "string" &&
              w.text.length <= 500 &&
              typeof w.start === "number" &&
              typeof w.end === "number" &&
              Number.isFinite(w.start) &&
              Number.isFinite(w.end) &&
              w.start >= cue.start - 0.002 &&
              w.end <= cue.end + 0.002 &&
              w.end > w.start
                ? [
                    {
                      text: w.text,
                      start: Math.max(cue.start, w.start),
                      end: Math.min(cue.end, w.end),
                    },
                  ]
                : [],
          );
        });
      }
      for (const asset of data.assets) {
        if (typeof asset.id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(asset.id))
          throw new Error("Medya kimliği geçersiz.");
        // Newer backups reference the primary video instead of duplicating it.
        const blob = entries.get(asset.source === true ? "source" : `asset-${asset.id}`);
        if (!blob) throw new Error("Yedekte medya dosyası eksik.");
        await editor.addAsset(
          sameStoredBlob(
            blob,
            new File([blob], String(asset.name).slice(0, 100), {
              type: String(asset.type).slice(0, 100),
            }),
          ),
          false,
          asset.id,
        );
      }
      if (Array.isArray(data.sounds)) {
        if (data.sounds.length > 20) throw new Error("Çok fazla ek ses dosyası.");
        for (const asset of data.sounds) {
          if (typeof asset.id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(asset.id))
            throw new Error("Ses kimliği geçersiz.");
          const blob = entries.get(`asset-${asset.id}`);
          if (!blob) throw new Error("Yedekte ses dosyası eksik.");
          await editor.addSound(
            sameStoredBlob(
              blob,
              new File([blob], String(asset.name).slice(0, 100), {
                type: String(asset.type).slice(0, 100),
              }),
            ),
            asset.id,
          );
        }
      }
      applySnapshot(nextSettings);
      if (data.cover && entries.has("asset-cover")) {
        const blob = await prepareCover(
          new File([entries.get("asset-cover")!], "kapak.jpg", { type: "image/jpeg" }),
        );
        setCoverBlob(blob);
        persistCover(blob);
      }
      editor.pending.current = next;
      captions.pending.current = {
        cues: nextCues,
        options: restoreCaptionOptions(JSON.stringify(data.settings.captions)),
      };
      const stored = entries.get("source");
      if (!stored) throw new Error("Yedekte kaynak dosya eksik.");
      const source = sameStoredBlob(
        stored,
        new File([stored], String(data.source.name).slice(0, 100), {
          type: String(data.source.type).slice(0, 100),
        }),
      );
      await engineRef.current?.useFile(source);
      if (easy) engineRef.current?.pause();
      setHomeView(false);
      setActiveTool(null);
      if (next.media.length) setVisualView("media");
      setTab("visual");
    } catch (err) {
      editor.pending.current = null;
      captions.pending.current = null;
      setError(err instanceof Error ? err.message : "Kurgu yedeği açılamadı.");
    } finally {
      setArchiveBusy(false);
    }
  }
  function pointerCanvas(event: React.PointerEvent<HTMLCanvasElement>) {
    if (recStatusRef.current !== "idle" || !editor.project.layers.length) return;
    const rect = event.currentTarget.getBoundingClientRect(),
      x = (event.clientX - rect.left) / rect.width,
      y = (event.clientY - rect.top) / rect.height,
      t = editor.draw.current.time;
    const layer = [...editor.project.layers].reverse().find((l) => {
      if (t < l.start || t >= l.end) return false;
      const f = frameAt(l, t),
        halfWidth =
          l.kind === "text" ? Math.min(0.4, l.text.length * 0.022) * f.scale : 0.12 * f.scale;
      return Math.abs(x - f.x) < halfWidth && Math.abs(y - f.y) < 0.13 * f.scale;
    });
    if (!layer) return;
    engineRef.current?.pause();
    event.currentTarget.setPointerCapture(event.pointerId);
    const f = frameAt(layer, t);
    overlayDrag.current = {
      id: layer.id,
      before: editor.project,
      dx: x - f.x,
      dy: y - f.y,
      time: t,
    };
    editor.setSelected(layer.id);
    if (!easy) {
      setTab("visual");
      setVisualView("layers");
    }
  }
  function moveCanvas(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = overlayDrag.current;
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width - drag.dx)),
      y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height - drag.dy));
    const current = editor.draw.current.project;
    editor.preview({
      ...current,
      layers: current.layers.map((l) =>
        l.id === drag.id
          ? {
              ...l,
              x,
              y,
              keyframes: l.keyframes.length
                ? [
                    ...l.keyframes.filter((f) => Math.abs(f.time - drag.time) > 0.05),
                    { ...frameAt(l, drag.time), time: drag.time, x, y },
                  ].sort((a, b) => a.time - b.time)
                : [],
            }
          : l,
      ),
    });
  }
  function finishCanvas(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = overlayDrag.current;
    if (!drag) return;
    overlayDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (JSON.stringify(editor.draw.current.project.layers) !== JSON.stringify(drag.before.layers))
      editor.commit(editor.draw.current.project, drag.before);
    if (easy) openTool("layers");
  }
  function snapshotImage() {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, "aura-sahne.png");
    }, "image/png");
  }

  // Explicit development-only fixture for reviewing the complete UI without user media.
  const designPreviewStarted = useRef(false);
  const designPreviewMedia = useRef(false);
  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      !ready ||
      designPreviewStarted.current ||
      new URLSearchParams(location.search).get("design-preview") !== "1"
    )
      return;
    designPreviewStarted.current = true;
    void fetch("/design-preview/AURA-Demo.wav")
      .then((response) => {
        if (!response.ok) throw new Error("Örnek ses açılamadı.");
        return response.blob();
      })
      .then((blob) => loadPrimary(new File([blob], "AURA-Demo.wav", { type: "audio/wav" })))
      .catch((failure) => setError(String(failure)));
  }, [ready, loadPrimary]);
  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      source !== "file" ||
      editor.total <= 0 ||
      designPreviewMedia.current ||
      new URLSearchParams(location.search).get("design-preview") !== "1"
    )
      return;
    designPreviewMedia.current = true;
    changeFormat("portrait");
    void fetch("/design-preview/poster.jpg")
      .then((response) => {
        if (!response.ok) throw new Error("Örnek görsel açılamadı.");
        return response.blob();
      })
      .then((blob) => editor.upload([new File([blob], "Poster.jpg", { type: "image/jpeg" })]))
      .then(() => {
        editor.seek(1);
        openTool("layers");
      })
      .catch((failure) => setError(String(failure)));
  }, [source, editor, openTool]);

  const activeMode = MODES.find((m) => m.id === mode)!;
  const activeFormat = VIDEO_FORMATS.find((f) => f.id === format)!;
  return (
    <div
      ref={rootRef}
      inert={!ready}
      data-ready={ready}
      data-format={format}
      data-tool={activeTool || "none"}
      onKeyDown={(event) => {
        if (event.target instanceof Element && event.target.closest('[role="dialog"],dialog'))
          return;
        if (event.key === "Escape" && easy && activeTool && !locked && !event.defaultPrevented) {
          event.preventDefault();
          closeTool();
        }
      }}
      className={`aura-studio atelier-studio ${homeView ? "at-home" : ""} ${easy ? "easy-editor timeline-editor" : "advanced-editor"} ${easy && activeTool ? "tool-open" : ""} ${easy && activeTool && panelTall ? "panel-tall" : ""} ${compactPreview ? "preview-compact" : ""} ${easy && source === "idle" ? "is-empty" : ""} ${hud ? "" : "is-presenting"}`}
    >
      <audio ref={audioRef} className="hidden" playsInline />
      <header className="studio-header atelier-header">
        <div className="atelier-brand-group">
          {!homeView && (
            <button
              type="button"
              className="atelier-back"
              disabled={locked}
              aria-label={ui(en ? "Home" : "Başlangıç")}
              onClick={() => {
                engineRef.current?.pause();
                setHomeView(true);
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="studio-brand">
            <span className="atelier-monogram">a</span>
            <div>
              <p>{ui("AURA")}</p>
              <small>{ui("CREATIVE STUDIO")}</small>
            </div>
          </div>
          {!homeView && (
            <span className="atelier-project-title">
              {fileName || (en ? "Sound study" : "Ses çalışması")}
            </span>
          )}
        </div>
        <div className="studio-header-actions">
          <button
            type="button"
            className="language-switch"
            aria-label={ui(en ? "Switch to Turkish" : "Switch to English")}
            onClick={() => setLanguage(en ? "tr" : "en")}
          >
            {en ? ui("EN") : ui("TR")}
            <ChevronDown size={13} />
          </button>
          {homeView ? (
            <button
              type="button"
              className="studio-button home-open"
              disabled={archiveBusy || loading}
              onClick={() => archiveInputRef.current?.click()}
            >
              <FolderOpen size={17} />
              {en ? ui("Open project") : ui("Proje aç")}
            </button>
          ) : (
            <>
              <button
                type="button"
                aria-label={en ? "Save project" : "Projeyi kaydet"}
                className="studio-button save-project"
                disabled={locked || archiveBusy || !captions.file}
                onClick={() => void saveEditingProject()}
              >
                <Save size={17} />
                <span>
                  {archiveBusy
                    ? en
                      ? ui("Saving…")
                      : ui("Kaydediliyor…")
                    : en
                      ? ui("Save project")
                      : ui("Projeyi kaydet")}
                </span>
              </button>
              <button
                type="button"
                className="studio-primary"
                disabled={loading || source === "idle" || recStatus !== "idle"}
                onClick={() => openTool("project")}
              >
                <Download size={17} />
                {en ? ui("Export") : ui("Dışa aktar")}
              </button>
            </>
          )}
        </div>
      </header>
      {homeView && (
        <AtelierHome
          language={language}
          busy={loading || archiveBusy}
          current={source !== "idle" ? fileName || (en ? "Sound study" : "Ses çalışması") : null}
          onNewProject={() => void startNewProject()}
          onResume={() => setHomeView(false)}
          recovery={source === "idle" ? autosaved : null}
          onRecover={() => void restoreAutosavedProject()}
          onDiscardRecovery={() => void discardAutosave()}
          onStart={startIntent}
          onOpen={() => archiveInputRef.current?.click()}
          onDemo={() => {
            if (source === "idle") void engineRef.current?.useDemo();
            else setHomeView(false);
          }}
          onLook={(mode, theme) => {
            if (source !== "idle") {
              chooseMode(mode);
              chooseTheme(theme);
              setHomeView(false);
              openTool("scenes");
            } else {
              pendingLook.current = { mode, theme };
              startIntent("music");
            }
          }}
          error={error}
        />
      )}
      <div className="studio-workspace">
        <WorkspaceNav
          language={language}
          active={workspace}
          onChange={selectWorkspace}
          disabled={locked || loading}
        />
        <main className="studio-main">
          {easy && source !== "idle" && (
            <div className="easy-preview-controls">
              <button
                type="button"
                className="source-name"
                aria-label={ui("Parçayı değiştir")}
                title={ui(en ? "Change source" : "Kaynak değiştir")}
                disabled={locked || loading}
                onClick={() => fileRef.current?.click()}
              >
                <Music className="size-4" />
                <span>{fileName || "Önizleme"}</span>
              </button>
              <div>
                <label className="format-quick" title={en ? "Video size" : "Video boyutu"}>
                  <select
                    value={format}
                    disabled={locked}
                    aria-label={en ? "Video size" : "Video boyutu"}
                    onChange={(event) => changeFormat(event.target.value as VideoFormat)}
                  >
                    {VIDEO_FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.ratio}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-3" aria-hidden="true" />
                </label>
                <Button
                  variant="ghost"
                  disabled={locked || !canUndoAny}
                  aria-label={ui("Son düzenlemeyi geri al")}
                  title={en ? "Undo (Ctrl+Z)" : "Geri al (Ctrl+Z)"}
                  onClick={undoLast}
                >
                  <Undo2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  disabled={locked || !canRedoAny}
                  aria-label={ui("Son düzenlemeyi yinele")}
                  title={en ? "Redo (Ctrl+Shift+Z)" : "Yinele (Ctrl+Shift+Z)"}
                  onClick={redoNext}
                >
                  <Redo2 className="size-4" />
                </Button>
                <Button
                  className="preview-fold"
                  aria-expanded={!compactPreview}
                  aria-controls="studio-preview"
                  onClick={() => setCompactPreview(!compactPreview)}
                >
                  {compactPreview ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                  {compactPreview ? ui("Önizlemeyi göster") : ui("Küçült")}
                </Button>
                <Button
                  variant="ghost"
                  aria-label={ui("Sahne görünümünü aç")}
                  onClick={() => setHud(false)}
                >
                  <Maximize2 className="size-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="preview-toolbar">
            <span className="preview-status">
              <span className={playing ? "is-live" : ""} />
              {playing
                ? ui("CANLI ÖNİZLEME")
                : source === "idle"
                  ? ui("SAHNE ÖNİZLEMESİ")
                  : ui("DURAKLATILDI")}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="studio-icon"
                aria-label={ui("Sahne görünümünü aç")}
                type="button"
                onClick={() => setHud(false)}
              >
                <Eye className="size-4" />
              </button>
              <button
                className="studio-icon"
                aria-label={ui("Sahneyi PNG olarak indir")}
                type="button"
                onClick={snapshotImage}
              >
                <Camera className="size-4" />
              </button>
              <button
                className="studio-icon"
                aria-label={ui(fullscreen ? "Tam ekrandan çık" : "Tam ekran")}
                type="button"
                onClick={() => void toggleFullscreen()}
              >
                {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
          </div>
          <div className="preview-fit" id="studio-preview" ref={fitRef}>
            <div className="canvas-frame" ref={frameRef}>
              <canvas
                onPointerDown={pointerCanvas}
                onPointerMove={moveCanvas}
                onPointerUp={finishCanvas}
                onPointerCancel={finishCanvas}
                ref={canvasRef}
                aria-label={ui(`${activeMode.label} müzik görselleştirmesi`)}
              />
              {recording && (
                <div className="record-badge">
                  <span />
                  {ui("REC ·")}
                  {formatTime(recSeconds)}
                </div>
              )}
            </div>
          </div>
          <div className="preview-meta">
            <span>
              {ui(activeMode.label)}
              <span className="meta-divider">/</span>
              {ui(theme.name)}
            </span>
            <span>
              {activeFormat.ratio}
              <span className="meta-divider">·</span>
              {resolution}p
            </span>
          </div>
          <div className="source-toolbar" role="group" aria-label={ui("Ses kaynağı")}>
            <button
              className="studio-button"
              type="button"
              disabled={locked || loading}
              aria-pressed={source === "file"}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              {ui("Parça yükle")}
            </button>
            <button
              className="studio-button"
              type="button"
              disabled={locked || loading}
              aria-pressed={source === "mic"}
              onClick={() =>
                source === "mic" ? engineRef.current?.stop() : void engineRef.current?.useMic()
              }
            >
              <Mic className="size-4" />
              {ui("Mikrofon")}
            </button>
            <button
              className="studio-button"
              type="button"
              disabled={locked || loading}
              aria-pressed={source === "demo"}
              onClick={() => void engineRef.current?.useDemo()}
            >
              <Music className="size-4" />
              {ui("Örnek")}
            </button>
          </div>
          <Transport
            compact={easy}
            source={source}
            name={fileName}
            playing={playing}
            loading={loading}
            time={source === "file" ? editor.time : time}
            duration={source === "file" ? editor.total : duration}
            volume={music.volume}
            muted={muted}
            loop={looping}
            onPlay={playTimeline}
            onSeek={editor.seek}
            onVolume={(v) => changeMusic({ volume: v })}
            onMute={() => setMuted((v) => !v)}
            onLoop={() => setLooping((v) => !v)}
          />
          {easy && source !== "idle" && (
            <div className={`project-timeline ${timelineExpanded ? "is-expanded" : ""}`}>
              <button
                type="button"
                className="timeline-toggle"
                aria-expanded={timelineExpanded}
                aria-controls="project-timeline-content"
                onClick={() => setTimelineExpanded(!timelineExpanded)}
              >
                <AudioLines className="size-5" />
                <span>{en ? ui("Timeline") : ui("Zaman çizelgesi")}</span>
                {timelineExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              <div id="project-timeline-content" hidden={!timelineExpanded}>
                <EditorTimeline
                  editor={editor}
                  file={captions.file}
                  duration={duration}
                  cues={captions.cues}
                  captionOffset={captions.options.offset}
                  playing={playing}
                  compact={!!activeTool && activeTool !== "cuts"}
                  disabled={locked}
                  onPause={() => engineRef.current?.pause()}
                  onTool={openTool}
                  onUpload={() => fileRef.current?.click()}
                  onTransitionPreview={async (id) => {
                    try {
                      await editor.waitForTransitions();
                      const clips = editor.draw.current.project.clips,
                        index = clips.findIndex((c) => c.id === id);
                      if (index < 1 || locked) return;
                      const at = clips.slice(0, index).reduce((n, c) => n + clipDuration(c), 0);
                      previewMotion(
                        Math.max(0, at - 0.15),
                        at + sceneTransitionDuration(clips[index - 1], clips[index]) + 0.15,
                      );
                    } catch {
                      setError("Geçiş görüntüleri hazırlanamadı. Geçişi kaldırıp yeniden deneyin.");
                    }
                  }}
                  onCaptionsPreview={captions.previewCues}
                  onCaptionsCommit={captions.commitCues}
                  quickToolsSignal={quickToolsSignal}
                  analysis={analysis}
                  onTemplates={openTemplates}
                  onCaption={(id) => {
                    setCaptionFocus((previous) => ({ id, serial: (previous?.serial || 0) + 1 }));
                    openTool("captions");
                  }}
                />
              </div>
            </div>
          )}
          {error && (
            <div className="studio-message" role="alert">
              <p>{error}</p>
              <button
                className="studio-icon"
                type="button"
                aria-label={ui("Hata mesajını kapat")}
                onClick={() => setError(null)}
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          {lastVideo && (
            <div className="studio-message" role="status">
              <p>
                {ui("Kaydın hazır ·")}
                {(lastVideo.blob.size / 1024 / 1024).toFixed(1)} {ui("MB")}
              </p>
              <button
                className="studio-button"
                type="button"
                onClick={() => downloadBlob(lastVideo.blob, lastVideo.name)}
              >
                <Download className="size-4" />
                {ui("Tekrar indir")}
              </button>
            </div>
          )}
        </main>
        <aside className="studio-inspector" aria-label={ui("Stüdyo ayarları")}>
          {easy && !activeTool && (
            <ToolLibrary
              language={language}
              workspace={workspace}
              onTool={openTool}
              disabled={locked || loading}
              onQuickTools={() => setQuickToolsSignal((n) => n + 1)}
              onAddText={() => {
                editor.addLayer("text");
                openTool("layers");
              }}
              onCover={() => {
                openTool("artwork");
                coverFileRef.current?.click();
              }}
              onUpload={() => fileRef.current?.click()}
              onTemplates={openTemplates}
            />
          )}
          <VideoTemplatesPanel
            open={templatesOpen}
            onClose={() => setTemplatesOpen(false)}
            current={appliedTemplate}
            canEdit={analysis.peaks.length > 0}
            canRevert={!!templateBefore}
            disabled={locked || loading}
            onApply={applyVideoTemplate}
            onRevert={revertVideoTemplate}
          />
          {easy && activeTool && activeTool !== "motion" && (
            <div className="editor-tool-heading">
              <Button variant="ghost" aria-label={ui("Zaman çizelgesine dön")} onClick={closeTool}>
                <ChevronLeft className="size-5" />
              </Button>
              <h2>{activeTool && toolName(activeTool, language)}</h2>
              <Button
                variant="ghost"
                className="panel-size"
                aria-pressed={panelTall}
                aria-label={
                  panelTall
                    ? en
                      ? "Show more preview"
                      : "Önizlemeyi büyüt"
                    : en
                      ? "Enlarge tool panel"
                      : "Araç panelini büyüt"
                }
                onClick={togglePanelTall}
              >
                {panelTall ? <ChevronsDown className="size-5" /> : <ChevronsUp className="size-5" />}
              </Button>
              <Button onClick={closeTool} className="editor-done">
                <Check className="size-4" />
                {en ? ui("Done") : ui("Tamam")}
              </Button>
            </div>
          )}
          <div className="inspector-heading">
            <span>
              <Settings2 className="size-4" />
              {ui("Düzenleme")}
            </span>
            <small>{ui("Değişiklikler anında görünür")}</small>
          </div>
          <div
            className="studio-tabs"
            hidden={easy}
            role="tablist"
            aria-label={ui("Düzenleme araçları")}
            onKeyDown={(e) => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              const index = editorTabs.findIndex((t) => t.id === tab);
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? editorTabs.length - 1
                    : (index + (e.key === "ArrowRight" ? 1 : -1) + editorTabs.length) %
                      editorTabs.length;
              const id = editorTabs[next].id;
              setTab(id);
              document.getElementById(`tab-${id}`)?.focus();
            }}
          >
            {editorTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                id={`tab-${t.id}`}
                role="tab"
                aria-label={ui(t.label)}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
              >
                <t.icon className="size-4" />
                {ui(t.label)}
                {t.id === "captions" && captions.cues.length > 0 && (
                  <span className="tab-count">{captions.cues.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="inspector-scroll" hidden={easy && !activeTool} ref={inspectorScrollRef}>
            <div
              className={`studio-tab-content ${visualView === "motion" ? "video-motion-tab" : ""}`}
              id="panel-visual"
              role="tabpanel"
              aria-labelledby="tab-visual"
              hidden={tab !== "visual"}
            >
              <div
                hidden={easy}
                className="studio-segments mb-4"
                role="group"
                aria-label={ui("Görsel araçlarına git")}
              >
                <button
                  type="button"
                  onClick={() => inspectorScrollRef.current?.scrollTo({ top: 0 })}
                >
                  {ui("Sahneler")}
                </button>
                <button type="button" onClick={() => setTab("artwork")}>
                  {ui("Kapak ve başlık")}
                </button>
              </div>
              <div
                hidden={easy}
                className={
                  easy ? "easy-visual-tools editor-visual-nav" : "studio-segments editor-visual-nav"
                }
                role="group"
                aria-label={ui("Görüntü düzenleme")}
              >
                {[
                  { id: "scenes", label: "Spektrum", title: "Sahneler", icon: AudioLines },
                  { id: "media", label: "Medya", title: "Fotoğraf / video", icon: ImagePlus },
                  { id: "layers", label: "Katmanlar", title: "Yazı / şekil", icon: Type },
                  {
                    id: "motion",
                    label: "Animasyon",
                    title: "Video animasyonları",
                    icon: Sparkles,
                  },
                  {
                    id: "adjust",
                    label: "Ayarla",
                    title: "Filtre / efekt",
                    icon: SlidersHorizontal,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={ui(easy ? item.title : item.label)}
                    aria-pressed={visualView === item.id}
                    onClick={() => setVisualView(item.id)}
                  >
                    {easy && <item.icon className="size-4" />}
                    {easy ? item.title : item.label}
                  </button>
                ))}
              </div>
              <div hidden={visualView !== "scenes"}>
                <VisualPanel
                  simple={easy}
                  mode={mode}
                  themeId={themeId}
                  finish={finish}
                  sensitivity={sensitivity}
                  effects={effects}
                  onMode={chooseMode}
                  onTheme={chooseTheme}
                  onFinish={changeFinish}
                  onSensitivity={changeSensitivity}
                  onEffects={changeEffects}
                />
              </div>
              <div hidden={visualView !== "media"}>
                <MediaPanel editor={editor} disabled={locked} onMotion={() => openTool("motion")} />
              </div>
              <div hidden={visualView !== "layers"}>
                <LayerPanel editor={editor} disabled={locked} />
              </div>
              <div hidden={visualView !== "adjust"}>
                <AdjustmentPanel editor={editor} disabled={locked} />
              </div>
              {visualView === "motion" && (
                <div className="video-motion-view">
                  <VideoMotionPanel
                    editor={editor}
                    canvas={canvasRef}
                    fileName={fileName || ""}
                    disabled={locked}
                    playing={playing}
                    onPreview={previewMotion}
                    onDone={easy ? closeTool : undefined}
                    onPause={() => {
                      motionPreviewEnd.current = null;
                      engineRef.current?.pause();
                    }}
                  />
                </div>
              )}
            </div>
            <div
              className="studio-tab-content"
              id="panel-artwork"
              role="tabpanel"
              aria-labelledby="tab-artwork"
              hidden={tab !== "artwork"}
            >
              <div id="artwork-settings" tabIndex={-1} aria-label={ui("Kapak ve başlık ayarları")}>
                <ArtworkPanel
                  simple={easy}
                  url={coverUrl}
                  options={coverOptions}
                  busy={coverBusy}
                  error={coverError}
                  title={ui(title)}
                  place={titlePlace}
                  style={titleStyle}
                  onUpload={() => coverFileRef.current?.click()}
                  onRemove={removeCover}
                  onOptions={changeCover}
                  onTitle={changeTitle}
                  onPlace={changePlace}
                  onStyle={changeStyle}
                />
              </div>
            </div>
            <div
              className="studio-tab-content studio-embedded"
              id="panel-music"
              role="tabpanel"
              aria-labelledby="tab-music"
              hidden={tab !== "music"}
            >
              {!easy && <h2 className="mb-3 text-base font-medium">{ui("Ses ve ritim")}</h2>}
              <div hidden={easy && activeTool !== "cuts"}>
                <CutPanel
                  contextual={easy}
                  onMotion={() => openTool("motion")}
                  onPause={() => engineRef.current?.pause()}
                  editor={editor}
                  file={captions.file}
                  duration={duration}
                  disabled={locked || loading}
                />
                {easy && (
                  <Button
                    className="replace-source"
                    disabled={locked || loading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    {ui("Kaynak dosyasını değiştir")}
                  </Button>
                )}
              </div>
              <details
                hidden={easy && activeTool !== "voice"}
                ref={voiceDetailsRef}
                className="easy-details"
              >
                <summary>{ui("Ek ses ve seslendirme")}</summary>
                <SoundPanel editor={editor} disabled={locked} />
              </details>
              <details
                hidden={easy && activeTool !== "sound"}
                ref={soundDetailsRef}
                open={!easy || undefined}
                className="easy-details"
              >
                <summary>{ui("Ses efektleri ve ritim")}</summary>
                <MusicPanel
                  embedded
                  music={music}
                  effects={effects}
                  stats={musicStats}
                  active={playing}
                  onMusic={changeMusic}
                  onEffects={changeEffects}
                  onScene={chooseRecipe}
                />
              </details>
            </div>
            <div
              className="studio-tab-content studio-embedded"
              id="panel-captions"
              role="tabpanel"
              aria-labelledby="tab-captions"
              hidden={tab !== "captions"}
            >
              {!easy && <h2 className="mb-3 text-base font-medium">{ui("Otomatik altyazı")}</h2>}
              <CaptionPanel
                embedded
                simple={easy}
                studio={captions}
                focusCue={captionFocus}
                time={time}
                duration={duration}
                onSeek={editor.seekSource}
              />
            </div>
            <div
              className="studio-tab-content"
              id="panel-project"
              role="tabpanel"
              aria-labelledby="tab-project"
              hidden={tab !== "project"}
            >
              {easy && activeTool !== "backup" && (
                <EasyExportPanel
                  showAction={false}
                  format={format}
                  resolution={resolution}
                  duration={editor.total}
                  available={source === "file" && editor.total > 0}
                  busy={locked}
                  onFormat={changeFormat}
                  onResolution={changeResolution}
                  onUpload={() => fileRef.current?.click()}
                  onExport={() => void exportVideo()}
                  onAudio={() => void exportVideo(true)}
                />
              )}
              <button
                type="button"
                className="studio-button w-full mb-3"
                disabled={locked}
                onClick={snapshotImage}
              >
                <Camera size={16} />
                {en ? "Save current frame · PNG" : "Bu kareyi kaydet · PNG"}
              </button>
              <details ref={backupDetailsRef} className="easy-details">
                <summary>{ui("Kurgu yedeği · medya dahil")}</summary>
                <p className="editor-note">
                  {ui(
                    "Müzik, fotoğraf/video dosyaları, kesimler, katmanlar, altyazılar ve görünüm tek dosyada saklanır. Üst sınır 200 MB.",
                  )}
                </p>
                <div className="editor-actions">
                  <button
                    className="studio-button"
                    type="button"
                    disabled={!captions.file || locked || archiveBusy}
                    onClick={() => void saveEditingProject()}
                  >
                    {ui("Kurguyu yedekle")}
                  </button>
                  <button
                    className="studio-button"
                    type="button"
                    disabled={locked || archiveBusy}
                    onClick={() => archiveInputRef.current?.click()}
                  >
                    {ui("Kurgu yedeği aç")}
                  </button>
                </div>
                {archiveBusy && (
                  <p role="status" className="editor-note">
                    {ui("Kurgu dosyası işleniyor…")}
                  </p>
                )}
              </details>
              <details open={!easy || undefined} className="easy-details">
                <summary>{ui("Proje ayarları ve yedekler")}</summary>
                <ProjectPanel
                  snapshot={snapshot}
                  locked={locked}
                  onApply={applySnapshot}
                  onFormat={changeFormat}
                  onResolution={changeResolution}
                  onReset={resetStudio}
                />
              </details>
            </div>
          </div>
          {easy && (activeTool === "project" || activeTool === "backup") && (
            <div className="easy-step-footer">
              <span>
                {activeFormat.ratio} · {resolution}
                {ui("p ·")}
                {formatTime(Math.min(editor.total, 180))}
              </span>
              <Button
                variant="default"
                disabled={locked || source !== "file" || editor.total <= 0}
                onClick={() => void exportVideo()}
              >
                <Download className="size-4" />
                {ui("Videoyu hazırla")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
          <div className="inspector-footer">
            <span>{ui("Sadece bu cihazda")}</span>
            <span>{ui("Ses dosyanız sunucuya yüklenmez")}</span>
          </div>
        </aside>
      </div>
      <ExportProgress
        open={autoExport}
        phase={recStatus}
        audioOnly={audioExportRef.current}
        time={editor.time}
        duration={editor.total}
        onCancel={() => void cancelExport()}
      />
      {!hud && (
        <div className="presentation-controls">
          <button className="studio-button" type="button" onClick={() => setHud(true)}>
            <ChevronLeft className="size-4" />
            {ui("Stüdyoya dön")}
          </button>
          <button
            className="studio-icon"
            type="button"
            aria-label={ui(playing ? "Duraklat" : "Oynat")}
            onClick={playTimeline}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
      )}
      {locked && !autoExport && (
        <div className="record-toolbar" role="status">
          <span className="record-indicator" />
          <span>
            {recStatus === "preparing"
              ? ui("Kayıt hazırlanıyor…")
              : recStatus === "finalizing"
                ? ui("Video hazırlanıyor…")
                : `Kayıt · ${formatTime(recSeconds)} / 3:00`}
          </span>
          {recording && (
            <button className="studio-button" type="button" onClick={() => void toggleRecord()}>
              <Square className="size-3.5" />
              {ui("Durdur")}
            </button>
          )}
        </div>
      )}
      {drag && (
        <div className="drop-overlay">
          <Upload className="size-10" />
          <p>{ui("Dosyanı buraya bırak")}</p>
          <span>{ui("Müzik veya kapak fotoğrafı")}</span>
        </div>
      )}
      <input
        ref={archiveInputRef}
        type="file"
        className="sr-only"
        accept=".zip,application/zip"
        aria-label={ui("Kurgu yedek dosyası")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void openEditingProject(file);
        }}
      />
      <input
        ref={coverFileRef}
        aria-label={ui("Kapak fotoğrafı dosyası")}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadCover(file);
        }}
      />
      <Dialog.Root open={!!incomingFile} onOpenChange={(open) => !open && setIncomingFile(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="atelier-dialog-overlay" />
          <Dialog.Content className="atelier-dialog">
            <Dialog.Title>
              {en ? "Open the shared file?" : "Paylaşılan dosya açılsın mı?"}
            </Dialog.Title>
            <Dialog.Description>
              {incomingFile &&
                (isProjectFile(incomingFile)
                  ? en
                    ? `${incomingFile.name} replaces the open project. Save a project file first if you want to keep it.`
                    : `${incomingFile.name} açık projenin yerine açılacak. Korumak istiyorsan önce proje dosyası olarak kaydet.`
                  : en
                    ? `A new project starts with ${incomingFile.name}. Save a project file first if you want to keep the open one.`
                    : `${incomingFile.name} ile yeni proje başlayacak. Açık projeyi korumak istiyorsan önce proje dosyası olarak kaydet.`)}
            </Dialog.Description>
            <div>
              <button type="button" onClick={() => setIncomingFile(null)}>
                {en ? "Cancel" : "Vazgeç"}
              </button>
              <button
                type="button"
                className="studio-primary"
                onClick={() => {
                  const file = incomingFile;
                  setIncomingFile(null);
                  if (file) openIncoming(file, true);
                }}
              >
                {en ? "Open" : "Aç"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <input
        ref={fileRef}
        aria-label={ui("Müzik dosyası")}
        className="sr-only"
        type="file"
        accept="audio/*,video/mp4,video/webm,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.mpeg,.mp4"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file && recStatusRef.current === "idle") void loadPrimary(file);
        }}
      />
    </div>
  );
}
