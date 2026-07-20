const PREFIX = "flow-control:grid";

function safeIdentityPart(value, fallback) {
  const normalized = String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  return normalized || fallback;
}

export function createGridPreferenceKey({ userId, gridId, version = 1 }) {
  return [
    PREFIX,
    safeIdentityPart(userId, "anonymous"),
    safeIdentityPart(gridId, "grid"),
    `v${Number(version) || 1}`,
  ].join(":");
}

export function loadGridPreferences(storage, identity) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(createGridPreferenceKey(identity));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGridPreferences(storage, identity, preferences) {
  if (!storage) return;
  try {
    storage.setItem(
      createGridPreferenceKey(identity),
      JSON.stringify(preferences),
    );
  } catch {
    // Storage can be unavailable or full. Grid behavior remains in memory.
  }
}

export function resetGridPreferences(storage, identity) {
  if (!storage) return;
  try {
    storage.removeItem(createGridPreferenceKey(identity));
  } catch {
    // Reset is best-effort when browser storage is unavailable.
  }
}
