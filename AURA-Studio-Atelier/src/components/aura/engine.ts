import { DEFAULT_MUSIC, type MusicOptions } from "./music";

export type SourceKind = "idle" | "mic" | "file" | "demo";

export type EngineEvents = {
  onSource: (source: SourceKind) => void;
  onLoading?: (loading: boolean) => void;
  onPlay: (playing: boolean) => void;
  onFile: (name: string | null, duration: number) => void;
  onTrack?: (file: File) => void;
  onTime: (time: number) => void;
  onError: (message: string | null) => void;
};

type WebAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

const BASS_STEPS = [55, 0, 82.41, 0, 73.42, 0, 65.41, 49, 55, 0, 98, 0, 73.42, 65.41, 49, 41.2];
const PLUCK_STEPS = [
  220, 0, 329.63, 392, 0, 293.66, 261.63, 329.63, 220, 0, 392, 329.63, 0, 293.66, 246.94, 220,
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private rhythmAnalyser: AnalyserNode | null = null;
  private bassWave = new Float32Array(0);
  private freq = new Uint8Array(0);
  private time = new Uint8Array(0);
  private audio: HTMLAudioElement | null = null;
  // Two players share the file: the one playing and a spare that waits,
  // already positioned, at the next cut. A cut then switches players
  // instead of seeking, which would stall the sound for a moment.
  private spare: HTMLAudioElement | null = null;
  private fileNodes = new Map<HTMLAudioElement, MediaElementAudioSourceNode>();
  private fileUrl: string | null = null;
  private fileName: string | null = null;
  private micStream: MediaStream | null = null;
  private micNode: MediaStreamAudioSourceNode | null = null;
  private demoStop: (() => void) | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private source: SourceKind = "idle";
  private op = 0;
  private noise: AudioBuffer | null = null;
  private input: GainNode | null = null;
  private eqDry: GainNode | null = null;
  private eqWet: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private dynamicsDry: GainNode | null = null;
  private dynamicsWet: GainNode | null = null;
  private effectsDry: GainNode | null = null;
  private echoWet: GainNode | null = null;
  private spaceWet: GainNode | null = null;
  private volumeNode: GainNode | null = null;
  private monitor: GainNode | null = null;
  private editGain: GainNode | null = null;
  private editLevel = 1;
  private muted = false;
  private detachAudio: (() => void) | null = null;
  private cancelFileLoad: (() => void) | null = null;
  private music: MusicOptions = { ...DEFAULT_MUSIC };

  constructor(private readonly events: EngineEvents) {}

  setMusic(options: MusicOptions): void {
    this.music = { ...options };
    const ctx = this.ctx;
    if (!ctx) return;
    const target = (param: AudioParam | undefined, value: number) => {
      param?.setTargetAtTime(value, ctx.currentTime, 0.025);
    };
    target(this.bassFilter?.gain, options.bass);
    target(this.midFilter?.gain, options.mid);
    target(this.trebleFilter?.gain, options.treble);
    target(this.eqDry?.gain, options.eq ? 0 : 1);
    target(this.eqWet?.gain, options.eq ? 1 : 0);
    target(this.dynamicsDry?.gain, options.compressor ? 0 : 1);
    target(this.dynamicsWet?.gain, options.compressor ? 1 : 0);
    target(this.effectsDry?.gain, 1 - Math.max(options.echo, options.space) * 0.5);
    target(this.echoWet?.gain, options.echo);
    target(this.spaceWet?.gain, options.space);
    target(this.volumeNode?.gain, options.volume);
  }

  setEditGain(value: number): void {
    this.editLevel = value;
    if (this.editGain && this.ctx)
      this.editGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.012);
  }

  openSoundLayer(audio: HTMLAudioElement) {
    const ctx = this.ensure();
    const input = ctx.createMediaElementSource(audio),
      gain = ctx.createGain();
    input.connect(gain);
    gain.connect(this.inputNode());
    return {
      setVolume: (volume: number) => gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.015),
      release: () => {
        input.disconnect();
        gain.disconnect();
      },
      resume: () => ctx.resume(),
    };
  }
  attach(audio: HTMLAudioElement): void {
    this.audio = audio;
    audio.preload = "metadata";
    if (!this.spare) {
      this.spare = document.createElement("audio");
      this.spare.preload = "auto";
      (this.spare as HTMLMediaElement & { playsInline?: boolean }).playsInline = true;
    }
    this.listen(audio);
  }

  /** Moves the player events to `audio`, the player now in use. */
  private listen(audio: HTMLAudioElement): void {
    this.detachAudio?.();
    const handlers: Record<string, EventListener> = {
      loadedmetadata: () => {
        if (this.source === "file")
          this.events.onFile(this.fileName, Number.isFinite(audio.duration) ? audio.duration : 0);
      },
      timeupdate: () => {
        if (this.source === "file") this.events.onTime(audio.currentTime || 0);
      },
      play: () => {
        if (this.source === "file") this.events.onPlay(true);
      },
      pause: () => {
        if (this.source === "file") this.events.onPlay(false);
      },
      ended: () => {
        if (this.source === "file") this.events.onPlay(false);
      },
      error: () => {
        if (this.source === "file") {
          this.events.onError("Ses dosyası okunamadı. Başka bir dosya deneyin.");
          this.events.onPlay(false);
        }
      },
    };
    for (const [type, handler] of Object.entries(handlers)) audio.addEventListener(type, handler);
    this.detachAudio = () => {
      for (const [type, handler] of Object.entries(handlers))
        audio.removeEventListener(type, handler);
    };
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.monitor && this.ctx)
      this.monitor.gain.setTargetAtTime(
        this.source === "mic" || muted ? 0 : 1,
        this.ctx.currentTime,
        0.025,
      );
  }

  setLoop(loop: boolean): void {
    if (this.audio) this.audio.loop = loop;
    if (this.spare) this.spare.loop = loop;
  }

  /** Positions the spare player at `at` (source seconds) for the next cut. */
  prepareCut(at: number, rate: number): void {
    const spare = this.spare,
      audio = this.audio;
    if (!spare || !audio || this.source !== "file" || !audio.src) return;
    if (spare.src !== audio.src) {
      spare.src = audio.src;
      spare.load();
    }
    if (!spare.paused) spare.pause();
    if (spare.playbackRate !== rate) spare.playbackRate = rate;
    if (Math.abs(spare.currentTime - at) > 0.01) spare.currentTime = at;
  }

  /**
   * Continues from `at` on the spare player when it is ready there and
   * returns it (it is the player in use from now on); null when the caller
   * has to seek instead.
   */
  cutTo(at: number, rate: number): HTMLAudioElement | null {
    const spare = this.spare,
      audio = this.audio;
    if (
      !spare ||
      !audio ||
      this.source !== "file" ||
      spare.src !== audio.src ||
      spare.seeking ||
      spare.readyState < HTMLMediaElement.HAVE_FUTURE_DATA ||
      Math.abs(spare.currentTime - at) > 0.04
    )
      return null;
    if (!this.fileNodes.has(spare)) this.connectFile(true);
    this.listen(spare);
    spare.loop = audio.loop;
    spare.playbackRate = rate;
    void spare.play().catch(() => {});
    audio.pause();
    this.audio = spare;
    this.spare = audio;
    return spare;
  }

  stop(): void {
    this.op++;
    this.resetSource();
    this.events.onLoading?.(false);
  }

  private resetSource(): void {
    this.cancelFileLoad?.();
    this.stopDemo();
    this.stopMic();
    this.pauseFile();
    this.connectFile(false);
    this.source = "idle";
    this.events.onSource("idle");
    this.events.onPlay(false);
    this.events.onFile(null, 0);
    this.events.onTime(0);
  }

  read(): {
    freq: Uint8Array;
    time: Uint8Array;
    sampleRate: number;
    fftSize: number;
    audible: boolean;
    bass: number;
  } | null {
    if (!this.ctx || !this.analyser || this.source === "idle") return null;
    this.analyser.getByteFrequencyData(this.freq);
    this.analyser.getByteTimeDomainData(this.time);
    this.rhythmAnalyser?.getFloatTimeDomainData(this.bassWave);
    let power = 0;
    for (const value of this.bassWave) power += value * value;
    const bass = Math.min(1, Math.sqrt(power / Math.max(1, this.bassWave.length)) * 2);
    const audible =
      this.source === "mic" ||
      (this.source === "file" && !!this.audio && !this.audio.paused) ||
      (this.source === "demo" && !!this.demoStop);
    return {
      freq: this.freq,
      time: this.time,
      sampleRate: this.ctx.sampleRate,
      fftSize: this.analyser.fftSize,
      audible,
      bass,
    };
  }

  async useMic(): Promise<void> {
    if (this.source === "mic") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.events.onError("Bu tarayıcı mikrofonu desteklemiyor.");
      return;
    }
    const token = ++this.op;
    this.resetSource();
    this.events.onLoading?.(true);
    this.events.onError(null);
    try {
      const ctx = this.ensure();
      await ctx.resume();
      if (token !== this.op) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      if (token !== this.op) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const node = ctx.createMediaStreamSource(stream);
      this.micStream = stream;
      this.micNode = node;
      node.connect(this.inputNode());
      this.source = "mic";
      this.setMuted(this.muted);
      this.events.onSource("mic");
      this.events.onPlay(true);
      stream.getAudioTracks()[0]?.addEventListener(
        "ended",
        () => {
          if (this.source === "mic" && this.micStream === stream) this.stop();
        },
        { once: true },
      );
    } catch {
      if (token === this.op) {
        this.resetSource();
        this.events.onError(
          "Mikrofon açılamadı. Tarayıcı mikrofon iznini kontrol edin veya bir parça yükleyin.",
        );
      }
    } finally {
      if (token === this.op) this.events.onLoading?.(false);
    }
  }

  async useFile(file: File): Promise<void> {
    if (file.type.startsWith("image/") || file.type.startsWith("text/")) {
      this.events.onError("Bir ses dosyası seçin.");
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      this.events.onError("Ses dosyası en fazla 150 MB olabilir.");
      return;
    }
    if (file.size === 0) {
      this.events.onError(
        "Seçilen dosya boş veya erişilemiyor. Dosyayı cihazınıza indirip yeniden seçin.",
      );
      return;
    }
    const audio = this.audio;
    if (!audio) return;
    const token = ++this.op;
    this.resetSource();
    this.events.onLoading?.(true);
    this.events.onError(null);
    try {
      const ctx = this.ensure();
      // A native document picker can consume the user gesture. A suspended
      // AudioContext must not prevent the selected track from loading.
      void ctx.resume().catch(() => {});
      if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
      const url = URL.createObjectURL(file);
      this.fileUrl = url;
      this.fileName = file.name;
      audio.src = url;
      if (this.spare) {
        this.spare.pause();
        this.spare.src = url;
      }
      this.connectFile(true);
      await this.waitForFile(audio);
      if (token !== this.op) return;
      this.source = "file";
      this.setMuted(this.muted);
      this.events.onTrack?.(file);
      this.events.onSource("file");
      this.events.onFile(file.name, Number.isFinite(audio.duration) ? audio.duration : 0);
      this.events.onTime(audio.currentTime || 0);
      try {
        await audio.play();
        if (token === this.op) this.events.onPlay(!audio.paused);
      } catch (error) {
        // The track is loaded: playback policy is not an import failure.
        if (!(error instanceof DOMException && error.name === "NotAllowedError")) throw error;
        if (token === this.op) this.events.onPlay(false);
      }
    } catch {
      if (token === this.op) {
        this.resetSource();
        this.events.onError(
          audio.error?.code === MediaError.MEDIA_ERR_NETWORK
            ? "Dosyaya erişilemedi. Parçayı cihazınıza indirip yeniden seçin."
            : /^video\//.test(file.type) || /\.(mp4|m4v|mov|webm|mkv|3gp)$/i.test(file.name)
              ? "Bu video açılamadı. MP4 (H.264) veya WebM biçiminde bir video deneyin; bazı telefonların HEVC/H.265 kayıtları desteklenmeyebilir."
              : "Bu ses dosyası açılamadı. MP3, M4A veya WAV biçiminde başka bir parça deneyin.",
        );
      }
    } finally {
      if (token === this.op) this.events.onLoading?.(false);
    }
  }

  private waitForFile(audio: HTMLAudioElement): Promise<void> {
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timer);
        audio.removeEventListener("loadedmetadata", ready);
        audio.removeEventListener("error", failed);
        if (this.cancelFileLoad === cancel) this.cancelFileLoad = null;
        if (error) reject(error);
        else resolve();
      };
      const ready = () => finish();
      const failed = () => finish(new Error("Audio metadata could not be read"));
      const cancel = () => finish(new DOMException("Track replaced", "AbortError"));
      const timer = setTimeout(() => finish(new Error("Audio load timed out")), 20000);
      this.cancelFileLoad = cancel;
      audio.addEventListener("loadedmetadata", ready, { once: true });
      audio.addEventListener("error", failed, { once: true });
      audio.load();
    });
  }

  async useDemo(): Promise<void> {
    if (this.source === "demo" && this.demoStop) return;
    const token = ++this.op;
    this.resetSource();
    this.events.onLoading?.(true);
    this.events.onError(null);
    try {
      const ctx = this.ensure();
      await ctx.resume();
      if (token !== this.op) return;
      this.startDemo(ctx);
      this.source = "demo";
      this.setMuted(this.muted);
      this.events.onSource("demo");
      this.events.onPlay(true);
    } catch {
      if (token === this.op)
        this.events.onError("Örnek ses başlatılamadı. Güncel bir tarayıcı deneyin.");
    } finally {
      if (token === this.op) this.events.onLoading?.(false);
    }
  }

  togglePlay(): void {
    if (this.source === "mic") {
      this.stop();
      return;
    }
    if (this.source === "file" && this.audio) {
      if (this.audio.paused) {
        this.events.onError(null);
        this.connectFile(true);
        void this.ensure().resume();
        void this.audio.play().catch(() => {
          this.events.onError("Oynatma başlatılamadı.");
        });
      } else {
        this.audio.pause();
      }
      return;
    }
    if (this.source === "demo") {
      if (this.demoStop) {
        this.stopDemo();
        this.events.onPlay(false);
      } else {
        const ctx = this.ensure();
        void ctx.resume();
        this.startDemo(ctx);
        this.events.onPlay(true);
      }
    }
  }

  async playFile(): Promise<void> {
    if (this.source !== "file" || !this.audio) throw new Error("Önce bir müzik dosyası seçin.");
    this.connectFile(true);
    await Promise.all([this.ensure().resume(), this.audio.play()]);
  }

  pause(): void {
    this.audio?.pause();
  }

  seekRatio(ratio: number): void {
    const audio = this.audio;
    if (!audio || this.source !== "file" || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, ratio * audio.duration));
    this.events.onTime(audio.currentTime);
  }

  seekBy(delta: number): void {
    const audio = this.audio;
    if (!audio || this.source !== "file" || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + delta));
    this.events.onTime(audio.currentTime);
  }

  tapRecording(): MediaStream {
    const ctx = this.ensure();
    void ctx.resume();
    if (!this.recordDest) throw new Error("Kayıt hattı yok");
    return this.recordDest.stream;
  }

  destroy(): void {
    this.op++;
    this.cancelFileLoad?.();
    this.detachAudio?.();
    this.detachAudio = null;
    this.stopDemo();
    this.stopMic();
    for (const player of [this.audio, this.spare]) {
      if (!player) continue;
      player.pause();
      player.src = "";
    }
    if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
    this.fileUrl = null;
    void this.ctx?.close().catch(() => {});
    // Every node below belongs to the closed context and can never be reused.
    this.ctx = null;
    this.analyser = null;
    this.rhythmAnalyser = null;
    this.recordDest = null;
    this.fileNodes.clear();
    this.input = null;
    this.editGain = null;
    this.monitor = null;
    this.volumeNode = null;
    this.source = "idle";
  }

  private inputNode(): GainNode {
    if (!this.input) throw new Error("Audio input missing");
    return this.input;
  }

  private ensure(): AudioContext {
    if (this.ctx && this.analyser) return this.ctx;
    const Ctx = window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
    if (!Ctx) throw new Error("Web Audio yok");
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.62;
    analyser.minDecibels = -88;
    analyser.maxDecibels = -22;
    this.ctx = ctx;
    this.analyser = analyser;
    this.recordDest = ctx.createMediaStreamDestination();
    this.input = ctx.createGain();
    // Detect low-frequency transients before EQ/compression; their gain must not mask beats.
    const bassProbe = ctx.createBiquadFilter();
    bassProbe.type = "lowpass";
    bassProbe.frequency.value = 200;
    bassProbe.Q.value = 0.7;
    this.rhythmAnalyser = ctx.createAnalyser();
    this.rhythmAnalyser.fftSize = 1024;
    this.bassWave = new Float32Array(this.rhythmAnalyser.fftSize);
    this.input.connect(bassProbe);
    bassProbe.connect(this.rhythmAnalyser);
    this.eqDry = ctx.createGain();
    this.eqWet = ctx.createGain();
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = "lowshelf";
    this.bassFilter.frequency.value = 180;
    this.midFilter = ctx.createBiquadFilter();
    this.midFilter.type = "peaking";
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 0.7;
    this.trebleFilter = ctx.createBiquadFilter();
    this.trebleFilter.type = "highshelf";
    this.trebleFilter.frequency.value = 4200;
    const eqBus = ctx.createGain();
    this.input.connect(this.eqDry);
    this.eqDry.connect(eqBus);
    this.input.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.eqWet);
    this.eqWet.connect(eqBus);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.2;
    this.dynamicsDry = ctx.createGain();
    this.dynamicsWet = ctx.createGain();
    const processed = ctx.createGain();
    eqBus.connect(this.dynamicsDry);
    this.dynamicsDry.connect(processed);
    eqBus.connect(compressor);
    compressor.connect(this.dynamicsWet);
    this.dynamicsWet.connect(processed);
    this.volumeNode = ctx.createGain();
    this.monitor = ctx.createGain();
    // Analyse before volume, so mute can leave visuals running.
    processed.connect(analyser);
    // Parallel effects leave onset detection clear while the recording receives the full mix.
    this.effectsDry = ctx.createGain();
    processed.connect(this.effectsDry);
    this.effectsDry.connect(this.volumeNode);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.32;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = "lowpass";
    echoTone.frequency.value = 3800;
    this.echoWet = ctx.createGain();
    processed.connect(delay);
    delay.connect(echoTone);
    echoTone.connect(feedback);
    feedback.connect(delay);
    echoTone.connect(this.echoWet);
    this.echoWet.connect(this.volumeNode);
    const room = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 1.4), ctx.sampleRate);
    let seed = 12345;
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        data[i] = ((seed / 4294967296) * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
      }
    }
    room.buffer = impulse;
    this.spaceWet = ctx.createGain();
    processed.connect(room);
    room.connect(this.spaceWet);
    this.spaceWet.connect(this.volumeNode);
    this.editGain = ctx.createGain();
    this.editGain.gain.value = this.editLevel;
    this.editGain.connect(this.inputNode());
    this.volumeNode.connect(this.recordDest);
    this.volumeNode.connect(this.monitor);
    this.monitor.connect(ctx.destination);
    this.eqDry.gain.value = this.music.eq ? 0 : 1;
    this.eqWet.gain.value = this.music.eq ? 1 : 0;
    this.dynamicsDry.gain.value = this.music.compressor ? 0 : 1;
    this.dynamicsWet.gain.value = this.music.compressor ? 1 : 0;
    this.effectsDry.gain.value = 1 - Math.max(this.music.echo, this.music.space) * 0.5;
    this.echoWet.gain.value = this.music.echo;
    this.spaceWet.gain.value = this.music.space;
    this.volumeNode.gain.value = this.music.volume;
    this.bassFilter.gain.value = this.music.bass;
    this.midFilter.gain.value = this.music.mid;
    this.trebleFilter.gain.value = this.music.treble;
    this.freq = new Uint8Array(analyser.frequencyBinCount);
    this.time = new Uint8Array(analyser.fftSize);
    return ctx;
  }

  private connectFile(on: boolean): void {
    const ctx = this.ctx;
    const analyser = this.analyser;
    if (!ctx || !analyser) return;
    // A paused player is silent, so both stay connected.
    for (const player of [this.audio, this.spare]) {
      if (!player?.src) continue;
      let node = this.fileNodes.get(player);
      if (!node) {
        node = ctx.createMediaElementSource(player);
        this.fileNodes.set(player, node);
      }
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
      if (on) node.connect(this.editGain!);
    }
  }

  private pauseFile(): void {
    for (const player of [this.audio, this.spare]) if (player && !player.paused) player.pause();
  }

  private stopMic(): void {
    this.micStream?.getTracks().forEach((track) => track.stop());
    try {
      this.micNode?.disconnect();
    } catch {
      /* already disconnected */
    }
    this.micStream = null;
    this.micNode = null;
  }

  private stopDemo(): void {
    this.demoStop?.();
    this.demoStop = null;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }

  private startDemo(ctx: AudioContext): void {
    this.stopDemo();
    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(this.inputNode());

    const padFreqs = [220, 261.63, 329.63, 440];
    const padNodes: OscillatorNode[] = [];
    for (const freq of padFreqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = (padNodes.length - 1.5) * 6;
      const gain = ctx.createGain();
      gain.gain.value = 0.028;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      padNodes.push(osc);
    }

    const noise = this.noiseBuffer(ctx);
    const stepDur = 60 / 98 / 2;
    let next = ctx.currentTime + 0.05;
    let step = 0;
    let alive = true;

    const schedule = (time: number, index: number) => {
      if (index % 4 === 0) this.kick(ctx, master, time);
      const bass = BASS_STEPS[index] ?? 0;
      if (bass > 0) this.tone(ctx, master, time, bass, "triangle", 0.2, 0.28);
      const pluck = PLUCK_STEPS[index] ?? 0;
      if (pluck > 0) this.tone(ctx, master, time, pluck, "sine", 0.07, 0.18);
      if (index % 2 === 1) this.hat(ctx, master, noise, time);
    };

    const timer = window.setInterval(() => {
      if (!alive) return;
      const horizon = ctx.currentTime + 0.28;
      while (next < horizon) {
        schedule(next, step % BASS_STEPS.length);
        next += stepDur;
        step++;
      }
    }, 40);

    this.demoStop = () => {
      alive = false;
      window.clearInterval(timer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      window.setTimeout(() => {
        for (const osc of padNodes) {
          try {
            osc.stop();
          } catch {
            /* already stopped */
          }
        }
        try {
          master.disconnect();
        } catch {
          /* already disconnected */
        }
      }, 120);
    };
  }

  private tone(
    ctx: AudioContext,
    dest: AudioNode,
    time: number,
    freq: number,
    type: OscillatorType,
    peak: number,
    dur: number,
  ): void {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private kick(ctx: AudioContext, dest: AudioNode, time: number): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(168, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.7, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  private hat(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer, time: number): void {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.045, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
    src.stop(time + 0.06);
  }
}
