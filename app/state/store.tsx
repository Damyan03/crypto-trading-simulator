import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { load, save } from "~/data/storage";
import { createDemoProfile, createProfile, type Profile } from "~/domain/profile";

// Bump the version when the Profile shape changes; old saves are then ignored
const STORAGE_KEY = "profile";
const STORAGE_VERSION = 1;

/** What useProfile() returns */
interface ProfileState {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  /** Back to 10,000 USDT and no holdings */
  reset: () => void;
}

// Shares the profile with every component inside ProfileProvider
const ProfileContext = createContext<ProfileState | null>(null);

/** Null if the data isn't a valid profile */
export function parseProfile(raw: unknown): Profile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { balance, holdings } = raw as Partial<Profile>;
  if (!Number.isFinite(balance) || typeof holdings !== "object" || holdings === null) return null;
  const valid = Object.values(holdings).every(
    (h) => Number.isFinite(h?.quantity) && Number.isFinite(h?.avgPrice),
  );
  return valid ? { balance: balance as number, holdings } : null;
}

/** Saved profile, or the demo profile if there's no valid one */
const loadProfile = () => parseProfile(load(STORAGE_KEY, STORAGE_VERSION)) ?? createDemoProfile();

/** Holds the profile and saves every change */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(loadProfile);

  useEffect(() => save(STORAGE_KEY, STORAGE_VERSION, profile), [profile]);

  const reset = () => setProfile(createProfile());

  return <ProfileContext.Provider value={{ profile, setProfile, reset }}>{children}</ProfileContext.Provider>;
}

/** Reads the profile in any component inside ProfileProvider */
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used inside ProfileProvider");
  return context;
}
