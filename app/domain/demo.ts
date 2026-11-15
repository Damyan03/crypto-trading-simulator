import { createProfile, type Profile } from "./profile";
import { applyTrade, type TradeRequest } from "./trade-logic";

const DAY = 24 * 60 * 60 * 1000;

// [days ago, trade]
const DEMO_TRADES: [number, TradeRequest][] = [
  [6, { side: "BUY", coin: "BTC", quantity: 0.03, price: 60_000 }],
  [5, { side: "BUY", coin: "ETH", quantity: 0.5, price: 2_000 }],
  [3, { side: "BUY", coin: "SOL", quantity: 10, price: 80 }],
  [1, { side: "SELL", coin: "BTC", quantity: 0.01, price: 65_000 }],
];

/** A new account after a few past trades, made with the real trade logic so everything adds up */
export const createDemoProfile = (now = Date.now()): Profile =>
  DEMO_TRADES.reduce((profile, [daysAgo, trade]) => applyTrade(profile, trade, now - daysAgo * DAY), createProfile());
