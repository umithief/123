import { useEffect, useMemo, useState } from "react";
import { beatGrid, detectBeats } from "./timeline";

export type AudioAnalysis = {
  /** Loudness bars (max level) over the whole source, empty until decoded. */
  peaks: number[];
  /** Detected onsets in source seconds. */
  onsets: number[];
  /** Steady beat grid in source seconds, with the tempo when one was found. */
  grid: { beats: number[]; bpm: number | null };
};

/** Decodes the source once for the waveform, beat marks and ready-made edits.
 *  Files over 50 MB, or formats the browser cannot decode, give empty results. */
export function useAudioAnalysis(file: File | null, duration: number): AudioAnalysis {
  const [peaks, setPeaks] = useState<number[]>([]),
    [onsets, setOnsets] = useState<number[]>([]);
  useEffect(() => {
    let current = true;
    setPeaks([]);
    setOnsets([]);
    if (!file || file.size > 50 * 1024 * 1024) return;
    void (async () => {
      try {
        const context = new OfflineAudioContext(1, 1, 8000);
        const buffer = await context.decodeAudioData(await file.arrayBuffer());
        if (!current) return;
        const samples = buffer.getChannelData(0),
          next: number[] = [];
        for (let bar = 0; bar < 2400; bar++) {
          let value = 0;
          const first = Math.floor((bar * samples.length) / 2400),
            last = Math.floor(((bar + 1) * samples.length) / 2400);
          for (let i = first; i < last; i += 4) value = Math.max(value, Math.abs(samples[i]));
          next.push(value);
        }
        setPeaks(next);
        setOnsets(detectBeats(samples, buffer.sampleRate));
      } catch {
        /* Some video formats cannot be decoded separately; editing still works. */
      }
    })();
    return () => {
      current = false;
    };
  }, [file]);
  const grid = useMemo(() => beatGrid(onsets, duration), [onsets, duration]);
  return { peaks, onsets, grid };
}
