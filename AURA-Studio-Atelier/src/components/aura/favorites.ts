// Favourites and recently used transitions, animations and effects, kept on
// the device. Every gallery that shows the same collection stays in step.
import { useEffect, useRef, useState } from "react";
import { readSetting, writeSetting } from "./storage.ts";

export type Collection = "transitions" | "motions" | "effects";
const RECENT = 8,
  MOST = 40;

/** `id` added to (or removed from) the favourites; the newest comes first. */
export function toggled(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list].slice(0, MOST);
}
/** `id` moved to the front of the recently used ("none" is never recorded). */
export function used(list: string[], id: string): string[] {
  if (!id || id === "none") return list;
  return [id, ...list.filter((x) => x !== id)].slice(0, RECENT);
}
/** A stored list, keeping only ids the collection still has. */
export function parseList(raw: string | null, known: (id: string) => boolean): string[] {
  try {
    const value = JSON.parse(raw ?? "[]");
    return Array.isArray(value)
      ? value.filter((x): x is string => typeof x === "string" && known(x)).slice(0, MOST)
      : [];
  } catch {
    return [];
  }
}

const EVENT = "aura-favorites";
export function useFavorites(collection: Collection, known: (id: string) => boolean) {
  const keys = { favorites: `aura-favorites-${collection}`, recent: `aura-recent-${collection}` };
  const load = () => ({
    favorites: parseList(readSetting(keys.favorites), known),
    recent: parseList(readSetting(keys.recent), known),
  });
  const [state, setState] = useState(load);
  const reload = useRef(load);
  reload.current = load;
  useEffect(() => {
    const sync = (event: Event) => {
      if ((event as CustomEvent).detail === collection) setState(reload.current());
    };
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [collection]);
  const save = (next: { favorites: string[]; recent: string[] }) => {
    writeSetting(keys.favorites, JSON.stringify(next.favorites));
    writeSetting(keys.recent, JSON.stringify(next.recent));
    setState(next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: collection }));
  };
  return {
    ...state,
    isFavorite: (id: string) => state.favorites.includes(id),
    toggle: (id: string) => {
      if (id !== "none") save({ ...state, favorites: toggled(state.favorites, id) });
    },
    use: (id: string) => {
      const recent = used(state.recent, id);
      if (recent !== state.recent) save({ ...state, recent });
    },
  };
}
