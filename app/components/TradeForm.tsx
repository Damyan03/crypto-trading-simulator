import { useState } from "react";
import QuickAmounts from "~/components/QuickAmounts";
import { QUOTE, type Pair } from "~/data/binance-api";
import type { Side } from "~/domain/profile";
import { applyTrade, quantityFor, roundDown, tradeFee, validateTrade } from "~/domain/trade-logic";
import { useAmountPresets, usePercentPresets } from "~/state/presets";
import { useProfile } from "~/state/store";
import { decimalsIn, parseAmount } from "~/utils/amount";
import { formatPrice, formatQuantity, formatUsdt } from "~/utils/format";

type Unit = "coin" | "quote";

interface Props {
  pair: Pair;
  /** Live price; undefined while loading */
  price: number | undefined;
}

/** Buy/sell form for one coin, trades at the live price */
export default function TradeForm({ pair, price }: Props) {
  const { coin, priceDecimals, quantityDecimals } = pair;
  const { profile, setProfile } = useProfile();
  const [presets, setPresets] = useAmountPresets();
  const [percents, setPercents] = usePercentPresets();
  const [amount, setAmount] = useState("");
  // currency the amount is typed in
  const [unit, setUnit] = useState<Unit>("coin");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const owned = profile.holdings[coin]?.quantity ?? 0;

  // "0,5" and "0.5" both work
  const value = parseAmount(amount);
  const tooManyDecimals = unit === "coin" && decimalsIn(amount) > quantityDecimals;
  // coins to trade; null until the amount and price are known
  const quantity =
    value === null || price === undefined ? null : unit === "coin" ? value : quantityFor(value, price, quantityDecimals);

  // a new amount makes the old message stale
  const changeAmount = (text: string, newUnit = unit) => {
    setAmount(text);
    setUnit(newUnit);
    setMessage(null);
  };

  // clears the amount, so it's never read in the other currency
  const switchUnit = (u: Unit) => {
    if (u !== unit) changeAmount("", u);
  };

  // shortcuts are coin amounts
  const pickPreset = (i: number) => changeAmount(presets[i], "coin");
  const pickPercent = (i: number) =>
    changeAmount(
      roundDown((owned * (parseAmount(percents[i]) ?? 0)) / 100, quantityDecimals).toFixed(quantityDecimals),
      "coin",
    );

  const submit = (side: Side) => {
    if (value === null) return setMessage({ text: "Enter an amount, e.g. 0.5.", ok: false });
    if (tooManyDecimals) return setMessage({ text: `${coin} allows at most ${quantityDecimals} decimals.`, ok: false });
    if (quantity === null || price === undefined) return;

    const request = { side, coin, quantity, price };
    const invalid = validateTrade(profile, request);
    if (invalid) return setMessage({ text: invalid, ok: false });

    setProfile(applyTrade(profile, request));
    setMessage({
      text: `${side === "BUY" ? "Bought" : "Sold"} ${formatQuantity(quantity, quantityDecimals)} ${coin} at ${formatPrice(price, priceDecimals)} ${QUOTE}, fee ${formatUsdt(tradeFee(quantity, price))} ${QUOTE}.`,
      ok: true,
    });
  };

  // estimate rows show "—" until the amount is valid
  const estimate = quantity === null || price === undefined || tooManyDecimals ? null : { quantity, price };
  const row = "flex justify-between gap-2";

  return (
    <div className="flex h-full flex-col gap-4 bg-surface p-4 text-foreground">
      <div className="flex rounded border bg-muted focus-within:ring-2 focus-within:ring-ring">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => changeAmount(e.target.value)}
          placeholder={`Amount in ${unit === "coin" ? coin : QUOTE}`}
          aria-label={`Amount in ${unit === "coin" ? coin : QUOTE}`}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 tabular-nums placeholder:text-muted-foreground focus:outline-none"
        />
        {(["coin", "quote"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => switchUnit(u)}
            className={`px-2 text-sm ${u === unit ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {u === "coin" ? coin : QUOTE}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <QuickAmounts label={coin} options={presets} onPick={pickPreset} onEdit={setPresets} />
        {owned > 0 && (
          <QuickAmounts
            label="Owned"
            options={percents}
            format={(p) => `${p}%`}
            onPick={pickPercent}
            onEdit={setPercents}
          />
        )}
      </div>

      <dl className="flex flex-col gap-1 text-sm tabular-nums">
        <div className={row}>
          <dt className="text-muted-foreground">Price</dt>
          <dd>{price === undefined ? "…" : `${formatPrice(price, priceDecimals)} ${QUOTE}`}</dd>
        </div>
        <div className={row}>
          <dt className="text-muted-foreground">Estimate</dt>
          <dd>
            {estimate
              ? `${formatQuantity(estimate.quantity, quantityDecimals)} ${coin} ≈ ${formatUsdt(estimate.quantity * estimate.price)} ${QUOTE}`
              : "—"}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted-foreground">Fee</dt>
          <dd>{estimate ? `${formatUsdt(tradeFee(estimate.quantity, estimate.price))} ${QUOTE}` : "—"}</dd>
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
