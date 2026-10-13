import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const subtitles =
  "1\n00:00:01,000 --> 00:00:14,000\nMüziğin ritmini birlikte hissediyoruz\n\n2\n00:00:20,000 --> 00:00:32,000\nYeni bir sahne yeni bir şarkı\n";
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, acceptDownloads: true });
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector("canvas")?.width > 300);
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: "Altyazı oluştur", exact: true }).isDisabled(),
      true,
    );
    await page
      .locator('input[type="file"][accept^="audio/"]')
      .setInputFiles("/workspace/screenshots/aura-caption-track.wav");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByLabel("SRT altyazı dosyası", { exact: true }).setInputFiles({
      name: "bad.srt",
      mimeType: "text/plain",
      buffer: Buffer.from("bad captions"),
    });
    await page.getByRole("alert").filter({ hasText: "Geçerli zaman damgalı" }).waitFor();
    await page.getByLabel("SRT altyazı dosyası", { exact: true }).setInputFiles({
      name: "captions.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from(subtitles),
    });
    await page.getByLabel("1. altyazı metni", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("2. altyazı metni", { exact: true }).inputValue(),
      "Yeni bir sahne yeni bir şarkı",
    );
    await page
      .getByLabel("1. altyazı metni", { exact: true })
      .fill("Altyazı müzikle birlikte akıyor");
    await page.getByLabel("1. altyazı başlangıcı", { exact: true }).fill("2.25");
    await page.getByLabel("1. altyazı bitişi", { exact: true }).focus();
    await page.getByLabel("1. altyazı bitişi", { exact: true }).fill("61");
    await page.getByLabel("1. altyazı metni", { exact: true }).focus();
    await page.getByRole("alert").filter({ hasText: "Başlangıç bitişten" }).waitFor();
    await page.getByLabel("1. altyazı bitişi", { exact: true }).fill("13.5");
    await page.getByLabel("1. altyazı metni", { exact: true }).focus();
    await page.getByRole("button", { name: "Klasik", exact: true }).click();
    await page.getByLabel("Altyazı konumu", { exact: true }).selectOption("bottom");
    const offset = page.getByLabel("Altyazı zaman kaydırma", { exact: true });
    await offset.press("Home"); // Keyboard changes the real range input.
    await offset.evaluate((el) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "0.5");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.getByRole("button", { name: "1. altyazıya git", exact: true }).click();
    await page.waitForFunction(
      () => Math.abs(document.querySelector("audio").currentTime - 2.75) < 0.15,
    );
    const [srt] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "SRT indir", exact: true }).click(),
    ]);
    await srt.saveAs(`/workspace/screenshots/aura-edited-${viewport.width}.srt`);
    const content = await readFile(
      `/workspace/screenshots/aura-edited-${viewport.width}.srt`,
      "utf8",
    );
    assert.match(content, /00:00:02,750 --> 00:00:14,000/);
    assert.match(content, /Altyazı müzikle birlikte akıyor/);
    await page.screenshot({
      path: `/workspace/screenshots/aura-caption-editor-${viewport.width}.png`,
    });
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page.getByRole("button", { name: "Oynat", exact: true }).click();
    if (viewport.width === 1280) {
      await page.getByRole("button", { name: "MP4 kaydet", exact: true }).click();
      await page.getByRole("button", { name: "Durdur", exact: true }).waitFor();
      await page.waitForTimeout(3000);
      const [mp4] = await Promise.all([
        page.waitForEvent("download", { timeout: 30000 }),
        page.getByRole("button", { name: "Durdur", exact: true }).click(),
      ]);
      await mp4.saveAs("/workspace/screenshots/aura-caption-recording.mp4");
    }
    await page.waitForTimeout(2800);
    await page.screenshot({
      path: `/workspace/screenshots/aura-caption-stage-${viewport.width}.png`,
    });
    await page.mouse.move(10, 10);
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page.getByRole("button", { name: "2. altyazıyı sil", exact: true }).click();
    assert.equal(await page.getByLabel("2. altyazı metni", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Tümünü temizle", exact: true }).click();
    await page.getByLabel("1. altyazı metni", { exact: true }).waitFor({ state: "hidden" });
    await page.getByLabel("SRT altyazı dosyası", { exact: true }).setInputFiles({
      name: "captions.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from(subtitles),
    });
    await page.getByLabel("1. altyazı metni", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Örnek", exact: true }).click();
    await page.getByLabel("1. altyazı metni", { exact: true }).waitFor({ state: "hidden" });
    assert.equal(
      await page.getByRole("button", { name: "Altyazı oluştur", exact: true }).isDisabled(),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        viewport,
        import: true,
        edit: true,
        seek: true,
        export: true,
        trackReset: true,
        errors,
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
