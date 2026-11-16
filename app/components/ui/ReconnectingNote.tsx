import { useText } from "~/i18n/language";

interface Props {
	className?: string;
}

/** Shown while a live connection is down and reconnecting */
export default function ReconnectingNote({ className = "" }: Props) {
	const text = useText();
	return <p className={`text-sm text-warning ${className}`}>{text.common.reconnecting}</p>;
}
