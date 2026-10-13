import { chromium } from "playwright";
import assert from "node:assert/strict";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
import { createServer } from "node:http";
import { Readable } from "node:stream";
const assetServer = createServer(async (req, res) => {
  try {
    const target = new URL(req.url, "http://127.0.0.1:8083").searchParams.get("url");
    if (!target?.startsWith("https://huggingface.co/")) {
      res.writeHead(400);
      res.end();
      return;
    }
    const response = await fetch(target);
    res.writeHead(response.status, {
      "access-control-allow-origin": "*",
      "content-type": response.headers.get("content-type") || "application/octet-stream",
    });
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    res.writeHead(502);
    res.end(String(err));
  }
});
await new Promise((resolve) => assetServer.listen(8083, "127.0.0.1", resolve));
const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
  });
  await useRuntimeAssetFetch(page);
  await page
    .context()
    .route(/^https:\/\/huggingface\.co\//, (route) =>
      route.fulfill({
        status: 302,
        headers: {
          location: "http://127.0.0.1:8083/?url=" + encodeURIComponent(route.request().url()),
          "access-control-allow-origin": "*",
        },
      }),
    );
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);console.log(e.stack);
    console.log("Page error", e.message);
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.log("Browser error", m.text());
  });
  let workers = 0;
  page.on("worker", () => {
    workers++;
    console.log("Caption worker started");
  });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelector("canvas")?.width > 300);
  await page
    .getByLabel("Müzik dosyası", {exact:true})
    .setInputFiles("/workspace/screenshots/aura-caption-speech.wav");
  await page.getByRole("button", { name: "Tüm araçlar", exact: true }).click();
  await page.getByRole("tab", { name: "Altyazı", exact: true }).click();
  await page.getByLabel("Altyazı dili", { exact: true }).selectOption("english");
  await page.getByRole("button", { name: "Altyazı oluştur", exact: true }).click();
  for (let i = 0; i < 600; i++) {
    await page.waitForTimeout(1000);
    const text = await page.locator("details").filter({ hasText: "Otomatik altyazı" }).innerText();
    if (i % 5 === 0) console.log(text.slice(-350).replace(/\n/g, " "));
    if (await page.getByRole("alert").count())
      throw Error(await page.getByRole("alert").first().innerText());
    if (await page.getByLabel("1. altyazı metni", { exact: true }).count()) break;
  }
  const cue = page.getByLabel("1. altyazı metni", { exact: true });
  await cue.waitFor({ timeout: 300000 });
  const values = await page
    .locator('textarea[aria-label$="altyazı metni"]')
    .evaluateAll((nodes) => nodes.map((n) => n.value));
  console.log(JSON.stringify({ transcript: values, errors }));
  assert.match(values.join(" "), /country|americans|ask/i);
  assert.deepEqual(errors, []);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "SRT indir", exact: true }).click(),
  ]);
  await download.saveAs("/workspace/screenshots/aura-auto-captions.srt");
  await page.screenshot({ path: "/workspace/screenshots/aura-auto-captions.png" });
  console.log(JSON.stringify({ strongerModel: true }));
  await page.getByLabel("Tanıma kalitesi", { exact: true }).selectOption("fast");
  await page.getByRole("button", { name: "Altyazı oluştur", exact: true }).click();
  await page.getByRole("button", { name: "İptal et", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Altyazı oluştur", exact: true })
    .waitFor({ timeout: 300000 });
  assert.equal(workers, 1, "Idle regeneration should reuse the loaded real model");
  assert.match(
    await page.getByLabel("1. altyazı metni", { exact: true }).inputValue(),
    /Americans|fellow|ask/i,
  );
  console.log(JSON.stringify({ modelSwitch: true, workers }));
} finally {
  await browser.close();
  assetServer.closeAllConnections();
  assetServer.close();
}
