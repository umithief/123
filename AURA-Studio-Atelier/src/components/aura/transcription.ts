export type TranscriptChunk = { text: string; timestamp: [number | null, number | null] };
export type TranscriptWindow = { start: number; end: number; keepStart: number; keepEnd: number };
export function transcriptionWindows(duration: number): TranscriptWindow[] {
  const result: TranscriptWindow[] = [];
  for (let at = 0; at < duration; at += 20)
    result.push({
      start: Math.max(0, at - 4),
      end: Math.min(duration, at + 24),
      keepStart: at,
      keepEnd: Math.min(duration, at + 20),
    });
  return result;
}
// Timestamp estimation retains words the model recognized but failed to timestamp.
// It is explicitly approximate; never invent replacement words.
export function normalizeTranscript(
  chunks: TranscriptChunk[],
  duration: number,
): TranscriptChunk[] {
  return chunks.flatMap((item, index) => {
    const text = item.text.replace(/\s+/g, " ").trim();
    if (!text) return [];
    const valid = (n: unknown): n is number =>
      typeof n === "number" && Number.isFinite(n) && n >= 0;
    let before = 0,
      after = duration;
    let left = index - 1,
      right = index + 1;
    while (left >= 0 && !valid(chunks[left].timestamp?.[1])) left--;
    if (left >= 0) before = chunks[left].timestamp[1]!;
    while (right < chunks.length && !valid(chunks[right].timestamp?.[0])) right++;
    if (right < chunks.length) after = chunks[right].timestamp[0]!;
    const slots = right - left - 1;
    const estimated =
      before + (Math.max(0.05, after - before) * (index - left - 1)) / Math.max(1, slots);
    const start = Math.max(
      0,
      Math.min(duration - 0.01, valid(item.timestamp?.[0]) ? item.timestamp[0] : estimated),
    );
    const end = Math.min(
      duration,
      valid(item.timestamp?.[1]) && item.timestamp[1] > start
        ? item.timestamp[1]
        : valid(chunks[index + 1]?.timestamp?.[0]) && chunks[index + 1].timestamp[0]! > start
          ? chunks[index + 1].timestamp[0]!
          : Math.max(
              start + 0.05,
              before + (Math.max(0.05, after - before) * (index - left)) / Math.max(1, slots),
            ),
    );
    return end > start ? [{ text, timestamp: [start, end] as [number, number] }] : [];
  });
}
export function ownedTranscript(
  chunks: TranscriptChunk[],
  window: TranscriptWindow,
): TranscriptChunk[] {
  return normalizeTranscript(chunks, window.end - window.start).flatMap((item) => {
    const start = item.timestamp[0]! + window.start,
      end = item.timestamp[1]! + window.start;
    // Ownership follows midpoint: words straddling a boundary are kept once.
    const midpoint = (start + end) / 2;
    return midpoint >= window.keepStart && midpoint < window.keepEnd
      ? [{ text: item.text, timestamp: [start, end] as [number, number] }]
      : [];
  });
}
export function mergeTranscript(chunks: TranscriptChunk[]): TranscriptChunk[] {
  const result: TranscriptChunk[] = [];
  for (const c of chunks.sort((a, b) => a.timestamp[0]! - b.timestamp[0]!)) {
    const previous = result[result.length - 1];
    // Remove only the same word at the same time; sung repetitions remain.
    if (
      previous &&
      previous.text.toLocaleLowerCase("tr") === c.text.toLocaleLowerCase("tr") &&
      Math.abs(previous.timestamp[0]! - c.timestamp[0]!) < 0.3
    )
      continue;
    result.push(c);
  }
  return result;
}
export function audioForRecognition(channels: Float32Array[]): Float32Array {
  const length = channels[0]?.length ?? 0;
  const mono = new Float32Array(length);
  let mixEnergy = 0,
    bestEnergy = 0,
    best = channels[0];
  for (const channel of channels) {
    let energy = 0;
    for (let i = 0; i < length; i++) {
      mono[i] += channel[i] / channels.length;
      energy += channel[i] * channel[i];
    }
    if (energy > bestEnergy) {
      bestEnergy = energy;
      best = channel;
    }
  }
  for (const v of mono) mixEnergy += v * v;
  if (best && mixEnergy < bestEnergy * 0.1) mono.set(best); // avoid phase-cancelled stereo vocals
  let peak = 0;
  for (const v of mono) peak = Math.max(peak, Math.abs(v));
  if (peak < 0.0001) throw new Error("Bu dosyada duyulabilir ses bulunamadı.");
  const gain = Math.min(8, 0.9 / peak);
  for (let i = 0; i < length; i++) mono[i] = Math.max(-1, Math.min(1, mono[i] * gain));
  return mono;
}
