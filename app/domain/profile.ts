/** Every account starts with this much USDT */
export const STARTING_BALANCE = 10_000;

export interface Holding {
  quantity: number;
  /** Average buy price in USDT, fees included */
  avgPrice: number;
}

/** Holdings of each coin, e.g. { BTC: { quantity: 1.5, avgPrice: 64000 } } */
export type Holdings = Record<string, Holding>;

/** Latest price in USDT per coin, e.g. { BTC: 97000, ETH: 3400 } */
export type Prices = Record<string, number>;

export type Side = "BUY" | "SELL";

/** A completed trade; stored as it happened, never changed */
export interface Trade {
  /** 1, 2, 3… */
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

export interface Profile {
  /** Cash in USDT */
  balance: number;
  holdings: Holdings;
  /** Oldest first */
  trades: Trade[];
}

/** create new profile */
export function createProfile(): Profile {
  return { balance: STARTING_BALANCE, holdings: {}, trades: [] };
}

/** cash + holdings total value */
export function totalValue(profile: Profile, prices: Prices): number | null {
  let total = profile.balance;
  for (const [coin, { quantity }] of Object.entries(profile.holdings)) {
    const price = prices[coin];
    if (price === undefined) return null; // price not loaded yet
    total += quantity * price;
  }
  return total;
}

/** profit/loss vs the starting balance */
export function profitLoss(total: number) {
  const amount = total - STARTING_BALANCE;
  return { amount, percent: (amount / STARTING_BALANCE) * 100 };
}
