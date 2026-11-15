import { useEffect, useState } from "react";
import ErrorMessage from "~/components/ErrorMessage";
import ReconnectingNote from "~/components/ReconnectingNote";
import { getDepth, QUOTE, subscribeDepth, type Depth, type DepthLevel, type Pair } from "~/data/binance-api";
import { formatPrice, formatQuantity } from "~/utils/format";

// price levels shown per side
const LEVELS = 10;

interface Props {
  pair: Pair;
  /** Live price, shown between asks and bids */
  price: number | undefined;
}

/** Live order book: how much of the coin is waiting to be bought or sold at each price */
export default function OrderBook({ pair, price }: Props) {
  const [depth, setDepth] = useState<Depth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // false while the live connection is down and reconnecting
  const [live, setLive] = useState(true);

  // REST: first snapshot, unless the stream was quicker
  useEffect(() => {
    getDepth(pair.symbol, LEVELS)
      .then((d) => setDepth((prev) => prev ?? d))
      .catch((e: Error) => setError(e.message));
  }, [pair, attempt]);

  // stream: a fresh snapshot every second; the cleanup closes the connection
  useEffect(() => subscribeDepth(pair.symbol, LEVELS, setDepth, setLive), [pair]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  if (error && !depth) return <ErrorMessage message={error} onRetry={retry} />;
  if (!depth) return <p className="bg-surface p-4 text-sm text-muted-foreground">Loading order book…</p>;

  // bar widths are relative to the biggest level shown
  const max = Math.max(...depth.bids.map((l) => l.quantity), ...depth.asks.map((l) => l.quantity));

  const row = (level: DepthLevel, side: "bid" | "ask") => (
    <div key={level.price} className="relative flex justify-between px-3 py-0.5">
      <div
        className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-success-subtle" : "bg-danger-subtle"}`}
        style={{ width: `${(level.quantity / max) * 100}%` }}
      />
      <span className={`relative ${side === "bid" ? "text-success" : "text-danger"}`}>
        {formatPrice(level.price, pair.priceDecimals)}
      </span>
      <span className="relative">{formatQuantity(level.quantity, pair.quantityDecimals)}</span>
    </div>
  );

  return (
    <div className="h-full overflow-hidden bg-surface text-xs tabular-nums text-foreground">
      <div className="flex justify-between px-3 py-2 text-muted-foreground">
        <span>Price ({QUOTE})</span>
        <span>Amount ({pair.coin})</span>
      </div>
      {/* highest ask on top, so the best ask sits next to the price */}
      {[...depth.asks].reverse().map((l) => row(l, "ask"))}
      <p className="px-3 py-1.5 text-sm font-semibold">{price === undefined ? "…" : formatPrice(price, pair.priceDecimals)}</p>
      {depth.bids.map((l) => row(l, "bid"))}
      {!live && <ReconnectingNote className="px-3 py-2" />}
    </div>
  );
}
