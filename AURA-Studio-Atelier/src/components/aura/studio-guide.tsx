import { ui } from "./interface-copy";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
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
} from "lucide-react";
import { Button } from "../ui/button";
import { searchText } from "./search";

const TOOLS = [
  {
    id: "motion",
    label: "Video animasyonları",
    description: "Giriş, çıkış ve karma hareketlerini seç.",
    keywords: "capcut iç dış animasyon zoom titreşim arıza maske 3d ışık",
    icon: Sparkles,
  },
  {
    id: "cuts",
    label: "Kes, böl ve hızlandır",
    description: "Parçaları kısalt, sırala veya hızını değiştir.",
    keywords: "müzik video zaman çizelgesi kırp hız yavaşlat",
    icon: Scissors,
  },
  {
    id: "sound",
    label: "Ses efektleri ve ritim",
    description: "Ekolayzır, yankı, bas ve ritim ayarları.",
    keywords: "eq reverb echo",
    icon: AudioLines,
  },
  {
    id: "voice",
    label: "Ek ses ve seslendirme",
    description: "İkinci bir ses dosyası veya mikrofon kaydı ekle.",
    keywords: "müzik mikrofon ses kaydet konuşma",
    icon: AudioLines,
  },
  {
    id: "scenes",
    label: "Spektrum ve sahneler",
    description: "Müziğine uyumlu bir görünüm seç.",
    keywords: "lüks görsel renk animasyon",
    icon: AudioLines,
  },
  {
    id: "media",
    label: "Fotoğraf ve video ekle",
    description: "Görüntüleri sırala ve geçiş ekle.",
    keywords: "medya arka plan maske chroma",
    icon: ImagePlus,
  },
  {
    id: "layers",
    label: "Yazı ve şekil ekle",
    description: "Yazıları ve şekilleri sahnede taşı.",
    keywords: "katman sticker etiket font animasyon keyframe",
    icon: Type,
  },
  {
    id: "adjust",
    label: "Filtre ve efektler",
    description: "Renk, ışık ve video efektlerini ayarla.",
    keywords: "görünüm vintage parlaklık kontrast",
    icon: SlidersHorizontal,
  },
  {
    id: "artwork",
    label: "Kapak ve başlık",
    description: "Kapak fotoğrafı ve parça adı ekle.",
    keywords: "sanatçı albüm",
    icon: ImagePlus,
  },
  {
    id: "captions",
    label: "Altyazı ekle ve düzenle",
    description: "Sözleri yapıştır, SRT yükle veya sesinden oluştur.",
    keywords: "şablon karaoke animasyon cümle",
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
    keywords: "proje zip kaydet devam",
    icon: FolderOpen,
  },
] as const;
export type StudioTool = (typeof TOOLS)[number]["id"];
export function StudioGuide({
  disabled,
  easy,
  onTool,
  onMode,
}: {
  disabled: boolean;
  easy: boolean;
  onTool: (tool: StudioTool) => void;
  onMode: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = TOOLS.filter((tool) =>
    searchText(query)
      .split(/\s+/)
      .every((word) =>
        searchText(`${tool.label} ${tool.description} ${tool.keywords}`).includes(word),
      ),
  );
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) setQuery("");
      }}
    >
      <Dialog.Trigger asChild>
        <Button disabled={disabled} className="guide-trigger">
          <Search className="size-4" />
          {ui("Araçlar")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="studio-guide-overlay" />
        <Dialog.Content className="studio-guide-dialog">
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
              aria-label={ui("Araç ara")}
              placeholder={ui("Örn. yazı, kes, efekt…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="studio-guide-results">
            {results.map((tool) => (
              <Button
                key={tool.id}
                className="studio-tool-result"
                onClick={() => {
                  onTool(tool.id);
                  setOpen(false);
                }}
              >
                <tool.icon className="size-5" />
                <span>
                  <strong>{ui(tool.label)}</strong>
                  <small>{ui(tool.description)}</small>
                </span>
              </Button>
            ))}
            {results.length === 0 && (
              <p className="studio-empty-result" role="status">
                {ui("Bu aramada araç bulunamadı. “Yazı”, “ses” veya “video” deneyebilirsin.")}
              </p>
            )}
          </div>
          <div className="studio-guide-help">
            <CircleHelp className="size-4" />
            <p>
              {ui(
                "Alttaki araç çubuğundan düzenle. Zaman çizelgesindeki klibe dokunarak ayarlarını aç.",
              )}
            </p>
          </div>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
