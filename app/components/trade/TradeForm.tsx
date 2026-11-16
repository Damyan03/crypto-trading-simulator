import { useState } from "react";
import QuickAmounts from "~/components/trade/QuickAmounts";
import { QUOTE, type Pair } from "~/data/binance-api";
import type { Side } from "~/domain/profile";
import { applyTrade, quantityFor, roundDown, tradeFee, validateTrade } from "~/domain/trade-logic";
import { useText } from "~/i18n/language";
import { usePercentPresets } from "~/state/presets";
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
	const { common, trade } = useText();
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

	// fills in a coin amount
	const pickPercent = (i: number) =>
		changeAmount(
			roundDown((owned * (parseAmount(percents[i]) ?? 0)) / 100, quantityDecimals).toFixed(quantityDecimals),
			"coin",
		);

	const submit = (side: Side) => {
		if (value === null) return setMessage({ text: trade.enterAmount, ok: false });
		if (tooManyDecimals) return setMessage({ text: trade.tooManyDecimals(coin, quantityDecimals), ok: false });
		if (quantity === null || price === undefined) return;

		const request = { side, coin, quantity, price };
		const rejection = validateTrade(profile, request);
		if (rejection) return setMessage({ text: trade.rejected[rejection](coin), ok: false });

		setProfile(applyTrade(profile, request));
		setMessage({
			text: trade.done[side](
				`${formatQuantity(quantity, quantityDecimals)} ${coin}`,
				`${formatPrice(price, priceDecimals)} ${QUOTE}`,
				`${formatUsdt(tradeFee(quantity, price))} ${QUOTE}`,
			),
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
					placeholder={trade.amountIn(unit === "coin" ? coin : QUOTE)}
					aria-label={trade.amountIn(unit === "coin" ? coin : QUOTE)}
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

			{owned > 0 && (
				<QuickAmounts
					label={trade.owned}
					options={percents}
					format={(p) => `${p}%`}
					onPick={pickPercent}
					onEdit={setPercents}
				/>
			)}

			<dl className="flex flex-col gap-1 text-sm tabular-nums">
				<div className={row}>
					<dt className="text-muted-foreground">{common.price}</dt>
					<dd>{price === undefined ? "…" : `${formatPrice(price, priceDecimals)} ${QUOTE}`}</dd>
				</div>
				<div className={row}>
					<dt className="text-muted-foreground">{trade.estimate}</dt>
					<dd>
						{estimate
							? `${formatQuantity(estimate.quantity, quantityDecimals)} ${coin} ≈ ${formatUsdt(estimate.quantity * estimate.price)} ${QUOTE}`
							: "—"}
					</dd>
				</div>
				<div className={row}>
					<dt className="text-muted-foreground">{trade.fee}</dt>
					<dd>{estimate ? `${formatUsdt(tradeFee(estimate.quantity, estimate.price))} ${QUOTE}` : "—"}</dd>
				</div>
				<div className={row}>
					<dt className="text-muted-foreground">{trade.available}</dt>
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
					{common.side.BUY}
				</button>
				<button
					type="button"
					onClick={() => submit("SELL")}
					disabled={price === undefined}
					className="rounded bg-danger py-2 font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
				>
					{common.side.SELL}
				</button>
			</div>

			{message && <p className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
		</div>
	);
}
