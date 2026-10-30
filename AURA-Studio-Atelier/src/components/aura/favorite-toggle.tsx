import { Star } from "lucide-react";
import { ui } from "./interface-copy";

/** Adds the selected look to (or removes it from) the favourites. */
export function FavoriteToggle({
  active,
  disabled,
  label,
  onToggle,
}: {
  active: boolean;
  disabled?: boolean;
  /** The selected item's name, for screen readers. */
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="favorite-toggle"
      aria-pressed={active}
      disabled={disabled}
      aria-label={`${ui(label)} · ${ui(active ? "Favorilerden çıkar" : "Favorilere ekle")}`}
      title={ui(active ? "Favorilerden çıkar" : "Favorilere ekle")}
      onClick={onToggle}
    >
      <Star className="size-4" fill={active ? "currentColor" : "none"} />
    </button>
  );
}

/** The small star on a favourite tile. */
export function FavoriteMark() {
  return (
    <span className="favorite-mark" aria-hidden="true">
      <Star className="size-3" fill="currentColor" />
    </span>
  );
}
