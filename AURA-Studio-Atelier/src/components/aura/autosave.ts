// Projects kept on this device. Every project is stored in IndexedDB with
// the same entries as a project ZIP. Media blobs are written once and shared
// by key: later saves only replace the small project.json, and a copy of a
// project costs nothing until it is edited.
const DB = "aura-autosave",
  FILES = "files",
  META = "meta",
  // 2.2 and earlier kept a single session under this key.
  LEGACY = "session";

export type ProjectInfo = {
  id: string;
  /** Source file name. */
  name: string;
  /** Name the user gave the project ("" until renamed). */
  title: string;
  savedAt: number;
  createdAt: number;
  /** Small JPEG data URL of the preview ("" when none). */
  thumb: string;
  /** Edit length in seconds. */
  duration: number;
  /** Video format id. */
  format: string;
};
/** What the project is called in lists and file names. */
export const projectLabel = (p: ProjectInfo, en: boolean) =>
  p.title || p.name || (en ? "Untitled project" : "Adsız proje");
export type ProjectExtras = { thumb?: string; duration?: number; format?: string };
type Stored = {
  version: 1;
  id?: string;
  name: string;
  title?: string;
  savedAt: number;
  createdAt?: number;
  thumb?: string;
  duration?: number;
  format?: string;
  project: string;
  entries: Array<{ name: string; key: string }>;
};

const written = new WeakMap<Blob, string>();
let opening: Promise<IDBDatabase> | null = null;

function open() {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      // The single saved session becomes the first project of the library.
      const meta = request.transaction!.objectStore(META),
        legacy = meta.get(LEGACY);
      legacy.onsuccess = () => {
        const record = legacy.result as Stored | undefined;
        if (!record) return;
        const id = `p${(Number(record.savedAt) || Date.now()).toString(36)}`;
        meta.put({ ...record, id, createdAt: record.savedAt }, id);
        meta.delete(LEGACY);
      };
    };
    request.onsuccess = () => {
      // Another tab/WebView upgrading the schema must not be blocked by us.
      request.result.onversionchange = () => {
        request.result.close();
        opening = null;
      };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Otomatik kayıt deposu meşgul."));
  });
  opening.catch(() => (opening = null));
  return opening;
}

function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Otomatik kayıt iptal edildi."));
  });
}

function result<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const valid = (record: unknown): record is Stored =>
  !!record &&
  (record as Stored).version === 1 &&
  typeof (record as Stored).project === "string" &&
  Array.isArray((record as Stored).entries);

/** Removes media no project refers to any more (runs inside `tx`). */
function sweep(tx: IDBTransaction) {
  const all = tx.objectStore(META).getAll();
  all.onsuccess = () => {
    const used = new Set(
      (all.result as unknown[]).flatMap((r) =>
        valid(r) ? r.entries.map((e) => String(e.key)) : [],
      ),
    );
    const files = tx.objectStore(FILES),
      keys = files.getAllKeys();
    keys.onsuccess = () => {
      for (const key of keys.result) if (!used.has(String(key))) files.delete(key);
    };
  };
}

/** Stores project `id` atomically; its name and creation time are kept. */
export async function writeProject(
  id: string,
  name: string,
  entries: Array<{ name: string; blob: Blob }>,
  extras: ProjectExtras = {},
): Promise<void> {
  const db = await open();
  const project = entries.find((e) => e.name === "project.json");
  if (!project) throw new Error("Kurgu bilgisi eksik.");
  const projectText = await project.blob.text();
  const tx = db.transaction([FILES, META], "readwrite"),
    files = tx.objectStore(FILES),
    meta = tx.objectStore(META),
    fresh: Array<[Blob, string]> = [];
  const list = entries
    .filter((e) => e !== project)
    .map((e) => {
      let key = written.get(e.blob);
      if (!key) {
        key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        files.put(e.blob, key);
        fresh.push([e.blob, key]);
      }
      return { name: e.name, key };
    });
  const previous = meta.get(id);
  previous.onsuccess = () => {
    const before = valid(previous.result) ? previous.result : null,
      now = Date.now();
    const record: Stored = {
      version: 1,
      id,
      name: name.slice(0, 100),
      title: before?.title || "",
      savedAt: now,
      createdAt: before?.createdAt || now,
      thumb: extras.thumb ?? before?.thumb ?? "",
      duration: extras.duration ?? before?.duration ?? 0,
      format: extras.format ?? before?.format ?? "",
      project: projectText,
      entries: list,
    };
    meta.put(record, id);
    sweep(tx);
  };
  await done(tx);
  // Only remember keys once they are durably stored.
  for (const [blob, key] of fresh) written.set(blob, key);
}

const info = (r: Stored, id: string): ProjectInfo => ({
  id,
  name: String(r.name || ""),
  title: String(r.title || ""),
  savedAt: Number(r.savedAt) || 0,
  createdAt: Number(r.createdAt) || Number(r.savedAt) || 0,
  thumb: typeof r.thumb === "string" && r.thumb.startsWith("data:image/") ? r.thumb : "",
  duration: Number(r.duration) || 0,
  format: String(r.format || ""),
});

/** Every project on this device, the most recently edited first. */
export async function listProjects(): Promise<ProjectInfo[]> {
  try {
    const db = await open();
    const store = db.transaction(META).objectStore(META);
    const [records, keys] = await Promise.all([result(store.getAll()), result(store.getAllKeys())]);
    return (records as unknown[])
      .flatMap((r, i) => (valid(r) ? [info(r, String(keys[i]))] : []))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/** Returns the same name → blob map a project ZIP unpacks to. */
export async function readProject(id: string): Promise<Map<string, Blob>> {
  const db = await open();
  const tx = db.transaction([FILES, META]),
    record = (await result(tx.objectStore(META).get(id))) as Stored | undefined;
  if (!valid(record)) throw new Error("Kayıtlı proje bulunamadı.");
  const entries = new Map<string, Blob>([
    ["project.json", new Blob([record.project], { type: "application/json" })],
  ]);
  for (const item of record.entries) {
    const blob = (await result(tx.objectStore(FILES).get(item.key))) as Blob | undefined;
    if (!(blob instanceof Blob)) throw new Error("Kayıtlı projede medya dosyası eksik.");
    entries.set(item.name, blob);
    written.set(blob, item.key);
  }
  return entries;
}

async function change(id: string, edit: (record: Stored) => Stored | null, copyTo?: string) {
  const db = await open();
  const tx = db.transaction([FILES, META], "readwrite"),
    meta = tx.objectStore(META),
    found = meta.get(id);
  found.onsuccess = () => {
    if (!valid(found.result)) return;
    const next = edit(found.result);
    if (next) meta.put(next, copyTo ?? id);
    else meta.delete(id);
    sweep(tx);
  };
  await done(tx);
}

export function renameProject(id: string, title: string) {
  return change(id, (r) => ({ ...r, title: title.trim().slice(0, 80) }));
}

/** A copy shares the original's media; it appears as the newest project. */
export function duplicateProject(id: string, copyId: string, title: string) {
  const now = Date.now();
  return change(
    id,
    (r) => ({ ...r, id: copyId, title: title.slice(0, 80), savedAt: now, createdAt: now }),
    copyId,
  );
}

export function deleteProject(id: string) {
  return change(id, () => null);
}

/** Bytes this site uses on the device, when the browser can tell. */
export async function storageUsed(): Promise<number | null> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    return typeof estimate?.usage === "number" ? estimate.usage : null;
  } catch {
    return null;
  }
}

/** A file rebuilt from a stored blob reuses its stored copy. */
export function sameStoredBlob<T extends Blob>(from: Blob, to: T): T {
  const key = written.get(from);
  if (key) written.set(to, key);
  return to;
}
