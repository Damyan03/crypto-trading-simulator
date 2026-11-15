import { useEffect, useState } from "react";
import { getPrices, getTradingPairs, subscribePrices, type Pair } from "~/data/binance-api";
import type { Prices } from "~/domain/profile";
import { useProfile } from "./store";

/** Live prices and pair info (for decimals) of every coin you hold */
export function useHoldingPrices() {
  const { profile } = useProfile();
  const [prices, setPrices] = useState<Prices>({});
  const [pairs, setPairs] = useState<Record<string, Pair>>({});
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // false while the live connection is down and reconnecting
  const [live, setLive] = useState(true);

  // e.g. "BTC,ETH"; a string so the effects only rerun when the coins change
  const coins = Object.keys(profile.holdings).join(",");

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

  // decimals for formatting each coin (cached after the first load)
  useEffect(() => {
    if (!coins) return;
    getTradingPairs()
      .then((list) => setPairs(Object.fromEntries(list.map((p) => [p.coin, p]))))
      .catch(() => {}); // formatting falls back to default decimals
  }, [coins]);

  // reruns the REST request
  const retry = () => setAttempt((a) => a + 1);

  return { prices, pairs, error, live, retry };
}
