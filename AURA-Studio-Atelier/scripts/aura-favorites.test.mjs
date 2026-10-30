import { test } from "node:test";
import assert from "node:assert/strict";
import { parseList, toggled, used } from "../src/components/aura/favorites.ts";

test("a favourite toggles in and out, newest first", () => {
  assert.deepEqual(toggled([], "pro-cube"), ["pro-cube"]);
  assert.deepEqual(toggled(["pro-cube"], "dissolve"), ["dissolve", "pro-cube"]);
  assert.deepEqual(toggled(["dissolve", "pro-cube"], "pro-cube"), ["dissolve"]);
});

test("recently used keeps the last eight, without repeats or 'none'", () => {
  let list = [];
  for (const id of ["a", "b", "c", "a", "none", "d", "e", "f", "g", "h", "i"])
    list = used(list, id);
  assert.deepEqual(list, ["i", "h", "g", "f", "e", "d", "a", "c"]);
  assert.equal(used(list, "none"), list, "'none' changes nothing");
});

test("stored lists survive bad data and forget removed items", () => {
  const known = (id) => id !== "gone";
  assert.deepEqual(parseList('["pro-cube","gone",3,"flash"]', known), ["pro-cube", "flash"]);
  assert.deepEqual(parseList("not json", known), []);
  assert.deepEqual(parseList('{"a":1}', known), []);
  assert.deepEqual(parseList(null, known), []);
});
