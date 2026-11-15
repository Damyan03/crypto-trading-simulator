import { useEffect, useState } from "react";
import { getPrices, subscribePrices } from "~/data/binance-api";
import type { Prices } from "~/domain/profile";

/** Prices of the given coins: fetched right away, then kept live by one stream */
export function useLivePrices(coinList: string[]) {
  const [prices, setPrices] = useState<Prices>({});
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // false while the live connection is down and reconnecting
  const [live, setLive] = useState(true);

  // e.g. "BTC,ETH"; a string so the effects only rerun when the coins change
  const coins = coinList.join(",");

  // REST: prices right away
  useEffect(() => {
    if (!coins) return;
    setError(null);
    getPrices(coins.split(","))
      .then(setPrices)
      .catch((e: Error) => setError(e.message));
  }, [coins, attempt]);

  // stream: live prices; the cleanup closes the connection
  useEffect(() => {
    if (!coins) return;
    return subscribePrices(
      coins.split(","),
      (coin, price) => setPrices((prev) => ({ ...prev, [coin]: price })),
      setLive,
    );
  }, [coins]);

  // reruns the REST request
  const retry = () => setAttempt((a) => a + 1);

  return { prices, error, live, retry };
}
