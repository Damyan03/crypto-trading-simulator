import { useEffect, useRef, useState } from "react";
import { QUOTE } from "~/data/binance-api";
import { STARTING_BALANCE } from "~/domain/profile";
import { errorText, useText } from "~/i18n/language";
import { useProfile } from "~/state/store";
import { formatUsdt } from "~/utils/format";

/** Header dropdown with the account reset options */
export default function ProfileMenu() {
	const { reset, resetToDemo } = useProfile();
	const allText = useText();
	const text = allText.profileMenu;
	const [open, setOpen] = useState(false);
	const [loadingDemo, setLoadingDemo] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const ref = useRef<HTMLDivElement>(null);

	// a click anywhere outside closes the menu
	useEffect(() => {
		if (!open) return;
		const close = (e: MouseEvent) => {
			if (!ref.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [open]);

	// both ask first: the old holdings and trades can't be restored
	const resetToDefault = () => {
		setOpen(false);
		if (window.confirm(text.confirmReset(`${formatUsdt(STARTING_BALANCE)} ${QUOTE}`))) {
			reset();
		}
	};

	// the menu stays open while the demo's past prices load, to show progress or the error
	const loadDemo = async () => {
		if (!window.confirm(text.confirmDemo)) return;
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
		<div ref={ref} className="relative ml-4">
			<button type="button" onClick={toggle} className="rounded px-2 py-1 hover:bg-muted">
				{text.open} ▾
			</button>
			{open && (
				<div className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded border bg-surface text-sm shadow-lg">
					<button type="button" onClick={resetToDefault} disabled={loadingDemo} className={item}>
						{text.resetToDefault}
					</button>
					<button type="button" onClick={loadDemo} disabled={loadingDemo} className={item}>
						{loadingDemo ? text.loadingDemo : text.resetToDemo}
					</button>
					{error && <p className="px-4 py-2 text-danger">{text.demoFailed(errorText(allText, error))}</p>}
				</div>
			)}
		</div>
	);
}
