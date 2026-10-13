import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
import { unpackProject } from "../src/components/aura/project-archive.ts";

const url = process.argv[2] || "http://127.0.0.1:8080";
const tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of (process.env.QA_WIDTHS || "390,1280,320").split(",").map(Number)) {
    const p = await browser.newPage({
      viewport: { width, height: width === 320 ? 600 : 844 },
      acceptDownloads: true,
      hasTouch: width < 700,
    });
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    await p
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-portrait-fixture.mp4");
    await p.waitForFunction(() => {
      const c = document.querySelector(".canvas-frame canvas");
      return c.width === 720 && c.height === 1280 && document.querySelector("audio").paused;
    });
    const dock = p.getByRole("navigation", { name: "Video düzenleme araçları" });
    await dock.getByRole("button", { name: "Animasyon", exact: true }).click();
    const panel = p.locator(".video-motion-panel"),
      gallery = p.locator(".video-motion-gallery");
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "motion");
    const layout = await p.evaluate(() => {
      const strip = document.querySelector(".video-motion-gallery");
      const cards = Array.from(strip.querySelectorAll(".video-motion-preset"));
      return {
        horizontal: strip.scrollWidth > strip.clientWidth,
        vertical: strip.scrollHeight > strip.clientHeight + 1,
        rows: new Set(cards.map(c => Math.round(c.getBoundingClientRect().top))).size,
        panel: document.querySelector(".studio-inspector").getBoundingClientRect().height,
        preview: document.querySelector(".canvas-frame canvas").getBoundingClientRect().height,
      };
    });
    assert.equal(layout.horizontal, true, JSON.stringify(layout));
    assert.equal(layout.vertical, false, JSON.stringify(layout));
    assert.equal(layout.rows, 1, JSON.stringify(layout));
    if (width < 700) {
      assert.ok(layout.panel < 320, JSON.stringify(layout));
      assert.ok(layout.preview > (width === 320 ? 90 : 290), JSON.stringify(layout));
    }
    // Native touch swipes pan the strip instead of moving its enclosing panel.
    if (width < 700) {
      const session = await p.context().newCDPSession(p);
      const rect = await gallery.boundingBox();
      const y = rect.y + 30, x = rect.x + rect.width - 25;
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= 8; i++) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 25, y }] });
        await p.waitForTimeout(20);
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await p.waitForFunction(() => document.querySelector(".video-motion-gallery").scrollLeft > 80);
      await session.detach();
    }
    // Keyboard navigation also reveals cards beyond the visible edge.
    await gallery.getByRole("button", { name: "Yok", exact: true }).focus();
    await p.keyboard.press("End");
    await p.waitForFunction(() => {
      const g = document.querySelector(".video-motion-gallery").getBoundingClientRect();
      const b = document.activeElement.getBoundingClientRect();
      return b.left >= g.left - 1 && b.right <= g.right + 1;
    });
    assert.ok(await gallery.evaluate(g => g.scrollLeft > 80));
    await p.keyboard.press("Home");
    await gallery.getByRole("button", { name: "Ani Etki", exact: true }).click();
    await p.waitForFunction(() => document.querySelector("audio").paused);
    assert.equal(
      await gallery
        .getByRole("button", { name: "Ani Etki", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    // A duration drag produces a single undo entry.
    const slider = panel.getByRole("slider", { name: "Video animasyon süresi", exact: true });
    const before = Number(await slider.inputValue());
    const box = await slider.boundingBox();
    await p.mouse.move(box.x + (box.width * (before - 0.1)) / 2.9, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 5 });
    await p.mouse.up();
    const dragged = Number(await slider.inputValue());
    assert.ok(dragged > 1.6 && dragged < 2.7, dragged);
    await p.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).click();
    assert.equal(Number(await slider.inputValue()), before);
    await p.getByRole("button", { name: "Son düzenlemeyi yinele", exact: true }).click();
    assert.equal(Number(await slider.inputValue()), dragged);
    await slider.focus();
    await p.keyboard.press("Home");
    for (let i = 0; i < 11; i++) await p.keyboard.press("ArrowRight");
    assert.equal(Number(await slider.inputValue()), 1.2);
    await p.screenshot({ path: `/workspace/screenshots/aura-horizontal-gallery-${tag}-${width}.png` });
    const buttons = panel.getByRole("group", { name: "Video animasyon kategorileri" });
    await panel.getByRole("tab", { name: /Çıkış/ }).click();
    await buttons.getByRole("button", { name: "Maske", exact: true }).click();
    await gallery.getByRole("button", { name: "Dairesel Açılış", exact: true }).click();
    await p.waitForFunction(() => document.querySelector("audio").paused);
    await panel.getByRole("tab", { name: /Karma/ }).click();
    await buttons.getByRole("button", { name: "3D", exact: true }).click();
    await gallery.getByRole("button", { name: "Yatay Dönüş", exact: true }).click();
    await p.waitForFunction(() => document.querySelector("audio").paused);
    await panel.getByRole("button", { name: "Video animasyonlarında ara", exact: true }).click();
    await panel
      .getByRole("searchbox", { name: "Video animasyonu ara", exact: true })
      .fill("Kirmizi");
    assert.equal(await gallery.getByRole("button").count(), 2);
    await gallery.getByRole("button", { name: "Kırmızı Mercek", exact: true }).click();
    await p.waitForFunction(() => document.querySelector("audio").paused);
    await panel.getByRole("button", { name: "Animasyon aramasını kapat", exact: true }).click();
    await panel.getByRole("button", { name: "Animasyon şiddetini ayarla", exact: true }).click();
    const amount = panel.getByRole("slider", { name: "Video animasyon şiddeti", exact: true });
    await amount.focus();
    await p.keyboard.press("Home");
    for (let i = 0; i < 10; i++) await p.keyboard.press("ArrowRight");
    assert.equal(Number(await amount.inputValue()), 0.5);
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    await p.getByRole("button", { name: /Klip 1 · aura-portrait-fixture/ }).click();
    await p
      .locator(".studio-inspector")
      .getByRole("button", { name: "Animasyon", exact: true })
      .click();
    await panel.getByRole("tab", { name: /Giriş/ }).click();
    await buttons.getByRole("button", { name: "Trend", exact: true }).click();
    assert.equal(
      await gallery
        .getByRole("button", { name: "Ani Etki", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    // Each additional image gets its own independent entrance.
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    const ruler = p.getByRole("slider", { name: "Zaman çizelgesinde gezin", exact: true });
    await ruler.focus();
    await p.keyboard.press("Home");
    await dock.getByRole("button", { name: "Medya", exact: true }).click();
    await p
      .getByLabel("Sahne medya dosyaları", { exact: true })
      .setInputFiles("/workspace/project/public/og.jpg");
    await p.getByRole("button", { name: /2\. og\.jpg/ }).click();
    await p
      .locator(".studio-inspector")
      .getByRole("button", { name: "Animasyon", exact: true })
      .click();
    assert.ok(
      (
        await panel.getByRole("combobox", { name: "Animasyon uygulanacak klip" }).inputValue()
      ).startsWith("media:"),
    );
    await buttons.getByRole("button", { name: "Maske", exact: true }).click();
    await gallery.getByRole("button", { name: "Perde", exact: true }).click();
    await p.waitForFunction(() => document.querySelector("audio").paused);
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    // Text stays independently editable above clip motion.
    await dock.getByRole("button", { name: "Metin", exact: true }).click();
    await p.getByRole("button", { name: "Metin ekle", exact: true }).click();
    await p.getByLabel("Katman metni", { exact: true }).fill("VİDEO HAREKETİ");
    await p.getByLabel("Katman metni", { exact: true }).press("Tab");
    await p.getByRole("button", { name: "Dışa aktar", exact: true }).click();
    if (width !== 320 && !process.env.SKIP_EXPORT) {
      const video = p.waitForEvent("download", { timeout: 60000 });
      await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
      const path = `/workspace/screenshots/aura-motion-${tag}-${width}.mp4`;
      await (await video).saveAs(path);
      await p.getByRole("dialog").waitFor({ state: "hidden" });
      const info = JSON.parse(
        execFileSync(
          "ffprobe",
          [
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=width,height,duration,channels,codec_name",
            "-of",
            "json",
            path,
          ],
          { encoding: "utf8" },
        ),
      );
      const picture = info.streams.find((s) => s.width),
        sound = info.streams.find((s) => s.channels);
      assert.deepEqual([picture.width, picture.height, picture.codec_name], [720, 1280, "h264"]);
      assert.equal(sound.channels, 2);
      assert.ok(
        Math.abs(Number(picture.duration) - Number(sound.duration)) < 0.06,
        JSON.stringify(info),
      );
      assert.ok(
        Number(info.format.duration) > 3.9 && Number(info.format.duration) < 4.5,
        JSON.stringify(info),
      );
    }
    await p.getByText("Kurgu yedeği · medya dahil", { exact: true }).click();
    const zip = p.waitForEvent("download");
    await p.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    const path = `/workspace/screenshots/aura-motion-${tag}-${width}.aura.zip`;
    await (await zip).saveAs(path);
    const archive = await unpackProject(new Blob([readFileSync(path)]));
    const data = JSON.parse(await archive.get("project.json").text());
    assert.equal(data.editor.clips[0].motion.in.id, "impact");
    assert.equal(data.editor.clips[0].motion.out.id, "iris");
    assert.equal(data.editor.clips[0].motion.combo.id, "red-lens");
    assert.equal(data.editor.clips[0].motion.in.duration, 1.2);
    assert.equal(data.editor.clips[0].motion.amount, 0.5);
    assert.equal(data.editor.media.find((m) => !m.sourceVideo).motion.in.id, "curtain");
    await p.getByLabel("Kurgu yedek dosyası", { exact: true }).setInputFiles(path);
    await p.waitForFunction(() => document.querySelector(".aura-studio").dataset.tool === "none");
    await dock.getByRole("button", { name: "Animasyon", exact: true }).click();
    await panel
      .getByRole("combobox", { name: "Animasyon uygulanacak klip" })
      .selectOption({ index: 0 });
    await panel.getByRole("tab", { name: /Giriş/ }).click();
    await buttons.getByRole("button", { name: "Trend", exact: true }).click();
    assert.equal(
      await gallery
        .getByRole("button", { name: "Ani Etki", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(Number(await slider.inputValue()), 1.2);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        tag,
        width,
        horizontalGallery: true,
        swipe: width < 700,
        keyboardGallery: true,
        layout,
        inOutCombo: true,
        categories: true,
        search: true,
        dragSingleUndo: true,
        intensity: true,
        photoMotion: true,
        export: width !== 320 && !process.env.SKIP_EXPORT,
        restore: true,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
