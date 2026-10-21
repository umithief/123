import { useEffect, useRef, useState } from "react";
import { Ban } from "lucide-react";
import { ui } from "./interface-copy";
import { ChoiceStrip } from "./choice-strip";
import { DEFAULT_ADJUST, VIDEO_EFFECTS, type Adjustment } from "./editor";
import { paintVideoEffect } from "./video-effects";
import { isPro } from "./pro-paint";
import { ProBadge } from "./pro-badge";

const TILE_W = 96,
  TILE_H = 128;

/** A still of the current preview (or a warm gradient) to show each look on. */
function useSample() {
  const [sample, setSample] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const next = document.createElement("canvas");
    next.width = TILE_W;
    next.height = TILE_H;
    const ctx = next.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, TILE_H);
    g.addColorStop(0, "#233456");
    g.addColorStop(0.6, "#e07a4c");
    g.addColorStop(1, "#1d1218");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TILE_W, TILE_H);
    const sun = ctx.createRadialGradient(60, 76, 0, 60, 76, 30);
    sun.addColorStop(0, "#fffbe6");
    sun.addColorStop(1, "rgba(255,210,140,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, TILE_W, TILE_H);
    const preview = document.querySelector<HTMLCanvasElement>(".canvas-frame canvas");
    if (preview?.width && preview.height) {
      try {
        const scale = Math.max(TILE_W / preview.width, TILE_H / preview.height);
        ctx.drawImage(
          preview,
          (TILE_W - preview.width * scale) / 2,
          (TILE_H - preview.height * scale) / 2,
          preview.width * scale,
          preview.height * scale,
        );
      } catch {
        /* keep the gradient */
      }
    }
    setSample(next);
  }, []);
  return sample;
}

function EffectTile({
  sample,
  id,
  animated,
}: {
  sample: HTMLCanvasElement | null;
  id: Adjustment["effect"];
  animated: boolean;
}) {
  const node = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = node.current,
      ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !sample) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0,
      visible = false,
      last = 0;
    const started = performance.now();
    const draw = (now: number) => {
      if (now - last > 80 || !animated) {
        last = now;
        ctx.clearRect(0, 0, TILE_W, TILE_H);
        ctx.drawImage(sample, 0, 0);
        paintVideoEffect(
          ctx,
          { ...DEFAULT_ADJUST, effect: id, effectAmount: 0.85 },
          animated && !reduce ? (now - started) / 1000 : 1.5,
          TILE_W,
          TILE_H,
          reduce,
        );
      }
      if (animated && visible && !reduce && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) draw(performance.now());
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [sample, id, animated]);
  return (
    <span className="effect-tile-picture">
      <canvas ref={node} width={TILE_W} height={TILE_H} aria-hidden="true" />
      {id === "none" && <Ban className="size-6" />}
    </span>
  );
}

/** Image effects as live picture tiles; AURA Pro looks lead with a gold mark. */
export function EffectGallery({
  value,
  onChange,
}: {
  value: Adjustment["effect"];
  onChange: (effect: Adjustment["effect"]) => void;
}) {
  const sample = useSample();
  const [group, setGroup] = useState<"all" | "pro">("all");
  const items = [
    VIDEO_EFFECTS[0],
    ...VIDEO_EFFECTS.filter((e) => isPro(e.id)),
    ...VIDEO_EFFECTS.filter((e) => e.id !== "none" && !isPro(e.id)),
  ].filter((e) => group === "all" || isPro(e.id) || e.id === "none");
  return (
    <section className="effect-gallery-wrap" aria-label={ui("Görüntü efekti")}>
      <div className="effect-gallery-head">
        <h4>{ui("Görüntü efekti")}</h4>
        <ChoiceStrip aria-label={ui("Efekt koleksiyonu")} value={group} className="choice-chips">
          <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>
            {ui("Tümü")}
          </button>
          <button
            type="button"
            className="pro-chip"
            aria-pressed={group === "pro"}
            onClick={() => setGroup("pro")}
          >
            {ui("Pro")}
          </button>
        </ChoiceStrip>
      </div>
      <ChoiceStrip aria-label={ui("Görüntü efektleri")} value={value} className="effect-gallery">
        {items.map((effect) => (
          <button
            key={effect.id}
            type="button"
            className="effect-tile"
            data-pro={isPro(effect.id) || undefined}
            aria-pressed={value === effect.id}
            title={ui(effect.description)}
            onClick={() => onChange(effect.id)}
          >
            <EffectTile sample={sample} id={effect.id} animated={value === effect.id} />
            {isPro(effect.id) && <ProBadge />}
            <span>{ui(effect.label)}</span>
          </button>
        ))}
      </ChoiceStrip>
    </section>
  );
}
