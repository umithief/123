import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:8080/");
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Örnek", exact: true }).click();
    await page.waitForTimeout(500);
    for (const name of [
      "Çubuklar",
      "İğne",
      "İpek",
      "Ayna",
      "Halka",
      "Taç",
      "Hale",
      "Yörünge",
      "Tünel",
      "Akış",
      "Dalga Ağı",
      "Prizma",
      "Takımyıldız",
      "DNA",
      "Spektrogram",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      await page.mouse.move(10, 10);
      await button.click();
      console.log(name, await button.getAttribute("aria-pressed"));
      await page.waitForFunction(
        (label) =>
          [...document.querySelectorAll("button")].some(
            (b) => b.textContent.trim() === label && b.getAttribute("aria-pressed") === "true",
          ),
        name,
      );
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      await page.waitForTimeout(150);
    }
    await page.locator("summary").filter({ hasText: "Efekt ayarları" }).click();
    for (const name of ["Stüdyo", "Canlı", "Sinematik"]) {
      const button = page.getByRole("button", { name, exact: true });
      await page.mouse.move(10, 10);
      await button.click();
      console.log(name, await button.getAttribute("aria-pressed"));
      await page.waitForFunction(
        (label) =>
          [...document.querySelectorAll("button")].some(
            (b) => b.textContent.trim() === label && b.getAttribute("aria-pressed") === "true",
          ),
        name,
      );
      assert.equal(await button.getAttribute("aria-pressed"), "true");
    }
    assert.equal(await page.evaluate(() => localStorage.getItem("aura-finish")), "cinema");
    await page.getByRole("radio", { name: "Buz", exact: true }).click();
    await page.locator("summary").filter({ hasText: "Efekt ayarları" }).click();
    await page.waitForTimeout(5500);
    await page.screenshot({ path: `/workspace/screenshots/aura-spectrum-${viewport.width}.png` });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ viewport, errors, modes: 15, finishes: 3, stored: true }));
    await page.close();
  }
} finally {
  await browser.close();
}
