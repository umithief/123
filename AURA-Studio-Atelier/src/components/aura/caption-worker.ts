import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import wasmUrl from "../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url";
import moduleUrl from "../../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url";
import {
  transcriptionWindows,
  ownedTranscript,
  mergeTranscript,
  normalizeTranscript,
  type TranscriptChunk,
} from "./transcription";
env.allowLocalModels = false;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.wasmPaths = { wasm: wasmUrl, mjs: moduleUrl };
let recognizer: AutomaticSpeechRecognitionPipeline | null = null;
let loadedModel = "";
self.onmessage = async (
  event: MessageEvent<{
    audio: Float32Array;
    language: string;
    quality: "accurate" | "fast";
    offset?: number;
  }>,
) => {
  try {
    const model =
      event.data.quality === "fast"
        ? "onnx-community/whisper-base_timestamped"
        : "onnx-community/whisper-small_timestamped";
    if (!recognizer || loadedModel !== model) {
      if (recognizer) {
        await recognizer.dispose();
        recognizer = null;
      }
      const binary = await fetch(wasmUrl);
      if (!binary.ok) throw new Error("Ses tanıma motoru yüklenemedi.");
      env.backends.onnx.wasm!.wasmBinary = await binary.arrayBuffer();
      recognizer = await pipeline<"automatic-speech-recognition">(
        "automatic-speech-recognition",
        model,
        {
          device: "wasm",
          dtype: "q8",
          progress_callback: (progress: unknown) => self.postMessage({ type: "model", progress }),
        },
      );
      loadedModel = model;
      env.backends.onnx.wasm!.wasmBinary = undefined;
    }
    self.postMessage({ type: "running" });
    const audio = event.data.audio,
      duration = audio.length / 16000,
      chunks: TranscriptChunk[] = [];
    const recognize = async (start: number, end: number) => {
      const output = await recognizer!(
        audio.subarray(Math.floor(start * 16000), Math.floor(end * 16000)),
        {
          ...(event.data.language === "auto" ? {} : { language: event.data.language }),
          task: "transcribe",
          return_timestamps: "word",
          max_new_tokens: 448,
          do_sample: false,
        },
      );
      const current = Array.isArray(output) ? output[0] : output;
      // Some engines return text without word times. Preserve that text with approximate times.
      return current.chunks?.length
        ? current.chunks
        : [{ text: current.text, timestamp: [0, end - start] as [number, number] }];
    };
    for (const window of transcriptionWindows(duration)) {
      chunks.push(...ownedTranscript(await recognize(window.start, window.end), window));
      self.postMessage({ type: "chunk", completed: window.keepEnd / duration });
    }
    // A shorter second pass can recover populated sections missed by long-window decoding.
    // Do not transcribe near-silent gaps or fabricate text to fill every second of a song.
    const merged = mergeTranscript(chunks),
      gaps: Array<[number, number]> = [];
    let cursor = 0;
    for (const c of merged) {
      if (c.timestamp[0]! - cursor > 4) gaps.push([cursor, c.timestamp[0]!]);
      cursor = Math.max(cursor, c.timestamp[1]!);
    }
    if (duration - cursor > 4) gaps.push([cursor, duration]);
    for (const [begin, finish] of gaps) {
      for (let start = begin; start < finish; start += 12) {
        const end = Math.min(finish, start + 12);
        if (end - start < 2) continue;
        let sum = 0;
        for (let i = Math.floor(start * 16000); i < Math.floor(end * 16000); i++)
          sum += audio[i] * audio[i];
        if (Math.sqrt(sum / ((end - start) * 16000)) < 0.012) continue;
        self.postMessage({ type: "recovery" });
        chunks.push(
          ...normalizeTranscript(await recognize(start, end), end - start).map((c) => ({
            text: c.text,
            timestamp: [c.timestamp[0]! + start, c.timestamp[1]! + start] as [number, number],
          })),
        );
      }
    }
    const offset = event.data.offset ?? 0;
    const result = mergeTranscript(chunks).map((c) => ({
      text: c.text,
      timestamp: [c.timestamp[0]! + offset, c.timestamp[1]! + offset],
    }));
    self.postMessage({
      type: "done",
      result: { text: result.map((c) => c.text).join(" "), chunks: result },
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
