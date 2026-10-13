import { chromium } from "playwright";
import assert from "node:assert/strict";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage();
  await useRuntimeAssetFetch(page);
  await page.goto("http://127.0.0.1:8080/");
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Örnek", exact: true }).click();
  await page.waitForTimeout(1500);
  const result = await page.evaluate(async () => {
    const { AudioEngine } = await import("/src/components/aura/engine.ts");
    const { DEFAULT_MUSIC } = await import("/src/components/aura/music.ts");
    const sourceRate = 48000,
      samples = sourceRate * 45;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const data = new DataView(buffer);
    const write = (at, text) => {
      for (let i = 0; i < text.length; i++) data.setUint8(at + i, text.charCodeAt(i));
    };
    write(0, "RIFF");
    data.setUint32(4, buffer.byteLength - 8, true);
    write(8, "WAVE");
    write(12, "fmt ");
    data.setUint32(16, 16, true);
    data.setUint16(20, 1, true);
    data.setUint16(22, 1, true);
    data.setUint32(24, sourceRate, true);
    data.setUint32(28, sourceRate * 2, true);
    data.setUint16(32, 2, true);
    data.setUint16(34, 16, true);
    write(36, "data");
    data.setUint32(40, samples * 2, true);
    for (let i = 0; i < samples; i++) {
      const t = i / sourceRate;
      const sample =
        0.36 * Math.sin(2 * Math.PI * 1000 * t) +
        0.025 * Math.sin(2 * Math.PI * 80 * t) +
        0.025 * Math.sin(2 * Math.PI * 8000 * t);
      data.setInt16(44 + i * 2, Math.round(sample * 32767), true);
    }
    const engine = new AudioEngine({
      onSource() {},
      onPlay() {},
      onFile() {},
      onTime() {},
      onError(error) {
        if (error) throw Error(error);
      },
    });
    const audio = new Audio();
    engine.attach(audio);
    await engine.useFile(new File([buffer], "tones.wav", { type: "audio/wav" }));
    const capture = new AudioContext();
    await capture.resume();
    const stream = capture.createMediaStreamSource(engine.tapRecording());
    const analyser = capture.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0;
    stream.connect(analyser);
    const freq = new Float32Array(analyser.frequencyBinCount);
    const wave = new Float32Array(analyser.fftSize);
    const wait = () => new Promise((resolve) => setTimeout(resolve, 500));
    const measure = async () => {
      await wait();
      analyser.getFloatFrequencyData(freq);
      analyser.getFloatTimeDomainData(wave);
      const index = Math.round((1000 / capture.sampleRate) * analyser.fftSize);
      let peak = -Infinity;
      for (let i = index - 2; i <= index + 2; i++) peak = Math.max(peak, freq[i]);
      return {
        tone: peak,
        rms: Math.sqrt(wave.reduce((sum, value) => sum + value * value, 0) / wave.length),
      };
    };
    const baseline = await measure();
    engine.setMusic({ ...DEFAULT_MUSIC, eq: true, mid: 6 });
    const boosted = await measure();
    engine.setMusic({ ...DEFAULT_MUSIC, eq: false, mid: 6 });
    const bypassed = await measure();
    engine.setMusic({ ...DEFAULT_MUSIC, volume: 0.25 });
    const quiet = await measure();
    engine.setMusic({ ...DEFAULT_MUSIC, volume: 0 });
    const muted = await measure();
    const reading = engine.read();
    const visibleWhileMuted = reading.audible && Math.max(...reading.freq) > 30;
    engine.setMusic({ ...DEFAULT_MUSIC, compressor: true });
    const compressed = await measure();
    // Check compression with alternating loud/quiet sections, not constant loudness:
    // the native compressor applies make-up gain to sustained audio.
    for (let i = 0; i < samples; i++) {
      const t = i / sourceRate;
      const sample = (t % 6 < 3 ? 0.6 : 0.04) * Math.sin(2 * Math.PI * 1000 * t);
      data.setInt16(44 + i * 2, Math.round(sample * 32767), true);
    }
    await engine.useFile(new File([buffer], "dynamics.wav", { type: "audio/wav" }));
    const dynamicRange = async (compressor) => {
      engine.setMusic({ ...DEFAULT_MUSIC, compressor });
      await wait();
      const high = [],
        low = [];
      for (let i = 0; i < 84; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        analyser.getFloatTimeDomainData(wave);
        const rms = Math.sqrt(wave.reduce((sum, value) => sum + value * value, 0) / wave.length);
        const phase = audio.currentTime % 6;
        if (phase > 1.4 && phase < 2.9) high.push(rms);
        if (phase > 4.8 && phase < 5.9) low.push(rms);
      }
      const average = (values) => values.reduce((a, b) => a + b, 0) / values.length;
      return average(high) / average(low);
    };
    const dryRange = await dynamicRange(false);
    const compressedRange = await dynamicRange(true);
    // A short tone followed by silence must leave a real effect tail in the recording bus.
    for (let i = 0; i < samples; i++) {
      const t = i / sourceRate;
      const sample = t < 0.12 ? 0.4 * Math.sin(2 * Math.PI * 1000 * t) : 0;
      data.setInt16(44 + i * 2, Math.round(sample * 32767), true);
    }
    const tail = async (settings) => {
      engine.setMusic({ ...DEFAULT_MUSIC, ...settings });
      await wait();
      await engine.useFile(new File([buffer], "burst.wav", { type: "audio/wav" }));
      while (audio.currentTime < 0.4) await new Promise((resolve) => setTimeout(resolve, 10));
      analyser.getFloatTimeDomainData(wave);
      const rms = Math.sqrt(wave.reduce((sum, value) => sum + value * value, 0) / wave.length);
      audio.pause();
      await new Promise((resolve) => setTimeout(resolve, 1600));
      return rms;
    };
    const dryTail = await tail({});
    const echoTail = await tail({ echo: 0.4 });
    const spaceTail = await tail({ space: 0.4 });
    engine.destroy();
    await capture.close();
    return {
      baseline,
      boosted,
      bypassed,
      quiet,
      muted,
      compressed,
      visibleWhileMuted,
      dryRange,
      compressedRange,
      dryTail,
      echoTail,
      spaceTail,
    };
  });
  console.log(JSON.stringify(result));
  assert.ok(
    result.boosted.tone - result.baseline.tone > 4,
    "EQ must boost the actual captured 1 kHz tone",
  );
  assert.ok(
    Math.abs(result.bypassed.tone - result.baseline.tone) < 1,
    "EQ bypass must restore neutral output",
  );
  assert.ok(
    Math.abs(result.quiet.tone - result.baseline.tone + 12.04) < 1,
    "25% volume must lower capture by about 12 dB",
  );
  assert.ok(result.muted.rms < 0.001, "mute must silence recorded audio");
  assert.equal(result.visibleWhileMuted, true, "mute should keep analysis active");
  assert.ok(
    result.compressedRange < result.dryRange * 0.8,
    "compressor must reduce loud/quiet contrast",
  );
  assert.ok(result.dryTail < 0.001, "dry output must end with the input burst");
  assert.ok(result.echoTail > 0.005, "echo must produce a recorded delayed tail");
  assert.ok(result.spaceTail > 0.001, "room effect must produce a recorded reverb tail");
} finally {
  await browser.close();
}
