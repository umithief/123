import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { Play, X, Layers, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { ChoiceStrip } from "./choice-strip";
import { ui } from "./interface-copy";
import type { useEditor } from "./use-editor";
import { isPro } from "./pro-paint";
import { ProBadge } from "./pro-badge";
import {
  SCENE_TRANSITIONS,
  parseSceneTransition,
  sceneTransitionDuration,
  paintSceneTransition,
  type SceneTransition,
} from "./scene-transitions";

function TransitionPreview({
  type,
  before,
  after,
}: {
  type: SceneTransition["id"];
  before?: string;
  after?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = ref.current!;
    node.width = 120;
    node.height = 72;
    const ctx = node.getContext("2d")!,
      old = document.createElement("canvas"),
      next = document.createElement("canvas");
    const sources = [old, next];
    const colours = ["#285849", "#b29d75"];
    let alive = true,
      visible = false,
      raf = 0;
    sources.forEach((canvas, i) => {
      canvas.width = 120;
      canvas.height = 72;
      const context = canvas.getContext("2d")!;
      context.fillStyle = colours[i];
      context.fillRect(0, 0, 120, 72);
      context.fillStyle = "#fffefa";
      context.font = "24px sans-serif";
      context.fillText(i ? "B" : "A", 50, 44);
      const url = i ? after : before;
      if (url) {
        const image = new Image();
        image.onload = () => {
          if (!alive) return;
          const scale = Math.min(120 / image.width, 72 / image.height);
          context.fillStyle = "#1c2622";
          context.fillRect(0, 0, 120, 72);
          context.drawImage(
            image,
            (120 - image.width * scale) / 2,
            (72 - image.height * scale) / 2,
            image.width * scale,
            image.height * scale,
          );
        };
        image.src = url;
      }
    });
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    observer.observe(node);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      ctx.clearRect(0, 0, 120, 72);
      paintSceneTransition(
        ctx,
        old,
        next,
        type,
        reduced ? 0.5 : Math.min(1, (now % 1800) / 1200),
        120,
        72,
      );
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [type, before, after]);
  return <canvas ref={ref} aria-hidden="true" />;
}
export function TransitionPanel({
  editor: e,
  incomingId,
  onClose,
  onSelect,
  disabled,
  thumbnails,
  onPreview,
}: {
  editor: ReturnType<typeof useEditor>;
  incomingId: string | null;
  onClose: () => void;
  disabled: boolean;
  thumbnails: Record<string, string[]>;
  onPreview: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
}) {
  const [group, setGroup] = useState("Tümü"),
    [search, setSearch] = useState("");
  const index = e.project.clips.findIndex((c) => c.id === incomingId),
    incoming = e.project.clips[index],
    previous = e.project.clips[index - 1];
  const value = parseSceneTransition(incoming?.transition);
  useEffect(() => {
    if (incomingId && index < 1) onClose();
  }, [incomingId, index]);
  const set = (transition: SceneTransition) => {
    if (incoming && !disabled) e.changeClip(incoming.id, { transition });
  };
  const options = SCENE_TRANSITIONS.filter(
    (t) =>
      (group === "Tümü" || t.group === group) &&
      ui(t.label).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <Dialog.Root
      open={!!incomingId && index > 0}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content className="transition-dialog" aria-describedby="transition-description">
          <div className="transition-heading">
            <div>
              <Dialog.Title>
                {ui("Sahne geçişi")} {index} → {index + 1}
              </Dialog.Title>
              <Dialog.Description id="transition-description">
                {ui("Efekti seç, süresini ayarla ve önizle.")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <ChoiceStrip
            aria-label={ui("Sahne aralıkları")}
            value={incomingId ?? ""}
            className="transition-boundaries"
          >
            {e.project.clips.slice(1).map((clip, i) => (
              <button
                key={clip.id}
                type="button"
                aria-pressed={clip.id === incomingId}
                onClick={() => {
                  e.setSelected(clip.id);
                  onSelect(clip.id);
                }}
              >
                {i + 1} → {i + 2}
              </button>
            ))}
          </ChoiceStrip>
          <input
            className="studio-input"
            aria-label={ui("Geçiş ara")}
            placeholder={ui("Geçiş ara")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ChoiceStrip
            aria-label={ui("Geçiş kategorileri")}
            value={group}
            className="transition-categories"
          >
            {["Tümü", "Pro", ...new Set(SCENE_TRANSITIONS.map((t) => t.group))]
              .filter((g, i, all) => all.indexOf(g) === i)
              .map((g) => (
                <button
                  type="button"
                  key={g}
                  className={g === "Pro" ? "pro-chip" : undefined}
                  aria-pressed={g === group}
                  onClick={() => setGroup(g)}
                >
                  {ui(g)}
                </button>
              ))}
          </ChoiceStrip>
          <ChoiceStrip
            aria-label={ui("Sahne geçiş efektleri")}
            value={value.id}
            className="transition-gallery"
          >
            {options.map((effect) => (
              <button
                key={effect.id}
                type="button"
                data-pro={isPro(effect.id) || undefined}
                title={"description" in effect ? ui(effect.description) : undefined}
                aria-pressed={value.id === effect.id}
                disabled={disabled}
                onClick={() => set({ ...value, id: effect.id })}
              >
                {isPro(effect.id) && <ProBadge />}
                <TransitionPreview
                  type={effect.id}
                  before={thumbnails[previous?.id]?.at(-1)}
                  after={thumbnails[incoming?.id]?.[0]}
                />
                <span>{ui(effect.label)}</span>
              </button>
            ))}
          </ChoiceStrip>
          {!options.length && (
            <p className="editor-note" role="status">
              {ui("Bu aramada geçiş bulunamadı.")}
            </p>
          )}
          <div className="transition-duration">
            <label>
              {ui("Geçiş süresi")}
              <select
                aria-label={ui("Sahne geçiş süresi")}
                value={value.duration}
                disabled={disabled || value.id === "none"}
                onChange={(event) => set({ ...value, duration: Number(event.target.value) })}
              >
                {[...new Set([0.1, 0.2, 0.4, 0.6, 0.8, 1, 1.5, 2, value.duration])]
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n} {ui("sn")}
                    </option>
                  ))}
              </select>
            </label>
            <span>
              {ui("Etkin süre")}:{" "}
              {previous && incoming ? sceneTransitionDuration(previous, incoming).toFixed(2) : 0}{" "}
              {ui("sn")}
            </span>
          </div>
          <p className="editor-note">
            {ui(
              "Kısa kliplerde süre otomatik kısalır. Toplam video süresi ve ses zamanları değişmez.",
            )}
          </p>
          <div className="transition-actions">
            <Button
              disabled={disabled || value.id === "none" || e.transitionsBusy}
              onClick={() => {
                if (incoming) {
                  onClose();
                  void onPreview(incoming.id);
                }
              }}
            >
              <Play className="size-4" />
              {e.transitionsBusy ? ui("Görüntüler hazırlanıyor") : ui("Geçişi önizle")}
            </Button>
            <Button
              variant="outline"
              disabled={disabled || e.project.clips.length < 2}
              onClick={() =>
                e.commit({
                  ...e.project,
                  clips: e.project.clips.map((c, i) =>
                    i ? { ...c, transition: { ...value } } : c,
                  ),
                })
              }
            >
              <Layers className="size-4" />
              {ui("Tüm aralıklara uygula")}
            </Button>
          </div>
          <div className="transition-footer">
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() =>
                e.commit({
                  ...e.project,
                  clips: e.project.clips.map((c) => ({ ...c, transition: undefined })),
                })
              }
            >
              <Trash2 className="size-4" />
              {ui("Tüm geçişleri kaldır")}
            </Button>
            <Dialog.Close asChild>
              <Button variant="outline">{ui("Tamam")}</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
