import type { EditClip } from "./editor.ts";
import { PRO_TRANSITIONS, paintProTransition } from "./pro-transitions.ts";
import { isPro } from "./pro-paint.ts";
export const SCENE_TRANSITIONS = [
  { id: "none", label: "Yok", group: "Temel" },
  // AURA Pro: premium transitions, first in the list and in their own collection.
  ...PRO_TRANSITIONS.map((t) => ({ ...t, group: "Pro" as const })),
  { id: "dissolve", label: "Çapraz çözülme", group: "Temel" },
  { id: "fade-black", label: "Siyaha geçiş", group: "Temel" },
  { id: "fade-white", label: "Beyaza geçiş", group: "Işık" },
  { id: "wipe-left", label: "Sola sil", group: "Kaydırma" },
  { id: "wipe-right", label: "Sağa sil", group: "Kaydırma" },
  { id: "slide-left", label: "Sola it", group: "Kaydırma" },
  { id: "slide-up", label: "Yukarı it", group: "Kaydırma" },
  { id: "zoom", label: "Zoom geçişi", group: "Hareket" },
  { id: "blur", label: "Bulanık çözülme", group: "Hareket" },
  { id: "iris", label: "Dairesel açılma", group: "Maske" },
  { id: "flash", label: "Işık çakması", group: "Işık" },
] as const;
export type SceneTransition = { id: (typeof SCENE_TRANSITIONS)[number]["id"]; duration: number };
export function parseSceneTransition(value: unknown): SceneTransition {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: SCENE_TRANSITIONS.some((t) => t.id === v.id) ? (v.id as SceneTransition["id"]) : "none",
    duration:
      typeof v.duration === "number" && Number.isFinite(v.duration)
        ? Math.min(2, Math.max(0.1, v.duration))
        : 0.6,
  };
}
const length = (c: EditClip) => (c.out - c.in) / c.rate;
export function sceneTransitionDuration(previous: EditClip, incoming: EditClip) {
  return Math.min(
    parseSceneTransition(incoming.transition).duration,
    length(previous) / 2,
    length(incoming) / 2,
  );
}
export function activeSceneTransition(clips: EditClip[], time: number) {
  let at = 0;
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i],
      duration = length(clip);
    if (i > 0 && clip.transition?.id && clip.transition.id !== "none") {
      const window = sceneTransitionDuration(clips[i - 1], clip);
      if (time >= at && time < at + window && window > 0)
        return {
          previous: clips[i - 1],
          incoming: clip,
          start: at,
          duration: window,
          progress: (time - at) / window,
        };
    }
    at += duration;
  }
  return null;
}
export function paintSceneTransition(
  ctx: CanvasRenderingContext2D,
  outgoing: CanvasImageSource,
  incoming: CanvasImageSource,
  type: SceneTransition["id"],
  progress: number,
  w: number,
  h: number,
) {
  if (isPro(type)) {
    paintProTransition(ctx, outgoing, incoming, type, progress, w, h);
    return;
  }
  const p = Math.max(0, Math.min(1, progress)),
    ease = p * p * (3 - 2 * p);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.drawImage(outgoing, 0, 0, w, h);
  if (type === "fade-black" || type === "fade-white") {
    const white = type !== "fade-black";
    if (p >= 0.5) ctx.drawImage(incoming, 0, 0, w, h);
    ctx.globalAlpha = 1 - Math.abs(p * 2 - 1);
    ctx.fillStyle = white ? "#ffffff" : "#08090b";
    ctx.fillRect(0, 0, w, h);
  } else if (type === "flash") {
    ctx.globalAlpha = ease;
    ctx.drawImage(incoming, 0, 0, w, h);
    ctx.globalAlpha = Math.max(0, 1 - Math.abs(p - 0.35) / 0.2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
  } else if (type === "wipe-left" || type === "wipe-right") {
    ctx.beginPath();
    ctx.rect(type === "wipe-left" ? w * (1 - ease) : 0, 0, w * ease, h);
    ctx.clip();
    ctx.drawImage(incoming, 0, 0, w, h);
  } else if (type === "slide-left" || type === "slide-up") {
    ctx.clearRect(0, 0, w, h);
    if (type === "slide-left") {
      ctx.drawImage(outgoing, -w * ease, 0, w, h);
      ctx.drawImage(incoming, w * (1 - ease), 0, w, h);
    } else {
      ctx.drawImage(outgoing, 0, -h * ease, w, h);
      ctx.drawImage(incoming, 0, h * (1 - ease), w, h);
    }
  } else if (type === "iris") {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, (Math.hypot(w, h) / 2) * ease, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(incoming, 0, 0, w, h);
  } else {
    if (type === "blur") ctx.filter = `blur(${Math.sin(p * Math.PI) * Math.min(w, h) * 0.025}px)`;
    if (type === "zoom") {
      const outScale = 1 + ease * 0.2;
      ctx.drawImage(
        outgoing,
        (w * (1 - outScale)) / 2,
        (h * (1 - outScale)) / 2,
        w * outScale,
        h * outScale,
      );
      const inScale = 1.2 - ease * 0.2;
      ctx.globalAlpha = ease;
      ctx.drawImage(
        incoming,
        (w * (1 - inScale)) / 2,
        (h * (1 - inScale)) / 2,
        w * inScale,
        h * inScale,
      );
    } else {
      ctx.globalAlpha = type === "none" ? 1 : ease;
      ctx.drawImage(incoming, 0, 0, w, h);
    }
  }
  ctx.restore();
}
