import type { ReactNode } from "react";
import { useNavigate } from "react-router";

interface TableProps {
	/** Header cells (<Th>) */
	head: ReactNode;
	/** Rows */
	children: ReactNode;
}

/** Full-width table whose header stays on top while the rows scroll */
export function Table({ head, children }: TableProps) {
	return (
		<table className="w-full">
			<thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
				<tr>{head}</tr>
			</thead>
			<tbody>{children}</tbody>
		</table>
	);
}

interface CellProps {
	/** Text goes left, numbers right */
	align?: "left" | "right";
	className?: string;
	children: ReactNode;
}

const cell = (align: CellProps["align"]) =>
	`px-4 py-2 whitespace-nowrap ${align === "left" ? "text-left" : "text-right"}`;

export function Th({ align = "right", className = "", children }: CellProps) {
	return <th className={`${cell(align)} font-normal ${className}`}>{children}</th>;
}

export function Td({ align = "right", className = "", children }: CellProps) {
	return <td className={`${cell(align)} ${className}`}>{children}</td>;
}

interface LinkRowProps {
	/** Path to open on click */
	to: string;
	children: ReactNode;
}

/** A row that opens a page when clicked */
export function LinkRow({ to, children }: LinkRowProps) {
	const navigate = useNavigate();
	return (
		<tr onClick={() => navigate(to)} className="cursor-pointer border-b tabular-nums hover:bg-muted">
			{children}
		</tr>
	);
}
