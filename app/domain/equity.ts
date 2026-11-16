import type { EquityPoint, Profile } from "./profile";

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

// grid steps to choose from, smallest first: 1m, 5m, 15m, 1h, 4h, 1d
const STEPS = [1, 5, 15, 60, 240, 1440].map((minutes) => minutes * 60 * 1000);

/**
 * The curve resampled onto an even time grid, with the smallest step that gives at most `maxPoints` points.
 * Each step takes the last value in it; empty steps take the straight line between their neighbors.
 * `points` must be oldest first.
 */
export function evenEquity(points: EquityPoint[], maxPoints: number): EquityPoint[] {
	if (points.length < 2) return points;
	const first = points[0].time;
	const last = points[points.length - 1].time;
	const step = STEPS.find((s) => (last - first) / s < maxPoints) ?? STEPS[STEPS.length - 1];

	const even: EquityPoint[] = [];
	let next = 0;
	for (let time = first - (first % step); time <= last; time += step) {
		// the last point in this step, if any
		let inStep: EquityPoint | undefined;
		while (next < points.length && points[next].time < time + step) inStep = points[next++];
		if (inStep) {
			even.push({ time, value: inStep.value });
		} else {
			// between the point before and the point after
			const before = points[next - 1];
			const after = points[next];
			const share = (time - before.time) / (after.time - before.time);
			even.push({ time, value: before.value + (after.value - before.value) * share });
		}
	}
	return even;
}
