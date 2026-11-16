// prefix of every localStorage key
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

// fetches in progress by key; a second call for the same key gets the same promise
const inFlight = new Map<string, Promise<unknown>>();

/** Saved data if it's fresh, otherwise fetches and saves it (null results aren't saved) */
export function cached<T>(key: string, version: number, maxAgeMs: number, fetcher: () => Promise<T>): Promise<T> {
	const saved = load<T>(key, version, maxAgeMs);
	if (saved !== null) return Promise.resolve(saved);

	let request = inFlight.get(key) as Promise<T> | undefined;
	if (!request) {
		request = fetcher()
			.then((data) => {
				if (data !== null) save(key, version, data);
				return data;
			})
			.finally(() => inFlight.delete(key));
		inFlight.set(key, request);
	}
	return request;
}
