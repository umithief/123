// Settings must remain usable when private browsing or quota limits block storage.
export function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSetting(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

type AndroidDownloads = {
  beginDownload: (name: string, mime: string, size: number) => string;
  appendDownload: (id: string, data: string) => boolean;
  finishDownload: (id: string) => boolean;
  abortDownload: (id: string) => void;
};

async function saveAndroidBlob(bridge: AndroidDownloads, blob: Blob, name: string) {
  let id = "";
  try {
    id = bridge.beginDownload(name, blob.type.split(";")[0] || "application/octet-stream", blob.size);
    if (!id) throw new Error("Dosya kaydetme başlatılamadı.");
    for (let offset = 0; offset < blob.size; offset += 128 * 1024) {
      const bytes = new Uint8Array(await blob.slice(offset, offset + 128 * 1024).arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      if (!bridge.appendDownload(id, btoa(binary))) throw new Error("Dosya kaydetme tamamlanamadı.");
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    if (!bridge.finishDownload(id)) throw new Error("Kaydetme penceresi açılamadı.");
  } catch (error) {
    if (id) bridge.abortDownload(id);
    window.dispatchEvent(new CustomEvent("aura-export-error", {
      detail: error instanceof Error ? error.message : "Dosya kaydedilemedi.",
    }));
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const bridge = (window as Window & { AuraAndroid?: AndroidDownloads }).AuraAndroid;
  if (bridge) {
    void saveAndroidBlob(bridge, blob, name);
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
