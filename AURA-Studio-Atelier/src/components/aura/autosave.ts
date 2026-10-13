// Crash/close recovery: the last edit session is kept on this device in
// IndexedDB with the same entries as a project ZIP. Media blobs are written
// once per file object; later saves only replace the small project.json.
const DB = "aura-autosave",
  FILES = "files",
  META = "meta",
  KEY = "session";

export type AutosaveInfo = { name: string; savedAt: number };
type Stored = AutosaveInfo & {
  version: 1;
  project: string;
  entries: Array<{ name: string; key: string }>;
};

const written = new WeakMap<Blob, string>();
let opening: Promise<IDBDatabase> | null = null;

function open() {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(FILES);
      request.result.createObjectStore(META);
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

/** Stores the session atomically; stale media from older saves is removed. */
export async function writeAutosave(
  name: string,
  entries: Array<{ name: string; blob: Blob }>,
): Promise<void> {
  const db = await open();
  const project = entries.find((e) => e.name === "project.json");
  if (!project) throw new Error("Kurgu bilgisi eksik.");
  const projectText = await project.blob.text();
  const tx = db.transaction([FILES, META], "readwrite"),
    files = tx.objectStore(FILES),
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
  const record: Stored = {
    version: 1,
    name: name.slice(0, 100),
    savedAt: Date.now(),
    project: projectText,
    entries: list,
  };
  tx.objectStore(META).put(record, KEY);
  const used = new Set(list.map((e) => e.key));
  const keys = files.getAllKeys();
  keys.onsuccess = () => {
    for (const key of keys.result) if (!used.has(String(key))) files.delete(key);
  };
  await done(tx);
  // Only remember keys once they are durably stored.
  for (const [blob, key] of fresh) written.set(blob, key);
}

export async function readAutosaveInfo(): Promise<AutosaveInfo | null> {
  try {
    const db = await open();
    const record = (await result(
      db.transaction(META).objectStore(META).get(KEY),
    )) as Stored | undefined;
    if (record?.version !== 1 || typeof record.project !== "string") return null;
    return { name: String(record.name || ""), savedAt: Number(record.savedAt) || 0 };
  } catch {
    return null;
  }
}

/** Returns the same name → blob map a project ZIP unpacks to. */
export async function readAutosave(): Promise<Map<string, Blob>> {
  const db = await open();
  const tx = db.transaction([FILES, META]),
    record = (await result(tx.objectStore(META).get(KEY))) as Stored | undefined;
  if (record?.version !== 1 || !Array.isArray(record.entries))
    throw new Error("Kayıtlı oturum bulunamadı.");
  const entries = new Map<string, Blob>([
    ["project.json", new Blob([record.project], { type: "application/json" })],
  ]);
  for (const item of record.entries) {
    const blob = (await result(tx.objectStore(FILES).get(item.key))) as Blob | undefined;
    if (!(blob instanceof Blob)) throw new Error("Kayıtlı oturumda medya dosyası eksik.");
    entries.set(item.name, blob);
    written.set(blob, item.key);
  }
  return entries;
}

export async function clearAutosave(): Promise<void> {
  const db = await open();
  const tx = db.transaction([FILES, META], "readwrite");
  tx.objectStore(FILES).clear();
  tx.objectStore(META).clear();
  await done(tx);
}

/** A file rebuilt from an autosaved blob reuses its stored copy. */
export function sameStoredBlob<T extends Blob>(from: Blob, to: T): T {
  const key = written.get(from);
  if (key) written.set(to, key);
  return to;
}
