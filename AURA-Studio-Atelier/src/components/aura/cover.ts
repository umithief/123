export type CoverPlacement = "center" | "background" | "both";
export type CoverShape = "circle" | "square";
export type CoverOptions = {
  placement: CoverPlacement;
  shape: CoverShape;
  size: number;
  opacity: number;
  pulse: boolean;
};

export const DEFAULT_COVER: CoverOptions = {
  placement: "center", shape: "circle", size: 0.34, opacity: 0.3, pulse: true,
};

export function restoreCoverOptions(raw: string | null): CoverOptions {
  try {
    const saved = JSON.parse(raw ?? "null");
    return {
      placement: ["center", "background", "both"].includes(saved?.placement) ? saved.placement : "center",
      shape: saved?.shape === "square" ? "square" : "circle",
      size: Number.isFinite(saved?.size) ? Math.max(0.2, Math.min(0.7, saved.size)) : 0.34,
      opacity: Number.isFinite(saved?.opacity) ? Math.max(0.1, Math.min(0.7, saved.opacity)) : 0.3,
      pulse: typeof saved?.pulse === "boolean" ? saved.pulse : true,
    };
  } catch { return { ...DEFAULT_COVER }; }
}

// Only local files are used, so the recording canvas stays origin-clean.
export async function prepareCover(file: File): Promise<Blob> {
  if (!/image\/(jpeg|png|webp)/.test(file.type)) throw new Error("JPG, PNG veya WebP fotoğraf seçin.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Kapak fotoğrafı en fazla 20 MB olabilir.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Fotoğraf işlenemedi.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("Fotoğraf işlenemedi.")), "image/webp", 0.9,
    ));
  } catch (error) {
    if (error instanceof Error && error.message === "Fotoğraf işlenemedi.") throw error;
    throw new Error("Fotoğraf açılamadı. Başka bir JPG, PNG veya WebP deneyin.");
  } finally { URL.revokeObjectURL(url); }
}

async function openCoverDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open("aura-artwork", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("cover");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadCover(): Promise<Blob | null> {
  const db = await openCoverDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("cover").objectStore("cover").get("image");
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveCover(blob: Blob | null): Promise<void> {
  const db = await openCoverDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("cover", "readwrite");
      if (blob) tx.objectStore("cover").put(blob, "image");
      else tx.objectStore("cover").delete("image");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
