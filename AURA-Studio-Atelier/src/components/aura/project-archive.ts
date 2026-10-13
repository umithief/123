// AURA uses stored ZIP entries: media is already compressed. No executable
// content, extraction paths, third-party archive code or remote upload is needed.
const encoder = new TextEncoder(),
  decoder = new TextDecoder();
const table = Uint32Array.from({ length: 256 }, (_, i) => {
  let n = i;
  for (let j = 0; j < 8; j++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
export function crc32(bytes: Uint8Array) {
  let n = 0xffffffff;
  for (const v of bytes) n = table[(n ^ v) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
}
export async function packProject(entries: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  if (entries.reduce((n, e) => n + e.blob.size, 0) > 200 * 1024 * 1024)
    throw new Error("Kurgu yedeği en fazla 200 MB olabilir.");
  const parts: BlobPart[] = [],
    directory: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = encoder.encode(e.name),
      bytes = new Uint8Array(await e.blob.arrayBuffer()),
      crc = crc32(bytes),
      local = new Uint8Array(30 + name.length),
      view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, bytes.length, true);
    view.setUint32(22, bytes.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    const central = new Uint8Array(46 + name.length),
      c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x800, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, bytes.length, true);
    c.setUint32(24, bytes.length, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.set(name, 46);
    directory.push(central);
    parts.push(local, bytes);
    offset += local.length + bytes.length;
  }
  const length = directory.reduce((n, b) => n + b.length, 0),
    end = new Uint8Array(22),
    v = new DataView(end.buffer);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(8, entries.length, true);
  v.setUint16(10, entries.length, true);
  v.setUint32(12, length, true);
  v.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: "application/zip" });
}
export async function unpackProject(file: Blob): Promise<Map<string, Blob>> {
  if (file.size > 205 * 1024 * 1024) throw new Error("Kurgu yedeği en fazla 200 MB olabilir.");
  const buffer = await file.arrayBuffer(),
    bytes = new Uint8Array(buffer),
    view = new DataView(buffer),
    result = new Map<string, Blob>();
  let at = 0;
  while (at + 30 <= bytes.length && view.getUint32(at, true) === 0x04034b50) {
    const flags = view.getUint16(at + 6, true),
      method = view.getUint16(at + 8, true),
      crc = view.getUint32(at + 14, true),
      size = view.getUint32(at + 18, true),
      uncompressed = view.getUint32(at + 22, true),
      nameLength = view.getUint16(at + 26, true),
      extraLength = view.getUint16(at + 28, true),
      begin = at + 30 + nameLength + extraLength,
      end = begin + size;
    if (
      method !== 0 ||
      (flags & 9) !== 0 ||
      size !== uncompressed ||
      end > bytes.length ||
      result.size >= 100
    )
      throw new Error("AURA tarafından oluşturulmuş bir kurgu ZIP dosyası seçin.");
    const name = decoder.decode(bytes.subarray(at + 30, at + 30 + nameLength));
    if (!/^(project\.json|source|asset-[a-zA-Z0-9-]+)$/.test(name) || result.has(name))
      throw new Error("Kurgu arşivi geçersiz dosya içeriyor.");
    const body = bytes.subarray(begin, end);
    if (crc32(body) !== crc) throw new Error("Kurgu yedeği hasarlı.");
    result.set(name, new Blob([body]));
    at = end;
  }
  if (!result.has("project.json") || !result.has("source"))
    throw new Error("Kurgu ve kaynak dosyası bulunamadı.");
  return result;
}
