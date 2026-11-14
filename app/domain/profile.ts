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

export interface Profile {
  balance: number;
  holdings: Holdings;
}

/** create new profile */
export function createProfile(): Profile {
  return { balance: STARTING_BALANCE, holdings: {} };
}

/** cash + holdings total value */
export function totalValue(profile: Profile, prices: Prices): number | null {
  let total = profile.balance;
  for (const [symbol, { quantity }] of Object.entries(profile.holdings)) {
    const price = prices[symbol];
    if (price === undefined) return null;
    total += quantity * price;
  }
  return total;
}

/** profit/loss vs the starting balance */
export function profitLoss(total: number) {
  const amount = total - STARTING_BALANCE;
  return { amount, percent: (amount / STARTING_BALANCE) * 100 };
}
