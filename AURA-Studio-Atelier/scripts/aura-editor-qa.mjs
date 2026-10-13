import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080",
  tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, acceptDownloads: true });
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") console.log("console", m.text());
    });
    await page.goto(url);
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    await page
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByRole("tab", { name: "Müzik", exact: true }).click();
    await page.getByLabel("Kurgu zaman çizelgesi", { exact: true }).fill("2");
    await page.getByRole("button", { name: "Buradan böl", exact: true }).click();
    assert.equal(
      await page.getByRole("group", { name: "Müzik kesimleri" }).getByRole("button").count(),
      2,
    );
    await page.getByRole("button", { name: "Kesim 2", exact: true }).click();
    await page.getByLabel("Oynatma hızı", { exact: true }).selectOption("2");
    await page.getByRole("button", { name: "Kesim 1", exact: true }).click();
    await page.getByLabel("Kesim başlangıcı (sn)", { exact: true }).fill("0.5");
    await page.getByLabel("Kesim başlangıcı (sn)", { exact: true }).press("Tab");
    await page.getByLabel("Ses girişi (sn)", { exact: true }).fill("0.3");
    await page.getByLabel("Ses girişi (sn)", { exact: true }).press("Tab");
    await page.getByRole("button", { name: "Kesimi çoğalt", exact: true }).click();
    assert.equal(
      await page.getByRole("group", { name: "Müzik kesimleri" }).getByRole("button").count(),
      3,
    );
    await page.getByRole("button", { name: "Kurguyu geri al", exact: true }).click();
    assert.equal(
      await page.getByRole("group", { name: "Müzik kesimleri" }).getByRole("button").count(),
      2,
    );
    await page.getByRole("button", { name: "Kurguyu yinele", exact: true }).click();
    assert.equal(
      await page.getByRole("group", { name: "Müzik kesimleri" }).getByRole("button").count(),
      3,
    );
    await page.getByRole("button", { name: "Kurguyu geri al", exact: true }).click();
    await page.getByLabel("Kurgu zaman çizelgesi", { exact: true }).fill("0");
    await page.screenshot({ path: `/workspace/screenshots/aura-editor-cuts-${tag}-${width}.png` });
    await page.getByRole("tab", { name: "Görsel", exact: true }).click();
    await page.getByRole("button", { name: "Fotoğraf / video", exact: true }).click();
    await page
      .getByLabel("Sahne medya dosyaları", { exact: true })
      .setInputFiles("/workspace/project/public/og.jpg");
    await page.getByRole("button", { name: /1\. og\.jpg/ }).waitFor();
    await page
      .getByText("Spektrumu görüntülerin üzerinde göster", { exact: true })
      .locator("..")
      .getByRole("checkbox")
      .uncheck();
    await page.getByLabel("Sahne geçişi", { exact: true }).selectOption("zoom");
    await page.getByRole("button", { name: "Yazı / şekil", exact: true }).click();
    await page.getByRole("button", { name: "Metin ekle", exact: true }).click();
    await page.getByLabel("Katman metni", { exact: true }).fill("BENİM KURGUM");
    await page.getByLabel("Katman metni", { exact: true }).press("Tab");
    const box = await page.locator(".canvas-frame canvas").boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 5 });
    await page.mouse.up();
    assert.ok(Number(await page.getByLabel("Yatay konum (%)", { exact: true }).inputValue()) > 55);

    await page.getByText("Anahtar kareler ve karışım", { exact: true }).click();
    await page.getByRole("button", { name: "Bu ana anahtar kare ekle", exact: true }).click();
    await page.getByRole("button", { name: "Kalp çıkartması ekle", exact: true }).click();
    await page.getByRole("button", { name: "Filtre / efekt", exact: true }).click();
    await page.getByLabel("Görüntü filtresi", { exact: true }).selectOption("vintage");
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page
      .getByRole("button", { name: /Sözleri yapıştır Elindeki doğru metni kullan/ })
      .click();
    await page
      .getByLabel("Şarkı sözleri", { exact: true })
      .fill("Bu doğru cümle\nHiçbir satır kaybolmasın");
    await page.getByRole("button", { name: "Sözleri altyazıya ekle", exact: true }).click();
    await page.getByRole("button", { name: "Metni düzenle", exact: true }).click();
    assert.equal(
      await page.getByLabel("1. altyazı metni", { exact: true }).inputValue(),
      "Bu doğru cümle",
    );
    assert.equal(
      await page.getByLabel("2. altyazı metni", { exact: true }).inputValue(),
      "Hiçbir satır kaybolmasın",
    );
    await page.getByRole("tab", { name: "Müzik", exact: true }).click();
    await page.getByText("Ek ses ve seslendirme", { exact: true }).first().click();
    await page
      .getByLabel("Ek ses dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    await page.getByRole("button", { name: "Ek sesi sil", exact: true }).waitFor();
    await page.getByRole("button", { name: "Kaydet", exact: true }).click();
    await page.getByText("Kurgu yedeği · medya dahil", { exact: true }).click();
    const archive = page.waitForEvent("download");
    await page.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    await (await archive).saveAs(`/workspace/screenshots/aura-editor-${tag}-${width}.aura.zip`);
    await page.getByRole("button", { name: "9:16 Reels / Story", exact: true }).click();
    await page.screenshot({
      path: `/workspace/screenshots/aura-editor-export-${tag}-${width}.png`,
    });
    await page.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Hazırlamayı iptal et", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    const video = page.waitForEvent("download", { timeout: 30000 });
    await page.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
    await (await video).saveAs(`/workspace/screenshots/aura-editor-${tag}-${width}.mp4`);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.ok(
      await page
        .locator("audio")
        .first()
        .evaluate((a) => a.paused),
    );
    const wav = page.waitForEvent("download", { timeout: 30000 });
    await page.getByRole("button", { name: "Yalnızca sesi kaydet · WAV", exact: true }).click();
    await (await wav).saveAs(`/workspace/screenshots/aura-editor-${tag}-${width}.wav`);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page
      .getByLabel("Kurgu yedek dosyası", { exact: true })
      .setInputFiles(`/workspace/screenshots/aura-editor-${tag}-${width}.aura.zip`);
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByRole("tab", { name: "Müzik", exact: true }).click();
    assert.equal(
      await page.getByRole("group", { name: "Müzik kesimleri" }).getByRole("button").count(),
      2,
    );
    await page.getByRole("tab", { name: "Görsel", exact: true }).click();
    await page.getByRole("button", { name: "Yazı / şekil", exact: true }).click();
    await page.getByRole("button", { name: /BENİM KURGUM/ }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({
      path: `/workspace/screenshots/aura-editor-layers-${tag}-${width}.png`,
    });
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        url,
        width,
        cuts: true,
        speed: true,
        undoRedo: true,
        media: true,
        layers: true,
        lyricsExact: true,
        mixedAudio: true,
        archiveRestore: true,
        export: true,
        errors,
      }),
    );
    // A video can start a project; its image follows source cuts and playback rate.
    const v = await browser.newPage({ viewport: { width, height: 844 } });
    await useRuntimeAssetFetch(v);
    await v.goto(url);
    await v.locator('.aura-studio[data-ready="true"]').waitFor();
    await v
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-editor-source.mp4");
    if (await v.getByRole("button", { name: "Duraklat", exact: true }).isVisible())
      await v.getByRole("button", { name: "Duraklat", exact: true }).click();
    await v.screenshot({
      path: `/workspace/screenshots/aura-editor-video-source-${tag}-${width}.png`,
    });
    if (await v.getByRole("alert").count())
      throw new Error(await v.getByRole("alert").first().innerText());
    await v.getByRole("button", { name: "Fotoğraf / video", exact: true }).click();
    await v.getByRole("button", { name: /aura-editor-source\.mp4/ }).waitFor();
    await v.getByRole("tab", { name: "Müzik", exact: true }).click();
    await v.getByLabel("Oynatma hızı", { exact: true }).selectOption("2");
    await v.getByRole("button", { name: "Kaydet", exact: true }).click();
    const vd = v.waitForEvent("download", { timeout: 30000 });
    await v.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
    await (await vd).saveAs(`/workspace/screenshots/aura-editor-video-${tag}-${width}.mp4`);
    console.log(JSON.stringify({ videoSource: true, width }));
    await v.close();
    await page.close();
  }
} finally {
  await browser.close();
}
