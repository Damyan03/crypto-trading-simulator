import { useEffect, useState } from "react";
import { getCoinStats, subscribeCoinStats, type CoinStats } from "~/data/binance-api";
import { getCoinInfo, type CoinInfo } from "~/data/coingecko-api";

/** 24h stats for one pair, e.g. "BTCUSDT": fetched right away, then kept live by a stream */
export function useCoinStats(symbol: string) {
	const [stats, setStats] = useState<CoinStats | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	// REST: stats right away
	useEffect(() => {
		setError(null);
		getCoinStats(symbol).then(setStats).catch(setError);
	}, [symbol, attempt]);

	// stream: live stats; the cleanup closes the connection
	useEffect(() => subscribeCoinStats(symbol, setStats, setLive), [symbol]);

	// reruns the REST request
	const retry = () => setAttempt((a) => a + 1);

	return { stats, error, live, retry };
}

/** CoinGecko info for a coin like "BTC"; a failure sets `failed`, with no retry */
export function useCoinInfo(coin: string) {
	// undefined = loading, null = CoinGecko doesn't know the coin
	const [info, setInfo] = useState<CoinInfo | null>();
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		getCoinInfo(coin)
			.then(setInfo)
			.catch(() => setFailed(true));
	}, [coin]);

	return { info, failed };
}
