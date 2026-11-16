import { useEffect, useRef, useState } from "react";
import { QUOTE } from "~/data/binance-api";
import { STARTING_BALANCE } from "~/domain/profile";
import { DICTIONARIES, errorText, LANGUAGES, useLanguage } from "~/i18n/language";
import { useProfile } from "~/state/store";
import { THEMES, useTheme } from "~/state/theme";
import { formatUsdt } from "~/utils/format";

interface OptionGroupProps<T extends string> {
	title: string;
	options: T[];
	current: T;
	label: (option: T) => string;
	onPick: (option: T) => void;
}

/** A titled list of choices; the current one is bold with a check mark */
function OptionGroup<T extends string>({ title, options, current, label, onPick }: OptionGroupProps<T>) {
	return (
		<div className="border-t">
			<p className="px-4 pt-2 text-xs text-muted-foreground">{title}</p>
			{options.map((option) => (
				<button
					key={option}
					type="button"
					onClick={() => onPick(option)}
					aria-pressed={option === current}
					className={`flex w-full justify-between px-4 py-2 hover:bg-muted ${option === current ? "font-semibold" : ""}`}
				>
					{label(option)}
					{option === current && <span>✓</span>}
				</button>
			))}
		</div>
	);
}

/** Header dropdown with the account reset options, theme and language */
export default function ProfileMenu() {
	const { reset, resetToDemo } = useProfile();
	const { language, setLanguage, text } = useLanguage();
	const { theme, setTheme } = useTheme();
	const { profileMenu } = text;
	const [open, setOpen] = useState(false);
	const [loadingDemo, setLoadingDemo] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const ref = useRef<HTMLDivElement>(null);

	// a click or tap outside, or Escape, closes the menu
	useEffect(() => {
		if (!open) return;
		const clickOutside = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		};
		const escape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("pointerdown", clickOutside);
		document.addEventListener("keydown", escape);
		return () => {
			document.removeEventListener("pointerdown", clickOutside);
			document.removeEventListener("keydown", escape);
		};
	}, [open]);

	// both ask first: the old holdings and trades can't be restored
	const resetToDefault = () => {
		setOpen(false);
		if (window.confirm(profileMenu.confirmReset(`${formatUsdt(STARTING_BALANCE)} ${QUOTE}`))) {
			reset();
		}
	};

	// the menu stays open while the demo's past prices load, to show progress or the error
	const loadDemo = async () => {
		if (!window.confirm(profileMenu.confirmDemo)) return;
		setError(null);
		setLoadingDemo(true);
		try {
			await resetToDemo();
			setOpen(false);
		} catch (e) {
			setError(e as Error);
		} finally {
			setLoadingDemo(false);
		}
	};

	const toggle = () => {
		setError(null);
		setOpen(!open);
	};

	const item = "block w-full px-4 py-2 text-left hover:bg-muted disabled:opacity-50";

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={toggle}
				aria-expanded={open}
				aria-haspopup="menu"
				className="whitespace-nowrap rounded px-2 py-1 hover:bg-muted"
			>
				{profileMenu.open} ▾
			</button>
			{open && (
				// opens leftwards from the button's right edge; never wider than the screen
				<div className="absolute right-0 top-full z-20 mt-1 w-56 max-w-[calc(100vw-2rem)] border bg-surface text-sm text-foreground shadow-sm">
					<button type="button" onClick={resetToDefault} disabled={loadingDemo} className={item}>
						{profileMenu.resetToDefault}
					</button>
					<button type="button" onClick={loadDemo} disabled={loadingDemo} className={item}>
						{loadingDemo ? profileMenu.loadingDemo : profileMenu.resetToDemo}
					</button>
					{error && <p className="px-4 py-2 text-danger">{profileMenu.demoFailed(errorText(text, error))}</p>}

					<OptionGroup
						title={profileMenu.theme}
						options={THEMES}
						current={theme}
						label={(option) => profileMenu.themes[option]}
						onPick={setTheme}
					/>
					<OptionGroup
						title={profileMenu.language}
						options={LANGUAGES}
						current={language}
						label={(code) => DICTIONARIES[code].languageName}
						onPick={setLanguage}
					/>
				</div>
			)}
		</div>
	);
}
