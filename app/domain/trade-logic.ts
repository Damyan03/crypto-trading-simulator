import type { Profile, Trade } from "./profile";

/** A trade before it happens */
export type TradeRequest = Omit<Trade, "id" | "time">;

// strips float noise, e.g. 0.1 + 0.2 = 0.30000000000000004 → 0.3
const clean = (value: number) => Number(value.toPrecision(12));

/** How many coins `usdt` buys at `price`, rounded down to the coin's `decimals` */
export const quantityFor = (usdt: number, price: number, decimals: number) =>
  Math.floor(clean((usdt / price) * 10 ** decimals)) / 10 ** decimals;

/** Why the trade can't happen, or null if it can */
export function validateTrade(profile: Profile, { side, coin, quantity, price }: TradeRequest): string | null {
  if (!(quantity > 0)) return "Amount must be more than 0.";
  if (side === "BUY" && quantity * price > profile.balance) return "Not enough cash.";
  if (side === "SELL" && quantity > (profile.holdings[coin]?.quantity ?? 0)) return `You don't own that much ${coin}.`;
  return null;
}

/** The profile after the trade, with the trade recorded; check validateTrade first */
export function applyTrade(profile: Profile, request: TradeRequest, time = Date.now()): Profile {
  const { side, coin, quantity, price } = request;
  const total = quantity * price;
  const held = profile.holdings[coin] ?? { quantity: 0, avgPrice: 0 };
  const holdings = { ...profile.holdings };
  const trades = [...profile.trades, { ...request, id: (profile.trades.at(-1)?.id ?? 0) + 1, time }];

  if (side === "BUY") {
    const newQuantity = clean(held.quantity + quantity);
    // average of all buys, weighted by quantity
    const avgPrice = (held.quantity * held.avgPrice + total) / newQuantity;
    holdings[coin] = { quantity: newQuantity, avgPrice };
    return { balance: profile.balance - total, holdings, trades };
  }

  // selling keeps the average buy price
  const left = clean(held.quantity - quantity);
  if (left > 0) holdings[coin] = { ...held, quantity: left };
  else delete holdings[coin];
  return { balance: profile.balance + total, holdings, trades };
}
