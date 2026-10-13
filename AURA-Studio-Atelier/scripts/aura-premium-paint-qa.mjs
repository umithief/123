import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const p = await browser.newPage();
  await useRuntimeAssetFetch(p);
  await p.goto("http://127.0.0.1:8080");
  await p.locator('.aura-studio[data-ready="true"]').waitFor();
  const result = await p.evaluate(async () => {
    const { paintCaptions } = await import("/src/components/aura/caption-paint.ts");
    const { DEFAULT_CAPTIONS, CAPTION_FONTS, loadCaptionFont } =
      await import("/src/components/aura/captions.ts");
    const { paintVideoEffect } = await import("/src/components/aura/video-effects.ts");
    const { DEFAULT_ADJUST, VIDEO_EFFECTS, emptyProject } =
      await import("/src/components/aura/editor.ts");
    const { paintEditorLayers } = await import("/src/components/aura/editor-paint.ts");
    await Promise.all(Object.keys(CAPTION_FONTS).map((id) => loadCaptionFont(id)));
    const c = document.createElement("canvas");
    c.width = 720;
    c.height = 1280;
    const ctx = c.getContext("2d");
    const hash = () => {
      let n = 2166136261;
      for (const value of ctx.getImageData(0, 0, c.width, c.height).data)
        n = Math.imul(n ^ value, 16777619);
      return n >>> 0;
    };
    const cue = [{ id: "sample", text: "Müziğin ışığını hisset", start: 0, end: 3 }];
    const options = {
      ...DEFAULT_CAPTIONS,
      place: "center",
      font: "montserrat",
      textColor: "#ddb57e",
      highlightColor: "#ff7750",
      size: 42,
    };
    const captions = (animation, time, reduce = false) => {
      ctx.clearRect(0, 0, c.width, c.height);
      paintCaptions(
        ctx,
        c.width,
        c.height,
        0,
        cue,
        { ...options, animation },
        time,
        "#ff7750",
        reduce,
      );
      return hash();
    };
    const motion = [
      "elastic",
      "iris",
      "float",
      "orbit",
      "word-flip",
      "tracking",
      "shimmer",
      "stamp",
    ].map((animation) => ({
      animation,
      changed: captions(animation, 0.04) !== captions("none", 0.04),
      timed: captions(animation, 0.04) !== captions(animation, 0.25),
      reduced: captions(animation, 0.04, true) === captions("none", 0.04),
    }));
    const paintBackground = () => {
      const g = ctx.createLinearGradient(0, 0, 720, 1280);
      g.addColorStop(0, "#14224b");
      g.addColorStop(1, "#574131");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = "#eab46d";
      ctx.fillRect(280, 550, 160, 160);
    };
    const effect = (id, amount = 0.65, time = 0.2, reduce = false) => {
      paintBackground();
      paintVideoEffect(
        ctx,
        { ...DEFAULT_ADJUST, effect: id, effectAmount: amount },
        time,
        720,
        1280,
        reduce,
      );
      return hash();
    };
    const effects = VIDEO_EFFECTS.filter((e) => e.id !== "none").map(({ id }) => ({
      id,
      changed: effect(id) !== effect("none"),
      zero: effect(id, 0) === effect("none"),
      stable: effect(id) === effect(id),
      reduced: effect(id, 0.65, 0.2, true) === effect(id, 0.65, 1.2, true),
    }));
    const sheet = document.createElement("canvas");
    sheet.width = 1080;
    sheet.height = 640;
    const sc = sheet.getContext("2d");
    VIDEO_EFFECTS.filter((e) => e.id !== "none").forEach((e, i) => {
      effect(e.id, 0.8);
      sc.drawImage(c, (i % 3) * 360, Math.floor(i / 3) * 320, 360, 320);
      sc.fillStyle = "#fff";
      sc.font = "600 20px Outfit";
      sc.fillText(e.label, (i % 3) * 360 + 16, Math.floor(i / 3) * 320 + 30);
    });
    const project = emptyProject();
    project.layers = [
      {
        id: "t",
        kind: "text",
        text: "ÇIĞLIK ŞÖLENİ",
        start: 0,
        end: 3,
        x: 0.5,
        y: 0.5,
        scale: 1,
        opacity: 1,
        rotation: 0,
        color: "#ffc36f",
        background: false,
        animation: "none",
        font: "space",
        weight: 700,
        textEffect: "none",
        blend: "source-over",
        keyframes: [],
      },
    ];
    const layer = (effect) => {
      ctx.clearRect(0, 0, 720, 1280);
      project.layers[0].textEffect = effect;
      paintEditorLayers(ctx, project, new Map(), 1, 720, 1280);
      return hash();
    };
    const textEffects = ["neon", "extrude", "gold"].map((id) => ({
      id,
      changed: layer(id) !== layer("none"),
    }));
    return { motion, effects, textEffects, sheet: sheet.toDataURL() };
  });
  for (const item of [...result.motion, ...result.effects, ...result.textEffects])
    for (const [key, value] of Object.entries(item))
      if (typeof value === "boolean") assert.ok(value, `${item.animation || item.id}: ${key}`);
  await writeFile(
    "/workspace/screenshots/aura-premium-effects-sheet.png",
    Buffer.from(result.sheet.split(",")[1], "base64"),
  );
  delete result.sheet;
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
