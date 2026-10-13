import assert from "node:assert/strict";
import test from "node:test";
import { frameAt, parseEditorProject, emptyProject } from "../src/components/aura/editor.ts";

const layer = (keyframes) => ({
  id: "l",
  kind: "text",
  text: "x",
  start: 0,
  end: 10,
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  opacity: 1,
  color: "#ffffff",
  background: false,
  animation: "none",
  font: "sans",
  weight: 600,
  textEffect: "none",
  blend: "source-over",
  keyframes,
});
const kf = (time, x) => ({ time, x, y: 0.5, scale: 1, opacity: 1, rotation: 0 });

test("sorted and unsorted keyframes interpolate identically", () => {
  const sorted = layer([kf(0, 0), kf(2, 1), kf(4, 0)]);
  const shuffled = layer([kf(4, 0), kf(0, 0), kf(2, 1)]);
  for (const t of [-1, 0, 0.5, 1, 2, 3, 4, 9])
    assert.deepEqual(frameAt(shuffled, t), frameAt(sorted, t));
  assert.equal(frameAt(sorted, 1).x, 0.5);
  assert.equal(frameAt(sorted, 3).x, 0.5);
});

test("interpolation does not reorder the stored keyframes", () => {
  const frames = [kf(4, 0), kf(0, 0)];
  frameAt(layer(frames), 2);
  assert.deepEqual(
    frames.map((f) => f.time),
    [4, 0],
  );
});

test("imported keyframes are stored in time order", () => {
  const raw = JSON.stringify({
    ...emptyProject(),
    clips: [{ in: 0, out: 10 }],
    layers: [layer([kf(5, 0.2), kf(1, 0.8), kf(3, 0.4)])],
  });
  const project = parseEditorProject(raw, 10);
  assert.deepEqual(
    project.layers[0].keyframes.map((f) => f.time),
    [1, 3, 5],
  );
});
