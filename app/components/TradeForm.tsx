import { useState } from "react";
import { QUOTE, type Pair } from "~/data/binance-api";
import { applyTrade, quantityFor, validateTrade, type Side } from "~/domain/trade-logic";
import { useProfile } from "~/state/store";
import { formatPrice, formatQuantity, formatUsdt } from "~/utils/format";

interface Props {
  pair: Pair;
  /** Live price; undefined while loading */
  price: number | undefined;
}

/** Buy/sell form for one coin, trades at the live price */
export default function TradeForm({ pair, price }: Props) {
  const { coin, priceDecimals, quantityDecimals } = pair;
  const { profile, setProfile } = useProfile();
  const [amount, setAmount] = useState("");
  // currency the amount is typed in
  const [unit, setUnit] = useState<"coin" | "quote">("coin");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // "0,5" and "0.5" both work
  const text = amount.trim().replace(",", ".");
  const value = /^(\d+\.?\d*|\.\d+)$/.test(text) ? Number(text) : null;
  const tooManyDecimals = unit === "coin" && (text.split(".")[1]?.length ?? 0) > quantityDecimals;
  // coins to trade; null until the amount and price are known
  const quantity =
    value === null || price === undefined ? null : unit === "coin" ? value : quantityFor(value, price, quantityDecimals);

  const submit = (side: Side) => {
    if (value === null) return setMessage({ text: "Enter an amount, e.g. 0.5.", ok: false });
    if (tooManyDecimals) return setMessage({ text: `${coin} allows at most ${quantityDecimals} decimals.`, ok: false });
    if (quantity === null || price === undefined) return;

    const trade = { side, coin, quantity, price };
    const invalid = validateTrade(profile, trade);
    if (invalid) return setMessage({ text: invalid, ok: false });

    setProfile(applyTrade(profile, trade));
    setAmount("");
    setMessage({
      text: `${side === "BUY" ? "Bought" : "Sold"} ${formatQuantity(quantity, quantityDecimals)} ${coin} at ${formatPrice(price, priceDecimals)} ${QUOTE}.`,
      ok: true,
    });
  };

  const owned = profile.holdings[coin]?.quantity ?? 0;
  const row = "flex justify-between gap-2";

  return (
    <div className="flex h-full flex-col gap-4 bg-surface p-4 text-foreground">
      <div className="flex rounded border bg-muted focus-within:ring-2 focus-within:ring-ring">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setMessage(null);
          }}
          placeholder="Amount"
          aria-label={`Amount (${unit === "coin" ? coin : QUOTE})`}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 tabular-nums placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setUnit(unit === "coin" ? "quote" : "coin")}
          title={`Type the amount in ${unit === "coin" ? QUOTE : coin}`}
          className="px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          {unit === "coin" ? coin : QUOTE} ⇄
        </button>
      </div>

      <dl className="flex flex-col gap-1 text-sm tabular-nums">
        <div className={row}>
          <dt className="text-muted-foreground">Price</dt>
          <dd>{price === undefined ? "…" : `${formatPrice(price, priceDecimals)} ${QUOTE}`}</dd>
        </div>
        <div className={row}>
          <dt className="text-muted-foreground">Estimate</dt>
          <dd>
            {quantity === null || price === undefined || tooManyDecimals
              ? "—"
              : `${formatQuantity(quantity, quantityDecimals)} ${coin} ≈ ${formatUsdt(quantity * price)} ${QUOTE}`}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted-foreground">Available</dt>
          <dd className="text-right">
            {formatUsdt(profile.balance)} {QUOTE} · {formatQuantity(owned, quantityDecimals)} {coin}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => submit("BUY")}
          disabled={price === undefined}
          className="rounded bg-success py-2 font-semibold text-white hover:bg-success/90 disabled:opacity-50"
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => submit("SELL")}
          disabled={price === undefined}
          className="rounded bg-danger py-2 font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
        >
          Sell
        </button>
      </div>

      {message && <p className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
    </div>
  );
}
