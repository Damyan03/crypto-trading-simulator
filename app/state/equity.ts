import { useEffect } from "react";
import { addEquityPoint, equityDue } from "~/domain/equity";
import { totalValue, type Prices } from "~/domain/profile";
import { useProfile } from "./store";

/** Saves the account value to the equity curve whenever a point is due; `prices` must cover every holding */
export function useEquityRecorder(prices: Prices) {
	const { profile, setProfile } = useProfile();
	// null until every holding has a price
	const value = totalValue(profile, prices);

	// runs on every price change; most runs find nothing due
	useEffect(() => {
		const now = Date.now();
		if (value !== null && equityDue(profile, now)) setProfile(addEquityPoint(profile, value, now));
	}, [profile, value, setProfile]);
}
