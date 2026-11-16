import { addEquityPoint } from "./equity";
import { createProfile, totalValue, type PriceSnapshot, type Profile } from "./profile";
import { applyTrade, quantityFor, roundDown, validateTrade, type TradeRequest } from "./trade-logic";

/** Coins the demo trades */
export const DEMO_COINS = ["BTC", "ETH", "SOL"];

/** Hourly prices the demo needs (8 days): the first opens the account, the last is the current hour */
export const DEMO_HOURS = 8 * 24;

// USDT for each coin's first buy
const OPENING_BUY = 1_500;

/**
 * The demo's trade in `hour` for the coin whose turn it is (coins take turns hour by hour).
 * After one opening buy per coin: every 4th hour sells a quarter of that coin, the other hours buy 30–120 USDT.
 * A fixed pattern, not random.
 */
function demoTrade(profile: Profile, hour: number, coin: string, price: number, decimals: number): TradeRequest {
	const opening = hour <= DEMO_COINS.length;
	if (!opening && hour % 4 === 0) {
		const held = profile.holdings[coin]?.quantity ?? 0;
		return { side: "SELL", coin, quantity: roundDown(held / 4, decimals), price };
	}
	const usdt = opening ? OPENING_BUY : 30 + ((hour * 37) % 91);
	return { side: "BUY", coin, quantity: quantityFor(usdt, price, decimals), price };
}

/**
 * An account that traded most hours of the past days at real prices, through the real trade logic.
 * `history`: each demo coin's price at the start of each hour, oldest first; `decimals`: each coin's quantity
 * decimals. One equity point per hour.
 */
export function createDemoProfile(history: PriceSnapshot[], decimals: Record<string, number>): Profile {
	let profile = createProfile(history[0].time);

	history.forEach(({ time, prices }, hour) => {
		if (hour === 0) return;
		const coin = DEMO_COINS[hour % DEMO_COINS.length];
		const request = demoTrade(profile, hour, coin, prices[coin], decimals[coin]);
		// invalid trades are skipped, e.g. not enough cash
		if (!validateTrade(profile, request)) profile = applyTrade(profile, request, time);
		profile = addEquityPoint(profile, totalValue(profile, prices) ?? profile.balance, time);
	});

	return profile;
}
