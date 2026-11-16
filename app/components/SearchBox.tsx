interface Props {
	value: string;
	onChange: (value: string) => void;
}

/** Text input for filtering coins by name */
export default function SearchBox({ value, onChange }: Props) {
	return (
		<input
			type="search"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder="Search coins, e.g. BTC"
			aria-label="Search coins"
			className="w-full rounded border bg-surface px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
		/>
	);
}
