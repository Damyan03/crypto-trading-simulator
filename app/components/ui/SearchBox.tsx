import { useText } from "~/i18n/language";

interface Props {
	value: string;
	onChange: (value: string) => void;
}

/** Text input for filtering coins by name */
export default function SearchBox({ value, onChange }: Props) {
	const text = useText().search;
	return (
		<input
			type="search"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={text.placeholder}
			aria-label={text.label}
			className="w-full rounded border bg-surface px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
		/>
	);
}
