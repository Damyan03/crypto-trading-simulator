import { useCallback, useEffect, useRef, useState } from "react";
import { getCandles, type Candle, type CandleInterval } from "~/data/binance-rest";
import { subscribeCandles } from "~/data/binance-ws";

// candles per request
const LIMIT = 500;

/** `candles` with a live update: replaces the newest candle, or adds one when a new candle starts */
function withLive(candles: Candle[], candle: Candle): Candle[] {
	const last = candles[candles.length - 1];
	if (!last || candle.time > last.time) return [...candles, candle];
	if (candle.time === last.time) return [...candles.slice(0, -1), candle];
	return candles;
}

/**
 * Candles for one pair, e.g. "BTCUSDT", oldest first, with live updates of the newest one.
 * Starts with the latest LIMIT; `loadOlder` adds earlier ones at the start.
 */
export function useCandles(symbol: string, interval: CandleInterval) {
	// null while loading
	const [candles, setCandles] = useState<Candle[] | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);
	// older-candle loading for the current history; a new history replaces it and drops earlier results
	const olderRef = useRef({ loading: false, done: false });

	useEffect(() => {
		// a late response for a previous pair or interval is ignored
		let cancelled = false;
		let unsubscribe = () => {};
		olderRef.current = { loading: false, done: false };
		setCandles(null);
		setError(null);

		getCandles(symbol, interval, LIMIT)
			.then((history) => {
				if (cancelled) return;
				setCandles(history);
				// live updates only after the history
				unsubscribe = subscribeCandles(
					symbol,
					interval,
					(candle) => setCandles((prev) => prev && withLive(prev, candle)),
					setLive,
				);
			})
			.catch((e: Error) => {
				if (!cancelled) setError(e);
			});

		return () => {
			cancelled = true;
			unsubscribe();
		};
	}, [symbol, interval, attempt]);

	/** Adds the LIMIT candles before `oldest` (start time in seconds); one request at a time, none once there are no more */
	const loadOlder = useCallback(
		(oldest: number) => {
			const older = olderRef.current;
			if (older.loading || older.done) return;
			older.loading = true;
			getCandles(symbol, interval, LIMIT, oldest)
				.then((loaded) => {
					if (older !== olderRef.current) return;
					older.done = loaded.length === 0;
					setCandles((prev) => prev && [...loaded.filter((c) => c.time < prev[0].time), ...prev]);
				})
				.catch((e: Error) => {
					if (older === olderRef.current) setError(e);
				})
				.finally(() => {
					older.loading = false;
				});
		},
		[symbol, interval],
	);

	// reruns the request
	const retry = () => setAttempt((a) => a + 1);

	return { candles, error, live, retry, loadOlder };
}
