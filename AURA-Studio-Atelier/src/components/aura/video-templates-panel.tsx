import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "../ui/button";
import { ChoiceStrip } from "./choice-strip";
import { ui } from "./interface-copy";
import { themeById } from "./palette";
import { ModePreview } from "./studio-panels";
import { VIDEO_FORMATS } from "./studio";
import { VIDEO_TEMPLATES, type VideoTemplate } from "./video-templates";

const CATEGORIES = ["Tümü", "Sosyal", "Müzik videosu", "Sinematik", "Sade"] as const;
// The thumbnails are spectrum stills; a CSS filter hints at the picture look.
const LOOK: Record<string, string> = {
  mono: "grayscale(1) contrast(1.1)",
  vintage: "sepia(0.45) saturate(0.85)",
  vivid: "saturate(1.45) contrast(1.05)",
  cool: "hue-rotate(15deg)",
  sepia: "sepia(0.8)",
};

function editTags(t: VideoTemplate) {
  const tags: string[] = [VIDEO_FORMATS.find((f) => f.id === t.format)!.ratio];
  if (t.edit.section) tags.push(`${t.edit.section} ${ui("sn")}`);
  if (t.edit.every) tags.push(`${t.edit.every} ${ui("vuruşta kesim")}`);
  return tags;
}

/** Ready-made looks for the whole video; applying one is a single tap. */
export function VideoTemplatesPanel({
  open,
  onClose,
  current,
  canEdit,
  canRevert,
  disabled,
  onApply,
  onRevert,
}: {
  open: boolean;
  onClose: () => void;
  /** Id of the template applied last, if the look still matches it. */
  current: string | null;
  /** The music could be analysed, so templates can also cut the video. */
  canEdit: boolean;
  canRevert: boolean;
  disabled: boolean;
  onApply: (template: VideoTemplate, withEdit: boolean) => void;
  onRevert: () => void;
}) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Tümü"),
    [withEdit, setWithEdit] = useState(true);
  const shown = VIDEO_TEMPLATES.filter((t) => category === "Tümü" || t.category === category);
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content
          className="transition-dialog video-templates-dialog"
          aria-describedby="video-templates-description"
        >
          <div className="transition-heading">
            <div>
              <Dialog.Title>{ui("Video şablonları")}</Dialog.Title>
              <Dialog.Description id="video-templates-description">
                {ui("Boyut, sahne, renk, altyazı ve kurgu tek dokunuşla hazır.")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <ChoiceStrip aria-label={ui("Şablon kategorisi")} value={category}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {ui(c)}
              </button>
            ))}
          </ChoiceStrip>
          <div className="video-template-grid" role="list">
            {shown.map((t) => (
              <button
                key={t.id}
                type="button"
                role="listitem"
                className="video-template"
                aria-pressed={current === t.id}
                disabled={disabled}
                onClick={() => onApply(t, withEdit && canEdit)}
              >
                <span
                  className="video-template-preview"
                  style={{ filter: LOOK[t.adjust.filter ?? ""] }}
                >
                  <ModePreview mode={t.mode} theme={themeById(t.theme)} />
                  {current === t.id && (
                    <span className="video-template-check" aria-hidden="true">
                      <Check className="size-4" />
                    </span>
                  )}
                </span>
                <strong>{ui(t.name)}</strong>
                <small>{ui(t.description)}</small>
                <span className="video-template-tags">
                  {editTags(t).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </span>
              </button>
            ))}
          </div>
          <label className="video-template-edit">
            <input
              type="checkbox"
              checked={withEdit && canEdit}
              disabled={!canEdit}
              onChange={(event) => setWithEdit(event.target.checked)}
            />
            <span>
              {ui("Kurguyu da uygula")}
              <small>
                {canEdit
                  ? ui("En iyi bölümü seçer, vuruşlardan keser; mevcut kesimlerin yerini alır.")
                  : ui("Müzik çözümlenemediği için yalnızca görünüm uygulanır.")}
              </small>
            </span>
          </label>
          <div className="video-template-footer">
            <Button variant="ghost" disabled={!canRevert || disabled} onClick={onRevert}>
              <RotateCcw className="size-4" />
              {ui("Şablondan önceki hâline dön")}
            </Button>
            <Button className="beat-split-apply" onClick={onClose}>
              {ui("Tamam")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
