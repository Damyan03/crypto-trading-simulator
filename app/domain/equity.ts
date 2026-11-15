import type { Profile } from "./profile";

// a point every minute while the app has live prices, plus one after every trade
const INTERVAL = 60 * 1000;
// oldest points are dropped past this; about a week of the app open nonstop
const MAX_POINTS = 10_000;

/** Whether a new equity point is due: a minute since the last one, or a trade after it */
export function equityDue(profile: Profile, now: number) {
  const last = profile.equity.at(-1);
  const lastTrade = profile.trades.at(-1);
  if (!last) return true;
  return now - last.time >= INTERVAL || (lastTrade !== undefined && lastTrade.time > last.time);
}

/** The profile with `value` added to its equity curve */
export const addEquityPoint = (profile: Profile, value: number, time: number): Profile => ({
  ...profile,
  equity: [...profile.equity, { time, value }].slice(-MAX_POINTS),
});
