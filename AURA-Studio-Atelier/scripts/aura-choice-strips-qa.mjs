import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  for (const width of (process.env.QA_WIDTHS || "390,320,1280").split(",").map(Number)) {
    const p = await browser.newPage({
      viewport: { width, height: width === 320 ? 600 : 844 },
      hasTouch: width < 700,
      acceptDownloads: true,
    });
    p.setDefaultTimeout(60000);
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    await p
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-portrait-fixture.mp4");
    await p.waitForFunction(
      () =>
        document.querySelector(".canvas-frame canvas")?.width === 720 &&
        document.querySelector("audio")?.paused,
    );
    const tool = async (name) => {
      console.log(width, name);
      const routes = {
        Spektrum: ["design", "scenes"],
        Kapak: ["design", "artwork"],
        Efektler: ["design", "adjust"],
        Medya: ["edit", "media"],
        Animasyon: ["edit", "motion"],
        Düzenle: ["edit", "cuts"],
        Ses: ["audio", "sound"],
        Seslendirme: ["audio", "voice"],
        Metin: ["text", "layers"],
        Altyazı: ["text", "captions"],
      };
      const [group, id] = routes[name];
      void group;
      await p.locator(`.aura-toolbar [data-tool="${id}"]`).click();
    };
    const choose = async (group, name) => {
      const g = p.getByRole("group", { name: group, exact: true });
      await g.getByRole("button", { name, exact: true }).click();
    };
    const strip = async (name, overflow = false) => {
      const g = p.getByRole("group", { name, exact: true });
      await g.waitFor({ state: "visible" });
      await g.scrollIntoViewIfNeeded();
      const info = await g.evaluate((g) => {
        const r = g.getBoundingClientRect(),
          outer = g.closest(".studio-inspector").getBoundingClientRect();
        return {
          rows: new Set(
            Array.from(g.children)
              .filter((c) => c.tagName === "BUTTON" || c.classList.contains("editor-list-item"))
              .map((c) => Math.round(c.getBoundingClientRect().top)),
          ).size,
          vertical: g.scrollHeight > g.clientHeight + 1,
          overflow: g.scrollWidth > g.clientWidth + 2,
          right: r.right,
          edge: outer.right,
        };
      });
      assert.ok(info.rows <= 1, `${name}: ${JSON.stringify(info)}`);
      assert.equal(info.vertical, false, name);
      assert.ok(info.right <= info.edge + 1, `${name} clipped`);
      if (overflow) assert.equal(info.overflow, true, name);
      return g;
    };
    await tool("Spektrum");
    const modes = await strip("Görselleştirmeler", true);
    assert.equal(await modes.getByRole("button").count(), 32);
    if (width < 700) {
      const session = await p.context().newCDPSession(p);
      const r = await modes.boundingBox();
      const x = r.x + r.width - 20,
        y = r.y + 30;
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (let i = 1; i <= 8; i++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x - i * 25, y }],
        });
        await p.waitForTimeout(20);
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await p.waitForFunction(
        () => document.querySelector('[aria-label="Görselleştirmeler"]').scrollLeft > 80,
      );
      await session.detach();
    }
    await modes.getByRole("button").first().focus();
    await p.keyboard.press("End");
    assert.ok(await modes.evaluate((g) => g.scrollLeft > 80));
    await p.keyboard.press("Home");
    await choose("Görselleştirmeler", "Altın Plak");
    await choose("Spektrum bölümleri", "Renkler");
    await strip("Renk teması", width < 700);
    await choose("Renk teması", "Şampanya");
    await p.screenshot({ path: `/workspace/screenshots/aura-choice-${tag}-${width}-palette.png` });
    await tool("Efektler");
    await strip("Görüntü filtresi", true);
    await choose("Görüntü filtresi", "Sepya");
    await choose("Görüntü ayarı bölümleri", "Efektler");
    await strip("Görüntü efekti", true);
    await choose("Görüntü efekti", "Prizma ışığı");
    await choose("Görüntü ayarı bölümleri", "Renk");
    await strip("Renk ayarları", width < 700);
    await choose("Renk ayarları", "Parlaklık");
    await p.screenshot({ path: `/workspace/screenshots/aura-choice-${tag}-${width}-adjust.png` });
    await tool("Metin");
    await p.getByRole("button", { name: "Metin ekle", exact: true }).click();
    await p.getByLabel("Katman metni", { exact: true }).fill("AURA TEST");
    await p.getByLabel("Katman metni", { exact: true }).press("Tab");
    await choose("Metin araçları", "Görünüm");
    await strip("Katman yazı tipi", true);
    await choose("Katman yazı tipi", "Anton · Güçlü vurgu");
    await choose("Katman görünümü", "Stil");
    await strip("Katman yazı efekti");
    await choose("Katman yazı efekti", "Altın yansıma");
    await choose("Metin araçları", "Hareket");
    await strip("Katman animasyonu", true);
    await choose("Katman animasyonu", "Elastik");
    await choose("Metin araçları", "Katmanlar");
    await strip("Görsel katmanlar");
    await tool("Medya");
    await p
      .getByLabel("Sahne medya dosyaları", { exact: true })
      .setInputFiles([
        "/workspace/project/public/og.jpg",
        "/workspace/project/public/x-banner.jpg",
      ]);
    await p.waitForFunction(
      () => document.querySelector('[aria-label="Medya sahneleri"]')?.children.length >= 3,
    );
    await strip("Medya sahneleri", width < 700);
    await choose("Görüntü kadrajı", "Tam görüntü");
    await choose("Sahne geçişi", "Yakınlaş");
    await p.getByText("Maske ve renk anahtarı", { exact: true }).click();
    await strip("Görüntü maskesi");
    await choose("Görüntü maskesi", "Oval");
    await tool("Ses");
    await strip("Ekolayzır hazır ayarları");
    await choose("Ekolayzır hazır ayarları", "Sıcak");
    await choose("Ses ayarı bölümleri", "Ritim");
    await strip("Müzik ve sahne reçeteleri");
    await tool("Altyazı");
    await p
      .getByLabel("SRT altyazı dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-choice-sample.srt");
    await p
      .getByRole("group", { name: "Altyazı tasarım bölümleri", exact: true })
      .waitFor({ state: "visible" });
    await strip("Altyazı şablonları", true);
    await choose("Altyazı tasarım bölümleri", "Animasyonlar");
    await p.getByRole("group", { name: "Animasyon türü", exact: true }).getByRole("button", { name: /^Kombo/ }).click();
    await strip("Altyazı animasyonları", true);
    await choose("Altyazı animasyonları", "İris");
    await choose("Altyazı tasarım bölümleri", "Özelleştir");
    await strip("Altyazı yazı tipi", true);
    await choose("Altyazı yazı tipi", "Montserrat · Modern");
    await choose("Altyazı görünümü", "Stil");
    await strip("Altyazı arka planı");
    await choose("Altyazı arka planı", "Kapsül");
    await p.screenshot({ path: `/workspace/screenshots/aura-choice-${tag}-${width}-captions.png` });
    await tool("Kapak");
    await p
      .getByLabel("Kapak fotoğrafı dosyası", { exact: true })
      .setInputFiles("/workspace/project/public/og.jpg");
    await p.getByText("Kapak konumu ve görünümü", { exact: true }).click();
    await strip("Kapak konumu");
    await choose("Kapak konumu", "İkisi");
    await strip("Kapak biçimi");
    await choose("Kapak biçimi", "Kare");
    await tool("Seslendirme");
    await p
      .getByLabel("Ek ses dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-portrait-fixture.mp4");
    await p
      .getByRole("group", { name: "Ek sesler", exact: true })
      .getByRole("button")
      .first()
      .waitFor();
    await strip("Ek sesler");
    await p.getByRole("button", { name: "Dışa aktar", exact: true }).click();
    const sizes = p.locator('.choice-strip[aria-label="Video boyutu"]');
    assert.ok(await sizes.evaluate((g) => g.scrollHeight <= g.clientHeight + 1));
    if (!process.env.SKIP_EXPORT) {
      const dl = p.waitForEvent("download", { timeout: 60000 });
      await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
      await (await dl).saveAs(`/workspace/screenshots/aura-choice-${tag}-${width}.mp4`);
      await p.getByRole("dialog").waitFor({ state: "hidden" });
    }
    await p.getByText("Kurgu yedeği · medya dahil", { exact: true }).click();
    const dl = p.waitForEvent("download");
    await p.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    const path = `/workspace/screenshots/aura-choice-${tag}-${width}.aura.zip`;
    await (await dl).saveAs(path);
    const archive = await unpackProject(new Blob([readFileSync(path)]));
    const data = JSON.parse(await archive.get("project.json").text());
    assert.equal(data.settings.mode, "vinyl");
    assert.equal(data.settings.theme, "champagne");
    assert.equal(data.editor.adjust.filter, "sepia");
    assert.equal(data.editor.adjust.effect, "prism");
    assert.equal(data.settings.captions.font, "montserrat");
    assert.equal(data.settings.captions.animation, "iris");
    assert.equal(data.settings.captions.background, "pill");
    const layer = data.editor.layers.find((l) => l.text === "AURA TEST");
    assert.equal(layer.font, "anton");
    assert.equal(layer.textEffect, "gold");
    assert.equal(layer.animation, "elastic");
    const media = data.editor.media.find((m) => !m.sourceVideo && m.fit === "contain");
    assert.ok(media);
    assert.equal(media.transition, "zoom");
    assert.equal(media.mask, "circle");
    await p.getByLabel("Kurgu yedek dosyası", { exact: true }).setInputFiles(path);
    await p.waitForFunction(() => document.querySelector(".aura-studio").dataset.tool === "none");
    await tool("Efektler");
    await choose("Görüntü ayarı bölümleri", "Filtreler");
    assert.equal(
      await p
        .getByRole("group", { name: "Görüntü filtresi", exact: true })
        .getByRole("button", { name: "Sepya", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        tag,
        width,
        horizontal: true,
        keyboard: true,
        swipe: width < 700,
        restore: true,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
