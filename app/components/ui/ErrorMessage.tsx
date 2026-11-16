import { errorText, useText } from "~/i18n/language";

interface Props {
	error: Error;
	onRetry: () => void;
}

/** The error in the current language, with a Retry button */
export default function ErrorMessage({ error, onRetry }: Props) {
	const text = useText();
	return (
		<div className="flex items-center gap-3 p-4 text-danger">
			<span>{errorText(text, error)}</span>
			<button type="button" onClick={onRetry} className="rounded bg-primary px-3 py-1 text-white hover:bg-primary/90">
				{text.common.retry}
			</button>
		</div>
	);
}
