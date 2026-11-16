import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getPriceHistory, getTradingPairs } from "~/data/binance-api";
import { load, save } from "~/data/storage";
import { createDemoProfile, DEMO_COINS, DEMO_HOURS } from "~/domain/demo";
import { createProfile, type EquityPoint, type Profile, type Trade } from "~/domain/profile";

// Bump the version when the Profile shape changes; old saves are then ignored
const STORAGE_KEY = "profile";
const STORAGE_VERSION = 4;

/** What useProfile() returns */
interface ProfileState {
	profile: Profile;
	setProfile: (profile: Profile) => void;
	/** Back to 10,000 USDT, no holdings or trades */
	reset: () => void;
	/** Replaces the account with the demo account, built from real past prices; rejects if they can't be loaded */
	resetToDemo: () => Promise<void>;
}

// Shares the profile with every component inside ProfileProvider
const ProfileContext = createContext<ProfileState | null>(null);

const isTrade = (t: Trade) =>
	Number.isInteger(t?.id) &&
	Number.isFinite(t?.time) &&
	(t?.side === "BUY" || t?.side === "SELL") &&
	typeof t?.coin === "string" &&
	Number.isFinite(t?.quantity) &&
	Number.isFinite(t?.price) &&
	Number.isFinite(t?.fee);

const isEquityPoint = (p: EquityPoint) => Number.isFinite(p?.time) && Number.isFinite(p?.value);

/** Null if the data isn't a valid profile */
export function parseProfile(raw: unknown): Profile | null {
	if (typeof raw !== "object" || raw === null) return null;
	const { balance, holdings, trades, equity } = raw as Partial<Profile>;
	if (
		!Number.isFinite(balance) ||
		typeof holdings !== "object" ||
		holdings === null ||
		!Array.isArray(trades) ||
		!Array.isArray(equity)
	) {
		return null;
	}
	const valid =
		Object.values(holdings).every((h) => Number.isFinite(h?.quantity) && Number.isFinite(h?.avgPrice)) &&
		trades.every(isTrade) &&
		equity.every(isEquityPoint);
	return valid ? { balance: balance as number, holdings, trades, equity } : null;
}

/** Saved profile, or a new one if there's no valid one */
const loadProfile = () => parseProfile(load(STORAGE_KEY, STORAGE_VERSION)) ?? createProfile();

/** Holds the profile and saves every change */
export function ProfileProvider({ children }: { children: ReactNode }) {
	const [profile, setProfile] = useState(loadProfile);

	useEffect(() => save(STORAGE_KEY, STORAGE_VERSION, profile), [profile]);

	const reset = () => setProfile(createProfile());
	const resetToDemo = async () => {
		const [history, pairs] = await Promise.all([getPriceHistory(DEMO_COINS, "1h", DEMO_HOURS), getTradingPairs()]);
		const decimals = Object.fromEntries(pairs.map((p) => [p.coin, p.quantityDecimals]));
		setProfile(createDemoProfile(history, decimals));
	};

	return (
		<ProfileContext.Provider value={{ profile, setProfile, reset, resetToDemo }}>{children}</ProfileContext.Provider>
	);
}

/** Reads the profile in any component inside ProfileProvider */
export function useProfile() {
	const context = useContext(ProfileContext);
	if (!context) throw new Error("useProfile must be used inside ProfileProvider");
	return context;
}
