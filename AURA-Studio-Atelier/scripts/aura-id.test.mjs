import test from 'node:test';
import assert from 'node:assert/strict';
import { createId } from '../src/components/aura/id.ts';

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
test('entity IDs use the native secure UUID API when available', () => {
  assert.match(createId(), uuidV4);
});
test('entity IDs remain valid and distinct when HTTP omits randomUUID', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const secureCrypto = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {
    getRandomValues: secureCrypto.getRandomValues.bind(secureCrypto),
  }});
  try {
    const ids = Array.from({ length: 100 }, () => createId());
    ids.forEach(id => assert.match(id, uuidV4));
    assert.equal(new Set(ids).size, ids.length);
  } finally {
    Object.defineProperty(globalThis, 'crypto', original);
  }
});
