import { useEffect, useState } from "react";
import ErrorMessage from "~/components/ui/ErrorMessage";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import { QUOTE, subscribeOrderBook, type Pair } from "~/data/binance-api";
import { groupDepth, type Depth, type DepthLevel } from "~/domain/order-book";
import { useText } from "~/i18n/language";
import { formatPrice, formatQuantity } from "~/utils/format";

// price levels shown per side
const LEVELS = 10;
// group sizes as powers of ten ticks, e.g. BTC: 0.01, 0.1, 1, 10, 100, 1000
const STEPS = [0, 1, 2, 3, 4, 5];

interface Props {
	pair: Pair;
	/** Live price, shown between asks and bids */
	price: number | undefined;
}

/** Live order book: how much of the coin is waiting to be bought or sold at each price */
export default function OrderBook({ pair, price }: Props) {
	const text = useText().orderBook;
	const [depth, setDepth] = useState<Depth | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);
	const [step, setStep] = useState(0);

	// the cleanup closes the connection
	useEffect(() => {
		setError(null);
		return subscribeOrderBook(pair.symbol, setDepth, setLive, setError);
	}, [pair, attempt]);

	const retry = () => setAttempt((a) => a + 1);

	if (error) return <ErrorMessage error={error} onRetry={retry} />;
	if (!depth) return <p className="bg-surface p-4 text-sm text-muted-foreground">{text.loading}</p>;

	const tick = 10 ** -pair.priceDecimals;
	// a group of 10 ticks needs one decimal less, and so on
	const decimalsFor = (s: number) => Math.max(0, pair.priceDecimals - s);
	const decimals = decimalsFor(step);
	const shown = groupDepth(depth, tick, 10 ** step, LEVELS);
	// bar widths are relative to the biggest group shown
	const max = Math.max(...shown.bids.map((l) => l.quantity), ...shown.asks.map((l) => l.quantity));

	const row = (level: DepthLevel, side: "bid" | "ask") => (
		<div key={level.price} className="relative flex justify-between px-3 py-0.5">
			<div
				className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-success-subtle" : "bg-danger-subtle"}`}
				style={{ width: `${(level.quantity / max) * 100}%` }}
			/>
			<span className={`relative ${side === "bid" ? "text-success" : "text-danger"}`}>
				{formatPrice(level.price, decimals)}
			</span>
			<span className="relative">{formatQuantity(level.quantity, pair.quantityDecimals)}</span>
		</div>
	);

	return (
		<div className="h-full overflow-hidden bg-surface text-xs tabular-nums text-foreground">
			<div className="flex flex-wrap gap-1 px-3 pt-2">
				{STEPS.map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => setStep(s)}
						className={`rounded px-1.5 py-0.5 ${s === step ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
					>
						{formatPrice(tick * 10 ** s, decimalsFor(s))}
					</button>
				))}
			</div>
			<div className="flex justify-between px-3 py-2 text-muted-foreground">
				<span>{text.price(QUOTE)}</span>
				<span>{text.amount(pair.coin)}</span>
			</div>
			{/* highest ask on top, so the best ask sits next to the price */}
			{[...shown.asks].reverse().map((l) => row(l, "ask"))}
			<p className="px-3 py-1.5 text-sm font-semibold">
				{price === undefined ? "…" : formatPrice(price, pair.priceDecimals)}
			</p>
			{shown.bids.map((l) => row(l, "bid"))}
			{!live && <ReconnectingNote className="px-3 py-2" />}
		</div>
	);
}
