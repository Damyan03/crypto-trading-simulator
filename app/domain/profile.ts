/** The account's currency; every coin is traded against it */
export const QUOTE = "USDT";

/** Every account starts with this much USDT */
export const STARTING_BALANCE = 10_000;

export interface Holding {
	quantity: number;
	/** Average buy price in USDT, fees included */
	avgPrice: number;
}

/** Holdings by coin */
export type Holdings = Record<string, Holding>;

/** Latest price in USDT by coin */
export type Prices = Record<string, number>;

/** Prices of several coins at one moment */
export interface PriceSnapshot {
	/** Unix time in ms */
	time: number;
	prices: Prices;
}

export type Side = "BUY" | "SELL";

/** A completed trade; stored as it happened, never changed */
export interface Trade {
	/** Sequential, from 1 */
	id: number;
	/** Unix time in ms */
	time: number;
	side: Side;
	coin: string;
	quantity: number;
	/** USDT per coin */
	price: number;
	/** Trading fee in USDT */
	fee: number;
}

/** The account's total value at one moment */
export interface EquityPoint {
	/** Unix time in ms */
	time: number;
	/** Cash + holdings in USDT */
	value: number;
}

export interface Profile {
	/** Cash in USDT */
	balance: number;
	holdings: Holdings;
	/** Oldest first */
	trades: Trade[];
	/** Oldest first */
	equity: EquityPoint[];
}

/** A new profile; its equity curve starts at the starting balance */
export function createProfile(now = Date.now()): Profile {
	return { balance: STARTING_BALANCE, holdings: {}, trades: [], equity: [{ time: now, value: STARTING_BALANCE }] };
}

/** Value of all holdings; null until every held coin's price is loaded */
export function holdingsValue(holdings: Holdings, prices: Prices): number | null {
	let total = 0;
	for (const [coin, { quantity }] of Object.entries(holdings)) {
		const price = prices[coin];
		if (price === undefined) return null;
		total += quantity * price;
	}
	return total;
}

/** Cash + holdings; null until every held coin's price is loaded */
export function totalValue(profile: Profile, prices: Prices): number | null {
	const holdings = holdingsValue(profile.holdings, prices);
	return holdings === null ? null : profile.balance + holdings;
}

/** Gain or loss of `value` vs `cost`, in USDT and % */
function gain(value: number, cost: number) {
	const amount = value - cost;
	return { amount, percent: (amount / cost) * 100 };
}

/** Profit/loss of the account vs the starting balance */
export function profitLoss(total: number) {
	return gain(total, STARTING_BALANCE);
}

/** A holding's value at `price` and its profit/loss vs its cost (fees included) */
export function holdingStats(holding: Holding, price: number) {
	const value = holding.quantity * price;
	return { value, pnl: gain(value, holding.quantity * holding.avgPrice) };
}
