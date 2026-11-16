import { useEffect, useState } from "react";
import { load, save } from "~/data/storage";
import { parseAmount } from "~/utils/amount";

// Bump the version when the saved shape changes; old saves are then ignored
const STORAGE_VERSION = 1;

/** Editable shortcut values saved under `key`; edited values that fail `isValid` keep their old value */
function useSavedPresets(key: string, defaults: string[], isValid: (value: string) => boolean) {
	const [presets, setPresets] = useState(() => {
		const saved = load<unknown>(key, STORAGE_VERSION);
		const valid =
			Array.isArray(saved) && saved.length === defaults.length && saved.every((v) => typeof v === "string" && isValid(v));
		return valid ? (saved as string[]) : defaults;
	});

	useEffect(() => save(key, STORAGE_VERSION, presets), [key, presets]);

	const update = (edited: string[]) => setPresets(edited.map((v, i) => (isValid(v.trim()) ? v.trim() : presets[i])));

	return [presets, update] as const;
}

const isPercent = (v: string) => {
	const percent = parseAmount(v) ?? 0;
	return percent > 0 && percent <= 100;
};

/** Sell shortcuts: % of the coins you own */
export const usePercentPresets = () => useSavedPresets("percent-presets", ["10", "25", "50", "100"], isPercent);
