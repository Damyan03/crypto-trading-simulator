import { useEffect, useState } from "react";
import { getPrices } from "~/data/binance-rest";
import { subscribePrices } from "~/data/binance-ws";
import type { Prices } from "~/domain/profile";

/** Prices of the given coins: fetched right away, then kept live by one stream */
export function useLivePrices(coinList: string[]) {
	const [prices, setPrices] = useState<Prices>({});
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	// e.g. "BTC,ETH"; the effects rerun only when this string changes
	const coins = coinList.join(",");

	// REST: prices right away
	useEffect(() => {
		if (!coins) return;
		setError(null);
		getPrices(coins.split(",")).then(setPrices).catch(setError);
	}, [coins, attempt]);

	// stream: live prices; the cleanup closes the connection
	useEffect(() => {
		if (!coins) return;
		return subscribePrices(coins.split(","), (coin, price) => setPrices((prev) => ({ ...prev, [coin]: price })), setLive);
	}, [coins]);

	// reruns the REST request
	const retry = () => setAttempt((a) => a + 1);

	return { prices, error, live, retry };
}

export type LivePrices = ReturnType<typeof useLivePrices>;
