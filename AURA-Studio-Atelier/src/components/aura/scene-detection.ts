import { splitClip, clipDuration, type EditClip } from "./editor.ts";

export type SceneFrame = { time: number; histogram: Float32Array; luma: Float32Array };
export type SceneCut = { time: number; score: number; thumbnail?: string };
export type SceneSensitivity = "low" | "normal" | "high";

// Regional colour distributions tolerate motion better than raw pixel subtraction.
export function describeSceneFrame(data: Uint8ClampedArray, width: number, height: number, time: number): SceneFrame {
  const histogram = new Float32Array(12 * 24), luma = new Float32Array(12), counts = new Uint32Array(12);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const tile = Math.min(2, Math.floor(y * 3 / height)) * 4 + Math.min(3, Math.floor(x * 4 / width));
    const at = (y * width + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      const value = data[at + channel] * 7 / 255, bin = Math.floor(value), fraction = value - bin, base = tile * 24 + channel * 8;
      histogram[base + bin] += 1 - fraction;
      histogram[base + Math.min(7, bin + 1)] += fraction;
    }
    luma[tile] += (data[at] * .2126 + data[at + 1] * .7152 + data[at + 2] * .0722) / 255;
    counts[tile]++;
  }
  for (let tile = 0; tile < 12; tile++) {
    luma[tile] /= counts[tile] || 1;
    for (let bin = 0; bin < 24; bin++) histogram[tile * 24 + bin] /= counts[tile] || 1;
  }
  return { time, histogram, luma };
}
export function sceneDistance(a: SceneFrame, b: SceneFrame) {
  let colour = 0, light = 0;
  for (let i = 0; i < a.histogram.length; i++) colour += Math.abs(a.histogram[i] - b.histogram[i]);
  for (let i = 0; i < a.luma.length; i++) light += Math.abs(a.luma[i] - b.luma[i]);
  return .8 * colour / 72 + .2 * light / 12;
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] || 0;

export function findSceneCuts(frames: SceneFrame[], sensitivity: SceneSensitivity, minimum: number): SceneCut[] {
  if (frames.length < 3) return [];
  const threshold = { low: .4, normal: .27, high: .17 }[sensitivity];
  const distances = frames.map((frame, i) => i ? sceneDistance(frames[i - 1], frame) : 0);
  const candidates: SceneCut[] = [];
  for (let i = 1; i < frames.length - 1; i++) {
    const recent = distances.slice(Math.max(1, i - 16), i), base = median(recent);
    const deviation = median(recent.map((value) => Math.abs(value - base)));
    const adaptive = Math.max(threshold, base + Math.max(.08, deviation * 4));
    const score = distances[i];
    // A single-frame flash returns to the old scene; require persistent change.
    const flashReturn = i > 1 && distances[i - 1] >= adaptive && sceneDistance(frames[i - 2], frames[i]) < adaptive * .6;
    if (!flashReturn && score >= adaptive && sceneDistance(frames[i - 1], frames[i + 1]) >= adaptive * .7) {
      candidates.push({ time: frames[i].time, score });
    }
  }
  // Slow dissolves: compare a half-second window and place the cut at its centre.
  for (let i = 1; i < frames.length; i++) {
    let before = i - 1;
    while (before > 0 && frames[i].time - frames[before].time < .5) before--;
    if (i - before < 3 || distances[i] > threshold || distances[i] < .025) continue;
    const score = sceneDistance(frames[before], frames[i]);
    if (score < threshold * 1.25) continue;
    const time = (frames[before].time + frames[i].time) / 2;
    if (!candidates.some((cut) => Math.abs(cut.time - time) < .75)) candidates.push({ time, score });
  }
  // Strongest nearby boundary wins; keep both edge scenes above the minimum.
  const selected: SceneCut[] = [];
  for (const cut of candidates.sort((a, b) => b.score - a.score)) {
    if (cut.time - frames[0].time < minimum || frames.at(-1)!.time - cut.time < minimum) continue;
    if (selected.every((other) => Math.abs(other.time - cut.time) >= minimum)) selected.push(cut);
  }
  return selected.sort((a, b) => a.time - b.time);
}

// Source timestamps are mapped through every retained occurrence, including reordered/accelerated clips.
export function splitSourceScenes(clips: EditClip[], cuts: number[]): EditClip[] {
  const points: number[] = [];
  let at = 0;
  for (const clip of clips) {
    for (const source of cuts) if (Number.isFinite(source) && source > clip.in && source < clip.out)
      points.push(at + (source - clip.in) / clip.rate);
    at += clipDuration(clip);
  }
  return [...new Set(points)].sort((a, b) => a - b).reduce((next, time) => splitClip(next, time), clips);
}

const abortError = () => new DOMException("Aborted", "AbortError");
export function videoEvent(video: HTMLVideoElement, event: string, signal: AbortSignal, action: () => void) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const cleanup = () => { clearTimeout(timer); video.removeEventListener(event, done); video.removeEventListener("error", error); signal.removeEventListener("abort", aborted); };
    const done = () => { cleanup(); resolve(); };
    const error = () => { cleanup(); reject(new Error("Video kareleri okunamadı. MP4/H.264 video deneyin.")); };
    const aborted = () => { cleanup(); reject(abortError()); };
    const timer = setTimeout(error, 15000);
    video.addEventListener(event, done, { once: true }); video.addEventListener("error", error, { once: true }); signal.addEventListener("abort", aborted, { once: true });
    action();
  });
}
export async function detectVideoScenes(file: File, options: {
  sensitivity: SceneSensitivity; minimum: number; signal: AbortSignal;
  onProgress: (value: number) => void;
}): Promise<{ cuts: SceneCut[]; interval: number; duration: number }> {
  const video = document.createElement("video"), canvas = document.createElement("canvas"), url = URL.createObjectURL(file);
  video.muted = true; video.playsInline = true; video.preload = "auto";
  canvas.width = 96; canvas.height = 54;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) { URL.revokeObjectURL(url); throw new Error("Bu cihazda sahne analizi desteklenmiyor."); }
  try {
    await videoEvent(video, "loadeddata", options.signal, () => { video.src = url; video.load(); });
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 3600) throw new Error("Sahne analizi için en fazla 60 dakikalık video kullanın.");
    const duration = video.duration, interval = Math.max(.125, duration / 12000), frames: SceneFrame[] = [];
    const seek = async (time: number) => {
      if (options.signal.aborted) throw abortError();
      if (Math.abs(video.currentTime - time) > .001 || video.readyState < 2)
        await videoEvent(video, "seeked", options.signal, () => { video.currentTime = time; });
      context.drawImage(video, 0, 0, 96, 54);
    };
    for (let i = 0; i <= Math.ceil(duration / interval); i++) {
      const time = Math.min(duration - .001, i * interval);
      await seek(time);
      frames.push(describeSceneFrame(context.getImageData(0, 0, 96, 54).data, 96, 54, time));
      options.onProgress(.9 * time / duration);
      // Yield so cancellation and touch controls remain responsive on phones.
      if (i % 8 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    const cuts = findSceneCuts(frames, options.sensitivity, options.minimum);
    const thumbnail = document.createElement("canvas"); thumbnail.width = 160; thumbnail.height = 90;
    const thumbnailContext = thumbnail.getContext("2d")!;
    // Only result frames become JPEGs; a long video never retains full-resolution frames.
    for (let i = 0; i < Math.min(cuts.length, 120); i++) {
      await seek(Math.min(duration - .001, cuts[i].time + interval));
      const scale = Math.min(160 / video.videoWidth, 90 / video.videoHeight);
      thumbnailContext.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-preview") || "#1c2622";
      thumbnailContext.fillRect(0, 0, 160, 90);
      thumbnailContext.drawImage(video, (160 - video.videoWidth * scale) / 2, (90 - video.videoHeight * scale) / 2, video.videoWidth * scale, video.videoHeight * scale);
      cuts[i].thumbnail = thumbnail.toDataURL("image/jpeg", .7);
      options.onProgress(.9 + .1 * (i + 1) / Math.min(cuts.length, 120));
    }
    options.onProgress(1);
    return { cuts, interval, duration };
  } finally {
    video.pause(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url);
  }
}
