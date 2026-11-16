// Formatters are created once and reused; `undefined` = the browser's locale
const usdt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signedUsdt = new Intl.NumberFormat(undefined, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	signDisplay: "exceptZero",
});
const percent = new Intl.NumberFormat(undefined, {
	style: "percent",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	signDisplay: "exceptZero",
});
const volume = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const time = new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "medium" });

/** Green above 0, red below, neutral at 0 */
export const changeColor = (value: number) => (value > 0 ? "text-success" : value < 0 ? "text-danger" : "");

/** e.g. 1,234.50 */
export const formatUsdt = (value: number) => usdt.format(value);

/** e.g. +81.60 / -118.38 */
export const formatSignedUsdt = (value: number) => signedUsdt.format(value);

/** e.g. 1.2M */
export const formatVolume = (value: number) => volume.format(value);

/** Takes Unix ms, e.g. 15/11/2026, 14:03:22 */
export const formatTime = (ms: number) => time.format(ms);

/** Takes 5 for 5% */
export const formatPercent = (value: number) => percent.format(value / 100);

/** `decimals` from the pair's tickSize; without it, 2 (up to 8 below 1) */
export const formatPrice = (value: number, decimals?: number) =>
	value.toLocaleString(undefined, {
		minimumFractionDigits: decimals ?? 2,
		maximumFractionDigits: decimals ?? (value >= 1 ? 2 : 8),
	});

/** `decimals` from the pair's stepSize; without it, up to 8 */
export const formatQuantity = (value: number, decimals?: number) =>
	value.toLocaleString(undefined, { minimumFractionDigits: decimals ?? 0, maximumFractionDigits: decimals ?? 8 });
