import test from "node:test";
import assert from "node:assert/strict";

import {
  createGridPreferenceKey,
  loadGridPreferences,
  saveGridPreferences,
  resetGridPreferences,
} from "../src/lib/data-grid/preferences.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("preference keys are namespaced by user, grid, and schema version", () => {
  assert.equal(
    createGridPreferenceKey({ userId: "admin", gridId: "qa", version: 2 }),
    "flow-control:grid:admin:qa:v2",
  );
});

test("preferences round-trip without crossing grid namespaces", () => {
  const storage = memoryStorage();
  const qa = { userId: "admin", gridId: "qa", version: 1 };
  const batches = { userId: "admin", gridId: "batches", version: 1 };

  saveGridPreferences(storage, qa, { pageSize: 25 });
  saveGridPreferences(storage, batches, { pageSize: 50 });

  assert.equal(loadGridPreferences(storage, qa).pageSize, 25);
  assert.equal(loadGridPreferences(storage, batches).pageSize, 50);
});

test("corrupt preferences fail closed and reset removes only the selected grid", () => {
  const identity = { userId: "admin", gridId: "qa", version: 1 };
  const key = createGridPreferenceKey(identity);
  const storage = memoryStorage({ [key]: "not-json" });

  assert.equal(loadGridPreferences(storage, identity), null);
  saveGridPreferences(storage, identity, { pageSize: 10 });
  resetGridPreferences(storage, identity);
  assert.equal(loadGridPreferences(storage, identity), null);
});
