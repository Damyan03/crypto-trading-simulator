import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { RequestError } from "~/data/http";
import { load, save } from "~/data/storage";
import { en, type Dictionary } from "./en";

/** Every supported language; to add one, copy en.ts and list it here */
export const DICTIONARIES = { en } satisfies Record<string, Dictionary>;

export type Language = keyof typeof DICTIONARIES;

const STORAGE_KEY = "language";
const STORAGE_VERSION = 1;

const isLanguage = (value: unknown): value is Language =>
	typeof value === "string" && Object.keys(DICTIONARIES).includes(value);

/** The saved choice, else the browser's language if supported, else English */
export function startLanguage(): Language {
	const saved = load<unknown>(STORAGE_KEY, STORAGE_VERSION);
	if (isLanguage(saved)) return saved;
	// "de-DE" → "de"
	const browser = typeof navigator === "undefined" ? undefined : navigator.language.split("-")[0];
	return isLanguage(browser) ? browser : "en";
}

interface LanguageState {
	language: Language;
	/** Switches and remembers the choice */
	setLanguage: (language: Language) => void;
	text: Dictionary;
}

const LanguageContext = createContext<LanguageState | null>(null);

/** Gives every component inside it the current language's text */
export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setCurrent] = useState(startLanguage);

	// screen readers and the browser read <html lang>
	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);

	const setLanguage = (next: Language) => {
		setCurrent(next);
		save(STORAGE_KEY, STORAGE_VERSION, next);
	};

	return (
		<LanguageContext.Provider value={{ language, setLanguage, text: DICTIONARIES[language] }}>
			{children}
		</LanguageContext.Provider>
	);
}

/** The current language and a way to change it */
export function useLanguage() {
	const context = useContext(LanguageContext);
	if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
	return context;
}

/** The current language's dictionary, e.g. text.header.title */
export const useText = () => useLanguage().text;

/** An error as text in the current language; errors the app doesn't know get a general message */
export function errorText(text: Dictionary, error: Error) {
	if (!(error instanceof RequestError)) return text.errors.unknown;
	return error.status === undefined
		? text.errors.offline(error.service)
		: text.errors.failed(error.service, error.status);
}
