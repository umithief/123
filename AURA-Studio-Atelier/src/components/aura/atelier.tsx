import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Captions,
  Check,
  ChevronRight,
  Film,
  FolderOpen,
  History,
  Image,
  Layers,
  Mic,
  Music2,
  Palette,
  Play,
  Plus,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import { ModePreview } from "./studio-panels";
import { themeById, type ModeId } from "./palette";
import type { StudioTool } from "./studio-guide";
import { readSetting, writeSetting } from "./storage";
import { setInterfaceCopyLanguage } from "./interface-copy";
export type InterfaceLanguage = "tr" | "en";
export type Workspace = "design" | "edit" | "audio" | "text";
export type ProjectIntent = "music" | "video" | "captions";
export function useInterfaceLanguage() {
  const [language, setLanguage] = useState<InterfaceLanguage>("tr");
  useEffect(() => {
    const saved = readSetting("aura-interface-language");
    if (saved === "en") {
      setInterfaceCopyLanguage("en");
      setLanguage("en");
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return [
    language,
    (next: InterfaceLanguage) => {
      setInterfaceCopyLanguage(next);
      setLanguage(next);
      writeSetting("aura-interface-language", next);
    },
  ] as const;
}
export const WORKSPACES = [
  {
    id: "design",
    tr: "Sahne",
    en: "Design",
    description: "Görsel kimliğini oluştur.",
    english: "Create your visual identity.",
    icon: Palette,
  },
  {
    id: "edit",
    tr: "Kurgu",
    en: "Edit",
    description: "Hikâyenin akışını düzenle.",
    english: "Shape the flow of your story.",
    icon: Scissors,
  },
  {
    id: "audio",
    tr: "Ses",
    en: "Audio",
    description: "Her notaya yer aç.",
    english: "Make every note count.",
    icon: AudioLines,
  },
  {
    id: "text",
    tr: "Metin",
    en: "Text",
    description: "Söylemek istediğini görünür kıl.",
    english: "Give your words a presence.",
    icon: Type,
  },
] as const;
const ACTIONS = [
  {
    id: "scenes",
    group: "design",
    tr: "Spektrum & sahneler",
    en: "Visualizers & scenes",
    detail: "Müzikle hareket eden 42 görünüm",
    english: "42 visuals that move with your music",
    icon: AudioLines,
  },
  {
    id: "artwork",
    group: "design",
    tr: "Kapak & başlık",
    en: "Artwork & title",
    detail: "Fotoğrafın, parçan ve imzan",
    english: "Your image, track and signature",
    icon: Image,
  },
  {
    id: "adjust",
    group: "design",
    tr: "Renk & efektler",
    en: "Color & effects",
    detail: "Görüntüne son dokunuş",
    english: "The finishing touch for your visuals",
    icon: SlidersHorizontal,
  },
  {
    id: "media",
    group: "edit",
    tr: "Fotoğraf & video",
    en: "Photos & video",
    detail: "Medya ekle, sırala ve kadrajla",
    english: "Add, arrange and frame your media",
    icon: Film,
  },
  {
    id: "cuts",
    group: "edit",
    tr: "Kes & sahnelere ayır",
    en: "Trim & split scenes",
    detail: "Otomatik sahne kesimi, kırpma ve hız",
    english: "Automatic scene cuts, trimming and speed",
    icon: Scissors,
  },
  {
    id: "motion",
    group: "edit",
    tr: "Hareket & geçişler",
    en: "Motion & transitions",
    detail: "34 giriş, çıkış ve karma animasyon",
    english: "34 entrance, exit and loop animations",
    icon: Sparkles,
  },
  {
    id: "sound",
    group: "audio",
    tr: "Ses tasarımı",
    en: "Sound design",
    detail: "Ekolayzır, efektler ve ritim",
    english: "Equalizer, effects and rhythm",
    icon: Music2,
  },
  {
    id: "voice",
    group: "audio",
    tr: "Seslendirme & ek ses",
    en: "Voiceover & tracks",
    detail: "Sesini kaydet veya ikinci parça ekle",
    english: "Record your voice or add another track",
    icon: Mic,
  },
  {
    id: "layers",
    group: "text",
    tr: "Yazı & şekiller",
    en: "Type & shapes",
    detail: "Başlıklar, yazı tipleri ve animasyon",
    english: "Titles, typography and animation",
    icon: Type,
  },
  {
    id: "captions",
    group: "text",
    tr: "Altyazılar",
    en: "Captions",
    detail: "Sözler, zamanlama ve hazır stiller",
    english: "Lyrics, timing and ready-made styles",
    icon: Captions,
  },
] as const;
export function workspaceForTool(tool: StudioTool): Workspace {
  return ACTIONS.find((a) => a.id === tool)?.group || "design";
}
export function toolName(tool: StudioTool, language: InterfaceLanguage) {
  if (tool === "project") return language === "tr" ? "Dışa aktar" : "Export";
  if (tool === "backup") return language === "tr" ? "Proje dosyası" : "Project file";
  const a = ACTIONS.find((a) => a.id === tool);
  return a ? (language === "tr" ? a.tr : a.en) : "";
}
export function WorkspaceNav({
  active,
  onChange,
  language,
  disabled,
}: {
  active: Workspace;
  onChange: (id: Workspace) => void;
  language: InterfaceLanguage;
  disabled: boolean;
}) {
  return (
    <nav
      className="atelier-navigation"
      aria-label={language === "tr" ? "Çalışma alanları" : "Workspaces"}
    >
      {WORKSPACES.map((w) => (
        <button
          key={w.id}
          type="button"
          data-workspace={w.id}
          aria-pressed={active === w.id}
          disabled={disabled}
          onClick={() => onChange(w.id)}
        >
          <w.icon size={21} />
          <span>{language === "tr" ? w.tr : w.en}</span>
        </button>
      ))}
    </nav>
  );
}
export function ToolLibrary({
  workspace,
  onTool,
  onAddText,
  onCover,
  onUpload,
  language,
  disabled,
}: {
  workspace: Workspace;
  onTool: (tool: StudioTool) => void;
  onAddText: () => void;
  onCover: () => void;
  onUpload: () => void;
  language: InterfaceLanguage;
  disabled: boolean;
}) {
  const w = WORKSPACES.find((w) => w.id === workspace)!;
  const en = language === "en";
  return (
    <section className="atelier-library" aria-label={en ? `${w.en} tools` : `${w.tr} araçları`}>
      <div className="library-heading">
        <span className="atelier-eyebrow">{en ? "YOUR WORKSPACE" : "ÇALIŞMA ALANIN"}</span>
        <h2>{en ? w.en : w.tr}</h2>
        <p>{en ? w.english : w.description}</p>
      </div>
      {(workspace === "text" || workspace === "design" || workspace === "audio") && (
        <button
          type="button"
          className="library-primary"
          disabled={disabled}
          onClick={workspace === "text" ? onAddText : workspace === "design" ? onCover : onUpload}
        >
          <Plus size={17} />
          {workspace === "text"
            ? en
              ? "Add text"
              : "Yazı ekle"
            : workspace === "design"
              ? en
                ? "Add cover image"
                : "Kapak fotoğrafı ekle"
              : en
                ? "Change music"
                : "Müziği değiştir"}
        </button>
      )}
      <div className="library-tools">
        {ACTIONS.filter((a) => a.group === workspace).map((a) => (
          <button
            type="button"
            key={a.id}
            data-tool={a.id}
            disabled={disabled}
            onClick={() => onTool(a.id)}
          >
            <span className="library-tool-icon">
              <a.icon size={21} />
            </span>
            <span>
              <strong>{en ? a.en : a.tr}</strong>
              <small>{en ? a.english : a.detail}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <div className="library-note">
        <Check size={15} />
        <span>
          {en
            ? "Changes appear instantly in the preview."
            : "Değişiklikleri önizlemede anında gör."}
        </span>
      </div>
    </section>
  );
}
const LOOKS: [ModeId, string, string, string][] = [
  ["eclipse", "Tutulma", "Eclipse", "platinum"],
  ["deco", "Art Deco", "Art Deco", "champagne"],
  ["ribbon", "Saten Dalga", "Silk Wave", "rose-gold"],
];
export function AtelierHome({
  language,
  busy,
  current,
  onResume,
  onNewProject,
  recovery,
  onRecover,
  onDiscardRecovery,
  onStart,
  onOpen,
  onDemo,
  onLook,
  error,
}: {
  language: InterfaceLanguage;
  busy: boolean;
  current: string | null;
  onResume: () => void;
  onNewProject: () => void;
  recovery: { name: string; savedAt: number } | null;
  onRecover: () => void;
  onDiscardRecovery: () => void;
  onStart: (intent: ProjectIntent) => void;
  onOpen: () => void;
  onDemo: () => void;
  onLook: (mode: ModeId, theme: string) => void;
  error: string | null;
}) {
  const en = language === "en";
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const tasks = [
    {
      id: "music",
      n: "01",
      icon: Music2,
      tr: "Müzik videosu",
      en: "Music visualizer",
      detail: "Bir parçadan etkileyici bir sahneye.",
      english: "From a track to a captivating scene.",
    },
    {
      id: "video",
      n: "02",
      icon: Film,
      tr: "Video düzenle",
      en: "Video editor",
      detail: "Görüntülerini bir araya getir.",
      english: "Bring your footage together.",
    },
    {
      id: "captions",
      n: "03",
      icon: Captions,
      tr: "Altyazı ekle",
      en: "Caption studio",
      detail: "Sözlerine bir görünüm kazandır.",
      english: "Give your words a visual voice.",
    },
  ] as const;
  return (
    <main className="atelier-home">
      <section className="home-intro">
        <div>
          <span className="atelier-eyebrow">AURA / CREATIVE STUDIO</span>
          <h1>
            {en ? (
              <>
                Sound. Vision.
                <br />
                <em>Your signature.</em>
              </>
            ) : (
              <>
                Ses. Görüntü.
                <br />
                <em>Senin imzan.</em>
              </>
            )}
          </h1>
          <p>
            {en
              ? "A considered space for your next creation. Start with what you want to make."
              : "Bir sonraki eserin için sade bir alan. Yapmak istediğini seçerek başla."}
          </p>
        </div>
        <div className="home-feature">
          <ModePreview mode="deco" theme={themeById("champagne")} />
          <div>
            <span>ART DECO</span>
            <span>01 / 42</span>
          </div>
        </div>
      </section>
      {current && (
        <section className="home-current">
          <span className="current-symbol">
            <Layers size={23} />
          </span>
          <div>
            <small>{en ? "OPEN PROJECT" : "AÇIK PROJE"}</small>
            <strong>{current}</strong>
            <span>
              {en
                ? "Edits are kept on this device. Save a project file to share or back up."
                : "Düzenlemeler bu cihazda saklanır. Paylaşmak veya yedeklemek için proje dosyası kaydet."}
            </span>
          </div>
          <Dialog.Root open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                disabled={busy}
                className="new-project-button"
                aria-label={en ? "New project" : "Yeni proje"}
              >
                <Plus size={18} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="atelier-dialog-overlay" />
              <Dialog.Content className="atelier-dialog">
                <Dialog.Title>{en ? "Start a new project?" : "Yeni projeye başla?"}</Dialog.Title>
                <Dialog.Description>
                  {en
                    ? "Your open project will close. Save a project file first if you want to keep it."
                    : "Açık çalışma kapanacak. Korumak istiyorsan önce proje dosyası olarak kaydet."}
                </Dialog.Description>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewProjectOpen(false);
                      onResume();
                    }}
                  >
                    {en ? "Return to project" : "Çalışmaya dön"}
                  </button>
                  <button
                    type="button"
                    className="studio-primary"
                    disabled={busy}
                    onClick={onNewProject}
                  >
                    {en ? "Start new" : "Yeni projeye geç"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <button type="button" disabled={busy} onClick={onResume}>
            {en ? "Continue" : "Devam et"}
            <ArrowRight size={18} />
          </button>
        </section>
      )}
      {!current && recovery && (
        <section className="home-current home-recovery">
          <span className="current-symbol">
            <History size={23} />
          </span>
          <div>
            <small>{en ? "LAST SESSION" : "SON OTURUM"}</small>
            <strong>{recovery.name || (en ? "Untitled project" : "Adsız proje")}</strong>
            <span>
              {en ? "Kept on this device" : "Bu cihazda saklandı"}
              {recovery.savedAt > 0 &&
                ` · ${new Intl.DateTimeFormat(en ? "en-GB" : "tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(recovery.savedAt)}`}
            </span>
          </div>
          <Dialog.Root open={discardOpen} onOpenChange={setDiscardOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                disabled={busy}
                className="new-project-button"
                aria-label={en ? "Discard last session" : "Son oturumu sil"}
              >
                <X size={18} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="atelier-dialog-overlay" />
              <Dialog.Content className="atelier-dialog">
                <Dialog.Title>{en ? "Discard last session?" : "Son oturum silinsin mi?"}</Dialog.Title>
                <Dialog.Description>
                  {en
                    ? "The automatically kept copy on this device will be deleted. Project files you saved are not affected."
                    : "Bu cihazda otomatik saklanan kopya silinecek. Kaydettiğin proje dosyaları etkilenmez."}
                </Dialog.Description>
                <div>
                  <button type="button" onClick={() => setDiscardOpen(false)}>
                    {en ? "Keep" : "Sakla"}
                  </button>
                  <button
                    type="button"
                    className="studio-primary"
                    onClick={() => {
                      setDiscardOpen(false);
                      onDiscardRecovery();
                    }}
                  >
                    {en ? "Delete" : "Sil"}
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <button type="button" disabled={busy} onClick={onRecover}>
            {en ? "Restore" : "Geri yükle"}
            <ArrowRight size={18} />
          </button>
        </section>
      )}
      <section className="home-create">
        <div className="home-section-heading">
          <h2>{en ? "What will you create?" : "Ne yaratmak istersin?"}</h2>
          <button type="button" disabled={busy} onClick={onOpen}>
            <FolderOpen size={17} />
            {en ? "Open project" : "Proje aç"}
          </button>
        </div>
        <div className="creation-grid">
          {tasks.map((task) => (
            <button
              type="button"
              key={task.id}
              data-intent={task.id}
              disabled={busy}
              onClick={() => onStart(task.id)}
            >
              <span className="creation-top">
                <task.icon size={23} />
                <small>{task.n}</small>
              </span>
              <strong>{en ? task.en : task.tr}</strong>
              <span>{en ? task.english : task.detail}</span>
              <ArrowRight className="creation-arrow" size={20} />
            </button>
          ))}
        </div>
      </section>
      {busy && (
        <p className="home-status" role="status">
          {en ? "Preparing your project…" : "Projen hazırlanıyor…"}
        </p>
      )}
      {error && (
        <p className="home-status" role="alert">
          {error}
        </p>
      )}
      <section className="home-collection">
        <div className="home-section-heading">
          <div>
            <span className="atelier-eyebrow">THE SIGNATURE COLLECTION</span>
            <h2>{en ? "A starting point for your sound." : "Sesine yakışan bir başlangıç."}</h2>
          </div>
          <button type="button" onClick={onDemo} disabled={busy}>
            <Play size={16} />
            {en ? "Explore with sound" : "Örnek sesle keşfet"}
          </button>
        </div>
        <div className="home-look-strip">
          {LOOKS.map(([mode, tr, english, theme], index) => (
            <button type="button" key={mode} disabled={busy} onClick={() => onLook(mode, theme)}>
              <ModePreview mode={mode} theme={themeById(theme)} />
              <span>
                <strong>{en ? english : tr}</strong>
                <small>0{index + 1}</small>
                <ArrowRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <footer className="home-footer">
        <span>AURA STUDIO</span>
        <span>{en ? "Made for your creative rhythm." : "Yaratıcı ritmine alan aç."}</span>
      </footer>
    </main>
  );
}
