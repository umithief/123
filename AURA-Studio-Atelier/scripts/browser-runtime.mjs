// Public browser assets can use the managed runtime's proxy and CA trust in QA.
// Node still verifies TLS; no browser trust-store changes are needed.
export async function useRuntimeAssetFetch(page) {
  if (process.env.BROWSER_RUNTIME_ASSETS !== "1") return;
  await page
    .context()
    .route(
      /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|grok\.com|huggingface\.co)\//,
      async (route) => {
        try {
          const requestHeaders = await route.request().allHeaders();
          const response = await fetch(route.request().url(), {
            headers: {
              "user-agent": requestHeaders["user-agent"] ?? "",
              accept: requestHeaders.accept ?? "*/*",
              origin: requestHeaders.origin ?? new URL(page.url()).origin,
            },
          });
          const headers = Object.fromEntries(response.headers);
          delete headers["content-encoding"];
          delete headers["content-length"];
          await route.fulfill({
            status: response.status,
            headers,
            body: Buffer.from(await response.arrayBuffer()),
          });
        } catch (error) {
          console.error("Runtime asset fetch failed:", error.message);
          await route.abort("failed");
        }
      },
    );
}
