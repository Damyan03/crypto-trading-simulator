import { useEffect, useState } from "react";
import { getCandles, subscribeCandles, type Candle, type CandleInterval } from "~/data/binance-api";

/**
 * Candles for one pair, e.g. "BTCUSDT", oldest first.
 * Live updates of the newest candle come separately as `latest`; `candles` stays the loaded history.
 */
export function useCandles(symbol: string, interval: CandleInterval) {
	// null while loading
	const [candles, setCandles] = useState<Candle[] | null>(null);
	const [latest, setLatest] = useState<Candle | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	useEffect(() => {
		// a late response for a previous pair or interval is ignored
		let cancelled = false;
		let unsubscribe = () => {};
		setCandles(null);
		setLatest(null);
		setError(null);

		getCandles(symbol, interval)
			.then((history) => {
				if (cancelled) return;
				setCandles(history);
				// live updates only after the history
				unsubscribe = subscribeCandles(symbol, interval, setLatest, setLive);
			})
			.catch((e: Error) => {
				if (!cancelled) setError(e);
			});

		return () => {
			cancelled = true;
			unsubscribe();
		};
	}, [symbol, interval, attempt]);

	// reruns the request
	const retry = () => setAttempt((a) => a + 1);

	return { candles, latest, error, live, retry };
}
