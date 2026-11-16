import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { load, save } from "~/data/storage";

export type Theme = "light" | "dark";

/** In picker order */
export const THEMES: Theme[] = ["light", "dark"];

const STORAGE_KEY = "theme";
const STORAGE_VERSION = 1;
const DARK_QUERY = "(prefers-color-scheme: dark)";

const systemTheme = (): Theme =>
	typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches ? "dark" : "light";

const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);

const savedTheme = () => {
	const saved = load<unknown>(STORAGE_KEY, STORAGE_VERSION);
	return isTheme(saved) ? saved : null;
};

interface ThemeState {
	theme: Theme;
	/** Switches and remembers the choice */
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/** Light or dark: the saved choice, else the system's (followed live until a choice is made) */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [choice, setChoice] = useState(savedTheme);
	const [system, setSystem] = useState(systemTheme);
	const theme = choice ?? system;

	useEffect(() => {
		const media = window.matchMedia(DARK_QUERY);
		const update = () => setSystem(media.matches ? "dark" : "light");
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	// before paint, so the page never shows the other theme; theme.css reads data-theme
	useLayoutEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	const setTheme = (next: Theme) => {
		setChoice(next);
		save(STORAGE_KEY, STORAGE_VERSION, next);
	};

	return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

/** The current theme and a way to change it */
export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme must be used inside ThemeProvider");
	return context;
}
