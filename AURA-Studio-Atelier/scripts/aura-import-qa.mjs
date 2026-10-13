import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";

const url = process.argv[2] || "http://127.0.0.1:8080";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await useRuntimeAssetFetch(page);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      const resume = AudioContext.prototype.resume;
      window.restoreAudio = () => {
        HTMLMediaElement.prototype.play = play;
        AudioContext.prototype.resume = resume;
      };
      // Reproduce a document-picker return after activation expired, including
      // a resume promise which stays pending until a fresh user gesture.
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Gesture expired", "NotAllowedError"));
      AudioContext.prototype.resume = () => new Promise(() => {});
    });
    await page.goto(url);
    await page.locator('.aura-studio[data-ready="true"]').waitFor();
    await page.getByLabel("Müzik dosyası", { exact: true }).setInputFiles("/workspace/screenshots/aura-import-test.mp3");
    const playButton = page.getByRole("button", { name: "Oynat", exact: true });
    await playButton.waitFor();
    await page.getByText("aura-import-test.mp3", { exact: true }).waitFor();
    assert.equal(await playButton.isEnabled(), true);
    assert.equal(await page.locator('[role="alert"]').count(), 0);
    assert.ok(await page.locator("audio").evaluate((audio) => audio.duration > 7 && audio.paused));
    await page.evaluate(() => window.restoreAudio());
    await playButton.click();
    await page.getByRole("button", { name: "Duraklat", exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector("audio").currentTime > 0.2);
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.getByLabel("Müzik dosyası", { exact: true }).setInputFiles({ name: "empty.mp3", mimeType: "audio/mpeg", buffer: Buffer.alloc(0) });
    await page.getByRole("alert").filter({ hasText: "dosya boş" }).waitFor();
    // An invalid new selection must not lose the previous usable track.
    await page.getByText("aura-import-test.mp3", { exact: true }).waitFor();
    await page.getByLabel("Müzik dosyası", { exact: true }).setInputFiles({ name: "broken.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("this is not audio") });
    await page.getByRole("alert").filter({ hasText: "ses dosyası açılamadı" }).waitFor();
    await page.getByLabel("Müzik dosyası", { exact: true }).setInputFiles("/workspace/screenshots/aura-import-test.mp3");
    await page.getByRole("button", { name: "Duraklat", exact: true }).waitFor();
    assert.equal(await page.locator('[role="alert"]').count(), 0);
    await page.getByRole("button", { name: "Duraklat", exact: true }).click();
    await page.screenshot({ path: `/workspace/screenshots/aura-import-${url.includes("8081") ? "built" : "dev"}-${width}.png` });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ url, width, mp3: true, expiredGesture: true, suspendedContext: true, manualPlayback: true, emptyAndCorruptRecovery: true, errors }));
    await page.close();
  }
} finally { await browser.close(); }
