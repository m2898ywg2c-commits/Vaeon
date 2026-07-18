// Stands in for the window.storage API that only exists inside Claude artifacts.
// Same shape (get/set/delete/list, all async, same return objects), backed by
// the browser's own localStorage so the app works completely standalone.

const PREFIX = "workout-tracker:";

function fullKey(key) {
  return PREFIX + key;
}

export const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw === null) return null;
      return { key, value: raw };
    } catch (e) {
      console.error("storage.get
