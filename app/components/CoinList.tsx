import { useEffect, useMemo, useState } from "react";
import ErrorMessage from "~/components/ErrorMessage";
import { getMarkets, QUOTE, type Market } from "~/data/api";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";

// most traded first
const byVolume = (a: Market, b: Market) => b.quoteVolume - a.quoteVolume;

/** All USDT pairs with price, 24h change and volume */
export default function CoinList() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // changing this reruns the effect, i.e. loads again
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getMarkets()
      .then(setMarkets)
      .catch((e: Error) => setError(e.message));
  }, [attempt]);

  // sorts a copy, only when the data changes
  const sorted = useMemo(() => markets && [...markets].sort(byVolume), [markets]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  // shared cell styles
  const th = "px-4 py-2 text-right font-normal whitespace-nowrap";
  const td = "px-4 py-3 text-right whitespace-nowrap";

  return (
    <div className="h-full overflow-y-auto bg-surface text-foreground">
      {!sorted && !error && <p className="p-4 text-muted-foreground">Loading coins…</p>}
      {sorted?.length === 0 && <p className="p-4 text-muted-foreground">No coins available.</p>}
      {error && <ErrorMessage message={error} onRetry={retry} />}

      {sorted && sorted.length > 0 && (
        <table className="w-full">
          <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="w-full px-4 py-2 text-left font-normal">Coin</th>
              <th className={th}>Price</th>
              <th className={th}>24h</th>
              <th className={th}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.symbol} className="border-b tabular-nums">
                <td className="px-4 py-3 text-left">
                  <span className="font-semibold">{m.coin}</span>
                  <span className="ml-2 text-sm text-muted-foreground">/{QUOTE}</span>
                </td>
                <td className={td}>{formatPrice(m.lastPrice, m.priceDecimals)}</td>
                <td className={`${td} ${changeColor(m.priceChangePercent)}`}>{formatPercent(m.priceChangePercent)}</td>
                <td className={`${td} text-muted-foreground`}>{formatVolume(m.quoteVolume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
