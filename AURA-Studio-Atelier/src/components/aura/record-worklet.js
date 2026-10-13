/* Audio capture runs on the audio thread, preserving samples while UI drawing is busy. */
class AuraCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.enabled = false;
    this.frame = 0;
    this.used = 0;
    this.chunk = 1024;
    this.data = new Float32Array(this.chunk * 2);
    this.port.onmessage = (event) => {
      if (event.data.type === "start") {
        this.frame = 0;
        this.used = 0;
        this.enabled = true;
      }
      if (event.data.type === "stop") {
        this.flush();
        this.enabled = false;
        this.port.postMessage({ type: "stopped" });
      }
    };
  }
  flush() {
    if (!this.used) return;
    const data = new Float32Array(this.used * 2);
    data.set(this.data.subarray(0, this.used));
    data.set(this.data.subarray(this.chunk, this.chunk + this.used), this.used);
    this.port.postMessage(
      {
        type: "samples",
        data,
        frames: this.used,
        timestamp: (this.frame - this.used) / sampleRate,
      },
      [data.buffer],
    );
    this.used = 0;
  }
  /** @param {Float32Array[][]} inputs */
  process(inputs) {
    if (!this.enabled) return true;
    const input = inputs[0],
      count = input[0]?.length ?? 128;
    for (let i = 0; i < count; i++) {
      this.data[this.used] = input[0]?.[i] ?? 0;
      this.data[this.chunk + this.used] = input[1]?.[i] ?? input[0]?.[i] ?? 0;
      this.used++;
      this.frame++;
      if (this.used === this.chunk) this.flush();
    }
    return true;
  }
}
registerProcessor("aura-capture", AuraCapture);
