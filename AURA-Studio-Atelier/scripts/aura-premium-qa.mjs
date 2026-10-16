import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";

const url = process.argv[2] || "http://127.0.0.1:8080";
const tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const fonts = {
  montserrat: "Montserrat",
  oswald: "Oswald",
  playfair: "Playfair Display",
  space: "Space Grotesk",
  caveat: "Caveat",
  anton: "Anton",
};
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, acceptDownloads: true });
    await useRuntimeAssetFetch(page);
    const errors = [],
      failedFonts = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.url().includes("premium-fonts/") && !r.ok()) failedFonts.push(r.url());
    });
    await page.addInitScript(() => {
      const drawImage = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
        if (
          this.canvas.matches(".canvas-frame > canvas") &&
          source instanceof HTMLCanvasElement &&
          source !== this.canvas
        )
          window.auraDrawSizes = {
            main: [this.canvas.width, this.canvas.height],
            base: [source.width, source.height],
          };
        return drawImage.call(this, source, ...args);
      };
    });
    await page.goto(url);
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    await page
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByRole("button", { name: "Kaydet", exact: true }).click();
    const ratios = {
      "16:9 YouTube": [1280, 720],
      "9:16 Reels / Story": [720, 1280],
      "1:1 Kare": [720, 720],
      "4:5 Gönderi": [720, 900],
    };
    for (const quality of ["720", "1080"]) {
      await page.getByLabel("Video kalitesi", { exact: true }).selectOption(quality);
      for (const [name, dimensions] of Object.entries(ratios)) {
        await page.getByRole("button", { name, exact: true }).click();
        const expected = dimensions.map((n) => n * (quality === "1080" ? 1.5 : 1));
        await page.waitForFunction(
          (expected) =>
            JSON.stringify(window.auraDrawSizes?.main) === JSON.stringify(expected) &&
            JSON.stringify(window.auraDrawSizes?.base) === JSON.stringify(expected),
          expected,
        );
        const bounds = await page.locator(".canvas-frame canvas").boundingBox();
        assert.ok(Math.abs(bounds.width / bounds.height - expected[0] / expected[1]) < 0.01);
      }
    }
    await page.getByLabel("Video kalitesi", { exact: true }).selectOption("720");
    await page.getByRole("button", { name: "9:16 Reels / Story", exact: true }).click();
    await page.waitForTimeout(120);
    await page.screenshot({
      path: `/workspace/screenshots/aura-portrait-fixed-${tag}-${width}.png`,
    });
    const clean = await page.locator(".canvas-frame canvas").evaluate((c) => c.toDataURL());
    await writeFile(
      `/workspace/screenshots/aura-portrait-canvas-${tag}-${width}.png`,
      Buffer.from(clean.split(",")[1], "base64"),
    );
    await page.getByRole("tab", { name: "Görsel", exact: true }).click();
    await page.getByRole("button", { name: "Yazı / şekil", exact: true }).click();
    await page.getByRole("button", { name: "Metin ekle", exact: true }).click();
    await page.getByLabel("Katman metni", { exact: true }).fill("IŞIĞI HİSSET");
    await page.getByLabel("Katman metni", { exact: true }).press("Tab");
    for (const [key, family] of Object.entries(fonts)) {
      await page.getByLabel("Katman yazı tipi", { exact: true }).selectOption(key);
      assert.ok(
        await page.evaluate(async (family) => {
          const loaded = await document.fonts.load(`600 30px "${family}"`, "ÇĞİÖŞÜ çğıöşü");
          return loaded.length > 0 && document.fonts.check(`600 30px "${family}"`, "ÇĞİÖŞÜ çğıöşü");
        }, family),
        family,
      );
    }
    await page.getByLabel("Katman yazı tipi", { exact: true }).selectOption("space");
    assert.equal(await page.getByLabel("Katman animasyonu").locator("option").count(), 11);
    for (const effect of ["neon", "extrude", "gold"])
      await page.getByLabel("Katman yazı efekti").selectOption(effect);
    await page.getByLabel("Katman animasyonu").selectOption("elastic");
    await page.getByRole("button", { name: "Filtre / efekt", exact: true }).click();
    for (const effect of ["grain", "leak", "scanlines", "frame", "dream", "prism"]) {
      await page.getByLabel("Görüntü efekti", { exact: true }).selectOption(effect);
      await page.getByLabel("Görüntü efekt gücü").fill("0.65");
    }
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page.getByLabel("SRT altyazı dosyası", { exact: true }).setInputFiles({
      name: "premium.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from("1\n00:00:00,000 --> 00:00:04,000\nMüziğin ışığı hiç sönmesin\n"),
    });
    await page.getByRole("button", { name: "Görünüm", exact: true }).click();
    await page.getByRole("button", { name: "Animasyonlar", exact: true }).click();
    await page.getByRole("group", { name: "Animasyon türü", exact: true }).getByRole("button", { name: /^Kombo/ }).click();
    const animations = page.getByRole("group", { name: "Altyazı animasyonları", exact: true });
    assert.equal(await animations.getByRole("button").count(), 32);
    for (let i = 0; i < 32; i++) {
      await animations.getByRole("button").nth(i).click();
      assert.equal(await animations.locator('[aria-pressed="true"]').count(), 1);
    }
    await animations.getByRole("button", { name: /^Işık geçişi/ }).click();
    await page.getByRole("button", { name: "Özelleştir", exact: true }).click();
    assert.equal(await page.getByLabel("Altyazı yazı tipi").locator("option").count(), 10);
    await page.getByLabel("Altyazı yazı tipi").selectOption("caveat");
    await page.getByRole("button", { name: "Şablonlar", exact: true }).click();
    await page.getByText("26 hazır görünüm.", { exact: false }).waitFor();
    await page.screenshot({
      path: `/workspace/screenshots/aura-premium-templates-${tag}-${width}.png`,
    });
    await page.getByRole("button", { name: "Kaydet", exact: true }).click();
    const download = page.waitForEvent("download", { timeout: 45000 });
    await page.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
    await (await download).saveAs(`/workspace/screenshots/aura-premium-${tag}-${width}.mp4`);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.deepEqual(errors, []);
    assert.deepEqual(failedFonts, []);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    console.log(
      JSON.stringify({
        tag,
        width,
        ratios: 8,
        newFonts: 6,
        captions: 32,
        templates: 26,
        effects: 6,
        export: true,
        errors,
      }),
    );
    const portrait = await browser.newPage({
      viewport: { width, height: 844 },
      acceptDownloads: true,
    });
    await useRuntimeAssetFetch(portrait);
    await portrait.goto(url);
    await portrait.locator('.aura-studio[data-ready="true"]').waitFor();
    await portrait
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-portrait-fixture.mp4");
    await portrait.waitForFunction(
      () =>
        document.querySelector(".canvas-frame canvas")?.width === 720 &&
        document.querySelector(".canvas-frame canvas")?.height === 1280,
    );
    await portrait.getByRole("button", { name: "Duraklat", exact: true }).click();
    await portrait.waitForTimeout(200);
    const frame = await portrait.locator(".canvas-frame canvas").evaluate((c) => c.toDataURL());
    await writeFile(
      `/workspace/screenshots/aura-source-portrait-${tag}-${width}.png`,
      Buffer.from(frame.split(",")[1], "base64"),
    );
    if (width === 390 || tag === "built") {
      await portrait.getByRole("button", { name: "Kaydet", exact: true }).click();
      if (width === 1280)
        await portrait.getByLabel("Video kalitesi", { exact: true }).selectOption("1080");
      const dl = portrait.waitForEvent("download", { timeout: 45000 });
      await portrait.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
      await (
        await dl
      ).saveAs(
        `/workspace/screenshots/aura-source-portrait-${tag}-${width === 1280 ? "1080" : "720"}.mp4`,
      );
    }
    await portrait.close();
    await page.close();
  }
} finally {
  await browser.close();
}
