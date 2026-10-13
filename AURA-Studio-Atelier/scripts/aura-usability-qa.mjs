import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080";
const tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of [390, 1280, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 320 ? 600 : 844 },
      acceptDownloads: true,
    });
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    assert.ok(
      await page.getByRole("button", { name: "Medya seç ve başla", exact: true }).isVisible(),
    );
    await page
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-easy-track.mp3");
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    const canvas = page.locator(".canvas-frame > canvas");
    const original = await canvas.evaluate((c) => [c.width, c.height]);
    let gained = 0;
    if (width < 700) {
      const before = await page.locator(".inspector-scroll").evaluate((e) => e.clientHeight);
      await page.getByRole("button", { name: "Küçült", exact: true }).click();
      assert.equal(
        await page.locator("#studio-preview").evaluate((e) => getComputedStyle(e).visibility),
        "hidden",
      );
      gained = (await page.locator(".inspector-scroll").evaluate((e) => e.clientHeight)) - before;
      assert.ok(gained >= 70, { gained, width });
      assert.deepEqual(await canvas.evaluate((c) => [c.width, c.height]), original);
      assert.ok(await page.getByRole("button", { name: "Oynat", exact: true }).isVisible());
    }
    await page.getByLabel("Sahne ara", { exact: true }).fill("Inci");
    const gallery = page.getByRole("group", { name: "Görselleştirmeler", exact: true });
    assert.equal(await gallery.getByRole("button").count(), 1);
    await gallery.getByRole("button", { name: "İnci Bulutu", exact: true }).click();
    await page.getByLabel("Sahne ara", { exact: true }).fill("bulunmayan sahne");
    assert.equal(await gallery.getByRole("button").count(), 0);
    await page.getByRole("button", { name: "Sahne aramasını temizle", exact: true }).click();
    assert.equal(await gallery.getByRole("button").count(), 26);
    // Search is a real route into tools, with keyboard dismissal and focus return.
    async function tool(query, name) {
      await page.getByRole("button", { name: "Araçlar", exact: true }).click();
      await page.getByLabel("Araç ara", { exact: true }).fill(query);
      await page.getByRole("dialog").getByRole("button", { name }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    }
    await page.getByRole("button", { name: "Araçlar", exact: true }).click();
    await page.getByLabel("Araç ara", { exact: true }).fill("olmayan arac");
    assert.ok(await page.getByRole("status").filter({ hasText: "araç bulunamadı" }).isVisible());
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .getByRole("button", { name: "Araçlar", exact: true })
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await tool("hiz", /Kes, böl ve hızlandır/);
    assert.equal(
      await page.getByRole("tab", { name: "Müzik", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await tool("ekolayzir", /Ses efektleri ve ritim/);
    assert.equal(
      await page
        .getByText("Ses efektleri ve ritim", { exact: true })
        .locator("..")
        .getAttribute("open"),
      "",
    );
    await tool("seslendirme", /Ek ses ve seslendirme/);
    assert.equal(
      await page
        .getByText("Ek ses ve seslendirme", { exact: true })
        .first()
        .locator("..")
        .getAttribute("open"),
      "",
    );
    await tool("yazi", /Yazı ve şekil ekle/);
    assert.equal(
      await page
        .getByRole("button", { name: "Yazı / şekil", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.getByRole("button", { name: "Metin ekle", exact: true }).click();
    assert.ok(
      await page.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).isEnabled(),
    );
    await page.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).click();
    assert.ok(
      await page.getByRole("button", { name: "Son düzenlemeyi yinele", exact: true }).isEnabled(),
    );
    await page.getByRole("button", { name: "Son düzenlemeyi yinele", exact: true }).click();
    await page.getByRole("tab", { name: "Görsel", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.getByRole("tab", { name: "Kapak", exact: true }).getAttribute("aria-selected"),
      "true",
    );
    await page
      .getByLabel("Kapak fotoğrafı dosyası", { exact: true })
      .setInputFiles("/workspace/project/public/og.jpg");
    await page.getByAltText("Yüklenen kapak").waitFor();
    assert.equal(
      await page
        .getByText("Kapak konumu ve görünümü", { exact: true })
        .locator("..")
        .getAttribute("open"),
      null,
    );
    await page.getByLabel("Parça adı", { exact: true }).fill("BENİM VİDEOM");
    await page.getByText("Başlık konumu ve yazı stili", { exact: true }).click();
    assert.ok(await page.getByRole("group", { name: "Yazı stili", exact: true }).isVisible());
    await page.getByRole("button", { name: "Altyazıya geç", exact: true }).click();
    await page
      .getByRole("button", { name: /Sözleri yapıştır Elindeki doğru metni kullan/ })
      .click();
    await page
      .getByLabel("Şarkı sözleri", { exact: true })
      .fill("Sözlerim aynen korunsun\nHiçbir cümle kaybolmasın");
    await page.getByRole("button", { name: "Sözleri altyazıya ekle", exact: true }).click();
    assert.equal(
      await page.getByLabel("1. altyazı metni", { exact: true }).inputValue(),
      "Sözlerim aynen korunsun",
    );
    assert.equal(
      await page.getByLabel("2. altyazı metni", { exact: true }).inputValue(),
      "Hiçbir cümle kaybolmasın",
    );
    await page.getByRole("button", { name: "Oluştur", exact: true }).click();
    await page
      .getByRole("button", { name: /SRT dosyası yükle Zamanlanmış altyazıyı içe aktar/ })
      .click();
    assert.equal(
      await page.getByRole("button", { name: "Altyazı oluştur", exact: true }).isVisible(),
      false,
    );
    await page
      .getByLabel("SRT altyazı dosyası", { exact: true })
      .setInputFiles({
        name: "sozler.srt",
        mimeType: "application/x-subrip",
        buffer: Buffer.from(
          "1\n00:00:00,000 --> 00:00:01,500\nİlk doğru satır\n\n2\n00:00:01,500 --> 00:00:03,000\nİkinci doğru satır\n",
        ),
      });
    await page.getByRole("button", { name: "Metni düzenle", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('[aria-label="1. altyazı metni"]')?.value === "İlk doğru satır",
    );
    await page.getByRole("button", { name: "Görünüm", exact: true }).click();
    assert.ok(await page.getByRole("button", { name: "Şablonlar", exact: true }).isVisible());
    await page.getByRole("button", { name: "Kaydetmeye geç", exact: true }).click();
    await page.getByRole("button", { name: "9:16 Reels / Story", exact: true }).click();
    await page.waitForFunction(() => {
      const c = document.querySelector(".canvas-frame > canvas");
      return c.width === 720 && c.height === 1280;
    });
    if (width < 700) {
      await page.getByRole("button", { name: "Önizlemeyi göster", exact: true }).click();
      const bounds = await canvas.boundingBox();
      assert.ok(Math.abs(bounds.width / bounds.height - 9 / 16) < 0.01);
    }
    await page.locator('.inspector-scroll').evaluate((node) => { node.scrollTop = 0; });
    const exportButton = await page.getByRole('button', { name: 'Videoyu hazırla', exact: true }).boundingBox();
    assert.ok(exportButton.y >= 0 && exportButton.y + exportButton.height <= (width === 320 ? 600 : 844));
    await page.screenshot({
      path: `/workspace/screenshots/aura-usability-export-${tag}-${width}.png`,
    });
    if (width !== 320) {
      const download = page.waitForEvent("download", { timeout: 60000 });
      await page.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
      await (await download).saveAs(`/workspace/screenshots/aura-usability-${tag}-${width}.mp4`);
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    }
    await tool("yedek", /Kurguyu yedekle/);
    assert.equal(
      await page
        .getByText("Kurgu yedeği · medya dahil", { exact: true })
        .locator("..")
        .getAttribute("open"),
      "",
    );
    const archive = page.waitForEvent("download");
    await page.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    const archivePath = `/workspace/screenshots/aura-usability-${tag}-${width}.aura.zip`;
    await (await archive).saveAs(archivePath);
    await page.getByLabel("Kurgu yedek dosyası", { exact: true }).setInputFiles(archivePath);
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    assert.equal(await page.locator(".aura-studio").getAttribute("data-format"), "portrait");
    await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
    await page.getByRole("button", { name: "Metni düzenle", exact: true }).click();
    assert.equal(
      await page.getByLabel("1. altyazı metni", { exact: true }).inputValue(),
      "İlk doğru satır",
    );
    await page.getByRole("button", { name: "Araçlar", exact: true }).click();
    await page.getByRole("button", { name: "Tüm araçlar", exact: true }).click();
    assert.ok(await page.locator(".advanced-editor").isVisible());
    await page.getByRole("button", { name: "Araçlar", exact: true }).click();
    await page.getByRole("button", { name: "Kolay düzenle", exact: true }).click();
    assert.ok(await page.locator(".easy-editor").isVisible());
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        url,
        width,
        previewSpaceGained: gained,
        sceneSearch: true,
        toolSearch: true,
        undoRedo: true,
        keyboardTabs: true,
        lyrics: true,
        srt: true,
        portrait: true,
        videoExport: width !== 320,
        backupRestore: true,
        modeSwitch: true,
        errors,
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
