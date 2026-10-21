import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { Copy, Download, Film, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { projectLabel, type ProjectInfo } from "./autosave";
import { VIDEO_FORMATS } from "./studio";
import type { InterfaceLanguage } from "./atelier";

const SHOWN = 4;

const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
function ago(at: number, en: boolean) {
  const seconds = (Date.now() - at) / 1000,
    words = new Intl.RelativeTimeFormat(en ? "en" : "tr", { numeric: "auto" });
  if (seconds < 60) return en ? "just now" : "az önce";
  if (seconds < 3600) return words.format(-Math.round(seconds / 60), "minute");
  if (seconds < 86400) return words.format(-Math.round(seconds / 3600), "hour");
  if (seconds < 86400 * 7) return words.format(-Math.round(seconds / 86400), "day");
  return new Intl.DateTimeFormat(en ? "en-GB" : "tr-TR", { dateStyle: "medium" }).format(at);
}
function size(bytes: number) {
  return bytes >= 1e9
    ? `${(bytes / 1e9).toFixed(1)} GB`
    : `${Math.max(1, Math.round(bytes / 1e6))} MB`;
}

/** The projects kept on this device: open, rename, copy, download, delete. */
export function ProjectLibrary({
  language,
  projects,
  currentId,
  storage,
  busy,
  onOpen,
  onRename,
  onDuplicate,
  onDownload,
  onDelete,
}: {
  language: InterfaceLanguage;
  projects: ProjectInfo[];
  /** The project open in the editor, if it is stored. */
  currentId: string | null;
  /** Bytes used on the device. */
  storage: number | null;
  busy: boolean;
  onOpen: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const en = language === "en";
  const [all, setAll] = useState(false),
    [query, setQuery] = useState(""),
    [renaming, setRenaming] = useState<ProjectInfo | null>(null),
    [deleting, setDeleting] = useState<ProjectInfo | null>(null),
    [menu, setMenu] = useState<string | null>(null);
  if (!projects.length) return null;
  const needle = query.trim().toLocaleLowerCase(en ? "en" : "tr");
  const found = needle
    ? projects.filter((p) =>
        `${p.title} ${p.name}`.toLocaleLowerCase(en ? "en" : "tr").includes(needle),
      )
    : projects;
  const shown = all || needle ? found : found.slice(0, SHOWN);
  return (
    <section className="home-projects" aria-labelledby="home-projects-title">
      <div className="home-section-heading home-projects-heading">
        <h2 id="home-projects-title">
          {en ? "My projects" : "Projelerim"}
          <small>{projects.length}</small>
        </h2>
        {storage != null && (
          <span>
            {en ? `${size(storage)} on this device` : `Cihazda ${size(storage)} kullanılıyor`}
          </span>
        )}
      </div>
      {projects.length > SHOWN && (
        <label className="project-search">
          <Search className="size-4" aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder={en ? "Search projects" : "Projelerde ara"}
            aria-label={en ? "Search projects" : "Projelerde ara"}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      )}
      <ul className="project-grid">
        {shown.map((p) => {
          const label = projectLabel(p, en),
            current = p.id === currentId,
            ratio = VIDEO_FORMATS.find((f) => f.id === p.format)?.ratio;
          return (
            <li key={p.id} className="project-card" data-current={current || undefined}>
              <button
                type="button"
                className="project-open"
                disabled={busy}
                aria-label={
                  current
                    ? en
                      ? `Continue ${label}`
                      : `${label} projesine devam et`
                    : en
                      ? `Open ${label}`
                      : `${label} projesini aç`
                }
                onClick={() => onOpen(p.id)}
              >
                <span className="project-thumb" data-format={p.format || undefined}>
                  {p.thumb ? <img src={p.thumb} alt="" /> : <Film className="size-6" />}
                  {p.duration > 0 && <small>{clock(p.duration)}</small>}
                </span>
                <span className="project-text">
                  <strong>{label}</strong>
                  <small>
                    {current ? (en ? "Open now" : "Şu an açık") : ago(p.savedAt, en)}
                    {ratio && ` · ${ratio}`}
                  </small>
                </span>
              </button>
              <Popover.Root
                open={menu === p.id}
                onOpenChange={(open) => setMenu(open ? p.id : null)}
              >
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="project-more"
                    disabled={busy}
                    aria-label={en ? `Options for ${label}` : `${label} seçenekleri`}
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="studio-popover project-menu"
                    side="bottom"
                    align="end"
                    sideOffset={6}
                  >
                    <button
                      type="button"
                      className="studio-popover-item"
                      onClick={() => {
                        setMenu(null);
                        setRenaming(p);
                      }}
                    >
                      <Pencil className="size-4" />
                      {en ? "Rename" : "Yeniden adlandır"}
                    </button>
                    <button
                      type="button"
                      className="studio-popover-item"
                      onClick={() => {
                        setMenu(null);
                        onDuplicate(p.id);
                      }}
                    >
                      <Copy className="size-4" />
                      {en ? "Make a copy" : "Kopyasını oluştur"}
                    </button>
                    <button
                      type="button"
                      className="studio-popover-item"
                      onClick={() => {
                        setMenu(null);
                        onDownload(p.id);
                      }}
                    >
                      <Download className="size-4" />
                      {en ? "Save project file" : "Proje dosyası olarak kaydet"}
                    </button>
                    {!current && (
                      <button
                        type="button"
                        className="studio-popover-item is-danger"
                        onClick={() => {
                          setMenu(null);
                          setDeleting(p);
                        }}
                      >
                        <Trash2 className="size-4" />
                        {en ? "Delete" : "Sil"}
                      </button>
                    )}
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </li>
          );
        })}
      </ul>
      {needle && !found.length && (
        <p className="project-empty">{en ? "No project matches." : "Eşleşen proje yok."}</p>
      )}
      {!needle && found.length > SHOWN && (
        <button type="button" className="project-all" onClick={() => setAll(!all)}>
          {all
            ? en
              ? "Show fewer"
              : "Daha az göster"
            : en
              ? `Show all (${found.length})`
              : `Tümünü göster (${found.length})`}
        </button>
      )}
      <Dialog.Root open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="atelier-dialog-overlay" />
          <Dialog.Content className="atelier-dialog">
            <Dialog.Title>{en ? "Rename project" : "Projeyi yeniden adlandır"}</Dialog.Title>
            <Dialog.Description>
              {en
                ? "The name is shown in My projects and on project files."
                : "Bu ad Projelerim'de ve proje dosyasında görünür."}
            </Dialog.Description>
            {renaming && (
              <form
                className="project-rename"
                onSubmit={(event) => {
                  event.preventDefault();
                  const title = String(new FormData(event.currentTarget).get("title") || "").trim();
                  if (title) onRename(renaming.id, title);
                  setRenaming(null);
                }}
              >
                <input
                  name="title"
                  className="studio-input"
                  aria-label={en ? "Project name" : "Proje adı"}
                  defaultValue={projectLabel(renaming, en)}
                  maxLength={80}
                  autoFocus
                  onFocus={(event) => event.currentTarget.select()}
                />
                <div>
                  <button type="button" onClick={() => setRenaming(null)}>
                    {en ? "Cancel" : "Vazgeç"}
                  </button>
                  <button type="submit" className="studio-primary">
                    {en ? "Save" : "Kaydet"}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="atelier-dialog-overlay" />
          <Dialog.Content className="atelier-dialog">
            <Dialog.Title>{en ? "Delete this project?" : "Bu proje silinsin mi?"}</Dialog.Title>
            <Dialog.Description>
              {deleting &&
                (en
                  ? `“${projectLabel(deleting, en)}” will be removed from this device. Project files and videos you saved are not affected.`
                  : `“${projectLabel(deleting, en)}” bu cihazdan silinecek. Kaydettiğin proje dosyaları ve videolar etkilenmez.`)}
            </Dialog.Description>
            <div>
              <button type="button" onClick={() => setDeleting(null)}>
                {en ? "Keep" : "Sakla"}
              </button>
              <button
                type="button"
                className="studio-primary is-danger"
                onClick={() => {
                  if (deleting) onDelete(deleting.id);
                  setDeleting(null);
                }}
              >
                {en ? "Delete" : "Sil"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
