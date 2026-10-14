import { test } from "node:test";
import assert from "node:assert/strict";
import { editStamp, isLatestStamp, redoable, stepStamp } from "../src/components/aura/history-clock.ts";

// Two independent stacks driven the way the studio drives the project and captions.
function stack() {
  const h = { past: [], future: [], value: 0 };
  return {
    h,
    edit(v) { h.past.push({ v: h.value, at: editStamp() }); h.future = []; h.value = v; },
    undoAt: () => h.past.at(-1)?.at ?? 0,
    redoAt: () => (redoable(h.future[0]?.at) ? h.future[0].at : 0),
    undo() { const e = h.past.pop(); h.future.unshift({ v: h.value, at: stepStamp() }); h.value = e.v; },
    redo() { const e = h.future.shift(); h.past.push({ v: h.value, at: stepStamp() }); h.value = e.v; },
  };
}
const undo = (a, b) => (b.undoAt() > a.undoAt() ? b.undo() : a.undo());
const redo = (a, b) => (b.redoAt() > a.redoAt() ? b.redo() : a.redo());

test("undo and redo step through both histories in edit order", () => {
  const project = stack(), captions = stack(), seen = [];
  project.edit(1);
  captions.edit(1);
  project.edit(2);
  captions.edit(2);
  const state = () => `${project.h.value}${captions.h.value}`;
  for (let i = 0; i < 4; i++) { undo(project, captions); seen.push(state()); }
  assert.deepEqual(seen, ["21", "11", "10", "00"]);
  seen.length = 0;
  for (let i = 0; i < 4; i++) { redo(project, captions); seen.push(state()); }
  assert.deepEqual(seen, ["10", "11", "21", "22"]);
});
test("a new edit in either history drops every pending redo", () => {
  const project = stack(), captions = stack();
  project.edit(1);
  captions.edit(1);
  undo(project, captions);
  undo(project, captions);
  assert.ok(project.redoAt() && captions.redoAt());
  captions.edit(5);
  assert.equal(project.redoAt(), 0);
  assert.equal(captions.redoAt(), 0);
  assert.ok(isLatestStamp(captions.undoAt()));
  stepStamp();
  assert.ok(!isLatestStamp(captions.undoAt()));
});
