import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";

const url = process.argv[2] || "http://127.0.0.1:8082/android/index.html";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
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
  assert.equal(await p.locator(".aura-studio").getAttribute("data-tool"), "none");
  await p.getByRole("button", { name: /Klip 1 · aura-portrait-fixture/ }).click();
  await p.getByLabel("Oynatma hızı", { exact: true }).selectOption("2");
  await p.getByRole("button", { name: "Tamam", exact: true }).click();
  await p
    .getByRole("navigation", { name: "Video düzenleme araçları" })
    .getByRole("button", { name: "Medya", exact: true })
    .click();
  await p.getByRole("button", { name: /1\. aura-portrait-fixture/ }).waitFor();
  assert.equal(
    await p.getByLabel("Spektrumu görüntülerin üzerinde göster", { exact: true }).isChecked(),
    false,
  );
  await p.getByRole("button", { name: "Tamam", exact: true }).click();
  await p.getByRole("button", { name: "Oynat", exact: true }).click();
  await p.waitForFunction(() => !document.querySelector("audio").paused);
  await p.getByRole("button", { name: "Duraklat", exact: true }).click();
  await p.getByRole("button", { name: "Dışa aktar", exact: true }).click();
  const download = p.waitForEvent("download", { timeout: 60000 });
  await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
  await (await download).saveAs("/workspace/screenshots/aura-timeline-source-video.mp4");
  await p.getByRole("dialog").waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      videoSource: true,
      pausedImport: true,
      automaticPortrait: true,
      rate: 2,
      playPause: true,
      export: true,
      errors,
    }),
  );
} finally {
  await browser.close();
}
