import { createFileRoute } from "@tanstack/react-router";
import { AuraStage } from "@/components/aura/stage";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AuraStage />;
}
