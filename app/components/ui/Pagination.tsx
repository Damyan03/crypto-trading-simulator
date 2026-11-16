import { useRef, useState } from "react";
import { useText } from "~/i18n/language";
import { pageList } from "~/utils/pagination";

interface Props {
	/** Current page, 0-based */
	page: number;
	pageSize: number;
	/** Number of items across all pages */
	total: number;
	onChange: (page: number) => void;
}

const pageButton = "rounded px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent";

/** "21–40 of 191" with Previous, page numbers and Next; renders nothing when everything fits on one page */
export default function Pagination({ page, pageSize, total, onChange }: Props) {
	const { pagination } = useText();
	const pageCount = Math.ceil(total / pageSize);
	if (pageCount <= 1) return null;

	const range = pagination.range(
		(page * pageSize + 1).toLocaleString(),
		Math.min((page + 1) * pageSize, total).toLocaleString(),
		total.toLocaleString(),
	);

	return (
		<div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
			<span className="tabular-nums text-muted-foreground">{range}</span>
			<nav className="flex items-center gap-1 tabular-nums">
				{/* phones show only the arrows */}
				<button
					type="button"
					onClick={() => onChange(page - 1)}
					disabled={page === 0}
					aria-label={pagination.previous}
					className={pageButton}
				>
					‹<span className="hidden sm:inline"> {pagination.previous}</span>
				</button>
				{pageList(page, pageCount).map((p, i) =>
					p === null ? (
						<PageJump key={`gap-${i}`} pageCount={pageCount} label={pagination.goToPage} onJump={onChange} />
					) : (
						<button
							key={p}
							type="button"
							onClick={() => onChange(p)}
							aria-current={p === page ? "page" : undefined}
							className={`${pageButton} ${p === page ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"}`}
						>
							{(p + 1).toLocaleString()}
						</button>
					),
				)}
				<button
					type="button"
					onClick={() => onChange(page + 1)}
					disabled={page === pageCount - 1}
					aria-label={pagination.next}
					className={pageButton}
				>
					<span className="hidden sm:inline">{pagination.next} </span>›
				</button>
			</nav>
		</div>
	);
}

interface PageJumpProps {
	pageCount: number;
	/** For screen readers and the tooltip, e.g. "Go to page" */
	label: string;
	/** 0-based page */
	onJump: (page: number) => void;
}

/** A "…" gap you can type a page number into; Enter or leaving the field jumps there, Escape cancels */
function PageJump({ pageCount, label, onJump }: PageJumpProps) {
	const [value, setValue] = useState("");
	// set by Escape: the blur that follows still sees the typed value, so it must not jump
	const cancelledRef = useRef(false);

	// numbers past either end go to the first or last page; anything else is ignored
	const jump = () => {
		const page = Number.parseInt(value, 10);
		if (!cancelledRef.current && Number.isFinite(page)) onJump(Math.min(Math.max(page, 1), pageCount) - 1);
		cancelledRef.current = false;
		setValue("");
	};

	return (
		<input
			type="text"
			inputMode="numeric"
			value={value}
			onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
			onKeyDown={(e) => {
				if (e.key === "Enter") e.currentTarget.blur();
				if (e.key === "Escape") {
					cancelledRef.current = true;
					e.currentTarget.blur();
				}
			}}
			onBlur={jump}
			placeholder="…"
			aria-label={label}
			title={label}
			className="w-9 rounded bg-transparent py-1 text-center placeholder:text-muted-foreground hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
		/>
	);
}
