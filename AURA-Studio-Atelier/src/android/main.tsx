import { createRoot } from "react-dom/client";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { AuraStage } from "@/components/aura/stage";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AuthProvider } from "@/lib/auth/provider";
import "../styles.css";

const routeTree = createRootRoute({
  component: () => (
    <>
      <PreviewHostBridge />
      <AuthProvider><AuraStage /></AuthProvider>
    </>
  ),
  errorComponent: ({ error }) => (
    <main className="p-6 text-ink">
      <h1 className="text-xl">AURA Studio açılamadı</h1>
      <p className="my-4 text-sm">{error instanceof Error ? error.message : String(error)}</p>
      <button onClick={() => location.reload()}>Yeniden dene</button>
    </main>
  ),
});
const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
