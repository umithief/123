import { createId } from "./id.ts";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  CAPTION_MAX_SECONDS,
  DEFAULT_CAPTIONS,
  cuesFromWords,
  lyricsToCues,
  importSrt,
  restoreCaptionOptions,
  type CaptionCue,
  type CaptionOptions,
} from "./captions";
import { readSetting, writeSetting } from "./storage";
import { audioForRecognition } from "./transcription";
import type { SourceKind } from "./engine";
import { editStamp, isLatestStamp, redoable, stepStamp } from "./history-clock";

// `at` orders caption steps against the project history (see history-clock);
// `key` and `when` merge rapid typing in one line into a single step.
type CueEntry = { cues: CaptionCue[]; at: number; key?: string; when?: number };
type CueHistory = { past: CueEntry[]; future: CueEntry[] };
const EMPTY_HISTORY: CueHistory = { past: [], future: [] };

export function useCaptions(audio: RefObject<HTMLAudioElement | null>, source: SourceKind) {
  const [file, setFile] = useState<File | null>(null);
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [options, setOptions] = useState<CaptionOptions>({ ...DEFAULT_CAPTIONS });
  const [quality, setQuality] = useState<"accurate" | "fast">("accurate");
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const [language, setLanguage] = useState("turkish");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [history, setHistoryState] = useState<CueHistory>(EMPTY_HISTORY);
  const historyRef = useRef(history);
  const setHistory = (next: CueHistory) => {
    historyRef.current = next;
    setHistoryState(next);
  };
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<{ cues: CaptionCue[]; options: CaptionOptions } | null>(null);
  const worker = useRef<Worker | null>(null);
  const generation = useRef(0);
  const draw = useRef({ cues, options });
  draw.current = { cues, options };

  /** Remembers `before` as one undo step (up to 40). */
  function record(before: CaptionCue[], key?: string) {
    const h = historyRef.current,
      last = h.past.at(-1),
      now = Date.now();
    if (key && last?.key === key && now - (last.when ?? 0) < 1500 && isLatestStamp(last.at)) {
      setHistory({ past: [...h.past.slice(0, -1), { ...last, when: now }], future: [] });
      return;
    }
    setHistory({
      past: [...h.past, { cues: before, at: editStamp(), key, when: now }].slice(-40),
      future: [],
    });
  }
  function show(next: CaptionCue[]) {
    draw.current = { ...draw.current, cues: next };
    setCues(next);
  }

  useEffect(() => {
    setOptions(restoreCaptionOptions(readSetting("aura-captions-options")));
  }, []);
  useEffect(
    () => () => {
      generation.current++;
      worker.current?.terminate();
    },
    [],
  );
  useEffect(() => {
    if (source !== "file") loadTrack(null);
  }, [source]);

  function cancel() {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    setStatus("idle");
    setMessage("");
    setProgress(0);
  }
  function loadTrack(next: File | null) {
    cancel();
    setFile(next);
    setHistory(EMPTY_HISTORY);
    setRange(null);
    if (next && pending.current) {
      setCues(pending.current.cues);
      changeOptions(pending.current.options);
      pending.current = null;
    } else setCues([]);
    setError(null);
  }
  function changeOptions(patch: Partial<CaptionOptions>) {
    setOptions((current) => {
      const next = { ...current, ...patch };
      writeSetting("aura-captions-options", JSON.stringify(next));
      return next;
    });
  }
  async function generate() {
    if (!file) return;
    if (status !== "idle") cancel();
    else generation.current++;
    const job = generation.current;
    setProgress(0);
    setError(null);
    setStatus("decoding");
    setMessage("Ses hazırlanıyor…");
    try {
      if (file.size > 50 * 1024 * 1024)
        throw new Error("Otomatik altyazı için en fazla 50 MB ses dosyası seçin.");
      if ((audio.current?.duration ?? 0) > CAPTION_MAX_SECONDS)
        throw new Error("Otomatik altyazı en fazla 10 dakikalık parçaları destekler.");
      const ctx = new OfflineAudioContext(1, 1, 16000);
      const decoded = await ctx.decodeAudioData(await file.arrayBuffer());
      if (job !== generation.current) return;
      if (decoded.duration > CAPTION_MAX_SECONDS)
        throw new Error("Otomatik altyazı en fazla 10 dakikalık parçaları destekler.");
      const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) =>
        decoded.getChannelData(i),
      );
      const prepared = audioForRecognition(channels);
      let mono: Float32Array;
      if (decoded.sampleRate !== 16000) {
        const resample = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
        const input = resample.createBuffer(1, prepared.length, decoded.sampleRate);
        input.copyToChannel(new Float32Array(prepared), 0);
        const player = resample.createBufferSource();
        player.buffer = input;
        player.connect(resample.destination);
        player.start();
        mono = (await resample.startRendering()).getChannelData(0).slice();
      } else mono = prepared;
      const offset = range ? Math.max(0, Math.min(decoded.duration, range.start)) : 0;
      const rangeEnd = range ? Math.min(decoded.duration, range.end) : decoded.duration;
      if (rangeEnd <= offset) throw new Error("Yeniden tarama bitişi başlangıçtan sonra olmalı.");
      if (range) mono = mono.slice(Math.floor(offset * 16000), Math.floor(rangeEnd * 16000));
      const duration = decoded.duration;
      if (!worker.current)
        worker.current = new Worker(new URL("./caption-worker.ts", import.meta.url), {
          type: "module",
        });
      const currentWorker = worker.current;
      const downloads = new Map<string, { loaded: number; total: number }>();
      setStatus("model");
      setMessage("Ses tanıma modeli hazırlanıyor…");
      const fail = () => {
        if (job !== generation.current) return;
        setError(
          "Ses tanıma tamamlanamadı. Model indirilemediyse bağlantınızı kontrol edip tekrar deneyin; SRT dosyası da yükleyebilirsiniz.",
        );
        cancel();
      };
      currentWorker.onerror = (event) => {
        console.error("Caption worker error:", event.message);
        fail();
      };
      currentWorker.onmessage = (event) => {
        if (job !== generation.current) return;
        const data = event.data;
        if (data.type === "model" && data.progress?.status === "progress") {
          const p = data.progress;
          if (Number.isFinite(p.loaded) && Number.isFinite(p.total))
            downloads.set(p.file, { loaded: p.loaded, total: p.total });
          const parts = [...downloads.values()],
            total = parts.reduce((n, p) => n + p.total, 0),
            loaded = parts.reduce((n, p) => n + p.loaded, 0);
          if (total > 0) setProgress(Math.min(99, Math.round((loaded / total) * 100)));
          setMessage("Model indiriliyor…");
        } else if (data.type === "running") {
          setStatus("running");
          setProgress(0);
          setMessage("Vokaller yazıya dönüştürülüyor…");
        } else if (data.type === "chunk") {
          setProgress(Math.min(99, Math.round(data.completed * 100)));
          setMessage("Vokaller yazıya dönüştürülüyor…");
        } else if (data.type === "recovery") {
          setMessage("Eksik kalan ses bölümleri yeniden taranıyor…");
        } else if (data.type === "done") {
          const result = Array.isArray(data.result) ? data.result[0] : data.result;
          const next = cuesFromWords(result?.chunks ?? [], duration).map((c) => ({
            ...c,
            id: createId(),
          }));
          record(draw.current.cues);
          setCues(
            range
              ? [
                  ...draw.current.cues.filter((c) => c.end <= offset || c.start >= rangeEnd),
                  ...next,
                ].sort((a, b) => a.start - b.start)
              : next,
          );
          setStatus("idle");
          setProgress(100);
          setMessage(
            next.length
              ? `${next.length} altyazı hazır. Metinleri kontrol edebilirsiniz.`
              : "Anlaşılabilir vokal bulunamadı. SRT yükleyebilir veya başka bir parça deneyebilirsiniz.",
          );
        } else if (data.type === "error") {
          console.error("Caption transcription failed:", data.message);
          fail();
        }
      };
      currentWorker.postMessage({ audio: mono, language, quality, offset }, [mono.buffer]);
    } catch (err) {
      if (job === generation.current) {
        setError(err instanceof Error ? err.message : "Ses dosyası açılamadı.");
        setStatus("idle");
        setMessage("");
      }
    }
  }
  function edit(id: string, patch: Partial<CaptionCue>) {
    record(draw.current.cues, `edit:${id}:${Object.keys(patch).sort().join(",")}`);
    setCues((current) =>
      current
        .map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                words:
                  patch.text !== undefined
                    ? undefined
                    : c.words
                        ?.map((w) => ({
                          ...w,
                          start: w.start + ((patch.start ?? c.start) - c.start),
                          end: Math.min(
                            patch.end ?? c.end,
                            w.end + ((patch.start ?? c.start) - c.start),
                          ),
                        }))
                        .filter((w) => w.end > w.start),
              }
            : c,
        )
        .sort((a, b) => a.start - b.start),
    );
  }
  async function importFile(next: File) {
    const job = generation.current;
    try {
      if (!file) return;
      if (next.size > 1024 * 1024) throw new Error("SRT dosyası en fazla 1 MB olabilir.");
      const raw = await next.text();
      if (job !== generation.current) return;
      const parsed = importSrt(raw, audio.current?.duration || CAPTION_MAX_SECONDS);
      cancel();
      record(draw.current.cues);
      setCues(parsed);
      setError(null);
      setMessage(`${parsed.length} altyazı yüklendi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Altyazı açılamadı.");
    }
  }
  return {
    file,
    pending,
    cues,
    options,
    language,
    setLanguage,
    quality,
    setQuality,
    range,
    setRange,
    applyLyrics: (raw: string) => {
      try {
        const next = lyricsToCues(raw, draw.current.cues, audio.current?.duration || 600);
        cancel();
        record(draw.current.cues);
        setCues(next);
        setError(null);
        setMessage("Sözler aynen eklendi. Tahmini zamanları dinleyerek kontrol edin.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sözler eklenemedi.");
      }
    },
    stamp: (id: string, at: number) => {
      record(draw.current.cues);
      setCues((current) =>
        current
          .map((c, index) =>
            c.id === id
              ? {
                  ...c,
                  start: Math.max(0, Math.min(at, (audio.current?.duration || 600) - 0.01)),
                  end: Math.min(audio.current?.duration || 600, Math.max(at + 0.1, c.end)),
                  words: undefined,
                }
              : index === current.findIndex((c) => c.id === id) - 1
                ? { ...c, end: Math.max(c.start + 0.01, at), words: undefined }
                : c,
          )
          .sort((a, b) => a.start - b.start),
      );
    },
    status,
    message,
    progress,
    error,
    draw,
    loadTrack,
    generate,
    cancel,
    changeOptions,
    edit,
    importFile,
    /** Live update while a caption is dragged on the timeline. */
    previewCues: (next: CaptionCue[]) => {
      draw.current = { ...draw.current, cues: next };
      setCues(next);
    },
    /** Finishes a timeline drag; `before` is what "undo" restores. */
    commitCues: (next: CaptionCue[], before: CaptionCue[]) => {
      const sorted = [...next].sort((a, b) => a.start - b.start);
      draw.current = { ...draw.current, cues: sorted };
      record(before);
      setCues(sorted);
      setMessage("Altyazı zamanı değişti.");
    },
    canUndo: history.past.length > 0,
    canRedo: redoable(history.future[0]?.at),
    /** Stamp of the step undo would revert (0 = none). */
    undoAt: history.past.at(-1)?.at ?? 0,
    /** Stamp of the step redo would restore (0 = none). */
    redoAt: redoable(history.future[0]?.at) ? history.future[0].at : 0,
    undo: () => {
      const h = historyRef.current,
        previous = h.past.at(-1);
      if (!previous) return;
      setHistory({
        past: h.past.slice(0, -1),
        future: [{ cues: draw.current.cues, at: stepStamp() }, ...h.future].slice(0, 40),
      });
      show(previous.cues);
      setMessage("Altyazı değişikliği geri alındı.");
    },
    redo: () => {
      const h = historyRef.current,
        next = h.future[0];
      if (!next || !redoable(next.at)) return;
      setHistory({
        past: [...h.past, { cues: draw.current.cues, at: stepStamp() }].slice(-40),
        future: h.future.slice(1),
      });
      show(next.cues);
      setMessage("Altyazı değişikliği yinelendi.");
    },
    add: (at: number, duration: number) => {
      if (!file || duration <= 0) return;
      record(cues);
      const start = Math.max(0, Math.min(at, duration - 1));
      setCues((current) =>
        [
          ...current,
          {
            id: createId(),
            text: "Yeni altyazı",
            start,
            end: Math.min(duration, start + 3),
          },
        ].sort((a, b) => a.start - b.start),
      );
    },
    remove: (id: string) => {
      record(cues);
      setCues((current) => current.filter((c) => c.id !== id));
    },
    clear: () => {
      cancel();
      record(cues);
      setCues([]);
      setError(null);
      setMessage("");
    },
  };
}
