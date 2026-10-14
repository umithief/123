import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { Drum, X } from "lucide-react";
import { Button } from "../ui/button";
import { ChoiceStrip } from "./choice-strip";
import { ui } from "./interface-copy";
import { clipDuration, type EditClip } from "./editor";
import { SCENE_TRANSITIONS, type SceneTransition } from "./scene-transitions";
import { beatCutTimes, splitAtTimes } from "./timeline";

export const MAX_CLIPS = 60;
const EVERY = [
  { value: 1, label: "Her vuruş" },
  { value: 2, label: "2 vuruş" },
  { value: 4, label: "4 vuruş · 1 ölçü" },
  { value: 8, label: "8 vuruş · 2 ölçü" },
] as const;

/** Cuts the selected clip or the whole video on the music's beat grid in one step. */
export function BeatSplitPanel({
  open,
  onClose,
  clips,
  selected,
  beats,
  bpm,
  disabled,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  clips: EditClip[];
  selected: string;
  beats: number[];
  bpm: number | null;
  disabled: boolean;
  onApply: (clips: EditClip[], added: number) => void;
}) {
  const [every, setEvery] = useState<number>(4),
    [scope, setScope] = useState<"clip" | "all">("all"),
    [transition, setTransition] = useState<SceneTransition["id"]>("none");
  const index = clips.findIndex((c) => c.id === selected),
    useClip = scope === "clip" && index >= 0;
  const range = useMemo(() => {
    let at = 0;
    for (let i = 0; i < clips.length; i++) {
      const length = clipDuration(clips[i]);
      if (useClip && i === index) return { from: at, to: at + length };
      at += length;
    }
    return { from: 0, to: at };
  }, [clips, index, useClip]);
  const times = useMemo(
    () => beatCutTimes(beats, clips, every, range.from, range.to),
    [beats, clips, every, range],
  );
  const room = Math.max(0, MAX_CLIPS - clips.length),
    count = Math.min(times.length, room),
    average = (range.to - range.from) / (count + 1);
  function apply() {
    // Short cuts get a quick transition that fits inside a beat.
    const result = splitAtTimes(
      clips,
      times,
      MAX_CLIPS,
      transition === "none"
        ? undefined
        : { id: transition, duration: bpm ? Math.min(0.5, 30 / bpm) : 0.3 },
    );
    if (result.added) onApply(result.clips, result.added);
    onClose();
  }
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content
          className="transition-dialog beat-split-dialog"
          aria-describedby="beat-split-description"
        >
          <div className="transition-heading">
            <div>
              <Dialog.Title>{ui("Vuruşlara böl")}</Dialog.Title>
              <Dialog.Description id="beat-split-description">
                {beats.length
                  ? `${bpm ? `≈ ${bpm} BPM · ` : ""}${beats.length} ${ui("vuruş bulundu")}`
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
            <span>{ui("Nereyi bölelim?")}</span>
            <ChoiceStrip aria-label={ui("Bölme alanı")} value={useClip ? "clip" : "all"}>
              <button type="button" aria-pressed={!useClip} onClick={() => setScope("all")}>
                {ui("Tüm video")}
              </button>
              <button
                type="button"
                aria-pressed={useClip}
                disabled={index < 0}
                onClick={() => setScope("clip")}
              >
                {index >= 0 ? `${ui("Seçili klip")} ${index + 1}` : ui("Seçili klip")}
              </button>
            </ChoiceStrip>
          </div>
          <div className="beat-split-field">
            <span>{ui("Ne sıklıkla?")}</span>
            <ChoiceStrip aria-label={ui("Kesim sıklığı")} value={String(every)}>
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
          <label className="beat-split-field">
            <span>{ui("Kesimlerde geçiş")}</span>
            <select
              className="studio-input"
              value={transition}
              onChange={(event) => setTransition(event.target.value as SceneTransition["id"])}
            >
              {SCENE_TRANSITIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {ui(t.label)}
                </option>
              ))}
            </select>
          </label>
          <p className="beat-split-summary" role="status">
            {count
              ? `${count} ${ui("kesim eklenecek")} · ${ui("parçalar")} ≈ ${average.toFixed(1)} ${ui("sn")}`
              : ui("Bu aralıkta eklenecek kesim yok.")}
          </p>
          {times.length > room && (
            <p className="editor-note">
              {room
                ? `${ui("Bir videoda en fazla 60 parça olabilir; ilk")} ${room} ${ui("kesim eklenecek. Tümü için daha seyrek bir aralık seçin.")}`
                : ui(
                    "Bir videoda en fazla 60 parça olabilir. Önce bazı kesimleri birleştirin veya silin.",
                  )}
            </p>
          )}
          <Button className="beat-split-apply" disabled={disabled || !count} onClick={apply}>
            <Drum className="size-4" />
            {ui("Vuruşlara böl")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
