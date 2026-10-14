import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useRef, useState } from "react";
import { Film, Images, Plus, X } from "lucide-react";
import { Button } from "../ui/button";
import { ChoiceStrip } from "./choice-strip";
import { ui } from "./interface-copy";
import type { MediaClip } from "./editor";
import { arrangedMedia, beatSlots, shuffledOrder, slideshowPictures } from "./timeline";

const EVERY = [
  { value: 1, label: "Her vuruş" },
  { value: 2, label: "2 vuruş" },
  { value: 4, label: "4 vuruş · 1 ölçü" },
  { value: 8, label: "8 vuruş · 2 ölçü" },
] as const;
const TRANSITIONS = [
  { id: "none", label: "Kesme" },
  { id: "fade", label: "Yumuşak" },
  { id: "zoom", label: "Zoom" },
  { id: "slide", label: "Kaydır" },
] as const;

/** Lays the project's pictures out on the music's beat grid in one step. */
export function BeatImagesPanel({
  open,
  onClose,
  media,
  thumbnail,
  marks,
  bpm,
  time,
  total,
  busy,
  disabled,
  onUpload,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  media: MediaClip[];
  /** Object URL of a picture's file, for the preview strip. */
  thumbnail: (asset: string) => string | undefined;
  /** Beat times on the timeline. */
  marks: number[];
  bpm: number | null;
  time: number;
  total: number;
  busy: boolean;
  disabled: boolean;
  onUpload: (files: File[]) => void;
  onApply: (media: MediaClip[], placed: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [every, setEvery] = useState<number>(4),
    [fromPlayhead, setFromPlayhead] = useState(false),
    [loop, setLoop] = useState(true),
    [shuffle, setShuffle] = useState(false),
    [transition, setTransition] = useState<MediaClip["transition"]>("fade"),
    [seed, setSeed] = useState(1);
  const pictures = useMemo(() => slideshowPictures(media), [media]);
  const from = fromPlayhead ? Math.min(time, Math.max(0, total - 0.2)) : 0;
  const slots = useMemo(
    () =>
      beatSlots(
        marks,
        every,
        from,
        total,
        pictures.length,
        loop,
        shuffle ? shuffledOrder(pictures.length, seed) : undefined,
      ),
    [marks, every, from, total, pictures.length, loop, shuffle, seed],
  );
  const beat = bpm ? 60 / bpm : 0.5,
    length = slots.length ? (slots.at(-1)!.end - slots[0].start) / slots.length : 0;
  function apply() {
    onApply(
      arrangedMedia(media, pictures, slots, transition, Math.min(0.4, beat / 2)),
      slots.length,
    );
    onClose();
  }
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content
          className="transition-dialog beat-split-dialog"
          aria-describedby="beat-images-description"
        >
          <div className="transition-heading">
            <div>
              <Dialog.Title>{ui("Görüntüleri vuruşlara yerleştir")}</Dialog.Title>
              <Dialog.Description id="beat-images-description">
                {marks.length
                  ? `${bpm ? `≈ ${bpm} BPM · ` : ""}${ui("Her görüntü müziğin vuruşunda değişir.")}`
                  : ui("Bu parçada vuruş bulunamadı.")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="beat-split-field">
            <span>
              {ui("Görüntüler")} · {pictures.length}
            </span>
            <div className="beat-images-strip" role="list" aria-label={ui("Görüntüler")}>
              {pictures.map((p, i) => {
                const url = p.kind === "image" ? thumbnail(p.asset) : undefined;
                return (
                  <span key={p.asset} role="listitem" title={p.name}>
                    {url ? (
                      <img src={url} alt="" />
                    ) : (
                      <Film className="size-5" aria-hidden="true" />
                    )}
                    <small>{i + 1}</small>
                  </span>
                );
              })}
              <button
                type="button"
                className="beat-images-add"
                disabled={busy || disabled}
                onClick={() => input.current?.click()}
              >
                <Plus className="size-5" />
                {ui("Ekle")}
              </button>
              <input
                ref={input}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                multiple
                hidden
                onChange={(event) => {
                  const files = [...(event.target.files || [])];
                  event.target.value = "";
                  if (files.length) onUpload(files);
                }}
              />
            </div>
            {!pictures.length && (
              <p className="editor-note">
                {ui("Fotoğraf veya kısa videolar ekleyin; sırayla vuruşlara yerleşir.")}
              </p>
            )}
          </div>
          <div className="beat-split-field">
            <span>{ui("Ne sıklıkla değişsin?")}</span>
            <ChoiceStrip aria-label={ui("Değişim sıklığı")} value={String(every)}>
              {EVERY.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={every === item.value}
                  onClick={() => setEvery(item.value)}
                >
                  {ui(item.label)}
                </button>
              ))}
            </ChoiceStrip>
          </div>
          <div className="beat-split-field">
            <span>{ui("Geçiş")}</span>
            <ChoiceStrip aria-label={ui("Görüntü geçişi")} value={transition}>
              {TRANSITIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={transition === item.id}
                  onClick={() => setTransition(item.id)}
                >
                  {ui(item.label)}
                </button>
              ))}
            </ChoiceStrip>
          </div>
          <div className="beat-images-options">
            <label>
              <input
                type="checkbox"
                checked={fromPlayhead}
                onChange={(event) => setFromPlayhead(event.target.checked)}
              />
              {ui("Oynatma başlığından başla")}
            </label>
            <label>
              <input
                type="checkbox"
                checked={loop}
                onChange={(event) => setLoop(event.target.checked)}
              />
              {ui("Görüntüler bitince başa dön")}
            </label>
            <label>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(event) => {
                  setShuffle(event.target.checked);
                  setSeed((s) => s + 1);
                }}
              />
              {ui("Karışık sıra")}
            </label>
          </div>
          <p className="beat-split-summary" role="status">
            {slots.length
              ? `${slots.length} ${ui("yerleşim")} · ${ui("her biri")} ≈ ${length.toFixed(1)} ${ui("sn")}`
              : ui("Yerleştirilecek görüntü yok.")}
          </p>
          {pictures.length > 0 && (
            <p className="editor-note">
              {ui("Görüntü satırı bu yerleşimle değişir; Geri al ile eski hâline dönebilirsiniz.")}
            </p>
          )}
          <Button
            className="beat-split-apply"
            disabled={disabled || busy || !slots.length}
            onClick={apply}
          >
            <Images className="size-4" />
            {ui("Vuruşlara yerleştir")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
