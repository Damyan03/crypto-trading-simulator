import { useEffect, useState } from "react";
import { getTradingPairs, type Pair } from "~/data/binance-rest";

/** Every tradable pair keyed by coin, e.g. pairs.BTC; undefined while loading */
export function usePairs() {
	const [pairs, setPairs] = useState<Record<string, Pair>>();
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);

	// cached after the first load
	useEffect(() => {
		setError(null);
		getTradingPairs()
			.then((list) => setPairs(Object.fromEntries(list.map((p) => [p.coin, p]))))
			.catch(setError);
	}, [attempt]);

	const retry = () => setAttempt((a) => a + 1);

	return { pairs, error, retry };
}
