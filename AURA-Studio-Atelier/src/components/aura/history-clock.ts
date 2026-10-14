// The project and the captions keep separate histories. They share this clock
// so one undo/redo button can step through both in the order edits were made:
// undo takes the entry with the newest stamp, redo the most recently undone.
let clock = 0,
  barrier = 0;

/** A new edit: stamps it and invalidates every pending redo, in both histories. */
export function editStamp() {
  barrier = ++clock;
  return barrier;
}
/** An undo or redo: orders the entry without discarding other redos. */
export function stepStamp() {
  return ++clock;
}
/** Redo entries undone before the latest edit no longer apply. */
export function redoable(undoneAt: number | undefined) {
  return undoneAt !== undefined && undoneAt > barrier;
}
/** True while no other edit, undo or redo has happened since `at`. */
export function isLatestStamp(at: number) {
  return at === clock;
}
