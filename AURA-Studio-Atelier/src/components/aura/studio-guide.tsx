import { ui } from "./interface-copy";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { readSetting, writeSetting } from "./storage";
import {
  Search,
  X,
  Scissors,
  AudioLines,
  ImagePlus,
  Type,
  SlidersHorizontal,
  Captions,
  Download,
  Settings2,
  CircleHelp,
  FolderOpen,
  Sparkles,
  LayoutTemplate,
  Wand2,
} from "lucide-react";
import { Button } from "../ui/button";
import { searchText } from "./search";

const TOOLS = [
  {
    id: "motion",
    label: "Video animasyonları",
    description: "Giriş, çıkış ve karma hareketlerini seç.",
    keywords:
      "capcut iç dış animasyon zoom titreşim arıza maske 3d ışık animation entrance exit motion transition",
    icon: Sparkles,
  },
  {
    id: "cuts",
    label: "Kes, böl ve hızlandır",
    description: "Parçaları kısalt, sırala veya hızını değiştir.",
    keywords: "müzik video zaman çizelgesi kırp hız yavaşlat trim split cut speed crop range",
    icon: Scissors,
  },
  {
    id: "sound",
    label: "Ses efektleri ve ritim",
    description: "Ekolayzır, yankı, bas ve ritim ayarları.",
    keywords: "eq reverb echo equalizer bass audio rhythm",
    icon: AudioLines,
  },
  {
    id: "voice",
    label: "Ek ses ve seslendirme",
    description: "İkinci bir ses dosyası veya mikrofon kaydı ekle.",
    keywords: "müzik mikrofon ses kaydet konuşma voiceover microphone record track",
    icon: AudioLines,
  },
  {
    id: "scenes",
    label: "Spektrum ve sahneler",
    description: "Müziğine uyumlu bir görünüm seç.",
    keywords: "lüks görsel renk animasyon spectrum visualizer scene luxury",
    icon: AudioLines,
  },
  {
    id: "media",
    label: "Fotoğraf ve video ekle",
    description: "Görüntüleri sırala ve geçiş ekle.",
    keywords: "medya arka plan maske chroma media photo video background",
    icon: ImagePlus,
  },
  {
    id: "layers",
    label: "Yazı ve şekil ekle",
    description: "Yazıları ve şekilleri sahnede taşı.",
    keywords: "katman sticker etiket font animasyon keyframe text shape title layer",
    icon: Type,
  },
  {
    id: "adjust",
    label: "Filtre ve efektler",
    description: "Renk, ışık ve video efektlerini ayarla.",
    keywords: "görünüm vintage parlaklık kontrast filter effect brightness contrast color",
    icon: SlidersHorizontal,
  },
  {
    id: "artwork",
    label: "Kapak ve başlık",
    description: "Kapak fotoğrafı ve parça adı ekle.",
    keywords: "sanatçı albüm cover artwork album artist",
    icon: ImagePlus,
  },
  {
    id: "captions",
    label: "Altyazı ekle ve düzenle",
    description: "Sözleri yapıştır, SRT yükle veya sesinden oluştur.",
    keywords: "şablon karaoke animasyon cümle caption subtitle lyrics srt",
    icon: Captions,
  },
  {
    id: "project",
    label: "Videoyu kaydet",
    description: "Boyut ve kaliteyi seç, MP4 veya WAV hazırla.",
    keywords: "indir export reels youtube dikey",
    icon: Download,
  },
  {
    id: "backup",
    label: "Kurguyu yedekle",
    description: "Daha sonra düzenlemek için dosyalarını birlikte sakla.",
    keywords: "proje zip kaydet devam backup archive save project",
    icon: FolderOpen,
  },
] as const;
export type StudioTool = (typeof TOOLS)[number]["id"];
export function StudioGuide({
  disabled,
  easy,
  onTool,
  onMode,
  onTemplates,
  onQuickTools,
}: {
  disabled: boolean;
  easy: boolean;
  onTool: (tool: StudioTool) => void;
  onMode?: () => void;
  onTemplates?: () => void;
  onQuickTools?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const picked = useRef(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const value = JSON.parse(readSetting("aura-recent-tools") || "[]");
      return Array.isArray(value) ? value.filter((id) => typeof id === "string").slice(0, 4) : [];
    } catch {
      return [];
    }
  });
  const available = [
    ...TOOLS,
    ...(onTemplates
      ? [
          {
            id: "templates",
            label: "Video şablonları",
            description: "Hazır bir görünümle başla, kendine göre düzenle.",
            keywords: "reels story shorts sinematik template hazır",
            icon: LayoutTemplate,
          },
        ]
      : []),
    ...(onQuickTools
      ? [
          {
            id: "quick",
            label: "Hazır araçlar",
            description: "Sessizlikleri temizle, ritme göre kes veya geçiş ekle.",
            keywords: "otomatik aralık hızlı vuruş kesim hazır",
            icon: Wand2,
          },
        ]
      : []),
  ];
  const words = searchText(query).split(/\s+/).filter(Boolean);
  const results = available
    .filter((tool) =>
      words.every((word) =>
        searchText(
          `${ui(tool.label)} ${ui(tool.description)} ${tool.label} ${tool.keywords}`,
        ).includes(word),
      ),
    )
    .sort((a, b) => {
      const score = (tool: (typeof available)[number]) =>
        words.reduce(
          (sum, word) =>
            sum +
            (searchText(`${ui(tool.label)} ${tool.label}`).includes(word)
              ? 6
              : searchText(ui(tool.description)).includes(word)
                ? 2
                : 1),
          0,
        );
      return score(b) - score(a);
    });
  const recentTools = words.length
    ? []
    : recent.flatMap((id) => {
        const found = available.find((t) => t.id === id);
        return found ? [found] : [];
      });
  function select(tool: (typeof available)[number]) {
    picked.current = true;
    const next = [tool.id, ...recent.filter((id) => id !== tool.id)].slice(0, 4);
    setRecent(next);
    writeSetting("aura-recent-tools", JSON.stringify(next));
    setOpen(false);
    if (tool.id === "templates") onTemplates?.();
    else if (tool.id === "quick") onQuickTools?.();
    else onTool(tool.id as StudioTool);
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (disabled || event.isComposing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        if (document.querySelector('[role="dialog"], [role="alertdialog"]') && !open) return;
        event.preventDefault();
        setQuery("");
        setOpen(true);
        requestAnimationFrame(() => input.current?.focus());
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [disabled, open]);
  function result(tool: (typeof available)[number]) {
    return (
      <Button key={tool.id} className="studio-tool-result" onClick={() => select(tool)}>
        <tool.icon className="size-5" />
        <span>
          <strong>{ui(tool.label)}</strong>
          <small>{ui(tool.description)}</small>
        </span>
      </Button>
    );
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setQuery("");
          picked.current = false;
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          disabled={disabled}
          className="guide-trigger"
          aria-label={ui("Araç bul")}
          aria-keyshortcuts="Control+k Meta+k"
          title={ui("Araç bul · Ctrl/⌘ K")}
        >
          <Search className="size-4" />
          <span>{ui("Araç bul")}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="studio-guide-overlay" />
        <Dialog.Content
          className="studio-guide-dialog"
          onCloseAutoFocus={(event) => {
            if (picked.current) {
              event.preventDefault();
              picked.current = false;
              requestAnimationFrame(() => {
                if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
                const target = document.querySelector<HTMLElement>(
                  ".editor-tool-heading h2, .inspector-scroll h2",
                );
                target?.focus({ preventScroll: true });
              });
            }
          }}
        >
          <div className="studio-guide-heading">
            <div>
              <Dialog.Title>{ui("Araç bul")}</Dialog.Title>
              <Dialog.Description>{ui("Yapmak istediğin işlemi seç.")}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label={ui("Araç penceresini kapat")}>
                <X className="size-5" />
              </Button>
            </Dialog.Close>
          </div>
          <label className="studio-search">
            <Search className="size-4" />
            <input
              ref={input}
              aria-label={ui("Araç ara")}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing && results.length) {
                  event.preventDefault();
                  select(recentTools[0] || results[0]);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  document
                    .querySelector<HTMLButtonElement>(".studio-guide-results button")
                    ?.focus();
                }
              }}
              placeholder={ui("Örn. yazı, kes, efekt…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="studio-guide-results">
            {!!recentTools.length && (
              <>
                <h3 className="guide-section-label">{ui("Son kullanılanlar")}</h3>
                {recentTools.map(result)}
                <h3 className="guide-section-label">{ui("Tüm araçlar")}</h3>
              </>
            )}
            {results.filter((tool) => !recentTools.some((r) => r.id === tool.id)).map(result)}
            {results.length === 0 && (
              <p className="studio-empty-result" role="status">
                {ui("Bu aramada araç bulunamadı. “Yazı”, “ses” veya “video” deneyebilirsin.")}
              </p>
            )}
          </div>
          <div className="studio-guide-help">
            <CircleHelp className="size-4" />
            <p>
              {ui("Araç adı veya yapmak istediğin işlemi yaz. İlk sonucu Enter ile açabilirsin.")}
            </p>
          </div>
          {onMode && (
            <Button
              disabled={disabled}
              onClick={() => {
                onMode();
                setOpen(false);
              }}
            >
              <Settings2 className="size-4" />
              {easy ? ui("Tüm araçlar") : ui("Kolay düzenle")}
            </Button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
