import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRightLeft,
  AudioWaveform,
  Drum,
  Flame,
  Images,
  ScissorsLineDashed,
  Sunrise,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { ui } from "./interface-copy";
import type { EditClip } from "./editor";
import {
  loudestWindow,
  sectionClips,
  softEdges,
  soundRanges,
  transitionEverywhere,
  trimmedEdges,
  withoutSilences,
} from "./quick-edits";

const SPANS = [15, 30, 60] as const;
const seconds = (n: number) => `${n.toFixed(1)} ${ui("sn")}`;

function Card({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section className="quick-tool">
      <span className="quick-tool-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="quick-tool-actions">{children}</div>
    </section>
  );
}

/** One-tap edits; each is a single undo step. */
export function QuickToolsPanel({
  open,
  onClose,
  clips,
  duration,
  peaks,
  beats,
  disabled,
  onApply,
  onBeatSplit,
  onBeatImages,
}: {
  open: boolean;
  onClose: () => void;
  clips: EditClip[];
  /** Source length in seconds. */
  duration: number;
  /** Source loudness bars over `duration` (empty when it could not be read). */
  peaks: number[];
  /** Beat grid in source seconds. */
  beats: number[];
  disabled: boolean;
  onApply: (clips: EditClip[]) => void;
  onBeatSplit: () => void;
  onBeatImages: () => void;
}) {
  const ranges = useMemo(() => soundRanges(peaks, duration), [peaks, duration]);
  const silences = useMemo(() => withoutSilences(clips, ranges), [clips, ranges]);
  const edges = useMemo(() => {
    const next = trimmedEdges(clips, ranges);
    return {
      clips: next,
      head: next[0] ? next[0].in - clips[0].in : 0,
      tail: next.length ? clips.at(-1)!.out - next.at(-1)!.out : 0,
    };
  }, [clips, ranges]);
  const heard = peaks.length > 0;
  function apply(next: EditClip[]) {
    onApply(next);
    onClose();
  }
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="atelier-dialog-overlay" />
        <Dialog.Content
          className="transition-dialog quick-tools-dialog"
          aria-describedby="quick-tools-description"
        >
          <div className="transition-heading">
            <div>
              <Dialog.Title>{ui("Hazır araçlar")}</Dialog.Title>
              <Dialog.Description id="quick-tools-description">
                {ui("Tek dokunuşla düzenle; her biri Geri al ile tek adımda geri alınır.")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <Card
            icon={<Flame className="size-5" />}
            title={ui("En iyi bölüm")}
            text={ui(
              "Şarkının en güçlü kısmını Reels, TikTok veya Shorts için seçer; mevcut kesimlerin yerini alır.",
            )}
          >
            {SPANS.map((span) => {
              const start = heard ? loudestWindow(peaks, duration, span, beats) : null;
              return (
                <Button
                  key={span}
                  variant="ghost"
                  disabled={disabled || start === null}
                  onClick={() => start !== null && apply(sectionClips(clips, start, span))}
                >
                  {span} {ui("sn")}
                </Button>
              );
            })}
          </Card>
          <Card
            icon={<Drum className="size-5" />}
            title={ui("Vuruşlara böl")}
            text={ui("Videoyu müziğin vuruşlarından keser.")}
          >
            <Button
              variant="ghost"
              disabled={disabled || !beats.length}
              onClick={() => {
                onClose();
                onBeatSplit();
              }}
            >
              {ui("Aç")}
            </Button>
          </Card>
          <Card
            icon={<Images className="size-5" />}
            title={ui("Görüntüleri vuruşlara yerleştir")}
            text={ui("Fotoğraflar müziğin vuruşunda sırayla değişir.")}
          >
            <Button
              variant="ghost"
              disabled={disabled || !beats.length}
              onClick={() => {
                onClose();
                onBeatImages();
              }}
            >
              {ui("Aç")}
            </Button>
          </Card>
          <Card
            icon={<ScissorsLineDashed className="size-5" />}
            title={ui("Sessiz yerleri kes")}
            text={
              !heard
                ? ui("Ses okunamadığı için kullanılamıyor.")
                : silences.removed >= 0.2
                  ? `${ui("Konuşma ve vlog için:")} ${seconds(silences.removed)} ${ui("sessizlik çıkarılır.")}`
                  : ui("Çıkarılacak sessizlik bulunamadı.")
            }
          >
            <Button
              variant="ghost"
              disabled={disabled || silences.removed < 0.2}
              onClick={() => apply(silences.clips)}
            >
              {ui("Kes")}
            </Button>
          </Card>
          <Card
            icon={<AudioWaveform className="size-5" />}
            title={ui("Baştaki ve sondaki boşluğu kırp")}
            text={
              edges.head + edges.tail >= 0.1
                ? `${ui("Baştan")} ${seconds(edges.head)}, ${ui("sondan")} ${seconds(edges.tail)} ${ui("sessizlik kırpılır.")}`
                : ui("Başta ve sonda sessizlik yok.")
            }
          >
            <Button
              variant="ghost"
              disabled={disabled || edges.head + edges.tail < 0.1}
              onClick={() => apply(edges.clips)}
            >
              {ui("Kırp")}
            </Button>
          </Card>
          <Card
            icon={<Sunrise className="size-5" />}
            title={ui("Yumuşak giriş ve çıkış")}
            text={ui("Video sessizce açılır, sonunda yavaşça kısılarak biter.")}
          >
            <Button
              variant="ghost"
              disabled={disabled || !clips.length}
              onClick={() => apply(softEdges(clips))}
            >
              {ui("Uygula")}
            </Button>
          </Card>
          <Card
            icon={<ArrowRightLeft className="size-5" />}
            title={ui("Tüm kesimlere geçiş")}
            text={
              clips.length > 1
                ? `${clips.length - 1} ${ui("kesime çapraz çözülme eklenir.")}`
                : ui("Önce videoyu bölün; tek parçada geçiş olmaz.")
            }
          >
            <Button
              variant="ghost"
              disabled={disabled || clips.length < 2}
              onClick={() => apply(transitionEverywhere(clips, { id: "dissolve", duration: 0.4 }))}
            >
              {ui("Ekle")}
            </Button>
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
