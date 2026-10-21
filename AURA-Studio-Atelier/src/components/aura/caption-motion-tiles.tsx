import { useEffect, useRef } from "react";
import { ui } from "./interface-copy";
import { ChoiceStrip } from "./choice-strip";
import {
  entranceFrame,
  exitFrame,
  loopFrame,
  REST,
  type CaptionInId,
  type CaptionLoopId,
  type CaptionOutId,
  type MotionFrame,
} from "./caption-motion";

export type MotionKind = "in" | "out" | "loop";
type Item = { id: string; label: string; description: string };

const CYCLE = 2.6;

/** The tile's frame `t` seconds into its preview cycle. */
function tileFrame(kind: MotionKind, id: string, t: number): MotionFrame {
  if (id === "none") return REST;
  const c = t % CYCLE;
  // A beat of nothing, arrive, then stay long enough to see where it landed.
  if (kind === "in") return entranceFrame(id as CaptionInId, Math.max(0, (c - 0.3) / 0.9));
  if (kind === "out")
    // Rest, leave, then stay gone for a moment before the next round.
    return c < 0.9 ? REST : exitFrame(id as CaptionOutId, (c - 0.9) / 0.9);
  return loopFrame(id as CaptionLoopId, t, 1, 1.2, 4);
}

function paintGlyph(
  ctx: CanvasRenderingContext2D,
  frame: MotionFrame,
  w: number,
  h: number,
  ink: string,
  accent: string,
) {
  ctx.clearRect(0, 0, w, h);
  const size = h * 0.42;
  ctx.save();
  ctx.font = `700 ${size}px "Outfit", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textWidth = ctx.measureText("Aa").width;
  if (frame.revealMode !== "none" && frame.reveal < 1) {
    const pad = size * 0.2,
      left = (w - textWidth) / 2 - pad,
      full = textWidth + pad * 2;
    ctx.beginPath();
    if (frame.revealMode === "left") ctx.rect(left, 0, full * frame.reveal, h);
    else if (frame.revealMode === "center")
      ctx.rect(left + (full * (1 - frame.reveal)) / 2, 0, full * frame.reveal, h);
    else ctx.rect(0, h / 2 + size * 0.6 - size * 1.2 * frame.reveal, w, size * 1.2 * frame.reveal);
    ctx.clip();
  }
  ctx.globalAlpha = Math.max(0, Math.min(1, frame.alpha));
  // Tiles are small: travel is shown at half scale so the glyph stays in view.
  ctx.translate(w / 2 + frame.x * size * 0.5, h / 2 + frame.y * size * 0.5);
  ctx.rotate(frame.rotate);
  if (frame.skew) ctx.transform(1, 0, frame.skew, 1, 0, 0);
  ctx.scale(
    Math.max(0.001, frame.scale * frame.scaleX),
    Math.max(0.001, frame.scale * frame.scaleY),
  );
  if (frame.blur > 0) ctx.filter = `blur(${frame.blur * size}px)`;
  if (frame.glow > 0) {
    ctx.shadowColor = accent;
    ctx.shadowBlur = size * (0.3 + frame.glow);
  }
  ctx.fillStyle = ink;
  ctx.fillText("Aa", 0, 0);
  ctx.restore();
}

/** A strip of In, Out or Loop presets; every tile plays its own motion. */
export function MotionTiles({
  kind,
  items,
  value,
  label,
  onPick,
}: {
  kind: MotionKind;
  items: readonly Item[];
  value: string;
  label: string;
  onPick: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const canvases = [...node.querySelectorAll<HTMLCanvasElement>("canvas[data-motion]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--color-ink").trim() || "#f4efe6";
    const accent = style.getPropertyValue("--color-accent").trim() || "#ff6b00";
    const start = performance.now();
    let frame = 0,
      visible = false;
    const draw = (now: number) => {
      const t = reduced.matches ? 0 : (now - start) / 1000;
      for (const canvas of canvases) {
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        const id = canvas.dataset.motion ?? "none";
        // With reduced motion each tile shows a still: the middle of its move.
        const still =
          kind === "in"
            ? entranceFrame(id as CaptionInId, 0.45)
            : kind === "out"
              ? exitFrame(id as CaptionOutId, 0.45)
              : loopFrame(id as CaptionLoopId, 0.4, 1, 1.2, 4);
        paintGlyph(
          ctx,
          reduced.matches ? still : tileFrame(kind, id, t),
          canvas.width,
          canvas.height,
          ink,
          accent,
        );
      }
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      draw(performance.now());
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restart();
    });
    observer.observe(node);
    reduced.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);
    restart();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", restart);
    };
  }, [kind, items]);
  return (
    <div ref={root}>
      <ChoiceStrip className="caption-motion-tiles" aria-label={label} value={value}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="caption-motion-tile"
            title={ui(item.description)}
            aria-pressed={value === item.id}
            onClick={() => onPick(item.id)}
          >
            <canvas data-motion={item.id} width={128} height={80} aria-hidden="true" />
            <span>{ui(item.label)}</span>
          </button>
        ))}
      </ChoiceStrip>
    </div>
  );
}
