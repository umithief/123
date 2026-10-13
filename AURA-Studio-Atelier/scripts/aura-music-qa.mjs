import { chromium } from "playwright";
import assert from "node:assert/strict";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080/";
// Use an explicit beat fixture: the demo has intentionally irregular bass onsets.
const rate = 48000,
  samples = rate * 120;
const beatFile = Buffer.alloc(44 + samples * 2);
beatFile.write("RIFF", 0);
beatFile.writeUInt32LE(beatFile.length - 8, 4);
beatFile.write("WAVEfmt ", 8);
beatFile.writeUInt32LE(16, 16);
beatFile.writeUInt16LE(1, 20);
beatFile.writeUInt16LE(1, 22);
beatFile.writeUInt32LE(rate, 24);
beatFile.writeUInt32LE(rate * 2, 28);
beatFile.writeUInt16LE(2, 32);
beatFile.writeUInt16LE(16, 34);
beatFile.write("data", 36);
beatFile.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++) {
  const t = i / rate,
    phase = t % 0.5;
  beatFile.writeInt16LE(
    Math.round((phase < 0.12 ? 0.65 * Math.sin(2 * Math.PI * 80 * t) : 0) * 32767),
    44 + i * 2,
  );
}
const setRange = async (locator, value) => {
  await locator.evaluate((input, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
      input,
      String(next),
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
};
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const select = async (page, name) => {
  await page.mouse.move(10, 10);
  await page.getByRole("button", { name, exact: true }).click();
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent.trim() === label && b.getAttribute("aria-pressed") === "true",
      ),
    name,
  );
  console.log("Selected", name);
};
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, acceptDownloads: true });
    page.setDefaultTimeout(10000);
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector("canvas")?.width > 300);
    await page.getByRole("button", { name: "Örnek", exact: true }).click();
    await page.locator("summary").filter({ hasText: "Müzik eklentileri" }).click();
    await page.getByRole("button", { name: "Elektronik", exact: true }).click();
    await page.waitForFunction(() => localStorage.getItem("aura-mode") === "prism");
    assert.equal(await page.getByLabel("3 bant ekolayzır", { exact: true }).isChecked(), true);
    assert.equal(await page.getByLabel("Dinamik denge", { exact: false }).isChecked(), true);
    await page.getByRole("button", { name: "Vokal", exact: true }).click();
    assert.equal(await page.getByLabel("Orta frekans kazancı", { exact: true }).inputValue(), "3");
    const volume = page.getByLabel("Çıkış sesi", { exact: true });
    await volume.scrollIntoViewIfNeeded();
    await volume.press("Home");
    await volume.press("ArrowRight");
    assert.equal(await volume.inputValue(), "0.01");
    await setRange(volume, 0.65);
    assert.equal(await page.getByLabel("Çıkış sesi", { exact: true }).inputValue(), "0.65");
    for (const label of ["Eko", "Oda ambiyansı"]) {
      const effect = page.getByLabel(label, { exact: true });
      await effect.scrollIntoViewIfNeeded();
      await effect.press("Home");
      await effect.press("ArrowRight");
      assert.equal(await effect.inputValue(), "0.01");
      await setRange(effect, 0.2);
      assert.equal(await page.getByLabel(label, { exact: true }).inputValue(), "0.2");
    }
    await page.locator('input[type="file"][accept^="audio/"]').setInputFiles({
      name: "120-bpm.wav",
      mimeType: "audio/wav",
      buffer: beatFile,
    });
    await page.waitForTimeout(700);
    await page.getByLabel("Otomatik DJ", { exact: false }).check();
    assert.equal(await page.getByLabel("Otomatik DJ", { exact: false }).isChecked(), true);
    const start = Number(await page.getByLabel("Algılanan vuruş sayısı").innerText());
    await page.waitForFunction(
      (first) =>
        Number(document.querySelector('[aria-label="Algılanan vuruş sayısı"]').textContent) >=
        first + 16,
      start,
      { timeout: 60000 },
    );
    await page.waitForFunction(
      () => localStorage.getItem("aura-mode") !== "prism",
      {},
      { timeout: 30000 },
    );
    const bpm = await page.getByLabel("Tahmini tempo", { exact: true }).innerText();
    console.log(
      JSON.stringify({
        viewport,
        startingBeat: start,
        beats: await page.getByLabel("Algılanan vuruş sayısı").innerText(),
        tempo: bpm,
        autoMode: await page.evaluate(() => localStorage.getItem("aura-mode")),
      }),
    );
    await select(page, "Prizma"); // Choosing a mode should disengage automatic DJ.
    assert.equal(await page.getByLabel("Otomatik DJ", { exact: false }).isChecked(), false);
    await page.locator("summary").filter({ hasText: "Müzik eklentileri" }).click();
    await page.waitForTimeout(3200);
    await page.screenshot({ path: `/workspace/screenshots/aura-prism-${viewport.width}.png` });
    await page.mouse.move(10, 10);
    await select(page, "Takımyıldız");
    await page.waitForTimeout(3200);
    await page.screenshot({
      path: `/workspace/screenshots/aura-constellation-${viewport.width}.png`,
    });
    await page.mouse.move(15, 15);
    await select(page, "DNA");
    await page.waitForTimeout(3200);
    await page.screenshot({ path: `/workspace/screenshots/aura-dna-${viewport.width}.png` });
    await page.mouse.move(20, 20);
    await select(page, "Spektrogram");
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: `/workspace/screenshots/aura-spectrogram-${viewport.width}.png`,
    });
    await page.mouse.move(10, 30);
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.waitForTimeout(700);
    await page.locator("summary").filter({ hasText: "Müzik eklentileri" }).click();
    assert.equal(
      await page.getByLabel("Tahmini tempo", { exact: true }).innerText(),
      "Müzik başlatın",
    );
    await page.reload();
    await page.waitForTimeout(1200);
    await page.locator("summary").filter({ hasText: "Müzik eklentileri" }).click();
    assert.equal(await page.getByLabel("Çıkış sesi", { exact: true }).inputValue(), "0.65");
    assert.equal(await page.getByLabel("Orta frekans kazancı", { exact: true }).inputValue(), "3");
    assert.equal(await page.getByLabel("Eko", { exact: true }).inputValue(), "0.2");
    assert.equal(await page.getByLabel("Oda ambiyansı", { exact: true }).inputValue(), "0.2");
    await page.getByLabel("Oda ambiyansı", { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/workspace/screenshots/aura-music-effects-${viewport.width}.png`,
    });
    await page.getByRole("button", { name: "Sesi sıfırla", exact: true }).click();
    assert.equal(await page.getByLabel("3 bant ekolayzır", { exact: true }).isChecked(), false);
    assert.equal(await page.getByLabel("Çıkış sesi", { exact: true }).inputValue(), "1");
    assert.equal(await page.getByLabel("Eko", { exact: true }).inputValue(), "0");
    assert.equal(await page.getByLabel("Oda ambiyansı", { exact: true }).inputValue(), "0");
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        url,
        viewport,
        newModes: 4,
        presets: true,
        persistence: true,
        reset: true,
        errors,
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
