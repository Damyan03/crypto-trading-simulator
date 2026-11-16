interface Props {
	className?: string;
}

/** Shown while a live connection is down and reconnecting */
export default function ReconnectingNote({ className = "" }: Props) {
	return <p className={`text-sm text-warning ${className}`}>Live updates paused, reconnecting…</p>;
}
