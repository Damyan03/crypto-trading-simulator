import { useEffect, useRef, useState } from "react";
import { QUOTE } from "~/data/binance-api";
import { STARTING_BALANCE } from "~/domain/profile";
import { useProfile } from "~/state/store";
import { formatUsdt } from "~/utils/format";

/** Header dropdown with the account reset options */
export default function ProfileMenu() {
	const { reset, resetToDemo } = useProfile();
	const [open, setOpen] = useState(false);
	const [loadingDemo, setLoadingDemo] = useState(false);
	const [error, setError] = useState<string | null>(null);
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
		if (window.confirm(`Reset to ${formatUsdt(STARTING_BALANCE)} ${QUOTE}? All holdings and trades will be deleted.`)) {
			reset();
		}
	};

	// the menu stays open while the demo's past prices load, to show progress or the error
	const loadDemo = async () => {
		if (!window.confirm("Switch to the demo account? All holdings and trades will be replaced.")) return;
		setError(null);
		setLoadingDemo(true);
		try {
			await resetToDemo();
			setOpen(false);
		} catch (e) {
			setError((e as Error).message);
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
				Profile ▾
			</button>
			{open && (
				<div className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded border bg-surface text-sm shadow-lg">
					<button type="button" onClick={resetToDefault} disabled={loadingDemo} className={item}>
						Reset to default
					</button>
					<button type="button" onClick={loadDemo} disabled={loadingDemo} className={item}>
						{loadingDemo ? "Loading demo…" : "Reset to demo account"}
					</button>
					{error && <p className="px-4 py-2 text-danger">Couldn't load the demo. {error}</p>}
				</div>
			)}
		</div>
	);
}
