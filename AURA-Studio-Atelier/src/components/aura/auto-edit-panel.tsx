import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useRef } from "react";
import { Clapperboard, RotateCcw, X } from "lucide-react";
import { Button } from "../ui/button";
import { ui } from "./interface-copy";
import { clipDuration, type EditClip } from "./editor";
import { AUTO_EDITS, autoEdit, type AutoEditId } from "./auto-edits";

/** A strip of the edit's shots: width is length, marks show the hits. */
function CutMap({ clips }: { clips: EditClip[] }) {
  return (
    <span className="auto-edit-map" aria-hidden="true">
      {clips.map((c) => (
        <i
          key={c.id}
          style={{ flexGrow: clipDuration(c) }}
          data-hit={c.transition?.id === "flash" ? "flash" : c.motion ? "motion" : undefined}
        />
      ))}
    </span>
  );
}

/** One-tap professional edits built from the song's own structure. */
export function AutoEditPanel({
  open,
  onClose,
  clips,
  duration,
  peaks,
  beats,
  disabled,
  onApply,
  onPlay,
}: {
  open: boolean;
  onClose: () => void;
  clips: EditClip[];
  /** Source length in seconds. */
  duration: number;
  /** Source loudness over `duration` (empty until the music is read). */
  peaks: number[];
  /** Beat grid in source seconds. */
  beats: number[];
  disabled: boolean;
  onApply: (clips: EditClip[]) => void;
  /** Plays the new edit from its start. */
  onPlay: () => void;
}) {
  // Recipes always start from the edit as it was before the first one, so
  // trying several never stacks them; the last result can be taken back.
  const session = useRef<{ before: EditClip[]; result: EditClip[]; id: AutoEditId } | null>(null);
  const last = session.current && session.current.result === clips ? session.current : null;
  const base = (last?.before ?? clips)[0];
  const edits = useMemo(
    () =>
      base
        ? AUTO_EDITS.map((recipe) => ({
            recipe,
            edit: autoEdit(recipe.id, base, duration, peaks, beats),
          }))
        : [],
    [base, duration, peaks, beats],
  );
  const ready = peaks.length > 0;
  function apply(id: AutoEditId, next: EditClip[]) {
    session.current = { before: last?.before ?? clips, result: next, id };
    onApply(next);
    onClose();
    onPlay();
  }
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content
          className="transition-dialog auto-edit-dialog"
          aria-describedby="auto-edit-description"
        >
          <div className="transition-heading">
            <div>
              <Dialog.Title>{ui("Oto Kurgu")}</Dialog.Title>
              <Dialog.Description id="auto-edit-description">
                {ui(
                  "Tek dokunuşla profesyonel kısa kurgu: doğru an, vuruşta kesimler, geçişler ve final. Sonuç hemen oynar.",
                )}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          {!ready && (
            <p className="editor-note" role="status">
              {ui("Müzik çözümlenince kullanılabilir. Biraz bekleyip yeniden açın.")}
            </p>
          )}
          <div className="auto-edit-grid" role="list">
            {edits.map(({ recipe, edit }) => (
              <button
                key={recipe.id}
                type="button"
                role="listitem"
                className="auto-edit-card"
                data-recipe={recipe.id}
                aria-pressed={last?.id === recipe.id}
                disabled={disabled || !edit}
                onClick={() => edit && apply(recipe.id, edit.clips)}
              >
                <span className="auto-edit-name">
                  <Clapperboard className="size-4" aria-hidden="true" />
                  {ui(recipe.name)}
                </span>
                <small>{ui(recipe.description)}</small>
                {edit && <CutMap clips={edit.clips} />}
                <span className="auto-edit-meta">
                  {edit
                    ? `${edit.length.toFixed(0)} ${ui("sn")} · ${edit.clips.length} ${ui("çekim")}`
                    : ui("Hazırlanıyor")}
                </span>
              </button>
            ))}
          </div>
          <div className="video-template-footer">
            <Button
              variant="ghost"
              disabled={!last || disabled}
              onClick={() => {
                if (!last) return;
                session.current = null;
                onApply(last.before);
              }}
            >
              <RotateCcw className="size-4" />
              {ui("Oto kurgudan önceki hâline dön")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
