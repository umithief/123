import { createId } from "./id.ts";
import { editStamp, redoable, stepStamp } from "./history-clock";
import { useTransitionFrames } from "./video-frames";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { AudioEngine } from "./engine";
import {
  clipDuration,
  clipGain,
  emptyProject,
  locateTime,
  makeClip,
  projectDuration,
  splitClip,
  timelineTime,
  type EditorProject,
  type Overlay,
  type EditClip,
  type MediaClip,
  type SoundLayer,
} from "./editor";
export type MediaAsset = {
  file: File;
  url: string;
  element: HTMLImageElement | HTMLVideoElement;
  duration: number;
  /** The source video's second player, waiting at the next cut. */
  spare?: HTMLVideoElement;
};
export type SoundAsset = {
  file: File;
  url: string;
  audio: HTMLAudioElement;
  duration: number;
  control: ReturnType<AudioEngine["openSoundLayer"]>;
};
export function useEditor(
  audio: RefObject<HTMLAudioElement | null>,
  engine: RefObject<AudioEngine | null>,
  file: File | null,
  duration: number,
  looping: boolean,
  exporting: boolean,
  onSourceVideo?: (width: number, height: number) => void,
) {
  const onSourceVideoRef = useRef(onSourceVideo);
  onSourceVideoRef.current = onSourceVideo;
  const [project, setProject] = useState<EditorProject>(emptyProject);
  const transitionFrames = useTransitionFrames(file, project.clips);
  const [time, setTime] = useState(0),
    [selected, setSelected] = useState(""),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  // `at` orders entries against the caption history (see history-clock).
  type Entry = { project: EditorProject; at: number };
  type History = { past: Entry[]; future: Entry[] };
  const [history, setHistoryState] = useState<History>({ past: [], future: [] });
  // Undo/redo and rapid successive edits must see the latest history, not the
  // value captured by the render that created the handler.
  const historyRef = useRef(history);
  const setHistory = (next: History | ((h: History) => History)) => {
    historyRef.current = typeof next === "function" ? next(historyRef.current) : next;
    setHistoryState(historyRef.current);
  };
  const draw = useRef({
    project,
    time: 0,
    assets: new Map<string, MediaAsset>(),
    transitionFrames: transitionFrames.frames.current,
  });
  draw.current.project = project;
  const soundAssets = useRef(new Map<string, SoundAsset>()).current;
  const voiceRef = useRef<MediaRecorder | null>(null),
    voiceStream = useRef<MediaStream | null>(null),
    voiceTimer = useRef(0),
    voiceStarting = useRef(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const assets = draw.current.assets,
    index = useRef(0),
    ended = useRef(false),
    settings = useRef({ looping, exporting });
  settings.current = { looping, exporting };
  const loaded = useRef<File | null>(null),
    assetGeneration = useRef(0),
    projectRef = useRef(project);
  projectRef.current = project;
  const pending = useRef<EditorProject | null>(null);
  const total = projectDuration(project);
  useEffect(() => {
    if (!file) {
      if (loaded.current) {
        setProject(emptyProject());
        loaded.current = null;
      }
      return;
    }
    if (duration <= 0 || file === loaded.current) return;
    loaded.current = file;
    index.current = 0;
    ended.current = false;
    setTime(0);
    const next = pending.current ?? {
      ...projectRef.current,
      media: projectRef.current.media.filter((c) => !c.sourceVideo),
      clips: [makeClip(duration)],
    };
    pending.current = null;
    setProject(next);
    draw.current.project = next;
    projectRef.current = next;
    setSelected(next.clips[0]?.id ?? "");
    setHistory({ past: [], future: [] });
    if (
      (file.type.startsWith("video/") || (!file.type && /\.(mp4|mov|m4v)$/i.test(file.name))) &&
      !next.media.some((m) => m.sourceVideo)
    ) {
      const job = assetGeneration.current;
      void addAsset(file, false, createId())
        .then((id) => {
          if (job !== assetGeneration.current || loaded.current !== file || !id) return;
          const p = projectRef.current;
          const media: MediaClip = {
            id: createId(),
            asset: id,
            name: file.name,
            kind: "video",
            sourceVideo: true,
            start: 0,
            end: projectDuration(p),
            offset: 0,
            rate: 1,
            fit: "cover",
            transition: "none",
            transitionDuration: 0.5,
            opacity: 1,
            keyColor: "#00ff00",
            keyTolerance: 0,
            mask: "none",
          };
          const withVideo = { ...p, media: [media, ...p.media], showSpectrum: false };
          setProject(withVideo);
          draw.current.project = withVideo;
          projectRef.current = withVideo;
          const element = assets.get(id)?.element;
          if (element instanceof HTMLVideoElement)
            onSourceVideoRef.current?.(element.videoWidth, element.videoHeight);
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Video görüntüsü açılamadı."),
        );
    }
    const player = audio.current;
    if (player) {
      player.playbackRate = next.clips[0]?.rate ?? 1;
      player.currentTime = next.clips[0]?.in ?? 0;
    }
  }, [file, duration]);
  useEffect(
    () => () => {
      assetGeneration.current++;
      for (const asset of assets.values()) {
        for (const video of [asset.element, asset.spare])
          if (video instanceof HTMLVideoElement) {
            video.pause();
            video.removeAttribute("src");
            video.load();
          }
        URL.revokeObjectURL(asset.url);
      }
      assets.clear();
      for (const asset of soundAssets.values()) {
        asset.audio.pause();
        asset.control.release();
        URL.revokeObjectURL(asset.url);
      }
      soundAssets.clear();
      if (voiceRef.current?.state === "recording") {
        voiceRef.current.onstop = null;
        voiceRef.current.stop();
      }
      voiceStream.current?.getTracks().forEach((t) => t.stop());
      clearTimeout(voiceTimer.current);
    },
    [],
  );
  useEffect(() => {
    let raf = 0,
      lastUi = 0;
    // The source videos that follow the main player (the clip's own picture).
    const sourceVideos = () =>
      [...assets.values()].filter(
        (a) =>
          a.element instanceof HTMLVideoElement &&
          draw.current.project.media.some((m) => m.sourceVideo && assets.get(m.asset) === a),
      );
    let prepared = "";
    /** Plays on from `next.in`: a split point simply continues; a jump uses the spare players when they are ready, else seeks. */
    const continueAt = (player: HTMLAudioElement, next: EditClip) => {
      if (Math.abs(player.currentTime - next.in) < 0.06) {
        if (player.playbackRate !== next.rate) player.playbackRate = next.rate;
        if (player.paused) void player.play().catch(() => {});
        return player;
      }
      const swapped = engine.current?.cutTo(next.in, next.rate) ?? null;
      if (!swapped) {
        player.playbackRate = next.rate;
        player.currentTime = next.in;
        if (player.paused) void player.play().catch(() => {});
        return player;
      }
      audio.current = swapped;
      for (const asset of sourceVideos()) {
        const spare = asset.spare,
          shown = asset.element as HTMLVideoElement;
        if (
          !spare ||
          spare.seeking ||
          spare.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          Math.abs(spare.currentTime - next.in) > 0.05
        )
          continue;
        spare.playbackRate = next.rate;
        void spare.play().catch(() => {});
        shown.pause();
        asset.element = spare;
        asset.spare = shown;
      }
      prepared = "";
      return swapped;
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      let player = audio.current;
      const clips = draw.current.project.clips;
      if (!player || !clips.length) return;
      const clip = clips[index.current] ?? clips[0];
      if (!clip) return;
      const wrap = settings.current.looping && !settings.current.exporting;
      const upcoming =
        index.current + 1 < clips.length ? clips[index.current + 1] : wrap ? clips[0] : null;
      // Shortly before a jump, the spare players wait at its first frame.
      if (
        upcoming &&
        !player.paused &&
        Math.abs(upcoming.in - clip.out) >= 0.06 &&
        (clip.out - player.currentTime) / clip.rate < 1.5
      ) {
        const key = `${upcoming.id}@${upcoming.in}`;
        if (prepared !== key) {
          prepared = key;
          engine.current?.prepareCut(upcoming.in, upcoming.rate);
          for (const asset of sourceVideos()) {
            if (!asset.spare) {
              const spare = document.createElement("video");
              spare.muted = true;
              spare.playsInline = true;
              spare.preload = "auto";
              spare.src = asset.url;
              asset.spare = spare;
            }
            if (!asset.spare.paused) asset.spare.pause();
            if (Math.abs(asset.spare.currentTime - upcoming.in) > 0.01)
              asset.spare.currentTime = upcoming.in;
          }
        }
      }
      if (!player.paused && (player.currentTime >= clip.out - 0.015 || player.ended)) {
        if (index.current + 1 < clips.length) {
          index.current++;
          player = continueAt(player, clips[index.current]);
          ended.current = false;
        } else if (wrap) {
          index.current = 0;
          player = continueAt(player, clips[0]);
        } else {
          player.pause();
          ended.current = true;
        }
      } else if (player.ended && index.current + 1 < clips.length) {
        index.current++;
        player = continueAt(player, clips[index.current]);
        ended.current = false;
      }
      const current = clips[index.current] ?? clips[0];
      // External subtitle/source seeks must stay within the selected cut.
      if (player.playbackRate !== current.rate) player.playbackRate = current.rate;
      engine.current?.setEditGain(clipGain(current, player.currentTime));
      const at = timelineTime(clips, index.current, player.currentTime);
      draw.current.time = at;
      if (now - lastUi > 80) {
        lastUi = now;
        setTime(at);
      }
      for (const [id, asset] of soundAssets) {
        const sound = draw.current.project.sounds.find(
          (c) => c.asset === id && at >= c.start && at < c.end,
        );
        const element = asset.audio;
        if (!sound || player.paused) {
          if (!element.paused) element.pause();
          if (!sound) continue;
        }
        const wanted = Math.min(asset.duration - 0.02, sound!.offset + at - sound!.start);
        if (Math.abs(element.currentTime - wanted) > 0.15)
          element.currentTime = Math.max(0, wanted);
        const local = at - sound!.start,
          total = sound!.end - sound!.start;
        asset.control.setVolume(
          sound!.volume *
            Math.max(
              0,
              Math.min(
                1,
                sound!.fadeIn ? local / sound!.fadeIn : 1,
                sound!.fadeOut ? (total - local) / sound!.fadeOut : 1,
              ),
            ),
        );
        if (!player.paused && element.paused && wanted < asset.duration - 0.03) {
          void asset.control.resume();
          void element.play().catch(() => {});
        }
      }
      for (const [id, asset] of assets) {
        if (!(asset.element instanceof HTMLVideoElement)) continue;
        const media = draw.current.project.media.find(
          (c) => c.asset === id && at >= c.start && at < c.end,
        );
        const video = asset.element;
        if (!media) {
          if (!video.paused) video.pause();
          continue;
        }
        const wanted = Math.min(
          Math.max(0, asset.duration - 0.03),
          media.sourceVideo ? player.currentTime : media.offset + (at - media.start) * media.rate,
        );
        if (Math.abs(video.currentTime - wanted) > 0.2) video.currentTime = wanted;
        // Writing playbackRate every frame fires a ratechange each time.
        const rate = media.sourceVideo ? current.rate : media.rate;
        if (video.playbackRate !== rate) video.playbackRate = rate;
        if (!player.paused && video.paused && wanted < asset.duration - 0.05)
          void video.play().catch(() => {});
        else if (player.paused && !video.paused) video.pause();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  function seek(at: number) {
    const found = locateTime(draw.current.project.clips, Math.max(0, at));
    if (!found || !audio.current) return;
    index.current = found.index;
    audio.current.currentTime = found.source;
    audio.current.playbackRate = found.clip.rate;
    ended.current = false;
    draw.current.time = timelineTime(draw.current.project.clips, index.current, found.source);
    setTime(draw.current.time);
  }
  function commit(next: EditorProject, before?: EditorProject) {
    next = {
      ...next,
      media: next.media.map((c) => (c.sourceVideo ? { ...c, end: projectDuration(next) } : c)),
    };
    const current = before ?? projectRef.current;
    const at = editStamp();
    setHistory((h) => ({ past: [...h.past, { project: current, at }].slice(-40), future: [] }));
    setProject(next);
    draw.current.project = next;
    projectRef.current = next;
    engine.current?.pause();
    index.current = Math.min(index.current, next.clips.length - 1);
    seek(Math.min(draw.current.time, projectDuration(next)));
  }
  function changeClip(id: string, patch: Partial<EditClip>) {
    const next = {
      ...projectRef.current,
      clips: projectRef.current.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
    const clip = next.clips.find((c) => c.id === id);
    if (!clip || clip.out - clip.in < 0.1 || clip.in < 0 || clip.out > duration) {
      setError("Kesim en az 0,1 saniye olmalı ve kaynak süresi içinde kalmalı.");
      return;
    }
    setError(null);
    commit(next);
  }
  async function addAsset(file: File, asLayer = false, restoreId?: string) {
    if (file.size > 100 * 1024 * 1024)
      throw new Error("Her medya dosyası en fazla 100 MB olabilir.");
    if (assets.size >= 30 && !restoreId)
      throw new Error("En fazla 30 medya dosyası ekleyebilirsiniz.");
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    if (asLayer && isVideo) throw new Error("Çıkartma için fotoğraf seçin.");
    if (!isVideo && !file.type.startsWith("image/"))
      throw new Error("Bir fotoğraf veya MP4/WebM video seçin.");
    const url = URL.createObjectURL(file),
      element = isVideo ? document.createElement("video") : new Image();
    try {
      if (element instanceof HTMLVideoElement) {
        element.muted = true;
        element.playsInline = true;
        element.preload = "auto";
      }
      element.src = url;
      if (element instanceof HTMLImageElement) {
        await element.decode();
        if (element.width * element.height > 40000000)
          throw new Error("Fotoğraf en fazla 40 megapiksel olabilir.");
      } else
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => finish(new Error("Video açılamadı. MP4/H.264 deneyin.")),
            12000,
          );
          const finish = (err?: Error) => {
            clearTimeout(timeout);
            element.onloadeddata = null;
            element.onerror = null;
            err ? reject(err) : resolve();
          };
          element.onloadeddata = () => finish();
          element.onerror = () => finish(new Error("Bu video cihazda desteklenmiyor."));
          element.load();
        });
      const id = restoreId ?? createId(),
        length = element instanceof HTMLVideoElement ? element.duration : 5;
      if (!Number.isFinite(length) || length <= 0) throw new Error("Medya süresi okunamadı.");
      if (assets.has(id)) {
        const old = assets.get(id)!;
        for (const video of [old.element, old.spare])
          if (video instanceof HTMLVideoElement) {
            video.pause();
            video.removeAttribute("src");
            video.load();
          }
        URL.revokeObjectURL(old.url);
      }
      assets.set(id, { file, url, element, duration: length });
      if (restoreId) return id;
      const currentTotal = projectDuration(projectRef.current);
      const lastEnd =
        projectRef.current.media.filter((c) => !c.sourceVideo).at(-1)?.end ?? draw.current.time;
      const start = Math.min(Math.max(draw.current.time, lastEnd), Math.max(0, currentTotal - 0.1)),
        end = Math.min(currentTotal || 5, start + length);
      if (asLayer) {
        addLayer("image", id);
        return id;
      }
      const media: MediaClip = {
        id: createId(),
        asset: id,
        name: file.name,
        kind: isVideo ? "video" : "image",
        start,
        end,
        offset: 0,
        rate: 1,
        fit: "cover",
        transition: "fade",
        transitionDuration: 0.5,
        opacity: 1,
        keyColor: "#00ff00",
        keyTolerance: 0,
        mask: "none",
      };
      commit({ ...projectRef.current, media: [...projectRef.current.media, media] });
      return id;
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  }
  async function addSound(file: File, restoreId?: string) {
    if (file.size > 50 * 1024 * 1024) throw new Error("Ek ses dosyası en fazla 50 MB olabilir.");
    if (soundAssets.size >= 20 && !restoreId)
      throw new Error("En fazla 20 ek ses dosyası kullanabilirsiniz.");
    const url = URL.createObjectURL(file),
      element = document.createElement("audio");
    element.preload = "auto";
    element.src = url;
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => finish(new Error("Ses dosyası açılamadı.")), 10000);
        const finish = (err?: Error) => {
          clearTimeout(timer);
          element.onloadedmetadata = null;
          element.onerror = null;
          err ? reject(err) : resolve();
        };
        element.onloadedmetadata = () => finish();
        element.onerror = () => finish(new Error("Bu ses dosyası desteklenmiyor."));
        element.load();
      });
      const length = Number.isFinite(element.duration)
        ? element.duration
        : (await new OfflineAudioContext(1, 1, 16000).decodeAudioData(await file.arrayBuffer()))
            .duration;
      if (!engine.current || !Number.isFinite(length) || length <= 0)
        throw new Error("Ses hattı hazır değil.");
      const id = restoreId ?? createId();
      if (soundAssets.has(id)) {
        const old = soundAssets.get(id)!;
        old.audio.pause();
        old.control.release();
        URL.revokeObjectURL(old.url);
      }
      soundAssets.set(id, {
        file,
        url,
        audio: element,
        duration: length,
        control: engine.current.openSoundLayer(element),
      });
      if (!restoreId) {
        const start = Math.min(
            draw.current.time,
            Math.max(0, projectDuration(projectRef.current) - 0.1),
          ),
          layer: SoundLayer = {
            id: createId(),
            asset: id,
            name: file.name,
            start,
            end: Math.min(projectDuration(projectRef.current), start + length),
            offset: 0,
            volume: 1,
            fadeIn: 0,
            fadeOut: 0,
          };
        commit({ ...projectRef.current, sounds: [...projectRef.current.sounds, layer] });
      }
      return id;
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  }
  async function uploadSound(file: File) {
    setBusy(true);
    setError(null);
    try {
      await addSound(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ses eklenemedi.");
    } finally {
      setBusy(false);
    }
  }
  async function startVoiceover() {
    // A second tap while the permission prompt is open must not open a second stream.
    if (voiceRef.current?.state === "recording" || voiceStarting.current) return;
    voiceStarting.current = true;
    const generation = assetGeneration.current;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation !== assetGeneration.current) {
        // The editor closed while the permission prompt was open.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      voiceStream.current = stream;
      const recorder = new MediaRecorder(stream),
        chunks: Blob[] = [];
      voiceRef.current = recorder;
      const at = draw.current.time;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        clearTimeout(voiceTimer.current);
        stream.getTracks().forEach((t) => t.stop());
        voiceStream.current = null;
        setVoiceRecording(false);
        engine.current?.pause();
        draw.current.time = at;
        seek(at);
        if (chunks.length)
          void uploadSound(new File(chunks, "seslendirme.webm", { type: recorder.mimeType }));
      };
      recorder.start(250);
      setVoiceRecording(true);
      void engine.current?.playFile();
      voiceTimer.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 120000);
    } catch (err) {
      voiceStream.current?.getTracks().forEach((t) => t.stop());
      setVoiceRecording(false);
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Seslendirme için mikrofon izni verin."
          : "Mikrofon kaydı bu cihazda başlatılamadı.",
      );
    } finally {
      voiceStarting.current = false;
    }
  }
  async function freezeFrame(id: string) {
    const media = projectRef.current.media.find((c) => c.id === id),
      asset = media ? assets.get(media.asset) : null;
    if (!asset || !(asset.element instanceof HTMLVideoElement)) return;
    setBusy(true);
    setError(null);
    try {
      const video = asset.element;
      if (video.readyState < 2) throw new Error("Önce videodan bir kare seçin.");
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kare alınamadı."))), "image/png"),
      );
      const assetId = await addAsset(
        new File([blob], "dondurulmus-kare.png", { type: "image/png" }),
        false,
        createId(),
      );
      const start = draw.current.time,
        end = Math.min(projectDuration(projectRef.current), start + 3);
      if (end - start < 0.1)
        throw new Error("Kareyi eklemek için videonun bitişinden önce bir an seçin.");
      const frozen: MediaClip = {
        ...media!,
        id: createId(),
        asset: assetId,
        name: "Dondurulmuş kare",
        kind: "image",
        sourceVideo: false,
        start,
        end,
        offset: 0,
        rate: 1,
        transition: "none",
      };
      commit({ ...projectRef.current, media: [...projectRef.current.media, frozen] });
      setSelected(frozen.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kare alınamadı.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: File[], asLayer = false) {
    const job = assetGeneration.current;
    setBusy(true);
    setError(null);
    try {
      for (const f of files) {
        if (job !== assetGeneration.current) break;
        await addAsset(f, asLayer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Medya açılamadı.");
    } finally {
      if (job === assetGeneration.current) setBusy(false);
    }
  }
  function addLayer(kind: Overlay["kind"], asset?: string) {
    if (projectRef.current.layers.length >= 50) {
      setError("En fazla 50 katman ekleyebilirsiniz.");
      return;
    }
    // Read the live duration: this also runs after an awaited image import.
    const total = projectDuration(projectRef.current);
    const start = Math.min(draw.current.time, Math.max(0, total - 0.1));
    const layer: Overlay = {
      id: createId(),
      kind,
      asset,
      text: "Metnini yaz",
      start,
      end: Math.min(total || 5, start + 5),
      x: 0.5,
      y: kind === "text" ? 0.5 : 0.28,
      scale: 1,
      rotation: 0,
      opacity: 1,
      color: "#ffffff",
      background: false,
      animation: kind === "text" ? "none" : "fade",
      font: "sans",
      weight: 600,
      textEffect: "none",
      blend: "source-over",
      keyframes: [],
    };
    commit({ ...projectRef.current, layers: [...projectRef.current.layers, layer] });
    setSelected(layer.id);
  }
  function restore(next: EditorProject) {
    commit(next);
    setSelected(next.clips[0]?.id ?? "");
  }
  function seekSource(at: number) {
    const clips = draw.current.project.clips;
    const atIndex = clips.findIndex((c) => at >= c.in && at < c.out);
    if (atIndex < 0) {
      setError("Bu altyazı kesilen bir bölümde. Müzik kesimini genişleterek dinleyebilirsiniz.");
      return;
    }
    setError(null);
    seek(timelineTime(clips, atIndex, at));
  }
  return {
    project,
    time,
    total,
    selected,
    setSelected,
    error: error || transitionFrames.error,
    transitionsBusy: transitionFrames.busy,
    waitForTransitions: transitionFrames.wait,
    busy,
    draw,
    assets,
    soundAssets,
    addSound,
    uploadSound,
    startVoiceover,
    voiceRecording,
    stopVoiceover: () => {
      if (voiceRef.current?.state === "recording") {
        voiceRef.current.stop();
      }
    },
    changeSound: (id: string, patch: Partial<SoundLayer>) => {
      const current = projectRef.current;
      commit({
        ...current,
        sounds: current.sounds.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      });
    },
    ended,
    seek,
    seekSource,
    commit,
    preview: (next: EditorProject) => {
      setProject(next);
      draw.current.project = next;
      projectRef.current = next;
    },
    changeClip,
    upload,
    addAsset,
    freezeFrame,
    addLayer,
    restore,
    pending,
    split: () => {
      // Split at the playhead's exact position, not the throttled UI time.
      const current = projectRef.current,
        at = draw.current.time;
      const next = splitClip(current.clips, at);
      if (next !== current.clips) {
        commit({ ...current, clips: next });
        setSelected(locateTime(next, at + 0.02)?.clip.id ?? "");
      }
    },
    changeMedia: (id: string, patch: Partial<MediaClip>) => {
      const current = projectRef.current;
      commit({
        ...current,
        media: current.media.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
    },
    changeLayer: (id: string, patch: Partial<Overlay>) => {
      const current = projectRef.current;
      commit({
        ...current,
        layers: current.layers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
    },
    undo: () => {
      const h = historyRef.current,
        previous = h.past.at(-1)?.project;
      if (!previous) return;
      setHistory({
        past: h.past.slice(0, -1),
        future: [{ project: projectRef.current, at: stepStamp() }, ...h.future],
      });
      setProject(previous);
      draw.current.project = previous;
      projectRef.current = previous;
      engine.current?.pause();
      seek(Math.min(draw.current.time, projectDuration(previous)));
    },
    redo: () => {
      const h = historyRef.current,
        next = redoable(h.future[0]?.at) ? h.future[0].project : null;
      if (!next) return;
      setHistory({
        past: [...h.past, { project: projectRef.current, at: stepStamp() }].slice(-40),
        future: h.future.slice(1),
      });
      setProject(next);
      draw.current.project = next;
      projectRef.current = next;
      engine.current?.pause();
      seek(Math.min(draw.current.time, projectDuration(next)));
    },
    canUndo: history.past.length > 0,
    canRedo: redoable(history.future[0]?.at),
    /** Stamp of the edit undo would revert (0 = none). */
    undoAt: history.past.at(-1)?.at ?? 0,
    /** Stamp of the step redo would restore (0 = none). */
    redoAt: redoable(history.future[0]?.at) ? history.future[0].at : 0,
  };
}
