import { useNavigate } from "react-router";
import { QUOTE, type Pair } from "~/data/binance-api";
import type { Trade } from "~/domain/profile";
import { formatPrice, formatQuantity, formatTime, formatUsdt } from "~/utils/format";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

interface Props {
  trades: Trade[];
  /** Keyed by coin, e.g. "BTC" */
  pairs: Record<string, Pair>;
  /** Search box text */
  query: string;
}

/** Table of past trades, newest first */
export default function TradeHistory({ trades, pairs, query }: Props) {
  const navigate = useNavigate();

  if (trades.length === 0) return <p className="p-4 text-muted-foreground">No trades yet.</p>;

  // trades are stored oldest first
  const rows = trades.filter((t) => matchesSearch(t.coin, query)).reverse();

  if (rows.length === 0) return <p className="p-4 text-muted-foreground">No trades match "{query}".</p>;

  // shared cell styles
  const thLeft = "px-4 py-2 text-left font-normal";
  const th = "px-4 py-2 text-right font-normal whitespace-nowrap";
  const td = "px-4 py-3 text-right whitespace-nowrap";

  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
        <tr>
          <th className={thLeft}>Time</th>
          <th className={thLeft}>Coin</th>
          <th className={thLeft}>Side</th>
          <th className={th}>Price</th>
          <th className={th}>Quantity</th>
          <th className={th}>Total ({QUOTE})</th>
          <th className={th}>Fee ({QUOTE})</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => {
          const pair = pairs[t.coin];
          return (
            <tr
              key={t.id}
              onClick={() => navigate(tradePath(t.coin))}
              className="cursor-pointer border-b tabular-nums hover:bg-muted"
            >
              <td className="px-4 py-3 text-left whitespace-nowrap text-muted-foreground">{formatTime(t.time)}</td>
              <td className="px-4 py-3 text-left font-semibold">{t.coin}</td>
              <td className={`px-4 py-3 text-left font-semibold ${t.side === "BUY" ? "text-success" : "text-danger"}`}>
                {t.side === "BUY" ? "Buy" : "Sell"}
              </td>
              <td className={td}>{formatPrice(t.price, pair?.priceDecimals)}</td>
              <td className={td}>{formatQuantity(t.quantity, pair?.quantityDecimals)}</td>
              <td className={td}>{formatUsdt(t.quantity * t.price)}</td>
              <td className={`${td} text-muted-foreground`}>{formatUsdt(t.fee)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
