// A big edit (deleting, cutting a range, applying to everything) announces
// itself; the studio then offers "Geri al" for a few seconds.
export const EDIT_EVENT = "aura-edit";

/** `message` is the Turkish description; the studio translates it. */
export function announceEdit(message: string) {
  window.dispatchEvent(new CustomEvent(EDIT_EVENT, { detail: message }));
}
