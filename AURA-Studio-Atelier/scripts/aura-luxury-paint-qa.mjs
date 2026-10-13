import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const p = await browser.newPage(); await useRuntimeAssetFetch(p); await p.goto("http://127.0.0.1:8080"); await p.locator('.aura-studio[data-ready="true"]').waitFor();
  const result = await p.evaluate(async () => {
    const { paint, step, createRenderState } = await import("/src/components/aura/render.ts");
    const { paintLuxuryScene } = await import("/src/components/aura/luxury-scenes.ts");
    const { LUXURY_MODES, themeById, MODES } = await import("/src/components/aura/palette.ts");
    const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
    const hash = () => { let h = 2166136261; for (const n of ctx.getImageData(0, 0, canvas.width, canvas.height).data) h = Math.imul(h ^ n, 16777619); return h >>> 0; };
    const state = (live) => {
      const s = createRenderState();
      const signal = live ? { kind: "live", freq: Uint8Array.from({ length: 1024 }, (_, i) => Math.round(120 + 90 * Math.abs(Math.sin(i * 0.13)))), time: Uint8Array.from({ length: 2048 }, (_, i) => 128 + Math.round(Math.sin(i * 0.1) * 65)), sampleRate: 48000, fftSize: 2048, sensitivity: 1.35 } : { kind: "silent" };
      for (let f = 1; f <= 90; f++) step(s, signal, f * 33.33, false, 1);
      s.reserve = 16; return s;
    };
    const live = state(true), quiet = state(false), theme = themeById("champagne");
    const checks = [];
    for (const [w, h] of [[640, 360], [360, 640], [360, 360], [360, 450]]) {
      canvas.width = w; canvas.height = h;
      for (const mode of LUXURY_MODES) {
        const draw = (s, reduce = false) => { ctx.clearRect(0, 0, w, h); paintLuxuryScene(ctx, w, h, theme, mode, s, reduce); return hash(); };
        const active = draw(live), silent = draw(quiet);
        const savedTime = live.t; const reduced = draw(live, true); live.t += 1; const reducedAgain = draw(live, true); live.t = savedTime;
        const pixels = ctx.getImageData(0, 0, w, h).data; let visible = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 10) visible++;
        checks.push({ mode, w, h, audioReactive: active !== silent, visible: visible > 100, reduced: reduced === reducedAgain });
      }
    }
    const atlases = [];
    for (const [w, h, name] of [[640, 360, "wide"], [360, 640, "portrait"]]) {
      const atlas = document.createElement("canvas"); atlas.width = w * 4; atlas.height = h * 2; const ac = atlas.getContext("2d");
      canvas.width = w; canvas.height = h;
      LUXURY_MODES.forEach((mode, i) => {
        paint(ctx, w, h, themeById(i === 3 || i === 6 ? "platinum" : i === 2 ? "rose-gold" : "champagne"), mode, live, 16, false, { text: "", place: "center", style: "wide" }, "cinema", undefined, { particles: false, speed: 1, beatPulse: false });
        ac.drawImage(canvas, (i % 4) * w, Math.floor(i / 4) * h);
        ac.fillStyle = "#fff6dd"; ac.font = "600 18px Outfit"; ac.fillText(MODES.find(m => m.id === mode).label, (i % 4) * w + 18, Math.floor(i / 4) * h + h - 18);
      });
      atlases.push({ name, image: atlas.toDataURL() });
    }
    canvas.width = 1080; canvas.height = 1920; ctx.setTransform(3, 0, 0, 3, 0, 0);
    const timing = LUXURY_MODES.map(mode => {
      const started = performance.now();
      for (let i = 0; i < 20; i++) paint(ctx, 360, 640, theme, mode, live, 16, false, { text: "", place: "center", style: "wide" }, "cinema", undefined, { particles: true, speed: 1 });
      return { mode, drawMs: Number(((performance.now() - started) / 20).toFixed(2)) };
    });
    return { checks, atlases, timing };
  });
  for (const c of result.checks) { assert.ok(c.audioReactive, JSON.stringify(c)); assert.ok(c.visible, JSON.stringify(c)); assert.ok(c.reduced, JSON.stringify(c)); }
  for (const atlas of result.atlases) await writeFile(`/workspace/screenshots/aura-luxury-${atlas.name}-atlas.png`, Buffer.from(atlas.image.split(",")[1], "base64"));
  console.log(JSON.stringify({ checked: result.checks.length, audioReactive: true, reducedMotion: true, timing: result.timing }));
} finally { await browser.close(); }
