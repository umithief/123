import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SAFE_GUIDES,
  coveredBy,
  guideZones,
  parseGuide,
  safeSpot,
} from "../src/components/aura/safe-zones.ts";

const tiktok = guideZones("tiktok", "portrait");
const inside = (spot, box, zones) =>
  coveredBy({ x: spot.x - box.w / 2, y: spot.y - box.h / 2, w: box.w, h: box.h }, zones);

test("platform guides apply to 9:16 only; the margin guide to every size", () => {
  assert.equal(guideZones("tiktok", "landscape").length, 0);
  assert.equal(guideZones("reels", "portrait").length, 3);
  assert.equal(guideZones("margin", "square").length, 4);
  assert.equal(guideZones("off", "portrait").length, 0);
  assert.equal(parseGuide("shorts"), "shorts");
  assert.equal(parseGuide("<script>"), "off");
  for (const g of SAFE_GUIDES)
    for (const z of g.zones)
      assert.ok(z.x >= 0 && z.y >= 0 && z.x + z.w <= 1 && z.y + z.h <= 1.0001);
});

test("a caption at the very bottom is covered by the description area", () => {
  const box = { x: 0.15, y: 0.86, w: 0.7, h: 0.07 };
  assert.equal(coveredBy(box, tiktok)?.label, "Açıklama ve müzik");
  assert.equal(coveredBy({ x: 0.15, y: 0.6, w: 0.6, h: 0.07 }, tiktok), null);
});

test("the fix lifts the caption above the description and clear of the buttons", () => {
  const box = { x: 0.15, y: 0.86, w: 0.75, h: 0.07 };
  const spot = safeSpot(box, tiktok);
  assert.ok(spot);
  assert.equal(inside(spot, box, tiktok), null);
  assert.ok(spot.y + box.h / 2 <= 0.8 - 0.015 + 1e-9, "above the description");
  assert.ok(spot.x + box.w / 2 <= 0.855 - 0.015 + 1e-9, "left of the like/share column");
});

test("a caption that is too wide to pass the buttons moves above them", () => {
  const box = { x: 0.03, y: 0.62, w: 0.94, h: 0.08 };
  const spot = safeSpot(box, tiktok);
  assert.ok(spot);
  assert.equal(inside(spot, box, tiktok), null);
  assert.ok(spot.y + box.h / 2 <= 0.38);
});

test("a caption already clear stays where it is", () => {
  const box = { x: 0.2, y: 0.5, w: 0.5, h: 0.06 };
  assert.deepEqual(safeSpot(box, tiktok), { x: 0.45, y: 0.53 });
});

test("the margin guide keeps captions inside the inner 90 %", () => {
  const zones = guideZones("margin", "landscape");
  const box = { x: 0.01, y: 0.9, w: 0.5, h: 0.08 };
  const spot = safeSpot(box, zones);
  assert.equal(inside(spot, box, zones), null);
  assert.ok(spot.x - box.w / 2 >= 0.05 && spot.y + box.h / 2 <= 0.95);
});

test("a caption taller than the clear area has no safe spot", () => {
  assert.equal(safeSpot({ x: 0, y: 0, w: 0.5, h: 0.8 }, tiktok), null);
});
