// digits with an optional "." or "," decimal point, e.g. "0.5", "0,5", ".5"
const AMOUNT = /^(\d+[.,]?\d*|[.,]\d+)$/;

/** Typed amount → number; null if it isn't a plain decimal number */
export function parseAmount(text: string) {
	const trimmed = text.trim();
	return AMOUNT.test(trimmed) ? Number(trimmed.replace(",", ".")) : null;
}

/** Digits after the decimal point, e.g. "0,250" → 3 */
export const decimalsIn = (text: string) => text.trim().split(/[.,]/)[1]?.length ?? 0;
