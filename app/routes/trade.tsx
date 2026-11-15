import { useEffect, useState } from "react";
import CoinDetails from "~/components/CoinDetails";
import ErrorMessage from "~/components/ErrorMessage";
import PriceChart from "~/components/PriceChart";
import { getTradingPairs, type Pair } from "~/data/binance-api";
import type { Route } from "./+types/trade";

export default function Trade({ params }: Route.ComponentProps) {
  // "/trade/btc" → "BTC"
  const coin = params.coin.toUpperCase();
  // undefined = loading, null = not traded here
  const [pair, setPair] = useState<Pair | null>();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // find the coin's pair once; the details and chart (and later the trade form) all need it
  useEffect(() => {
    setPair(undefined);
    setError(null);
    getTradingPairs()
      .then((pairs) => setPair(pairs.find((p) => p.coin === coin) ?? null))
      .catch((e: Error) => setError(e.message));
  }, [coin, attempt]);

  const retry = () => setAttempt((a) => a + 1);

  return (
    <div className="flex h-full w-full bg-red-500">
      <div className="flex flex-col w-9/12 h-full bg-green-500">
        <div className="flex w-full h-9/12 bg-blue-500">
          <div className="flex flex-col w-4/5 bg-yellow-500 h-full">
            <div className="w-full bg-green-500">
              {error && <ErrorMessage message={error} onRetry={retry} />}
              {!error && pair === undefined && <p className="bg-surface p-4 text-muted-foreground">Loading {coin}…</p>}
              {pair === null && <p className="bg-surface p-4 text-muted-foreground">{coin} isn't traded on this platform.</p>}
              {/* key: a new coin starts with fresh state instead of showing the previous coin's data */}
              {pair && <CoinDetails key={pair.symbol} pair={pair} />}
            </div>
            <div className="bg-orange-500 flex-1 min-h-0">{pair && <PriceChart key={pair.symbol} pair={pair} />}</div>
          </div>
          <div className="flex-1 bg-cyan-500 h-full">
            <div className="bg-purple-500 w-full">trade</div>
            <div className="bg-pink-500 w-full">trade</div>
            <div className="bg-gray-500 w-full">trade</div>
          </div>
        </div>
        <div className="flex-1 bg-purple-500">
          <div className="bg-pink-500 w-full">trade history</div>
          <div className="bg-gray-500 w-full">trade history</div>
          <div className="bg-indigo-500 w-full">trade history</div>
        </div>
      </div>
      <div className="flex-1 bg-amber-500">
        trading window
      </div>
    </div>
  );
}
