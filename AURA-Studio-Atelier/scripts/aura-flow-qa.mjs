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
  for (const width of (process.env.QA_WIDTHS || "390,320,1280").split(",").map(Number)) {
    const p = await browser.newPage({
      viewport: { width, height: width === 320 ? 600 : 844 },
      hasTouch: width < 700,
    });
    p.setDefaultTimeout(30000);
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    const firstPicker = p.waitForEvent("filechooser");
    await p.getByRole("button", { name: "Müzik veya video seç", exact: true }).click();
    await (await firstPicker).setFiles("/workspace/screenshots/aura-portrait-fixture.mp4");
    const quick = p.getByRole("region", { name: "Hızlı başlangıç" });
    await quick.getByRole("button", { name: /Yazı ekle/ }).waitFor();
    await p.waitForFunction(
      () => !document.querySelector(".project-action-strip button")?.disabled,
    );
    const timeline = p.getByRole("button", { name: "Zaman çizelgesi", exact: true });
    assert.equal(await timeline.getAttribute("aria-expanded"), "false");
    const replace = p.waitForEvent("filechooser");
    await p.getByRole("button", { name: "Parçayı değiştir", exact: true }).click();
    assert.equal(await (await replace).element().getAttribute("aria-label"), "Müzik dosyası");
    await p.screenshot({ path: `/workspace/screenshots/aura-flow-home-${tag}-${width}.png` });
    await quick.getByRole("button", { name: /Yazı ekle/ }).click();
    const text = p.getByLabel("Katman metni", { exact: true });
    await text.waitFor({ state: "visible" });
    await text.fill("Kendi ritmini yarat");
    await text.press("Tab");
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "layers");
    const sections = p.getByRole("group", { name: "Metin araçları", exact: true });
    assert.equal(await sections.getByRole("button").count(), 6);
    await sections.getByRole("button", { name: "Görünüm", exact: true }).click();
    await p.screenshot({ path: `/workspace/screenshots/aura-flow-text-${tag}-${width}.png` });
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    await quick.waitFor();
    const coverPicker = p.waitForEvent("filechooser");
    await quick.getByRole("button", { name: /Kapak ekle/ }).click();
    const coverChooser = await coverPicker;
    assert.equal(
      await coverChooser.element().getAttribute("aria-label"),
      "Kapak fotoğrafı dosyası",
    );
    await coverChooser.setFiles("/workspace/project/public/og.jpg");
    assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "artwork");
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    const dock = p.getByRole("navigation", { name: "Video düzenleme araçları" });
    await dock.waitFor({ state: "visible" });
    assert.equal(await dock.getByRole("button").count(), 12);
    for (const [name, id] of [
      ["Spektrum", "scenes"],
      ["Kapak", "artwork"],
      ["Metin", "layers"],
      ["Altyazı", "captions"],
      ["Medya", "media"],
      ["Animasyon", "motion"],
      ["Efektler", "adjust"],
      ["Ses", "sound"],
      ["Düzenle", "cuts"],
      ["Seslendirme", "voice"],
      ["Kurgu yedeği", "backup"],
    ]) {
      await dock.getByRole("button", { name, exact: true }).click();
      assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), id, name);
      assert.ok(await p.getByRole("button", { name: "Tamam", exact: true }).isVisible());
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        name,
      );
    }
    await dock.getByRole("button", { name: "Düzenle", exact: true }).click();
    assert.equal(await timeline.getAttribute("aria-expanded"), "true");
    const ruler = p.getByRole("slider", { name: "Zaman çizelgesinde gezin", exact: true });
    await ruler.focus();
    await p.keyboard.press("Home");
    for (let i = 0; i < 20; i++) await p.keyboard.press("ArrowRight");
    await p
      .getByRole("region", { name: "Proje zaman çizelgesi", exact: true })
      .getByRole("button", { name: "Böl", exact: true })
      .click();
    assert.equal(await p.locator(".source-clip-button").count(), 2);
    await p.getByRole("button", { name: "Son düzenlemeyi geri al", exact: true }).click();
    assert.equal(await p.locator(".source-clip-button").count(), 1);
    await p.getByRole("button", { name: "Tamam", exact: true }).click();
    assert.equal(await timeline.getAttribute("aria-expanded"), "false");
    await dock.getByRole("button", { name: "Gelişmiş stüdyo", exact: true }).click();
    assert.ok(await p.locator(".advanced-editor").count());
    await p.getByRole("button", { name: "Araçlar", exact: true }).click();
    await p.getByRole("button", { name: "Kolay düzenle", exact: true }).click();
    await quick.waitFor();
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        tag,
        width,
        quickText: true,
        quickCover: true,
        replacePicker: true,
        directTools: 12,
        splitUndo: true,
        overflow: false,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
