import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { History, Redo2 } from "lucide-react";
import { Button } from "../ui/button";
import { ui } from "./interface-copy";
import type { EditorProject } from "./editor";
import type { CaptionCue, CaptionPosition } from "./captions";
import { redoable } from "./history-clock";
import { describeCaptions, describeEdit, type StepName } from "./history-describe";

type EditStep = { project: EditorProject; at: number };
type CaptionStep = { cues: CaptionCue[]; pos: CaptionPosition | null; at: number };
type Row = { at: number; name: StepName };

const named = (name: StepName) =>
  name.detail ? `${ui(name.text)}: ${ui(name.detail)}` : ui(name.text);

/**
 * Every step of the edit by name, newest first. Tapping a step brings the
 * project back to how it was right after that step (undone steps can be
 * brought back the same way until a new edit is made).
 */
export function HistoryPanel({
  project,
  editPast,
  editFuture,
  cues,
  position,
  captionPast,
  captionFuture,
  disabled,
  onJump,
}: {
  project: EditorProject;
  editPast: EditStep[];
  editFuture: EditStep[];
  cues: CaptionCue[];
  position: CaptionPosition | null;
  captionPast: CaptionStep[];
  captionFuture: CaptionStep[];
  disabled: boolean;
  /** Negative: that many undos; positive: that many redos. */
  onJump: (steps: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const done: Row[] = [],
    undone: Row[] = [];
  if (open) {
    editPast.forEach((step, i) =>
      done.push({
        at: step.at,
        name: describeEdit(step.project, editPast[i + 1]?.project ?? project),
      }),
    );
    captionPast.forEach((step, i) => {
      const next = captionPast[i + 1];
      done.push({
        at: step.at,
        name: describeCaptions(step, next ?? { cues, pos: position }),
      });
    });
    done.sort((a, b) => a.at - b.at);
    const editRedo = editFuture.filter((f) => redoable(f.at)),
      captionRedo = captionFuture.filter((f) => redoable(f.at));
    editRedo.forEach((f, i) =>
      undone.push({
        at: f.at,
        name: describeEdit(i ? editRedo[i - 1].project : project, f.project),
      }),
    );
    captionRedo.forEach((f, i) =>
      undone.push({
        at: f.at,
        name: describeCaptions(i ? captionRedo[i - 1] : { cues, pos: position }, f),
      }),
    );
    // Redo brings back the most recently undone step first.
    undone.sort((a, b) => b.at - a.at);
  }
  const jump = (steps: number) => {
    setOpen(false);
    onJump(steps);
  };
  const empty = !editPast.length && !captionPast.length && !undone.length;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          className="history-button"
          disabled={disabled}
          aria-label={ui("Düzenleme geçmişi")}
          title={ui("Düzenleme geçmişi")}
        >
          <History className="size-4" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="studio-popover history-menu"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <p>{ui("Düzenleme geçmişi")}</p>
          {empty ? (
            <p className="history-empty">{ui("Henüz bir düzenleme yok.")}</p>
          ) : (
            <ol>
              {[...undone].reverse().map((row, i, list) => (
                <li key={`u${row.at}`}>
                  <button
                    type="button"
                    className="history-row"
                    data-state="undone"
                    onClick={() => jump(list.length - i)}
                  >
                    <Redo2 className="size-3.5" aria-hidden="true" />
                    <span>{named(row.name)}</span>
                  </button>
                </li>
              ))}
              {[...done].reverse().map((row, i) => (
                <li key={`d${row.at}`}>
                  <button
                    type="button"
                    className="history-row"
                    data-state={i === 0 ? "current" : "done"}
                    aria-current={i === 0 ? "step" : undefined}
                    disabled={i === 0}
                    onClick={() => jump(-i)}
                  >
                    <span>{named(row.name)}</span>
                    {i === 0 && <small>{ui("Şu an")}</small>}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="history-row"
                  data-state={done.length ? "done" : "current"}
                  aria-current={done.length ? undefined : "step"}
                  disabled={!done.length}
                  onClick={() => jump(-done.length)}
                >
                  <span>{ui("Başlangıç")}</span>
                  {!done.length && <small>{ui("Şu an")}</small>}
                </button>
              </li>
            </ol>
          )}
          <small className="history-note">
            {ui(
              "Bir adıma dokun: proje o adımdaki hâline döner. Yeni bir düzenleme, geri alınanları siler.",
            )}
          </small>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
