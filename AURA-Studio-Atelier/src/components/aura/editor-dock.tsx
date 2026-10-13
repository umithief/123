import {
  Scissors,
  AudioLines,
  Type,
  Captions,
  ImagePlus,
  SlidersHorizontal,
  Music,
  Image,
  Mic,
  Sparkles,
  FolderOpen,
  Settings2,
} from "lucide-react";
import { ChoiceStrip } from "./choice-strip";
import type { StudioTool } from "./studio-guide";
export const EDITOR_TOOLS = [
  { id: "scenes", label: "Spektrum", title: "Spektrum ve sahneler", icon: AudioLines },
  { id: "artwork", label: "Kapak", title: "Kapak ve başlık", icon: Image },
  { id: "layers", label: "Metin", title: "Yazı ve şekil", icon: Type },
  { id: "captions", label: "Altyazı", title: "Altyazılar", icon: Captions },
  { id: "media", label: "Medya", title: "Fotoğraf ve video", icon: ImagePlus },
  { id: "motion", label: "Animasyon", title: "Video animasyonları", icon: Sparkles },
  { id: "adjust", label: "Efektler", title: "Filtre ve efektler", icon: SlidersHorizontal },
  { id: "sound", label: "Ses", title: "Ses ve ritim", icon: Music },
  { id: "cuts", label: "Düzenle", title: "Klip ayarları", icon: Scissors },
  { id: "voice", label: "Seslendirme", title: "Ek ses ve seslendirme", icon: Mic },
] as const;
export function EditorDock({
  active,
  disabled,
  onTool,
  onMode,
}: {
  active: StudioTool | null;
  disabled: boolean;
  onTool: (tool: StudioTool) => void;
  onMode: () => void;
}) {
  return (
    <nav className="editor-dock" aria-label="Video düzenleme araçları">
      <ChoiceStrip
        aria-label="Hızlı düzenleme araçları"
        value={active || ""}
        className="action-rail"
      >
        {EDITOR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            data-tool={tool.id}
            disabled={disabled}
            aria-label={tool.label}
            aria-pressed={active === tool.id}
            className="editor-dock-tool"
            onClick={() => onTool(tool.id)}
          >
            <tool.icon className="size-5" />
            <span>{tool.label}</span>
          </button>
        ))}
        <button
          type="button"
          data-tool="backup"
          disabled={disabled}
          className="editor-dock-tool"
          aria-pressed={active === "backup"}
          onClick={() => onTool("backup")}
        >
          <FolderOpen className="size-5" />
          <span>Kurgu yedeği</span>
        </button>
        <button type="button" disabled={disabled} className="editor-dock-tool" onClick={onMode}>
          <Settings2 className="size-5" />
          <span>Gelişmiş stüdyo</span>
        </button>
      </ChoiceStrip>
    </nav>
  );
}
