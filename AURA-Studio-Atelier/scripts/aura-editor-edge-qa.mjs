import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080";
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
try {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await useRuntimeAssetFetch(p);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.stack));
  await p.goto(url);
  await p.locator('.aura-studio[data-ready="true"]').waitFor();
  const chooser = p.waitForEvent("filechooser");
  await p.getByRole("button", { name: "Medya seç ve başla", exact: true }).click();
  await (await chooser).setFiles("/workspace/screenshots/aura-editor-source.mp4");
  await p.getByRole("tab", { name: "Görsel", exact: true }).waitFor();
  if (await p.getByRole("button", { name: "Duraklat", exact: true }).isVisible())
    await p.getByRole("button", { name: "Duraklat", exact: true }).click();
  await p.getByRole("button", { name: "Medya", exact: true }).click();
  await p.getByRole("button", { name: /aura-editor-source\.mp4/ }).waitFor();
  await p.getByRole("tab", { name: "Müzik", exact: true }).click();
  await p.getByLabel("Kurgu zaman çizelgesi", { exact: true }).fill("0.5");
  await p.getByRole("tab", { name: "Görsel", exact: true }).click();
  await p.getByRole("button", { name: "Kareyi dondur", exact: true }).click();
  await p.getByRole("button", { name: /Dondurulmuş kare/ }).waitFor();
  await p.getByText("Maske ve renk anahtarı", { exact: true }).click();
  await p.getByLabel("Görüntü maskesi", { exact: true }).selectOption("circle");
  await p.getByLabel("Renk silme toleransı", { exact: true }).fill("45");
  await p.getByRole("tab", { name: "Müzik", exact: true }).click();
  await p.getByText("Ek ses ve seslendirme", { exact: true }).first().click();
  await p.getByRole("button", { name: "Seslendirme kaydet", exact: true }).click();
  await p.getByRole("button", { name: "Ses kaydını bitir", exact: true }).waitFor();
  await p.waitForTimeout(1100);
  await p.getByRole("button", { name: "Ses kaydını bitir", exact: true }).click();
  await p.waitForTimeout(2500);
  console.log(
    "VOICE UI",
    await p.getByRole("tabpanel", { name: "Müzik", exact: true }).innerText(),
  );
  await p.screenshot({ path: "/workspace/screenshots/aura-editor-voice-debug.png" });
  await p.getByRole("button", { name: /seslendirme\.webm/ }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({ voiceover: true, freezeFrame: true, mask: true, colorKey: true, errors }),
  );
  await p.close();
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  await useRuntimeAssetFetch(q);
  await q.goto(url);
  await q.locator('.aura-studio[data-ready="true"]').waitFor();
  const picker = q.waitForEvent("filechooser");
  await q.getByRole("button", { name: "Kurgu yedeği aç", exact: true }).click();
  await (await picker).setFiles("/workspace/screenshots/aura-editor-dev-390.aura.zip");
  await q.getByRole("tab", { name: "Görsel", exact: true }).waitFor();
  await q.getByRole("button", { name: "Katmanlar", exact: true }).click();
  await q.getByRole("button", { name: /BENİM KURGUM/ }).waitFor();
  console.log(JSON.stringify({ projectRestoreFromStart: true }));
  await q.close();
} finally {
  await b.close();
}
