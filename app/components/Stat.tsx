interface Props {
	label: string;
	value: string;
	className?: string;
}

/** One label with its value, for use inside a <dl>; the parent sets the value's text size */
export default function Stat({ label, value, className = "" }: Props) {
	return (
		<div>
			<dt className="text-sm text-muted-foreground">{label}</dt>
			<dd className={`font-semibold tabular-nums ${className}`}>{value}</dd>
		</div>
	);
}
