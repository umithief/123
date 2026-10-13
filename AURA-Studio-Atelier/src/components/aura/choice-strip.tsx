import { ui } from "./interface-copy";
import { Children, isValidElement, useEffect, useRef, type ReactNode } from "react";

/** Native touch panning, with the same keyboard and selection behavior in every gallery. */
export function ChoiceStrip({
  children,
  value,
  className = "",
  ...props
}: {
  children: ReactNode;
  value?: string | number;
  className?: string;
  "aria-label": string;
  hidden?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pointerFocus = useRef(false);
  const keys = Children.toArray(children)
    .map((c) => (isValidElement(c) ? c.key : ""))
    .join("|");
  function reveal(item: HTMLElement) {
    const strip = ref.current;
    if (!strip) return;
    const edge = strip.getBoundingClientRect(),
      box = item.getBoundingClientRect();
    if (box.left < edge.left + 4) strip.scrollLeft += box.left - edge.left - 4;
    else if (box.right > edge.right - 4) strip.scrollLeft += box.right - edge.right + 4;
  }
  // A different gallery starts at its beginning with the selection in view.
  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    strip.scrollLeft = 0;
    const selected = strip.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (selected) reveal(selected);
  }, [keys, props.hidden]);
  // Choosing an item keeps the strip where it is; it only scrolls when the
  // selection is partly hidden (e.g. changed by undo).
  useEffect(() => {
    const selected = ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (selected) reveal(selected);
  }, [value]);
  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaX || !event.deltaY) return;
      const step =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1);
      const next = Math.max(
        0,
        Math.min(strip.scrollWidth - strip.clientWidth, strip.scrollLeft + step),
      );
      if (next !== strip.scrollLeft) {
        event.preventDefault();
        strip.scrollLeft = next;
      }
    };
    strip.addEventListener("wheel", wheel, { passive: false });
    return () => strip.removeEventListener("wheel", wheel);
  }, []);
  return (
    <div
      {...props}
      ref={ref}
      role="group"
      className={`choice-strip ${className}`}
      onPointerDownCapture={() => {
        pointerFocus.current = true;
      }}
      onPointerUpCapture={() => {
        pointerFocus.current = false;
      }}
      onPointerCancelCapture={() => {
        pointerFocus.current = false;
      }}
      onMouseDownCapture={(event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
        if (button && !button.disabled) {
          event.preventDefault();
          button.focus({ preventScroll: true });
        }
      }}
      onFocusCapture={(event) => {
        if (pointerFocus.current) return;
        const button = (event.target as HTMLElement).closest("button");
        if (button) reveal(button);
      }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
        );
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (index < 0) return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : Math.max(
                  0,
                  Math.min(buttons.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)),
                );
        buttons[next]?.focus({ preventScroll: true });
      }}
    >
      {children}
    </div>
  );
}

export function ChoicePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string; family?: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <section className="choice-picker">
      <h4>{ui(label)}</h4>
      <ChoiceStrip aria-label={ui(label)} value={value} className="choice-chips">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            style={option.family ? { fontFamily: option.family } : undefined}
          >
            {ui(option.label)}
          </button>
        ))}
      </ChoiceStrip>
    </section>
  );
}
