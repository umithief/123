import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
import { unpackProject } from "../src/components/aura/project-archive.ts";
const names = ["Tutulma", "Frekans Vadisi", "Sıvı Metal", "Faz Çiçeği", "Art Deco", "Cam Kuleler"];
const ids = ["eclipse", "valley", "liquid-metal", "phase-flower", "deco", "glass-towers"];
const url = process.argv[2] || "http://127.0.0.1:8080";
const tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of (process.env.QA_WIDTHS || "390,1280").split(",").map(Number)) {
    const p = await browser.newPage({
      viewport: { width, height: 844 },
      acceptDownloads: true,
      hasTouch: width < 700,
    });
    p.setDefaultTimeout(60000);
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    await p
      .getByLabel("Müzik dosyası", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-spectra-track.mp3");
    await p.waitForFunction(() => document.querySelector("audio")?.duration > 1);
    await p
      .getByRole("navigation", { name: "Video düzenleme araçları" })
      .getByRole("button", { name: "Spektrum", exact: true })
      .click();
    if (process.env.QA_FORMAT === "portrait") {
      await p.getByRole("button", { name: "Dışa aktar", exact: true }).click();
      await p.locator(".easy-formats").getByRole("button", { name: /Reels/ }).click();
      await p.getByRole("navigation", { name: "Video düzenleme araçları" }).getByRole("button", { name: "Spektrum", exact: true }).click();
    }
    const g = p.getByRole("group", { name: "Görselleştirmeler", exact: true });
    assert.equal(await g.getByRole("button").count(), 32);
    const thumbs = await g
      .locator("canvas")
      .evaluateAll((cs) => cs.slice(0, 6).map((c) => c.toDataURL()));
    assert.equal(new Set(thumbs).size, 6);
    await p
      .getByRole("group", { name: "Görselleştirme filtresi", exact: true })
      .getByRole("button", { name: "Lüks", exact: true })
      .click();
    assert.equal(await g.getByRole("button").count(), 14);
    await p.getByRole("button", { name: "Oynat", exact: true }).click();
    const frames = [];
    for (const name of names) {
      console.log(tag, width, name);
      await g.getByRole("button", { name, exact: true }).click();
      await p.waitForTimeout(450);
      frames.push(await p.locator(".canvas-frame canvas").evaluate((c) => c.toDataURL()));
      assert.equal(
        await g.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"),
        "true",
      );
    }
    assert.equal(new Set(frames).size, 6);
    await p.getByRole("button", { name: "Duraklat", exact: true }).click();
    await p.screenshot({ path: `/workspace/screenshots/aura-new-spectra-${tag}-${width}.png` });
    const sheet = await browser.newPage({ viewport: { width: 1200, height: 760 } });
    await sheet.setContent(
      '<body style="margin:0;background:#0b0c0f;color:#eee;font:18px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px"></body>',
    );
    await sheet.evaluate(
      async ({ frames, names }) => {
        for (let i = 0; i < frames.length; i++) {
          const div = document.createElement("div");
          const img = new Image();
          img.src = frames[i];
          img.style = "width:100%;height:315px;object-fit:contain;background:#08090c";
          await img.decode();
          div.append(img, document.createTextNode(names[i]));
          document.body.append(div);
        }
      },
      { frames, names },
    );
    await sheet.screenshot({
      path: `/workspace/screenshots/aura-new-spectra-sheet-${tag}-${width}.png`,
    });
    await sheet.close();
    await p.getByRole("button", { name: "Dışa aktar", exact: true }).click();
    if (!process.env.SKIP_EXPORT) {
      await p.locator(".easy-formats").getByRole("button", { name: /Reels/ }).click();
      const download = p.waitForEvent("download", { timeout: 90000 });
      await p.getByRole("button", { name: "Videoyu hazırla", exact: true }).click();
      await (await download).saveAs(`/workspace/screenshots/aura-new-spectra-${tag}-${width}.mp4`);
      await p.getByRole("dialog").waitFor({ state: "hidden" });
    }
    await p.getByText("Kurgu yedeği · medya dahil", { exact: true }).click();
    const zip = p.waitForEvent("download");
    await p.getByRole("button", { name: "Kurguyu yedekle", exact: true }).click();
    const path = `/workspace/screenshots/aura-new-spectra-${tag}-${width}.aura.zip`;
    await (await zip).saveAs(path);
    const archive = await unpackProject(new Blob([readFileSync(path)]));
    const data = JSON.parse(await archive.get("project.json").text());
    assert.equal(data.settings.mode, ids.at(-1));
    await p.getByLabel("Kurgu yedek dosyası", { exact: true }).setInputFiles(path);
    await p.waitForFunction(() => document.querySelector(".aura-studio").dataset.tool === "none");
    await p
      .getByRole("navigation", { name: "Video düzenleme araçları" })
      .getByRole("button", { name: "Spektrum", exact: true })
      .click();
    assert.equal(
      await g
        .getByRole("button", { name: "Cam Kuleler", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        tag,
        width,
        spectra: 6,
        uniqueThumbnails: true,
        liveAudio: true,
        backupRestore: true,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
