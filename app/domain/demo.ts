import { addEquityPoint } from "./equity";
import { createProfile, totalValue, type PriceSnapshot, type Profile, type Side } from "./profile";
import { applyTrade, quantityFor, validateTrade } from "./trade-logic";

/** Coins the demo trades */
export const DEMO_COINS = ["BTC", "ETH", "SOL"];

/** Days of history the demo needs: day 0 opens the account, the last day is today */
export const DEMO_DAYS = 8;

// [day, side, coin, USDT value]; USDT values fit the starting balance at any price
const DEMO_TRADES: [number, Side, string, number][] = [
  [1, "BUY", "BTC", 3_000],
  [2, "BUY", "ETH", 1_500],
  [4, "BUY", "SOL", 1_000],
  [6, "SELL", "BTC", 1_000],
];

/**
 * An account that traded over the past days at real prices, made with the real trade logic so everything adds up.
 * `days`: each demo coin's price at the start of each day, oldest first; `decimals`: each coin's quantity decimals.
 * One equity point per day.
 */
export function createDemoProfile(days: PriceSnapshot[], decimals: Record<string, number>): Profile {
  let profile = createProfile(days[0].time);

  days.forEach(({ time, prices }, day) => {
    if (day === 0) return;
    for (const [tradeDay, side, coin, usdt] of DEMO_TRADES) {
      if (tradeDay !== day) continue;
      const request = { side, coin, quantity: quantityFor(usdt, prices[coin], decimals[coin]), price: prices[coin] };
      // skipped if the prices make it impossible
      if (!validateTrade(profile, request)) profile = applyTrade(profile, request, time);
    }
    profile = addEquityPoint(profile, totalValue(profile, prices) ?? profile.balance, time);
  });

  return profile;
}
