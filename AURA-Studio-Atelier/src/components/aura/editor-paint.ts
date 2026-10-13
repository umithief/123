import {
  frameAt,
  locateTime,
  clipDuration,
  type EditorProject,
  type MediaClip,
  type Overlay,
} from "./editor";
import type { MediaAsset } from "./use-editor";
import { CAPTION_FONTS } from "./captions";
import { paintVideoEffect } from "./video-effects";
import { videoMotionAt, motionIsActive } from "./video-motion";
import { paintVideoMotion } from "./video-motion-paint";
import { activeSceneTransition, paintSceneTransition } from "./scene-transitions";
const transitionOutgoing = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
const transitionIncoming = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
const scenes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
const mediaSurfaces = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function surface(
  cache: WeakMap<HTMLCanvasElement, HTMLCanvasElement>,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  let canvas = cache.get(ctx.canvas);
  if (!canvas) {
    canvas = document.createElement("canvas");
    cache.set(ctx.canvas, canvas);
  }
  if (canvas.width !== ctx.canvas.width || canvas.height !== ctx.canvas.height) {
    canvas.width = ctx.canvas.width;
    canvas.height = ctx.canvas.height;
  }
  const target = canvas.getContext("2d")!;
  target.setTransform(1, 0, 0, 1, 0, 0);
  target.clearRect(0, 0, canvas.width, canvas.height);
  target.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  return { canvas, context: target };
}
const keyed = new Map<
  string,
  { canvas: HTMLCanvasElement; stamp: number; color: string; tolerance: number }
>();
function keyedSource(
  media: MediaClip,
  asset: MediaAsset,
  width: number,
  height: number,
): CanvasImageSource {
  if (!media.keyTolerance) return asset.element;
  const stamp = asset.element instanceof HTMLVideoElement ? asset.element.currentTime : 0;
  let saved = keyed.get(media.asset);
  if (
    saved &&
    saved.stamp === stamp &&
    saved.color === media.keyColor &&
    saved.tolerance === media.keyTolerance
  )
    return saved.canvas;
  if (!saved) {
    if (keyed.size > 30) keyed.clear();
    saved = { canvas: document.createElement("canvas"), stamp: -1, color: "", tolerance: 0 };
    keyed.set(media.asset, saved);
  }
  const element = asset.element,
    w = element instanceof HTMLVideoElement ? element.videoWidth : element.naturalWidth,
    h = element instanceof HTMLVideoElement ? element.videoHeight : element.naturalHeight;
  const scale = Math.min(1, Math.max(width, height) / Math.max(w, h));
  saved.canvas.width = Math.max(1, Math.round(w * scale));
  saved.canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = saved.canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(element, 0, 0, saved.canvas.width, saved.canvas.height);
  const pixels = ctx.getImageData(0, 0, saved.canvas.width, saved.canvas.height),
    r = parseInt(media.keyColor.slice(1, 3), 16),
    g = parseInt(media.keyColor.slice(3, 5), 16),
    b = parseInt(media.keyColor.slice(5, 7), 16);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const distance = Math.hypot(pixels.data[i] - r, pixels.data[i + 1] - g, pixels.data[i + 2] - b);
    pixels.data[i + 3] *= Math.max(0, Math.min(1, (distance - media.keyTolerance) / 20));
  }
  ctx.putImageData(pixels, 0, 0);
  saved.stamp = stamp;
  saved.color = media.keyColor;
  saved.tolerance = media.keyTolerance;
  return saved.canvas;
}
function mediaImage(
  ctx: CanvasRenderingContext2D,
  media: MediaClip,
  asset: MediaAsset,
  w: number,
  h: number,
  time: number,
  hasNext: boolean,
) {
  const e = asset.element,
    sw = e instanceof HTMLVideoElement ? e.videoWidth : e.naturalWidth,
    sh = e instanceof HTMLVideoElement ? e.videoHeight : e.naturalHeight;
  if (!sw || !sh || (e instanceof HTMLVideoElement && e.readyState < 2)) return;
  const startProgress = Math.min(1, Math.max(0, (time - media.start) / media.transitionDuration));
  const endProgress = hasNext
    ? 1
    : Math.min(1, Math.max(0, (media.end - time) / media.transitionDuration));
  ctx.save();
  ctx.globalAlpha = media.opacity * (media.transition === "fade" ? startProgress * endProgress : 1);
  if (media.mask === "circle") {
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.clip();
  } else if (media.mask === "rounded") {
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, Math.min(w, h) * 0.12);
    ctx.clip();
  }
  if (media.transition === "slide") ctx.translate((1 - startProgress) * w, 0);
  const zoom = media.transition === "zoom" ? 1 + (1 - startProgress) * 0.25 : 1;
  const scale =
    (media.fit === "cover" ? Math.max(w / sw, h / sh) : Math.min(w / sw, h / sh)) * zoom;
  const source = keyedSource(media, asset, w, h);
  ctx.drawImage(source, (w - sw * scale) / 2, (h - sh * scale) / 2, sw * scale, sh * scale);
  ctx.restore();
}
export function paintEditorBase(
  ctx: CanvasRenderingContext2D,
  base: HTMLCanvasElement,
  project: EditorProject,
  assets: Map<string, MediaAsset>,
  time: number,
  w: number,
  h: number,
  reducedMotion = false,
  transitionFrames?: Map<string, HTMLImageElement>,
) {
  const transition = !reducedMotion ? activeSceneTransition(project.clips, time) : null;
  if (transition) {
    const outgoing = surface(transitionOutgoing, ctx, w, h),
      incoming = surface(transitionIncoming, ctx, w, h);
    const oldAssets = new Map(assets),
      source = project.media.find((m) => m.sourceVideo);
    const image = transitionFrames?.get(transition.previous.id);
    if (source && image && assets.has(source.asset))
      oldAssets.set(source.asset, { ...assets.get(source.asset)!, element: image });
    paintScene(
      outgoing.context,
      base,
      project,
      oldAssets,
      Math.max(0, transition.start - 0.001),
      w,
      h,
      reducedMotion,
    );
    paintScene(incoming.context, base, project, assets, time, w, h, reducedMotion);
    paintSceneTransition(
      ctx,
      outgoing.canvas,
      incoming.canvas,
      transition.incoming.transition!.id,
      transition.progress,
      w,
      h,
    );
    return;
  }
  const clip = locateTime(project.clips, time);
  const motion = clip
    ? videoMotionAt(clip.clip.motion, clip.local, clipDuration(clip.clip), reducedMotion)
    : null;
  if (motion && motionIsActive(motion)) {
    const scene = surface(scenes, ctx, w, h);
    paintScene(scene.context, base, project, assets, time, w, h, reducedMotion);
    ctx.save();
    ctx.fillStyle = "#08090b";
    ctx.fillRect(0, 0, w, h);
    paintVideoMotion(ctx, scene.canvas, motion, w, h, clip!.local);
    ctx.restore();
  } else paintScene(ctx, base, project, assets, time, w, h, reducedMotion);
}
function paintScene(
  ctx: CanvasRenderingContext2D,
  base: HTMLCanvasElement,
  project: EditorProject,
  assets: Map<string, MediaAsset>,
  time: number,
  w: number,
  h: number,
  reducedMotion: boolean,
) {
  const a = project.adjust;
  ctx.save();
  ctx.fillStyle = "#08090b";
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2);
  ctx.rotate((a.rotation * Math.PI) / 180);
  ctx.scale(a.zoom * (a.flipX ? -1 : 1), a.zoom * (a.flipY ? -1 : 1));
  ctx.translate(-w / 2, -h / 2);
  let filter = `brightness(${a.brightness}) contrast(${a.contrast}) saturate(${a.saturation}) blur(${a.blur}px)`;
  if (a.filter === "mono") filter += " grayscale(1)";
  if (a.filter === "sepia") filter += " sepia(0.8)";
  if (a.filter === "vintage") filter += " sepia(0.4) contrast(0.9) saturate(0.8)";
  if (a.filter === "cool") filter += " hue-rotate(15deg)";
  if (a.filter === "vivid") filter += " saturate(1.5) contrast(1.1)";
  ctx.filter = filter;
  const visible = project.media.filter(
    (c) => time >= c.start && time < c.end + c.transitionDuration && assets.has(c.asset),
  );
  if (!visible.length) {
    ctx.drawImage(base, 0, 0, w, h);
  } else {
    for (const c of visible) {
      const hasNext = project.media.some((m) => m.id !== c.id && Math.abs(m.start - c.end) < 0.1);
      if (time >= c.end && !hasNext) continue;
      const mediaMotion = c.sourceVideo
        ? null
        : videoMotionAt(c.motion, time - c.start, c.end - c.start, reducedMotion);
      if (mediaMotion && motionIsActive(mediaMotion)) {
        const scene = surface(mediaSurfaces, ctx, w, h);
        mediaImage(scene.context, c, assets.get(c.asset)!, w, h, time, hasNext);
        paintVideoMotion(ctx, scene.canvas, mediaMotion, w, h, time - c.start);
      } else mediaImage(ctx, c, assets.get(c.asset)!, w, h, time, hasNext);
    }
    if (project.showSpectrum) {
      ctx.globalCompositeOperation = "screen";
      ctx.drawImage(base, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
  }
  ctx.filter = "none";
  ctx.restore();
  if (a.warmth) {
    ctx.save();
    ctx.globalAlpha = Math.abs(a.warmth) * 0.2;
    ctx.fillStyle = a.warmth > 0 ? "#ee9b42" : "#398ddd";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (a.vignette) {
    ctx.save();
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.2,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65,
    );
    g.addColorStop(0, "transparent");
    g.addColorStop(1, `rgba(0,0,0,${a.vignette})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  paintVideoEffect(ctx, a, time, w, h, reducedMotion);
}
function shape(ctx: CanvasRenderingContext2D, kind: Overlay["kind"], size: number) {
  const s = size / 2;
  ctx.beginPath();
  if (kind === "heart") {
    ctx.moveTo(0, s);
    ctx.bezierCurveTo(-size, s * 0.1, -size, -s, 0, -s * 0.35);
    ctx.bezierCurveTo(size, -s, size, s * 0.1, 0, s);
  } else if (kind === "star") {
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? s * 0.45 : s;
      const x = Math.cos(angle) * r,
        y = Math.sin(angle) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  } else if (kind === "arrow") {
    ctx.moveTo(-s, -s * 0.25);
    ctx.lineTo(0, -s * 0.25);
    ctx.lineTo(0, -s * 0.75);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s * 0.75);
    ctx.lineTo(0, s * 0.25);
    ctx.lineTo(-s, s * 0.25);
    ctx.closePath();
  } else if (kind === "circle") ctx.arc(0, 0, s, 0, Math.PI * 2);
  else ctx.roundRect(-s, -s * 0.65, size, size * 0.65, 5);
  ctx.fill();
}
export function paintEditorLayers(
  ctx: CanvasRenderingContext2D,
  project: EditorProject,
  assets: Map<string, MediaAsset>,
  time: number,
  w: number,
  h: number,
  reducedMotion = false,
) {
  for (const layer of project.layers) {
    if (time < layer.start || time >= layer.end) continue;
    const frame = frameAt(layer, time),
      enter = Math.min(1, (time - layer.start) / 0.35),
      exit = Math.min(1, (layer.end - time) / 0.25),
      size = Math.min(w, h) * 0.17;
    const animation = reducedMotion ? "none" : layer.animation;
    const ease = 1 - Math.pow(1 - enter, 3);
    ctx.save();
    ctx.globalCompositeOperation = layer.blend;
    ctx.globalAlpha = frame.opacity * (animation === "fade" ? enter * exit : 1);
    ctx.translate(frame.x * w, frame.y * h + (animation === "slide" ? (1 - ease) * h * 0.15 : 0));
    ctx.rotate((frame.rotation * Math.PI) / 180);
    const scale =
      frame.scale *
      (animation === "pop"
        ? 0.75 + 0.25 * Math.sin((enter * Math.PI) / 2)
        : animation === "zoom-out"
          ? 1 + (1 - ease) * 0.25
          : 1);
    ctx.scale(scale, scale);
    if (animation === "elastic") {
      const spring = Math.sin(enter * Math.PI * 3) * (1 - enter);
      ctx.scale(1 + spring * 0.2, 1 - spring * 0.15);
    }
    if (animation === "swing") ctx.rotate(Math.sin(enter * Math.PI * 2) * (1 - enter) * 0.15);
    if (animation === "float") ctx.translate(0, Math.sin((time - layer.start) * 2.5) * size * 0.06);
    if (animation === "blur") {
      ctx.filter = `blur(${(1 - ease) * size * 0.1}px)`;
      ctx.globalAlpha *= ease;
    }
    if (animation === "wipe") {
      ctx.beginPath();
      ctx.rect(-w / 2, -h, w * ease, h * 2);
      ctx.clip();
    }
    ctx.fillStyle = layer.color;
    if (layer.kind === "text") {
      const text =
        animation === "typewriter"
          ? Array.from(layer.text)
              .slice(0, Math.ceil(enter * Array.from(layer.text).length))
              .join("")
          : layer.text;
      const fontSize = Math.min(w, h) * 0.065;
      ctx.font = `${layer.weight} ${fontSize}px ${CAPTION_FONTS[layer.font].family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines: string[] = [];
      for (const row of text.split("\n")) {
        let current = "";
        for (const word of row.split(/\s+/)) {
          const next = current ? current + " " + word : word;
          if (ctx.measureText(next).width > w * 0.75 && current) {
            lines.push(current);
            current = word;
          } else current = next;
        }
        lines.push(current);
      }
      lines.slice(0, 8).forEach((row, i) => {
        const y = (i - (Math.min(8, lines.length) - 1) / 2) * size * 0.48;
        if (layer.background) {
          ctx.fillStyle = "rgba(8,9,11,0.8)";
          const width = ctx.measureText(row).width;
          ctx.fillRect(-width / 2 - 8, y - size * 0.24, width + 16, size * 0.48);
          ctx.fillStyle = layer.color;
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        if (layer.textEffect === "extrude") {
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.65)";
          for (let n = 4; n > 0; n--)
            ctx.fillText(row, n * fontSize * 0.035, y + n * fontSize * 0.035);
          ctx.restore();
        }
        if (layer.textEffect === "neon") {
          ctx.shadowColor = layer.color;
          ctx.shadowBlur = fontSize * 0.65;
        }
        if (layer.textEffect === "gold") {
          const gold = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
          gold.addColorStop(0, "#fff5c2");
          gold.addColorStop(0.45, "#dfab46");
          gold.addColorStop(0.55, "#fff6d4");
          gold.addColorStop(1, "#ae6c20");
          ctx.fillStyle = gold;
        }
        ctx.strokeText(row, 0, y);
        ctx.fillText(row, 0, y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = layer.color;
      });
    } else if (layer.kind === "image") {
      const asset = assets.get(layer.asset ?? "");
      if (asset && asset.element instanceof HTMLImageElement) {
        const e = asset.element,
          ratio = e.width / e.height;
        ctx.drawImage(e, (-size * ratio) / 2, -size / 2, size * ratio, size);
      }
    } else shape(ctx, layer.kind, size);
    ctx.restore();
  }
}
