import type { Profile, Trade } from "./profile";

/** A trade before it happens */
export type TradeRequest = Omit<Trade, "id" | "time" | "fee">;

/** Share of each trade's value charged as a fee, paid in USDT */
export const FEE_RATE = 0.001;

/** Fee in USDT for trading `quantity` coins at `price` */
export const tradeFee = (quantity: number, price: number) => quantity * price * FEE_RATE;

// strips float noise, e.g. 0.30000000000000004 → 0.3
const clean = (value: number) => Number(value.toPrecision(12));

/** Rounds down to `decimals`, e.g. to a coin's step size */
export const roundDown = (value: number, decimals: number) =>
	Math.floor(clean(value * 10 ** decimals)) / 10 ** decimals;

/** How many coins `usdt` buys at `price`, rounded down to the coin's `decimals` */
export const quantityFor = (usdt: number, price: number, decimals: number) => roundDown(usdt / price, decimals);

/** Rejection reasons: no amount, not enough cash (fee included), not enough coins to sell */
export type TradeRejection = "amount" | "cash" | "coins";

/** The trade's rejection, or null if it's valid */
export function validateTrade(profile: Profile, { side, coin, quantity, price }: TradeRequest): TradeRejection | null {
	if (!(quantity > 0)) return "amount";
	if (side === "BUY" && quantity * price + tradeFee(quantity, price) > profile.balance) return "cash";
	if (side === "SELL" && quantity > (profile.holdings[coin]?.quantity ?? 0)) return "coins";
	return null;
}

/** The profile after the trade, with the trade recorded; check validateTrade first */
export function applyTrade(profile: Profile, request: TradeRequest, time = Date.now()): Profile {
	const { side, coin, quantity, price } = request;
	const total = quantity * price;
	const fee = tradeFee(quantity, price);
	const held = profile.holdings[coin] ?? { quantity: 0, avgPrice: 0 };
	const holdings = { ...profile.holdings };
	const trades = [...profile.trades, { ...request, id: (profile.trades.at(-1)?.id ?? 0) + 1, time, fee }];

	if (side === "BUY") {
		const newQuantity = clean(held.quantity + quantity);
		// average cost per coin over all buys, fees included
		const avgPrice = (held.quantity * held.avgPrice + total + fee) / newQuantity;
		holdings[coin] = { quantity: newQuantity, avgPrice };
		return { ...profile, balance: profile.balance - total - fee, holdings, trades };
	}

	// selling keeps the average buy price
	const left = clean(held.quantity - quantity);
	if (left > 0) holdings[coin] = { ...held, quantity: left };
	else delete holdings[coin];
	return { ...profile, balance: profile.balance + total - fee, holdings, trades };
}
