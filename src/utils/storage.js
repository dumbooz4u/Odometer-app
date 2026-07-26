// Wrappers that swallow storage errors (private browsing, quota, disabled
// storage) so a persistence failure never breaks the app.

export function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore persistence failures */
  }
}

export function remove(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    /* ignore */
  }
}
