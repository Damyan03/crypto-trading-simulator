import { useEffect, useMemo, useState } from "react";
import { getMarkets, type Market } from "~/data/api";

const byVolume = (a: Market, b: Market) => b.quoteVolume - a.quoteVolume;
const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

export default function CoinList() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getMarkets()
      .then(setMarkets)
      .catch((e: Error) => setError(e.message));
  }, [attempt]);

  const sorted = useMemo(() => markets && [...markets].sort(byVolume), [markets]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="h-full overflow-y-auto bg-surface text-foreground">
      {!sorted && !error && <p className="p-4 text-muted-foreground">Loading coins…</p>}
      {sorted?.length === 0 && <p className="p-4 text-muted-foreground">No coins available.</p>}
      {error && (
        <div className="flex items-center gap-4 p-4 text-danger">
          <span>{error}</span>
          <button onClick={retry} className="rounded bg-primary px-3 py-1 text-white hover:bg-primary/90">
            Retry
          </button>
        </div>
      )}

      {sorted && sorted.length > 0 && (
        <>
          <div className="sticky top-0 flex gap-4 border-b bg-muted px-4 py-2 text-xs text-muted-foreground">
            <span>Coin</span>
            <span className="ml-auto">Price</span>
            <span className="w-20 text-right">24h</span>
            <span className="w-20 text-right">Volume</span>
          </div>
          <ul>
            {sorted.map((m) => (
              <li key={m.symbol} className="flex items-center gap-4 border-b px-4 py-3">
                <span className="font-semibold">{m.baseAsset}</span>
                <span className="text-sm text-muted-foreground">/{m.quoteAsset}</span>
                <span className="ml-auto tabular-nums">
                  {m.lastPrice.toLocaleString(undefined, {
                    minimumFractionDigits: m.priceDecimals,
                    maximumFractionDigits: m.priceDecimals,
                  })}
                </span>
                <span
                  className={`w-20 text-right tabular-nums ${m.priceChangePercent >= 0 ? "text-success" : "text-danger"}`}
                >
                  {m.priceChangePercent >= 0 ? "+" : ""}
                  {m.priceChangePercent.toFixed(2)}%
                </span>
                <span className="w-20 text-right tabular-nums text-muted-foreground">
                  {compact.format(m.quoteVolume)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
