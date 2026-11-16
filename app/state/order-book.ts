import { useEffect, useState } from "react";
import { subscribeOrderBook } from "~/data/binance-api";
import type { Depth } from "~/domain/order-book";

/** Live order book for one pair, e.g. "BTCUSDT"; null until it's in sync */
export function useOrderBook(symbol: string) {
	const [depth, setDepth] = useState<Depth | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	// the cleanup closes the connection
	useEffect(() => {
		setError(null);
		return subscribeOrderBook(symbol, setDepth, setLive, setError);
	}, [symbol, attempt]);

	// opens a new connection
	const retry = () => setAttempt((a) => a + 1);

	return { depth, error, live, retry };
}
