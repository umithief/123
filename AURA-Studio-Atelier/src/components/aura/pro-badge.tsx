import { ui } from "./interface-copy";

/** The gold mark on every AURA Pro effect, animation and transition. */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`pro-badge ${className}`.trim()} aria-label={ui("Pro")} title={ui("AURA Pro")}>
      PRO
    </span>
  );
}
