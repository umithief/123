import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, acceptDownloads: true });
    await useRuntimeAssetFetch(page);
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    const gallery = page.getByRole("group", { name: "Altyazı şablonları", exact: true });
    await gallery.waitFor();
    assert.equal(await gallery.getByRole("button").count(), 20);
    // The catalogue works before a track/cue exists.
    await page.getByRole("group", { name: "Şablon kategorisi", exact: true }).getByRole("button", { name: "Müzik", exact: true }).click();
    assert.equal(await gallery.getByRole("button").count(), 5);
    await page.getByLabel("Altyazı şablonu ara", { exact: true }).fill("Neon");
    assert.equal(await gallery.getByRole("button").count(), 1);
    await gallery.getByRole("button", { name: "Neon Nane şablonu", exact: true }).click();
    const settings = () => page.evaluate(() => JSON.parse(localStorage.getItem("aura-captions-options")));
    assert.equal((await settings()).glow, 0.85);
    await page.getByLabel("Altyazı şablonu ara", { exact: true }).fill("");
    await page.getByRole("group", { name: "Şablon kategorisi", exact: true }).getByRole("button", { name: "Tümü", exact: true }).click();
    for (let i = 0; i < 20; i++) {
      const button = gallery.getByRole("button").nth(i); await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(await gallery.locator('[aria-pressed="true"]').count(), 1);
    }
    await gallery.getByRole("button", { name: "Viral Sarı şablonu", exact: true }).click();
    assert.equal((await settings()).uppercase, true);
    assert.equal((await settings()).glow, 0);
    await gallery.getByRole("button", { name: "Neon Nane şablonu", exact: true }).click();
    assert.equal((await settings()).uppercase, false);
    await page.getByRole("button", { name: "Özelleştir", exact: true }).click();
    await page.getByLabel("Altyazı yazı tipi", { exact: true }).selectOption("mono");
    await page.getByLabel("Altyazı arka planı", { exact: true }).selectOption("pill");
    await page.getByLabel("Altyazı kontur kalınlığı", { exact: true }).press("End");
    await page.getByRole("button", { name: "Şablonlar", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Özel görünüm" }).waitFor();
    await page.getByRole("button", { name: "Görünümü geri al", exact: true }).click();
    assert.equal((await settings()).highlightColor, "#ffe650");
    // Real content + preset + exported video use the same drawing path.
    await page.getByLabel("Müzik dosyası", { exact: true }).setInputFiles("/workspace/screenshots/aura-caption-track.wav");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByLabel("SRT altyazı dosyası", { exact: true }).setInputFiles({ name: "templates.srt", mimeType: "application/x-subrip", buffer: Buffer.from("1\n00:00:00,000 --> 00:00:08,000\nBu gece ritmi birlikte hissediyoruz\n") });
    await gallery.getByRole("button", { name: "Neon Nane şablonu", exact: true }).click();
    await page.locator("audio").evaluate((audio) => { audio.currentTime = 1.5; });
    await page.getByRole("group", { name: "Şablon kategorisi", exact: true }).getByRole("button", { name: "Müzik", exact: true }).click();
    await page.getByLabel("Altyazı şablonu ara", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/workspace/screenshots/aura-templates-${url.includes("8081") ? "built" : "dev"}-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (width === 1280 && !url.includes("8081")) {
      await page.getByRole("button", { name: "Oynat", exact: true }).click();
      await page.getByRole("button", { name: "MP4 kaydet", exact: true }).click();
      await page.getByRole("button", { name: "Durdur", exact: true }).waitFor();
      await page.waitForTimeout(2300);
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 45000 }), page.getByRole("button", { name: "Durdur", exact: true }).click()]);
      await download.saveAs("/workspace/screenshots/aura-neon-captions.mp4");
    }
    await page.reload();
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    assert.equal(await gallery.getByRole("button", { name: "Neon Nane şablonu", exact: true }).getAttribute("aria-pressed"), "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Animasyonlar", exact: true }).click();
    await page.getByRole("group", { name: "Animasyon türü", exact: true }).getByRole("button", { name: /^Kombo/ }).click();
    await page.getByRole("group", { name: "Animasyon kategorisi", exact: true }).getByRole("button", { name: "Döngü", exact: true }).click();
    assert.equal(await page.getByRole("group", { name: "Altyazı animasyonları", exact: true }).getByRole("button").count(), 2);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, url, templates: 20, categories: true, customization: true, undo: true, reload: true, errors }));
    await page.close();
  }
} finally { await browser.close(); }
