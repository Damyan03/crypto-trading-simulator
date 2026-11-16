import { useEffect, useState } from "react";
import { getMarkets, type Market, type Ticker } from "~/data/binance-rest";
import { subscribeTickers } from "~/data/binance-ws";

// ms before connecting to a new set of coins; changes within it open one connection, not one each
const SUBSCRIBE_DELAY = 300;

/** Every USDT pair with its 24h stats; null while loading */
export function useMarkets() {
	const [markets, setMarkets] = useState<Market[] | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		setError(null);
		getMarkets().then(setMarkets).catch(setError);
	}, [attempt]);

	// reruns the request
	const retry = () => setAttempt((a) => a + 1);

	return { markets, error, retry };
}

/** Live 24h stats of the given coins, keyed by symbol, all on one connection */
export function useLiveTickers(coinList: string[]) {
	const [tickers, setTickers] = useState<Record<string, Ticker>>({});
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	// e.g. "BTC,ETH"; the stream reconnects only when this string changes
	const coins = coinList.join(",");

	// the cleanup closes the connection
	useEffect(() => {
		if (!coins) return;
		let unsubscribe = () => {};
		const timer = setTimeout(() => {
			unsubscribe = subscribeTickers(
				coins.split(","),
				(ticker) => setTickers((prev) => ({ ...prev, [ticker.symbol]: ticker })),
				setLive,
			);
		}, SUBSCRIBE_DELAY);
		return () => {
			clearTimeout(timer);
			unsubscribe();
		};
	}, [coins]);

	return { tickers, live };
}
