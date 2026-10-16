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
    p.setDefaultTimeout(30000);
    await useRuntimeAssetFetch(p);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url);
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    assert.equal(await p.locator(".studio-workspace").isVisible(), false);
    const chooser = p.waitForEvent("filechooser");
    await p.locator('[data-intent="music"]').click();
    await (await chooser).setFiles("/workspace/screenshots/aura-portrait-fixture.mp4");
    await p.waitForFunction(
      () => document.querySelector(".aura-studio")?.getAttribute("data-tool") === "scenes",
    );
    await p.waitForFunction(() => document.querySelector(".canvas-frame canvas")?.width === 720);
    assert.equal(await p.locator(".atelier-home").count(), 0);
    await p.getByRole("button", { name: "Başlangıç", exact: true }).click();
    await p.getByRole("button", { name: "Switch to English", exact: true }).click();
    await p.getByRole("button", { name: "Continue", exact: true }).click();
    assert.equal(await p.locator("html").getAttribute("lang"), "en");
    const nav = p.getByRole("navigation", { name: "Workspaces", exact: true });
    assert.equal(await nav.getByRole("button").count(), 4);
    const group = async (id) => {
      await nav.locator(`[data-workspace="${id}"]`).click();
    };
    await group("text");
    await p.getByRole("button", { name: "Add text", exact: true }).click();
    await p.getByLabel("Layer text", { exact: true }).fill("Kalp");
    await p.getByLabel("Layer text", { exact: true }).press("Tab");
    await p
      .getByRole("group", { name: "Text tools", exact: true })
      .getByRole("button", { name: "Appearance", exact: true })
      .click();
    await p.getByRole("group", { name: "Layer font", exact: true }).waitFor();
    await p.screenshot({ path: `/workspace/screenshots/atelier-en-text-${tag}-${width}.png` });
    await group("design");
    const cover = p.waitForEvent("filechooser");
    await p.getByRole("button", { name: "Add cover image", exact: true }).click();
    assert.equal(await (await cover).element().getAttribute("aria-label"), "Cover image file");
    await (await cover).setFiles("/workspace/project/public/og.jpg");
    await p.getByRole("button", { name: "Done", exact: true }).click();
    await group("audio");
    await p.locator('.aura-toolbar [data-tool="sound"]').click();
    await p.getByRole("group", { name: "Equalizer presets", exact: true }).waitFor();
    await group("edit");
    await p.locator('.aura-toolbar [data-tool="cuts"]').click();
    const ruler = p.getByRole("slider", { name: "Seek in timeline", exact: true });
    await ruler.focus();
    await p.keyboard.press("Home");
    for (let i = 0; i < 10; i++) await p.keyboard.press("ArrowRight");
    await p
      .getByRole("region", { name: "Project timeline", exact: true })
      .getByRole("button", { name: "Split", exact: true })
      .click();
    assert.equal(await p.locator(".source-clip-button").count(), 2);
    await p.getByRole("button", { name: "Undo last edit", exact: true }).click();
    assert.equal(await p.locator(".source-clip-button").count(), 1);
    await p.getByRole("button", { name: "Home", exact: true }).click();
    await p.locator('[data-intent="captions"]').click();
    await p
      .getByLabel("SRT caption file", { exact: true })
      .setInputFiles("/workspace/screenshots/aura-choice-sample.srt");
    await group("design");
    await p.screenshot({ path: `/workspace/screenshots/atelier-en-editor-${tag}-${width}.png` });
    const bounds = await p.evaluate(() => {
      const frame = document.querySelector(".canvas-frame").getBoundingClientRect(),
        fit = document.querySelector(".preview-fit").getBoundingClientRect();
      return {
        width: frame.width,
        height: frame.height,
        inside:
          frame.top >= fit.top - 1 &&
          frame.bottom <= fit.bottom + 1 &&
          frame.left >= fit.left - 1 &&
          frame.right <= fit.right + 1,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(bounds.inside, JSON.stringify(bounds));
    assert.ok(bounds.height > 100);
    assert.ok(Math.abs(bounds.width / bounds.height - 9 / 16) < 0.01);
    assert.equal(bounds.overflow, false);
    const dl = p.waitForEvent("download");
    await p.getByRole("button", { name: "Save project", exact: true }).click();
    const path = `/workspace/screenshots/atelier-en-${tag}-${width}.aura.zip`;
    await (await dl).saveAs(path);
    const archive = await unpackProject(new Blob([readFileSync(path)]));
    const metadata = JSON.parse(await archive.get("project.json").text());
    assert.ok(metadata.editor.layers.some((l) => l.text === "Kalp"));
    assert.ok(metadata.srt.includes("Müziğin ritmini hisset"));
    await p.getByRole("button", { name: "Export", exact: true }).click();
    await p.locator('.choice-strip[aria-label="Video size"]').waitFor();
    await p.getByRole("button", {name:"Home",exact:true}).click();
    await p.getByRole("button", {name:"New project",exact:true}).click();
    await p.getByRole("dialog").waitFor();
    await p.getByRole("button", {name:"Return to project",exact:true}).click();
    assert.equal(await p.locator(".home-current").count(),0);
    await p.getByRole("button", {name:"Home",exact:true}).click();
    await p.getByRole("button", {name:"New project",exact:true}).click();
    await p.getByRole("button", {name:"Start new",exact:true}).click();
    await p.waitForFunction(()=>document.querySelector(".at-home") && !document.querySelector(".home-current"));
    const freshPicker=p.waitForEvent("filechooser");
    await p.locator('[data-intent="video"]').click();
    await (await freshPicker).setFiles("/workspace/screenshots/aura-easy-track.mp3");
    await p.waitForFunction(()=>document.querySelector(".aura-studio")?.getAttribute("data-tool")==="cuts");
    const freshDownload=p.waitForEvent("download");
    await p.getByRole("button",{name:"Save project",exact:true}).click();
    const freshPath=`/workspace/screenshots/atelier-fresh-${tag}-${width}.aura.zip`;
    await (await freshDownload).saveAs(freshPath);
    const freshArchive=await unpackProject(new Blob([readFileSync(freshPath)]));
    const fresh=JSON.parse(await freshArchive.get("project.json").text());
    assert.equal(fresh.editor.layers.length,0);assert.equal(fresh.editor.media.length,0);assert.equal(fresh.assets.length,0);assert.equal(fresh.sounds.length,0);assert.equal(fresh.cover,false);assert.equal(fresh.srt,"");
    await p.reload();
    await p.locator('.aura-studio[data-ready="true"]').waitFor();
    await p.getByRole("button", { name: "Switch to Turkish", exact: true }).waitFor();
    assert.equal(await p.locator("html").getAttribute("lang"), "en");
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        tag,
        width,
        intent: true,
        languagePersistence: true,
        newProjectClean:true,
        userTextUnchanged: true,
        captionsUnchanged: true,
        coverPicker: true,
        splitUndo: true,
        bounds,
        errors,
      }),
    );
    await p.close();
  }
} finally {
  await browser.close();
}
