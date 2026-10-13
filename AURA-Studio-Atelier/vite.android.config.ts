import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error Existing platform branding plugin is JavaScript.
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error Existing shared PWA helper is JavaScript.
import { renderWebManifest } from "./scripts/grok-pwa-shared.mjs";

process.env.VITE_PUBLIC_HOSTNAME = "appassets.androidplatform.net";

// Independent client build: the existing web/server configuration stays intact.
export default defineConfig({
  base: "/",
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  plugins: [grokPwaPlugin(), {
    name: "aura:android-manifest",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "__grok/manifest.webmanifest", source: renderWebManifest("appassets.androidplatform.net") });
    },
  }, tailwindcss(), react()],
  worker: { format: "es" },
  build: {
    target: "chrome120",
    outDir: "android/build/web",
    emptyOutDir: true,
    rollupOptions: { input: "android/index.html" },
  },
});
