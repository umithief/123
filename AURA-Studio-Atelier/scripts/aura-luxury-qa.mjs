import assert from "node:assert/strict";
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080";
const tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const modes = [
  "Altın Plak",
  "Mücevher",
  "Saten Dalga",
  "Platin Bloklar",
  "Kadife Işık",
  "Kristal Salon",
  "İnci Bulutu",
  "Işık Katedrali",
];
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of [390, 1280]) {
    const p = await browser.newPage({ viewport: { width, height: 844 }, acceptDownloads: true });
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
        if (
          this.canvas.matches(".canvas-frame > canvas") &&
          source instanceof HTMLCanvasElement &&
          source !== this.canvas
        ) {
          window.auraPaints ||= [];
          window.auraPaints.push(performance.now());
        }
        return original.call(this, source, ...args);
      };
    });
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    await p
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    await p.getByRole("button", { name: "Duraklat", exact: true }).click();
    await p.getByRole("button", { name: "Lüks koleksiyon · 8 yeni", exact: true }).click();
    const gallery = p.getByRole("group", { name: "Görselleştirmeler", exact: true });
    assert.equal(await gallery.getByRole("button").count(), 8);
    const thumbnails = await gallery
      .locator("canvas")
      .evaluateAll((cs) => cs.map((c) => c.toDataURL()));
    assert.equal(new Set(thumbnails).size, 8);
    for (const name of modes) {
      await gallery.getByRole("button", { name, exact: true }).click();
      assert.equal(
        await gallery.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"),
        "true",
      );
    }
    const palettes = p.getByRole("group", { name: "Renk teması" });
    assert.equal(await palettes.getByRole("button").count(), 8);
    for (const name of ["Şampanya", "Platin", "Bakır Gül"]) {
      await palettes.getByRole("button", { name, exact: true }).click();
      assert.equal(
        await palettes.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"),
        "true",
      );
    }
    await palettes
      .getByRole("button", { name: width === 390 ? "Şampanya" : "Platin", exact: true })
      .click();
    await gallery
      .getByRole("button", { name: width === 390 ? "Altın Plak" : "Kristal Salon", exact: true })
      .click();
    await p.getByRole("button", { name: "Bütün koleksiyon", exact: true }).click();
    assert.equal(await gallery.getByRole("button").count(), 26);
    await p
      .getByRole("group", { name: "Görselleştirme filtresi" })
      .getByRole("button", { name: "Spektrum", exact: true })
      .click();
    assert.equal(await gallery.getByRole("button").count(), 15);
    await p
      .getByRole("group", { name: "Görselleştirme filtresi" })
      .getByRole("button", { name: "Sahne", exact: true })
      .click();
    assert.equal(await gallery.getByRole("button").count(), 11);
    await p
      .getByRole("group", { name: "Görselleştirme filtresi" })
      .getByRole("button", { name: "Lüks", exact: true })
      .click();
    await p.screenshot({ path: `/workspace/screenshots/aura-luxury-gallery-${tag}-${width}.png` });
    if (width === 390) {
      await p.getByRole("tab", { name: "Kapak", exact: true }).click();
      await p
        .getByLabel("Kapak fotoğrafı dosyası", { exact: true })
        .setInputFiles("/workspace/project/public/og.jpg");
      await p.getByAltText("Yüklenen kapak").waitFor();
      await p.getByLabel("Parça adı", { exact: true }).fill("LÜKS MÜZİK");
    }
    await p.getByRole("button", { name: "Kaydet", exact: true }).click();
    await p.getByRole("button", { name: "9:16 Reels / Story", exact: true }).click();
    await p
      .getByLabel("Video kalitesi", { exact: true })
      .selectOption(width === 390 ? "720" : "1080");
    await p.waitForTimeout(100);
    await p.screenshot({ path: `/workspace/screenshots/aura-luxury-preview-${tag}-${width}.png` });
    await p.evaluate(() => {
      window.auraPaints = [];
    });
    const dl = p.waitForEvent("download", { timeout: 60000 });
    await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
    await (await dl).saveAs(`/workspace/screenshots/aura-luxury-${tag}-${width}.mp4`);
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    const fps = await p.evaluate(() => {
      const frames = window.auraPaints || [];
      const middle = frames.slice(10, -10);
      return middle.length > 2
        ? Math.round(((middle.length - 1) * 1000) / (middle.at(-1) - middle[0]))
        : 0;
    });
    assert.ok(fps >= 12, `render stalled: ${fps} FPS`);
    await p.getByText("Kurgu yedeği · medya dahil", { exact: true }).click();
    const zip = p.waitForEvent("download");
    await p.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    const archive = `/workspace/screenshots/aura-luxury-${tag}-${width}.aura.zip`;
    await (await zip).saveAs(archive);
    await p.getByLabel("Kurgu yedek dosyası", { exact: true }).setInputFiles(archive);
    await p.getByRole("button", { name: "Duraklat", exact: true }).click();
    await p.getByRole("tab", { name: "Görsel", exact: true }).click();
    await p
      .getByRole("button", { name: width === 390 ? "Altın Plak" : "Kristal Salon", exact: true })
      .waitFor();
    assert.equal(
      await p.evaluate(() => localStorage.getItem("aura-mode")),
      width === 390 ? "vinyl" : "chandelier",
    );
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        tag,
        width,
        modes: 8,
        palettes: 3,
        fps,
        export: true,
        archive: true,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
