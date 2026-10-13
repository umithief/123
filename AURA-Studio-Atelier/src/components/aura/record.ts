import type { AudioSampleSource } from "mediabunny";
import workletUrl from "./record-worklet.js?url&no-inline";

const FPS = 30;

async function pickAudioCodec(): Promise<"aac" | "opus"> {
  if (typeof AudioEncoder === "undefined") throw new Error("Ses kodlayıcı yok");
  const aac = await AudioEncoder.isConfigSupported({
    codec: "mp4a.40.2",
    sampleRate: 48000,
    numberOfChannels: 2,
    bitrate: 256000,
  });
  if (aac.supported) return "aac";
  const opus = await AudioEncoder.isConfigSupported({
    codec: "opus",
    sampleRate: 48000,
    numberOfChannels: 2,
    bitrate: 192000,
  });
  if (opus.supported) return "opus";
  throw new Error("Bu tarayıcı MP4 sesini kodlayamıyor");
}

function evenSize(width: number, height: number): { width: number; height: number } {
  const cap = 1920;
  const scale = Math.min(1, cap / Math.max(width, height, 1));
  let nextW = Math.max(2, Math.round(width * scale));
  let nextH = Math.max(2, Math.round(height * scale));
  if (nextW % 2) nextW -= 1;
  if (nextH % 2) nextH -= 1;
  return { width: nextW, height: nextH };
}

export class Mp4Recorder {
  private running = false;
  private raf = 0;
  private startedAt = 0;
  private lastStamp = 0;
  private busy = false;
  private writing: Promise<void> = Promise.resolve();
  private fail: Error | null = null;
  private output: {
    start: () => Promise<void>;
    finalize: () => Promise<void>;
    cancel: () => Promise<void>;
    state: string;
    target: { buffer: ArrayBuffer | null };
    setMetadataTags: (tags: { title?: string; artist?: string }) => void;
  } | null = null;
  private video: { add: (timestamp: number, duration?: number) => Promise<void> } | null = null;
  private audioTrack: MediaStreamTrack | null = null;
  private audioSource: AudioSampleSource | null = null;
  private audioContext: AudioContext | null = null;
  private capture: AudioWorkletNode | null = null;
  private audioWriting: Promise<void> = Promise.resolve();
  private captureStopped: (() => void) | null = null;
  private capturedSeconds = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly openAudio: () => MediaStream,
    private readonly title: () => string,
    private readonly audioOnly = false,
  ) {}

  async start(): Promise<void> {
    if (typeof VideoEncoder === "undefined" || typeof AudioEncoder === "undefined") {
      throw new Error("WebCodecs yok");
    }
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width < 2 || height < 2) throw new Error("Tuval hazır değil");
    const fitted = evenSize(width, height);
    const {
      Output,
      Mp4OutputFormat,
      WavOutputFormat,
      BufferTarget,
      CanvasSource,
      AudioSampleSource,
      AudioSample,
      Quality,
    } = await import("mediabunny");

    const target = new BufferTarget();
    const output = new Output({
      format: this.audioOnly
        ? new WavOutputFormat()
        : new Mp4OutputFormat({ fastStart: "in-memory" }),
      target,
    });
    const video = this.audioOnly
      ? null
      : new CanvasSource(this.canvas, {
          codec: "avc",
          quality: new Quality("very-high"),
          latencyMode: "quality",
          keyFrameInterval: 2,
          hardwareAcceleration: "no-preference",
          transform: { width: fitted.width, height: fitted.height, fit: "fill" },
        });
    if (video) output.addVideoTrack(video, { frameRate: FPS });

    this.output = output;
    this.video = video;
    const stream = this.openAudio();
    const original = stream.getAudioTracks()[0];
    if (original) {
      const track = original.clone();
      this.audioTrack = track;
      const codec = this.audioOnly ? "pcm-s16" : await pickAudioCodec();
      const audio = new AudioSampleSource({
        codec,
        quality: new Quality({ bitrate: codec === "aac" ? 256_000 : 192_000 }),
      });
      this.audioSource = audio;
      output.addAudioTrack(audio);
      const context = new AudioContext({ sampleRate: 48000 });
      this.audioContext = context;
      await context.audioWorklet.addModule(workletUrl);
      const capture = new AudioWorkletNode(context, "aura-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      this.capture = capture;
      const input = context.createMediaStreamSource(new MediaStream([track])),
        silent = context.createGain();
      silent.gain.value = 0;
      input.connect(capture);
      capture.connect(silent);
      silent.connect(context.destination);
      capture.port.onmessage = (event) => {
        if (event.data.type === "stopped") {
          this.captureStopped?.();
          this.captureStopped = null;
          return;
        }
        if (event.data.type !== "samples" || this.fail) return;
        const { data, frames, timestamp } = event.data;
        this.capturedSeconds = timestamp + frames / context.sampleRate;
        const sample = new AudioSample({
          format: "f32-planar",
          sampleRate: context.sampleRate,
          numberOfChannels: 2,
          timestamp,
          data,
        });
        this.audioWriting = this.audioWriting
          .then(() => audio.add(sample))
          .catch((error) => {
            this.fail = error instanceof Error ? error : new Error("Ses kodlanamadı");
          })
          .finally(() => sample.close());
      };
      await context.resume();
    }

    const name = this.title().trim();
    output.setMetadataTags({ title: name || "AURA", artist: "AURA" });
    this.output = output;
    this.video = video;
    try {
      await output.start();
    } catch (error) {
      await this.cancel();
      throw error;
    }
    this.capture?.port.postMessage({ type: "start" });
    this.running = true;
    this.startedAt = performance.now();
    this.lastStamp = 0;
    if (video) {
      this.enqueue(0, 1 / FPS);
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  async stop(): Promise<Blob> {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.capture) {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          this.captureStopped = null;
          reject(new Error("Ses yakalama sonlandırılamadı."));
        }, 3000);
        this.captureStopped = () => {
          clearTimeout(timer);
          resolve();
        };
        this.capture!.port.postMessage({ type: "stop" });
      });
    }
    await this.audioWriting;
    await this.writing;
    // Hold the last image until the captured sound ends, on the same clock.
    const finalStamp = this.capturedSeconds - 1 / FPS;
    if (this.video && !this.fail && finalStamp > this.lastStamp) {
      this.lastStamp = finalStamp;
      this.enqueue(finalStamp, 1 / FPS);
      await this.writing;
    }
    if (this.fail) throw this.fail;
    const output = this.output;
    if (!output) throw new Error("Kayıt yok");
    try {
      await output.finalize();
    } finally {
      this.releaseAudio();
    }
    const buffer = output.target.buffer;
    if (!buffer) throw new Error("MP4 boş");
    return new Blob([buffer], { type: this.audioOnly ? "audio/wav" : "video/mp4" });
  }

  async cancel(): Promise<void> {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const output = this.output;
    this.output = null;
    this.video = null;
    try {
      if (output && output.state !== "finalized" && output.state !== "canceled")
        await output.cancel();
    } catch {
      /* already closed */
    }
    this.releaseAudio();
  }

  private releaseAudio(): void {
    this.capture?.port.close();
    this.capture?.disconnect();
    this.capture = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.audioTrack?.stop();
    this.audioTrack = null;
    this.audioSource = null;
  }

  private enqueue(timestamp: number, duration: number): void {
    const video = this.video;
    if (!video) return;
    this.busy = true;
    const job = video.add(timestamp, duration);
    this.writing = this.writing
      .then(() => job)
      .catch((error: unknown) => {
        this.fail = error instanceof Error ? error : new Error("Kare kodlanamadı");
      })
      .finally(() => {
        this.busy = false;
      });
  }

  private loop = (): void => {
    if (!this.running) return;
    const elapsed = this.capture
      ? this.capturedSeconds
      : (performance.now() - this.startedAt) / 1000;
    if (!this.busy && !this.fail && elapsed - this.lastStamp >= 1 / FPS) {
      this.lastStamp = elapsed;
      // A delayed frame must not extend the end by the previous rendering gap.
      this.enqueue(elapsed, 1 / FPS);
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
