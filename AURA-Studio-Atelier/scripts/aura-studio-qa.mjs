import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const speech =
  "1\n00:00:00,000 --> 00:00:40,000\nMüziğin ritmini birlikte hissediyoruz\n\n2\n00:00:42,000 --> 00:00:52,000\nYeni bir sahne yeni bir şarkı\n";
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, acceptDownloads: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await useRuntimeAssetFetch(page);
    await page.goto(url);
    await page.waitForFunction(
      () => document.querySelector(".canvas-frame canvas")?.width === 1280,
    );
    await page.getByRole("tab", { name: "Proje", exact: true }).click();
    await page.getByRole("button", { name: "Dikey video (9:16)", exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector(".canvas-frame canvas").width === 720 &&
        document.querySelector(".canvas-frame canvas").height === 1280,
    );
    assert.equal(
      await page.getByRole("button", { name: "MP4 kaydet", exact: true }).isDisabled(),
      true,
    );
    // Welcome is usable even in a narrow portrait preview.
    const welcome = await page.locator(".stage-welcome").boundingBox();
    assert.ok(welcome.width > 300);
    await page.getByLabel("Video çözünürlüğü", { exact: true }).selectOption("1080");
    await page.waitForFunction(
      () => document.querySelector(".canvas-frame canvas").height === 1920,
    );
    await page.getByLabel("Video çözünürlüğü", { exact: true }).selectOption("720");
    await page
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-caption-track.wav");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByRole("button", { name: "Parçayı tekrarla", exact: true }).click();
    assert.equal(await page.locator("audio").evaluate((a) => a.loop), true);
    const seek = page.getByLabel("Çalma konumu", { exact: true });
    await seek.focus();
    await seek.press("Home");
    await seek.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector("audio").currentTime > 0.05);
    // Global shortcuts never alter timing when a field owns the keyboard.
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => document.querySelector("audio").currentTime > 5);
    await page.getByRole("button", { name: "Başa dön", exact: true }).click();
    await page.getByRole("tab", { name: "Görsel", exact: true }).click();
    await page.getByRole("button", { name: "DNA", exact: true }).click();
    await page.getByLabel("Parça adı", { exact: true }).fill("Gece Akışı");
    await page
      .getByRole("group", { name: "Yazı konumu", exact: true })
      .getByRole("button", { name: "Üst", exact: true })
      .click();
    await page
      .getByLabel("Kapak fotoğrafı dosyası", { exact: true })
      .setInputFiles("public/og.jpg");
    await page.getByRole("img", { name: "Yüklenen kapak", exact: true }).waitFor();
    await page.getByRole("tab", { name: "Ses", exact: true }).click();
    await page.getByRole("button", { name: "Vokal", exact: true }).click();
    assert.equal(await page.getByLabel("Orta frekans kazancı", { exact: true }).inputValue(), "3");
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page
      .getByLabel("SRT altyazı dosyası", { exact: true })
      .setInputFiles({
        name: "lyrics.srt",
        mimeType: "application/x-subrip",
        buffer: Buffer.from(speech),
      });
    await page
      .getByLabel("1. altyazı metni", { exact: true })
      .fill("Altyazı müzikle birlikte akıyor");
    await page.getByRole("button", { name: "2. altyazıyı sil", exact: true }).click();
    await page.getByRole("button", { name: "Geri al", exact: true }).click();
    assert.equal(await page.getByLabel("2. altyazı metni", { exact: true }).count(), 1);
    await page.getByRole("button", { name: "Satır ekle", exact: true }).click();
    assert.equal(await page.locator('textarea[aria-label$="altyazı metni"]').count(), 3);
    await page.getByRole("button", { name: "Geri al", exact: true }).click();
    await page.getByLabel("Altyazılarda ara", { exact: true }).fill("Yeni bir");
    assert.equal(await page.locator('textarea[aria-label$="altyazı metni"]').count(), 1);
    await page.getByLabel("Altyazılarda ara", { exact: true }).fill("");
    const [srt] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "SRT indir", exact: true }).click(),
    ]);
    await srt.saveAs(`/workspace/screenshots/aura-pro-${viewport.width}.srt`);
    assert.match(
      await readFile(`/workspace/screenshots/aura-pro-${viewport.width}.srt`, "utf8"),
      /Altyazı müzikle birlikte akıyor/,
    );
    await page.screenshot({
      path: `/workspace/screenshots/aura-pro-captions-${viewport.width}.png`,
    });
    await page.getByRole("tab", { name: "Proje", exact: true }).click();
    await page.getByLabel("Hazır ayar adı", { exact: true }).fill("Gece seti");
    await page.getByRole("button", { name: "Hazır ayarı kaydet", exact: true }).click();
    await page
      .locator(".saved-look > button:first-child")
      .filter({ hasText: "Gece seti" })
      .waitFor();
    const [backup] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Yedekle", exact: true }).click(),
    ]);
    await backup.saveAs(`/workspace/screenshots/aura-pro-${viewport.width}.json`);
    const settings = JSON.parse(
      await readFile(`/workspace/screenshots/aura-pro-${viewport.width}.json`, "utf8"),
    );
    assert.equal(settings.mode, "helix");
    assert.equal(settings.format, "portrait");
    assert.equal(settings.music.mid, 3);
    await page.getByRole("button", { name: "Yatay video (16:9)", exact: true }).click();
    await page.locator(".saved-look > button:first-child").filter({ hasText: "Gece seti" }).click();
    await page.waitForFunction(
      () => document.querySelector(".canvas-frame canvas").height === 1280,
    );
    await page
      .getByLabel("AURA ayar dosyası", { exact: true })
      .setInputFiles({
        name: "bad.json",
        mimeType: "application/json",
        buffer: Buffer.from('{"version":2}'),
      });
    await page.getByRole("alert").filter({ hasText: "desteklenen" }).waitFor();
    await page
      .getByLabel("AURA ayar dosyası", { exact: true })
      .setInputFiles(`/workspace/screenshots/aura-pro-${viewport.width}.json`);
    await page.getByRole("status").filter({ hasText: "Ayar yedeği yüklendi" }).waitFor();
    // A native PNG download has the same aspect and dimensions as the planned MP4.
    const [png] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Sahneyi PNG olarak indir", exact: true }).click(),
    ]);
    await png.saveAs(`/workspace/screenshots/aura-pro-frame-${viewport.width}.png`);
    await page.getByRole("button", { name: "Dinlemeyi sessize al", exact: true }).click();
    await page.getByRole("button", { name: "Oynat", exact: true }).click();
    if (viewport.width === 1280) {
      await page.getByRole("button", { name: "MP4 kaydet", exact: true }).click();
      await page.getByRole("button", { name: "Durdur", exact: true }).waitFor();
      assert.equal(await page.getByLabel("Video çözünürlüğü", { exact: true }).isDisabled(), true);
      await page.setViewportSize({ width: 1100, height: 760 });
      await page.waitForTimeout(2500);
      const [video] = await Promise.all([
        page.waitForEvent("download", { timeout: 45000 }),
        page.getByRole("button", { name: "Durdur", exact: true }).click(),
      ]);
      await video.saveAs("/workspace/screenshots/aura-pro-portrait.mp4");
      await page.getByRole("button", { name: "Tekrar indir", exact: true }).waitFor();
      await page.setViewportSize(viewport);
    }
    await page.getByRole("button", { name: "Sahne görünümünü aç", exact: true }).click();
    assert.equal(await page.getByRole("tablist").isVisible(), false);
    await page.screenshot({ path: `/workspace/screenshots/aura-pro-stage-${viewport.width}.png` });
    await page.getByRole("button", { name: "Stüdyoya dön", exact: true }).click();
    await page.getByRole("tab", { name: "Proje", exact: true }).click();
    await page.screenshot({
      path: `/workspace/screenshots/aura-pro-project-${viewport.width}.png`,
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    // Reload restores settings and the cover but never auto-plays a previous private file.
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector(".aura-studio")?.dataset.ready === "true",
    );
    await page.getByRole("tab", { name: "Proje", exact: true }).click();
    await page
      .locator(".saved-look > button:first-child")
      .filter({ hasText: "Gece seti" })
      .waitFor();
    await page.getByRole("tab", { name: "Görsel", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: "DNA", exact: true }).getAttribute("aria-pressed"),
      "true",
    );
    await page.getByRole("img", { name: "Yüklenen kapak", exact: true }).waitFor();
    await page.getByRole("button", { name: "Mikrofon", exact: true }).click();
    await page.getByRole("button", { name: "Mikrofonu kapat", exact: true }).waitFor();
    await page.getByRole("button", { name: "Mikrofonu kapat", exact: true }).click();
    await page.getByRole("button", { name: "Örnek", exact: true }).click();
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: "Altyazı oluştur", exact: true }).isDisabled(),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        viewport,
        transport: true,
        settings: true,
        captions: true,
        artwork: true,
        recording: viewport.width === 1280,
        errors,
      }),
    );
    await page.close();
  }
} catch (error) {
  const page = browser.contexts().flatMap((c) => c.pages())[0];
  if (page) {
    await page.screenshot({ path: "/workspace/screenshots/aura-pro-failure.png" });
    console.log((await page.locator("body").innerText()).slice(-1800));
  }
  throw error;
} finally {
  await browser.close();
}
