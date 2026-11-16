import type { ReactNode } from "react";

interface Props<T extends string | number> {
	options: readonly T[];
	/** The picked option */
	value: T;
	/** Called only when a different option is picked */
	onChange: (value: T) => void;
	/** Button text for an option */
	label: (option: T) => ReactNode;
	className?: string;
}

/** A row of buttons with exactly one picked, e.g. chart timeframes */
export default function SegmentedControl<T extends string | number>({
	options,
	value,
	onChange,
	label,
	className = "",
}: Props<T>) {
	return (
		<div className={`flex gap-1 ${className}`}>
			{options.map((option) => (
				<button
					key={option}
					type="button"
					onClick={() => {
						if (option !== value) onChange(option);
					}}
					aria-pressed={option === value}
					className={`rounded px-1.5 py-0.5 ${option === value ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
				>
					{label(option)}
				</button>
			))}
		</div>
	);
}
