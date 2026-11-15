import { Link, useNavigate } from "react-router";
import { QUOTE, type Pair } from "~/data/binance-api";
import type { Holdings, Prices } from "~/domain/profile";
import {
  changeColor,
  formatPercent,
  formatPrice,
  formatQuantity,
  formatSignedUsdt,
  formatUsdt,
} from "~/utils/format";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

interface Props {
  holdings: Holdings;
  prices: Prices;
  /** Keyed by coin, e.g. "BTC" */
  pairs: Record<string, Pair>;
  /** Search box text */
  query: string;
}

/** Table of owned coins with their value and profit/loss */
export default function HoldingsList({ holdings, prices, pairs, query }: Props) {
  const navigate = useNavigate();

  if (Object.keys(holdings).length === 0) {
    return (
      <p className="p-4 text-muted-foreground">
        No holdings yet.{" "}
        <Link to="/" className="text-primary hover:underline">
          Discover coins
        </Link>
      </p>
    );
  }

  // one row per matching coin; values are null until its price is loaded
  const rows = Object.entries(holdings)
    .filter(([coin]) => matchesSearch(coin, query))
    .map(([coin, { quantity, avgPrice }]) => {
      const price = prices[coin];
      const value = price === undefined ? null : quantity * price;
      const pnl = value === null ? null : value - quantity * avgPrice;
      const pnlPercent = price === undefined ? null : ((price - avgPrice) / avgPrice) * 100;
      return { coin, quantity, avgPrice, price, value, pnl, pnlPercent, pair: pairs[coin] };
    })
    // biggest position first
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (rows.length === 0) return <p className="p-4 text-muted-foreground">No holdings match "{query}".</p>;

  // shared cell styles
  const th = "px-4 py-2 text-right font-normal whitespace-nowrap";
  const td = "px-4 py-3 text-right whitespace-nowrap";

  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
        <tr>
          <th className="px-4 py-2 text-left font-normal">Coin</th>
          <th className={th}>Quantity</th>
          <th className={th}>Avg price</th>
          <th className={th}>Price</th>
          <th className={th}>Value ({QUOTE})</th>
          <th className={th}>Profit / loss</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.coin}
            onClick={() => navigate(tradePath(r.coin))}
            className="cursor-pointer border-b tabular-nums hover:bg-muted"
          >
            <td className="px-4 py-3 text-left font-semibold">{r.coin}</td>
            <td className={td}>{formatQuantity(r.quantity, r.pair?.quantityDecimals)}</td>
            <td className={td}>{formatPrice(r.avgPrice, r.pair?.priceDecimals)}</td>
            <td className={td}>{r.price === undefined ? "…" : formatPrice(r.price, r.pair?.priceDecimals)}</td>
            <td className={td}>{r.value === null ? "…" : formatUsdt(r.value)}</td>
            <td className={`${td} ${changeColor(r.pnl ?? 0)}`}>
              {r.pnl === null || r.pnlPercent === null
                ? "…"
                : `${formatSignedUsdt(r.pnl)} (${formatPercent(r.pnlPercent)})`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
