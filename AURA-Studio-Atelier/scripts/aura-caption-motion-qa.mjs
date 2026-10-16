import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";

const url = process.argv[2] || "http://127.0.0.1:8080";
const built = url.includes("8081");
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, acceptDownloads: true });
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    await page
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-caption-track.wav");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page
      .getByLabel("SRT altyazı dosyası", { exact: true })
      .setInputFiles({
        name: "motion.srt",
        mimeType: "application/x-subrip",
        buffer: Buffer.from(
          "1\n00:00:00,000 --> 00:00:08,000\nMüziğin ritmini birlikte hissediyoruz\n",
        ),
      });
    await page.getByRole("button", { name: "Animasyonlar", exact: true }).click();
    await page.getByRole("group", { name: "Animasyon türü", exact: true }).getByRole("button", { name: /^Kombo/ }).click();
    const effects = page.getByRole("group", { name: "Altyazı animasyonları", exact: true });
    await effects.waitFor();
    assert.equal(await effects.getByRole("button").count(), 24);
    for (let index = 0; index < 24; index++) {
      const button = effects.getByRole("button").nth(index);
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(await effects.locator('[aria-pressed="true"]').count(), 1);
    }
    await effects.getByRole("button", { name: /^Kelime pop/ }).click();
    await page.getByLabel("Altyazı animasyon hızı", { exact: true }).press("End");
    await page.getByLabel("Altyazı hareket gücü", { exact: true }).press("End");
    assert.equal(
      await page.getByLabel("Altyazı animasyon hızı", { exact: true }).inputValue(),
      "2",
    );
    await page.getByRole("button", { name: "1. altyazıya git", exact: true }).click();
    const audio = page.locator("audio");
    await audio.evaluate((element) => {
      element.currentTime = 1.2;
    });
    await page.waitForTimeout(150);
    await effects.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/workspace/screenshots/aura-motion-${built ? "built" : "dev"}-${width}.png`,
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    // Recording uses the stage canvas, not the illustrative effect preview.
    if (width === 1280 && !built) {
      await page.getByRole("button", { name: "Oynat", exact: true }).click();
      await page.getByRole("button", { name: "MP4 kaydet", exact: true }).click();
      await page.getByRole("button", { name: "Durdur", exact: true }).waitFor();
      await page.waitForTimeout(2500);
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 45000 }),
        page.getByRole("button", { name: "Durdur", exact: true }).click(),
      ]);
      await download.saveAs("/workspace/screenshots/aura-caption-motion.mp4");
      await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    }
    await page.reload();
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("aura-captions-options")),
    );
    assert.equal(saved.animation, "bounce");
    assert.equal(saved.speed, 2);
    assert.equal(saved.intensity, 1);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, url, effects: 24, persistence: true, errors }));
    if (width === 1280 && !built) {
      const result = await page.evaluate(async () => {
        const { paintCaptions } = await import("/src/components/aura/caption-paint.ts");
        const { DEFAULT_CAPTIONS, CAPTION_ANIMATIONS } =
          await import("/src/components/aura/captions.ts");
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext("2d");
        const cue = {
          id: "a",
          text: "Müziğin ritmini hisset",
          start: 0,
          end: 3,
          words: [
            { text: "Müziğin", start: 0, end: 1 },
            { text: "ritmini", start: 1, end: 2 },
            { text: "hisset", start: 2, end: 3 },
          ],
        };
        const render = (animation, time, offset = 0, reduce = false) => {
          ctx.clearRect(0, 0, 640, 360);
          paintCaptions(
            ctx,
            640,
            360,
            0,
            [cue],
            { ...DEFAULT_CAPTIONS, style: "minimal", place: "center", animation, offset },
            time,
            "#ff6a2a",
            reduce,
          );
          if (ctx.globalAlpha !== 1 || !ctx.getTransform().isIdentity)
            throw Error("Drawing context leaked");
          return canvas.toDataURL();
        };
        return CAPTION_ANIMATIONS.map(({ id }) => {
          const a = render(id, id === "spotlight" ? 0.5 : 0.03);
          const b = render(id, id === "spotlight" ? 1.5 : 0.15);
          const before = render(id, 0.17);
          render(id, 1.3);
          return {
            id,
            changed: a !== b,
            seekStable: before === render(id, 0.17),
            offsetStable: before === render(id, 0.67, 0.5),
            reduceStable: render(id, 0.17, 0, true) === render("none", 0.17),
            frame: render(id, 0.17),
          };
        });
      });
      for (const item of result) {
        assert.equal(item.changed, item.id !== "none", item.id);
        assert.ok(item.seekStable && item.offsetStable && item.reduceStable, item.id);
        await writeFile(
          `/workspace/screenshots/caption-effect-${item.id}.png`,
          Buffer.from(item.frame.split(",")[1], "base64"),
        );
      }
      console.log(
        "All canvas effects animate, seek deterministically, respect offset/reduced motion and restore drawing state",
      );
    }
    await page.close();
  }
} finally {
  await browser.close();
}
