// Added to every key so ours are easy to spot in localStorage
const PREFIX = "crypto-sim-";

/** What gets saved in localStorage */
interface Entry<T> {
  savedAt: number;
  version: number;
  data: T;
}

/** Null if missing, unreadable, from another version or older than `maxAgeMs` */
export function load<T>(key: string, version: number, maxAgeMs = Infinity): T | null {
  try {
    const entry = JSON.parse(localStorage.getItem(PREFIX + key) ?? "null") as Entry<T> | null;
    if (!entry || entry.version !== version || Date.now() - entry.savedAt > maxAgeMs) return null;
    return entry.data ?? null;
  } catch {
    return null;
  }
}

/** Saves data together with the current time and version */
export function save<T>(key: string, version: number, data: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), version, data }));
  } catch {
    // storage full or blocked
  }
}
