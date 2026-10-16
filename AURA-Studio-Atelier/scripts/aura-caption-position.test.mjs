import { test } from "node:test";
import { register } from "node:module";
import assert from "node:assert/strict";
import {
  DEFAULT_CAPTIONS,
  parseCaptionPosition,
  restoreCaptionOptions,
} from "../src/components/aura/captions.ts";
import { CAPTION_TEMPLATES } from "../src/components/aura/caption-templates.ts";

// caption-paint.ts uses bundler-style imports without extensions.
register(
  "data:text/javascript," +
    encodeURIComponent(
      "export async function resolve(s, c, next) { try { return await next(s, c); } catch (e) {" +
        " if (s.startsWith('.') && !/\\.[a-z]+$/.test(s)) return next(s + '.ts', c); throw e; } }",
    ),
);
const { paintCaptions } = await import("../src/components/aura/caption-paint.ts");

// A canvas context that only measures text (10 px per character).
function stubContext() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {},
    {
      get(target, key) {
        if (key in target) return target[key];
        if (key === "measureText") return (text) => ({ width: Array.from(text).length * 10 });
        if (key === "createLinearGradient" || key === "createRadialGradient") return () => gradient;
        return () => {};
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    },
  );
}
const cue = { id: "c1", text: "Merhaba dünya", start: 0, end: 4 };
const options = (patch = {}) => ({ ...DEFAULT_CAPTIONS, animation: "none", ...patch });
const box = (o) => paintCaptions(stubContext(), 1000, 600, 0, [cue], o, 2, "#fff");

test("caption positions are validated and default to none", () => {
  assert.equal(DEFAULT_CAPTIONS.position, null);
  assert.equal(parseCaptionPosition(null), null);
  assert.equal(parseCaptionPosition({ x: "1", y: 0 }), null);
  assert.deepEqual(parseCaptionPosition({ x: -2, y: 4 }), { x: 0, y: 1 });
  assert.equal(restoreCaptionOptions("{}").position, null);
  assert.deepEqual(
    restoreCaptionOptions(JSON.stringify({ position: { x: 0.25, y: 0.3 } })).position,
    { x: 0.25, y: 0.3 },
  );
});

test("templates never move a dragged caption", () => {
  for (const t of CAPTION_TEMPLATES) assert.equal("position" in t.options, false, t.id);
});

test("the painter reports where the caption block sits", () => {
  const placed = box(options());
  assert.equal(placed.id, "c1");
  assert.ok(Math.abs(placed.x + placed.width / 2 - 500) < 0.5, "centred by default");
  assert.ok(placed.y + placed.height > 400, "bottom by default");
  assert.equal(box(options({ enabled: false })), null);
  assert.equal(paintCaptions(stubContext(), 1000, 600, 0, [cue], options(), 9, "#fff"), null);
});

test("a free position moves the block, which stays inside the frame", () => {
  const moved = box(options({ position: { x: 0.3, y: 0.25 } }));
  assert.ok(Math.abs(moved.x + moved.width / 2 - 300) < 0.5);
  assert.ok(Math.abs(moved.y + moved.height / 2 - 150) < 0.5);
  const corner = box(options({ position: { x: 1, y: 0 } }));
  assert.ok(corner.x + corner.width <= 1000 - 7, "kept off the right edge");
  assert.ok(corner.y >= 7, "kept off the top edge");
});
