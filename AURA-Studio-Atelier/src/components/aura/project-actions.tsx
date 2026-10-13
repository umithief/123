import { AudioLines, Image, Type, Captions, ArrowUpRight } from "lucide-react";
import { ChoiceStrip } from "./choice-strip";
import type { StudioTool } from "./studio-guide";
const actions = [
  { tool: "scenes", title: "Spektrum seç", detail: "Müziğine bir görünüm ver", icon: AudioLines },
  { tool: "artwork", title: "Kapak ekle", detail: "Kendi fotoğrafını kullan", icon: Image },
  { tool: "layers", title: "Yazı ekle", detail: "Başlığını sahneye yerleştir", icon: Type },
  {
    tool: "captions",
    title: "Altyazı ekle",
    detail: "Sözlerini müzikle birleştir",
    icon: Captions,
  },
] as const;
export function ProjectActions({
  disabled,
  onTool,
  onAddText,
  onAddCover,
}: {
  disabled: boolean;
  onTool: (tool: StudioTool) => void;
  onAddText: () => void;
  onAddCover: () => void;
}) {
  return (
    <section className="project-actions" aria-label="Hızlı başlangıç">
      <div className="project-actions-heading">
        <h2>Ne yapmak istersin?</h2>
        <span>Bir işlem seç, hemen başla.</span>
      </div>
      <ChoiceStrip aria-label="Proje başlangıç işlemleri" className="project-action-strip">
        {actions.map((action) => (
          <button
            type="button"
            key={action.tool}
            disabled={disabled}
            onClick={() =>
              action.tool === "layers"
                ? onAddText()
                : action.tool === "artwork"
                  ? onAddCover()
                  : onTool(action.tool)
            }
          >
            <action.icon className="size-5" />
            <div>
              <strong>{action.title}</strong>
              <small>{action.detail}</small>
            </div>
            <ArrowUpRight className="size-4" />
          </button>
        ))}
      </ChoiceStrip>
    </section>
  );
}
