import { useEffect, useRef, useState } from "react";
import type { EditClip } from "./editor";
import { videoEvent } from "./scene-detection";
const isVideo = (file: File | null) =>
  !!file && (file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(file.name));
async function readFrames(
  file: File,
  times: number[],
  edge: number,
  signal: AbortSignal,
  frame: (time: number, url: string) => Promise<void> | void,
) {
  const video = document.createElement("video"),
    url = URL.createObjectURL(file),
    canvas = document.createElement("canvas");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    await videoEvent(video, "loadeddata", signal, () => {
      video.src = url;
      video.load();
    });
    const scale = Math.min(1, edge / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d")!;
    for (const time of [...new Set(times)]) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const at = Math.max(0, Math.min(video.duration - 0.03, time));
      if (Math.abs(video.currentTime - at) > 0.001)
        await videoEvent(video, "seeked", signal, () => {
          video.currentTime = at;
        });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      await frame(time, canvas.toDataURL("image/jpeg", 0.9));
    }
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
export function useTransitionFrames(file: File | null, clips: EditClip[]) {
  const frames = useRef(new Map<string, HTMLImageElement>());
  const cache = useRef(new Map<number, HTMLImageElement>());
  const currentFile = useRef(file),
    pending = useRef<Promise<void>>(Promise.resolve());
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const need = clips
    .slice(1)
    .flatMap((clip, i) =>
      clip.transition && clip.transition.id !== "none"
        ? [{ id: clips[i].id, time: Math.max(clips[i].in, clips[i].out - 0.04) }]
        : [],
    );
  const signature = JSON.stringify(need);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    if (currentFile.current !== file) {
      cache.current.clear();
      currentFile.current = file;
    }
    frames.current.clear();
    for (const item of need) {
      const image = cache.current.get(item.time);
      if (image) frames.current.set(item.id, image);
    }
    if (!file || !isVideo(file) || !need.length) {
      setBusy(false);
      pending.current = Promise.resolve();
      return;
    }
    const times = need.filter((item) => !cache.current.has(item.time)).map((item) => item.time);
    setBusy(times.length > 0);
    const work = readFrames(file, times, 640, controller.signal, async (time, url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (controller.signal.aborted) return;
      cache.current.set(time, image);
      for (const item of need) if (item.time === time) frames.current.set(item.id, image);
    })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure.message);
          throw failure;
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    pending.current = work;
    void work.catch(() => {});
    // Bound retained images to the current transition set.
    for (const time of cache.current.keys())
      if (!need.some((item) => item.time === time)) cache.current.delete(time);
    return () => controller.abort();
  }, [file, signature]);
  return { frames, busy, error, wait: () => pending.current };
}
export function useClipThumbnails(file: File | null, clips: EditClip[]) {
  const [images, setImages] = useState<Record<string, string[]>>({});
  const signature = JSON.stringify(clips.map((c) => [c.id, c.in, c.out]));
  useEffect(() => {
    const controller = new AbortController();
    setImages({});
    if (!file || !isVideo(file)) return;
    const items = clips.flatMap((clip) =>
      [0.1, 0.5, 0.9].map((part) => ({ id: clip.id, time: clip.in + (clip.out - clip.in) * part })),
    );
    const next: Record<string, string[]> = {};
    void readFrames(
      file,
      items.map((item) => item.time),
      120,
      controller.signal,
      (time, url) => {
        if (controller.signal.aborted) return;
        for (const item of items)
          if (item.time === time) next[item.id] = [...(next[item.id] || []), url];
        setImages({ ...next });
      },
    ).catch(() => {
      /* Filmstrips are optional; source playback remains available. */
    });
    return () => controller.abort();
  }, [file, signature]);
  return images;
}
