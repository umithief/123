import type { ReactNode } from "react";
import { ChoiceStrip } from "./choice-strip";
import { ui } from "./interface-copy";

/** One consistent, horizontally scrollable section selector for editor tools. */
export function PanelTabs<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: readonly { id: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
}) {
  return (
    <ChoiceStrip className="panel-tabs studio-segments" aria-label={ui(label)} value={value}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={value === item.id}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {ui(item.label)}
        </button>
      ))}
    </ChoiceStrip>
  );
}
export function PanelPage({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div hidden={!active} className="panel-page">
      {children}
    </div>
  );
}
export function PanelHelp({ children }: { children: string }) {
  return (
    <details className="panel-help">
      <summary>{ui("Kısa açıklama")}</summary>
      <p>{ui(children)}</p>
    </details>
  );
}
