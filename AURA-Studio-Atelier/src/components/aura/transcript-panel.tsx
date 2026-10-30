import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { Captions, Eraser, Pause, Play, Scissors, TextSelect, Timer, X } from "lucide-react";
import { Button } from "../ui/button";
import { ui } from "./interface-copy";
import type { CaptionCue } from "./captions";
import type { EditClip } from "./editor";
import { formatTime } from "./studio-panels";
import { announceEdit } from "./edit-toast";
import {
  cutSourceRanges,
  isHesitation,
  keptWord,
  longPauses,
  rangesForWords,
  removedSeconds,
  transcriptWords,
} from "./transcript-edit";

const seconds = (n: number) => `${n.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn`;

/**
 * Text-based editing: the spoken words of the video, as text. Tap words to
 * select them and cut them out of the video; hesitations and long pauses
 * can be picked in one tap. Cut words stay visible, struck through.
 */
export function TranscriptPanel({
  open,
  onClose,
  cues,
  offset,
  clips,
  sourceTime,
  playing,
  disabled,
  onApply,
  onPlaySource,
  onPause,
  onCreateCaptions,
}: {
  open: boolean;
  onClose: () => void;
  cues: CaptionCue[];
  /** Caption delay in seconds. */
  offset: number;
  clips: EditClip[];
  /** Where the source is playing, in seconds. */
  sourceTime: number;
  playing: boolean;
  disabled: boolean;
  onApply: (clips: EditClip[]) => void;
  /** Plays the edit from the moment it reaches source second `start` until `end`. */
  onPlaySource: (start: number, end: number) => void;
  onPause: () => void;
  onCreateCaptions: () => void;
}) {
  const words = useMemo(() => transcriptWords(cues, offset), [cues, offset]);
  const kept = useMemo(
    () => new Set(words.filter((w) => keptWord(w, clips)).map((w) => w.id)),
    [words, clips],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [range, setRange] = useState(false);
  const [notice, setNotice] = useState("");
  const anchor = useRef<string | null>(null);
  const body = useRef<HTMLDivElement>(null);
  // A changed edit or caption set starts a fresh selection.
  useEffect(() => {
    setSelected(new Set());
    anchor.current = null;
  }, [cues, clips]);
  useEffect(() => {
    if (!open) setNotice("");
  }, [open]);
  const hesitations = words.filter((w) => kept.has(w.id) && isHesitation(w.text));
  const pauses = useMemo(() => longPauses(words, clips), [words, clips]);
  const pauseSeconds = useMemo(() => removedSeconds(clips, pauses), [clips, pauses]);
  const chosen = words.filter((w) => selected.has(w.id));
  const chosenRanges = rangesForWords(words, selected);
  const chosenSeconds = removedSeconds(clips, chosenRanges);
  const current = playing
    ? words.find((w) => kept.has(w.id) && sourceTime >= w.start && sourceTime < w.end)?.id
    : undefined;
  // The word being spoken stays in view while the edit plays.
  useEffect(() => {
    if (!current || !open) return;
    body.current
      ?.querySelector<HTMLElement>(`[data-word="${CSS.escape(current)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [current, open]);
  const approximate = words.some((w) => w.approximate);

  function toggle(id: string) {
    if (!kept.has(id)) return;
    setNotice("");
    const next = new Set(selected);
    if (range && anchor.current && anchor.current !== id) {
      const a = words.findIndex((w) => w.id === anchor.current),
        b = words.findIndex((w) => w.id === id);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++)
        if (kept.has(words[i].id)) next.add(words[i].id);
      anchor.current = null;
    } else {
      if (next.has(id)) next.delete(id);
      else next.add(id);
      anchor.current = id;
    }
    setSelected(next);
  }
  function cut(ranges: Array<[number, number]>, message: string) {
    if (disabled || !ranges.length) return;
    const next = cutSourceRanges(clips, ranges);
    if (next === null) {
      setNotice(
        ui("Bu kesim çok fazla parça oluşturuyor. Daha az kelime seç ya da bölüm bölüm kes."),
      );
      return;
    }
    if (next === clips) return;
    onPause();
    onApply(next);
    announceEdit(message);
    setSelected(new Set());
  }
  const cueWords = (cue: string) => words.filter((w) => w.cue === cue);
  const ordered = [...cues].sort((a, b) => a.start - b.start);
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content
          className="transition-dialog transcript-dialog"
          aria-describedby="transcript-description"
        >
          <div className="transition-heading">
            <div>
              <Dialog.Title>{ui("Metinle Kurgu")}</Dialog.Title>
              <Dialog.Description id="transcript-description">
                {ui(
                  "Konuşmayı yazı olarak düzenle: kelimelere dokunup seç, Kes ile videodan çıkar.",
                )}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          {!words.length ? (
            <div className="transcript-empty">
              <Captions className="size-7" aria-hidden="true" />
              <p>
                {ui(
                  "Metinle kurgu için önce konuşmanın yazıya dökülmesi gerekir. Altyazı aracında Oluştur ile konuşmayı otomatik yazıya dök ya da SRT dosyası ekle.",
                )}
              </p>
              <Button
                onClick={() => {
                  onClose();
                  onCreateCaptions();
                }}
              >
                <Captions className="size-4" />
                {ui("Altyazı oluştur")}
              </Button>
            </div>
          ) : (
            <>
              <div className="transcript-tools" role="group" aria-label={ui("Hızlı seçimler")}>
                <button
                  type="button"
                  disabled={disabled || !hesitations.length}
                  onClick={() => setSelected(new Set(hesitations.map((w) => w.id)))}
                >
                  <Eraser className="size-4" />
                  {ui("Duraksamaları seç")}
                  <small>{hesitations.length}</small>
                </button>
                <button
                  type="button"
                  disabled={disabled || pauseSeconds < 0.1}
                  onClick={() => cut(pauses, "Uzun duraklamalar kısaltıldı")}
                >
                  <Timer className="size-4" />
                  {ui("Uzun duraklamaları kısalt")}
                  {pauseSeconds >= 0.1 && <small>−{seconds(pauseSeconds)}</small>}
                </button>
                <button type="button" aria-pressed={range} onClick={() => setRange(!range)}>
                  <TextSelect className="size-4" />
                  {ui("Aralık seç")}
                </button>
              </div>
              {range && (
                <p className="transcript-hint">
                  {ui("Aralık: ilk kelimeye, sonra son kelimeye dokun.")}
                </p>
              )}
              <div className="transcript-body" ref={body}>
                {ordered.map((cue) => {
                  const list = cueWords(cue.id);
                  if (!list.length) return null;
                  return (
                    <p key={cue.id} className="transcript-line">
                      <button
                        type="button"
                        className="transcript-time"
                        aria-label={`${formatTime(list[0].start)} ${ui("noktasından oynat")}`}
                        onClick={() =>
                          playing
                            ? onPause()
                            : onPlaySource(list[0].start, Number.POSITIVE_INFINITY)
                        }
                      >
                        {formatTime(list[0].start)}
                      </button>
                      {list.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          className="transcript-word"
                          data-word={w.id}
                          data-removed={!kept.has(w.id) || undefined}
                          data-current={w.id === current || undefined}
                          data-hesitation={(kept.has(w.id) && isHesitation(w.text)) || undefined}
                          aria-pressed={selected.has(w.id)}
                          disabled={disabled || !kept.has(w.id)}
                          title={!kept.has(w.id) ? ui("Kesildi") : undefined}
                          onClick={() => toggle(w.id)}
                        >
                          {w.text}
                        </button>
                      ))}
                    </p>
                  );
                })}
              </div>
              {approximate && (
                <p className="transcript-hint">
                  {ui(
                    "Bazı altyazıların kelime süreleri tahmini; kesmeden önce seçimi dinlemen önerilir.",
                  )}
                </p>
              )}
              {notice && (
                <p className="editor-note" role="alert">
                  {notice}
                </p>
              )}
              <div className="transcript-footer">
                <span role="status">
                  {chosen.length
                    ? `${chosen.length} ${ui("kelime seçili")} · ${seconds(chosenSeconds)}`
                    : `${kept.size}/${words.length} ${ui("kelime videoda")}`}
                </span>
                <Button
                  variant="ghost"
                  disabled={!chosen.length}
                  aria-label={ui(playing ? "Durdur" : "Seçimi dinle")}
                  onClick={() =>
                    playing
                      ? onPause()
                      : onPlaySource(Math.max(0, chosen[0].start - 0.6), chosen.at(-1)!.end + 0.6)
                  }
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!chosen.length}
                  onClick={() => setSelected(new Set())}
                >
                  {ui("Temizle")}
                </Button>
                <Button
                  className="studio-primary"
                  disabled={disabled || !chosen.length}
                  onClick={() => cut(chosenRanges, "Seçili kelimeler kesildi")}
                >
                  <Scissors className="size-4" />
                  {ui("Kes")}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
