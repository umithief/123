import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080",
  tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of (process.env.QA_WIDTHS || "390,1280,320").split(",").map(Number)) {
    const p = await browser.newPage({
      viewport: { width, height: width === 320 ? 600 : 844 },
      acceptDownloads: true,
    });
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    await p
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    const clips = p.getByRole("group", { name: "Ana klipler", exact: true });
    await clips.getByRole("button", { name: /Klip 1 ·/ }).waitFor();
    await p.waitForFunction(() => document.querySelector("audio").paused);
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "none");
    assert.equal(await p.locator(".studio-inspector").isVisible(), false);
    assert.ok(await p.getByRole("navigation", { name: "Video düzenleme araçları" }).isVisible());
    await p.screenshot({ path: `/workspace/screenshots/aura-timeline-home-${tag}-${width}.png` });
    // Trim gesture changes the actual source cut, with one undo entry for the entire drag.
    const handle = p.getByRole("button", { name: "Klip 1 başlangıcını kırp", exact: true });
    let box = await handle.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width / 2 + 26, box.y + box.height / 2, { steps: 6 });
    await p.mouse.up();
    await clips.getByRole("button", { name: /Klip 1 ·/ }).click();
    const trimmed = Number(
      await p.getByLabel("Kesim başlangıcı (sn)", { exact: true }).inputValue(),
    );
    assert.ok(trimmed > 0.3 && trimmed < 0.8, trimmed);
    await p.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).click();
    assert.equal(
      Number(await p.getByLabel("Kesim başlangıcı (sn)", { exact: true }).inputValue()),
      0,
    );
    await p.getByRole("button", { name: "Son düzenlemeyi yinele", exact: true }).click();
    assert.ok(
      Number(await p.getByLabel("Kesim başlangıcı (sn)", { exact: true }).inputValue()) > 0.3,
    );
    await p.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).click();
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "none");
    const firstClip = clips.getByRole("button", { name: /Klip 1 ·/ });
    const zoomBefore = (await firstClip.boundingBox()).width;
    await p.getByRole("button", { name: "Zaman çizelgesini yakınlaştır", exact: true }).click();
    await p.getByRole("button", { name: "Zaman çizelgesini yakınlaştır", exact: true }).click();
    assert.ok((await firstClip.boundingBox()).width > zoomBefore);
    await p.getByRole("button", { name: "Zaman çizelgesini uzaklaştır", exact: true }).click();
    await p.getByRole("button", { name: "Zaman çizelgesini uzaklaştır", exact: true }).click();
    const ruler = p.getByRole("slider", { name: "Zaman çizelgesinde gezin", exact: true });
    await ruler.focus();
    await p.keyboard.press("Home");
    for (let i = 0; i < 20; i++) await p.keyboard.press("ArrowRight");
    assert.ok(
      Math.abs(Number(await ruler.getAttribute("aria-valuenow")) - 2) < 0.03,
      await ruler.getAttribute("aria-valuenow"),
    );
    await p.getByRole("button", { name: "Böl", exact: true }).click();
    assert.equal(await p.locator(".source-clip-button").count(), 2);
    await clips.getByRole("button", { name: /Klip 2 ·/ }).click();
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "cuts");
    await p.getByLabel("Oynatma hızı", { exact: true }).selectOption("2");
    await p.screenshot({ path: `/workspace/screenshots/aura-timeline-cuts-${tag}-${width}.png` });
    assert.ok(
      await p
        .locator(".source-clip-button")
        .nth(1)
        .textContent()
        .then((s) => s.includes("2×")),
    );
    await p.getByRole("button", { name: "Seçili klibi çoğalt", exact: true }).click();
    assert.equal(await p.locator(".source-clip-button").count(), 3);
    await p.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).click();
    assert.equal(await p.locator(".source-clip-button").count(), 2);
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    const dock = p.getByRole("navigation", { name: "Video düzenleme araçları", exact: true });
    await dock.getByRole("button", { name: "Metin", exact: true }).click();
    await p.getByRole("button", { name: "Metin ekle", exact: true }).click();
    await p.getByLabel("Katman metni", { exact: true }).fill("BENİM KURGUM");
    await p.getByLabel("Katman metni", { exact: true }).press("Tab");
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    await p.getByRole("button", { name: "Katman: BENİM KURGUM", exact: true }).click();
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "layers");
    assert.equal(await p.getByLabel("Katman metni", { exact: true }).inputValue(), "BENİM KURGUM");
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    const canvas = p.locator(".canvas-frame canvas");
    box = await canvas.boundingBox();
    await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 5 });
    await p.mouse.up();
    await p.getByLabel("Yatay konum (%)", { exact: true }).waitFor();
    assert.ok(Number(await p.getByLabel("Yatay konum (%)", { exact: true }).inputValue()) > 55);
    await dock.getByRole("button", { name: "Medya", exact: true }).click();
    await p
      .getByLabel("Sahne medya dosyaları", { exact: true })
      .setInputFiles("/workspace/project/public/og.jpg");
    await p.getByRole("button", { name: /1\. og\.jpg/ }).waitFor();
    await p.getByLabel("Sahne geçişi", { exact: true }).selectOption("zoom");
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    await p.getByRole("button", { name: "Görüntü: og.jpg", exact: true }).click();
    assert.equal(await p.getByLabel("Sahne geçişi", { exact: true }).inputValue(), "zoom");
    await dock.getByRole("button", { name: "Altyazı", exact: true }).click();
    await p
      .getByRole("button", { name: /SRT dosyası yükle Zamanlanmış altyazıyı içe aktar/ })
      .click();
    let srt = "";
    for (let i = 0; i < 10; i++) {
      const start = i * 350,
        end = start + 300,
        stamp = (n) =>
          `00:00:${String(Math.floor(n / 1000)).padStart(2, "0")},${String(n % 1000).padStart(3, "0")}`;
      srt += `${i + 1}\n${stamp(start)} --> ${stamp(end)}\nDoğru satır ${i + 1}\n\n`;
    }
    await p.getByLabel("SRT altyazı dosyası", { exact: true }).setInputFiles({
      name: "sozler.srt",
      mimeType: "application/x-subrip",
      buffer: Buffer.from(srt),
    });
    await p
      .getByRole("button", { name: "Metni düzenle", exact: true })
      .waitFor({ state: "visible" });
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    await p.getByRole("button", { name: "Altyazı: Doğru satır 10", exact: true }).click();
    assert.equal(
      await p.getByLabel("10. altyazı metni", { exact: true }).inputValue(),
      "Doğru satır 10",
    );
    await p.getByLabel("10. altyazı metni", { exact: true }).fill("Düzeltilen son satır");
    await p.getByLabel("10. altyazı metni", { exact: true }).press("Tab");
    await p.screenshot({
      path: `/workspace/screenshots/aura-timeline-caption-${tag}-${width}.png`,
    });
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    await p.getByRole("button", { name: "Altyazı: Düzeltilen son satır", exact: true }).waitFor();
    await dock.getByRole("button", { name: "Spektrum", exact: true }).click();
    await p.getByLabel("Sahne ara", { exact: true }).fill("Inci");
    await p.getByRole("button", { name: "İnci Bulutu", exact: true }).click();
    await p.getByRole("button", { name: "Araçlar", exact: true }).click();
    await p.getByRole("dialog").waitFor();
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "scenes");
    await p.getByRole("button", { name: "Araçlar", exact: true }).click();
    await p.getByLabel("Araç ara", { exact: true }).fill("seslendirme");
    await p
      .getByRole("dialog")
      .getByRole("button", { name: /Ek ses ve seslendirme/ })
      .click();
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "voice");
    await p
      .getByLabel("Ek ses dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    await p.getByRole("button", { name: "Ek sesi sil", exact: true }).waitFor();
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    assert.equal(
      await p.getByRole("group", { name: "Ek ses satırı" }).getByRole("button").count(),
      1,
    );
    await p.getByRole("button", { name: "Dışa aktar", exact: true }).click();
    await p.getByRole("button", { name: "9:16 Reels / Story", exact: true }).click();
    await p.waitForFunction(() => {
      const c = document.querySelector(".canvas-frame canvas");
      return c.width === 720 && c.height === 1280;
    });
    const b = await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).boundingBox();
    assert.ok(b.y >= 0 && b.y + b.height <= p.viewportSize().height);
    await p.screenshot({ path: `/workspace/screenshots/aura-timeline-export-${tag}-${width}.png` });
    if (width !== 320) {
      const expectedDuration = Number(
        await p.locator(".timeline-ruler").getAttribute("aria-valuemax"),
      );
      const video = p.waitForEvent("download", { timeout: 60000 });
      await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
      const outputPath = `/workspace/screenshots/aura-timeline-${tag}-${width}.mp4`;
      await (await video).saveAs(outputPath);
      await p.getByRole("dialog").waitFor({ state: "hidden" });
      const probe = JSON.parse(
        execFileSync(
          "ffprobe",
          [
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_name,width,height,channels,duration",
            "-of",
            "json",
            outputPath,
          ],
          { encoding: "utf8" },
        ),
      );
      assert.ok(
        Number(probe.format.duration) <= expectedDuration + 0.45,
        JSON.stringify({ expectedDuration, probe }),
      );
      assert.ok(
        Number(probe.format.duration) >= expectedDuration - 0.05,
        JSON.stringify({ expectedDuration, probe }),
      );
      assert.ok(
        probe.streams.some((s) => s.codec_name === "h264" && s.width === 720 && s.height === 1280),
      );
      assert.ok(probe.streams.some((s) => s.channels === 2));
      const picture = probe.streams.find((s) => s.width),
        sound = probe.streams.find((s) => s.channels);
      assert.ok(
        Math.abs(Number(picture.duration) - Number(sound.duration)) < 0.06,
        JSON.stringify(probe),
      );
    }
    await p.getByText("Kurgu yedeği · medya dahil", { exact: true }).click();
    const backup = p.waitForEvent("download");
    await p.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    const path = `/workspace/screenshots/aura-timeline-${tag}-${width}.aura.zip`;
    await (await backup).saveAs(path);
    await p.getByLabel("Kurgu yedek dosyası", { exact: true }).setInputFiles(path);
    await p.waitForFunction(() => document.querySelector(".aura-studio").dataset.tool === "none");
    assert.equal(await p.locator(".source-clip-button").count(), 2);
    assert.equal(
      await p.getByRole("button", { name: "Altyazı: Düzeltilen son satır", exact: true }).count(),
      1,
    );
    await p.getByRole("button", { name: "Araçlar", exact: true }).click();
    await p.getByRole("button", { name: "Tüm araçlar", exact: true }).click();
    assert.ok(await p.locator(".advanced-editor").isVisible());
    await p.getByRole("tab", { name: "Ses", exact: true }).click();
    assert.equal(
      await p.getByRole("group", { name: "Müzik kesimleri" }).getByRole("button").count(),
      2,
    );
    await p.getByRole("button", { name: "Araçlar", exact: true }).click();
    await p.getByRole("button", { name: "Kolay düzenle", exact: true }).click();
    assert.ok(await p.locator(".timeline-editor").isVisible());
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "none");
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        url,
        width,
        dragTrim: true,
        singleUndo: true,
        zoom: true,
        scrub: true,
        split: true,
        speed: true,
        layers: true,
        canvasDrag: true,
        media: true,
        captionFocusPage2: true,
        sound: true,
        export: width !== 320,
        backup: true,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
