import { QUOTE, type Prices, type PriceSnapshot } from "~/domain/profile";
import { getJson } from "./http";
import { cached } from "./storage";

// Binance public REST API, no key needed
const BASE_URL = "https://api.binance.com/api/v3";
// order book snapshot levels per side: the most Binance allows (weight 250)
const BOOK_LIMIT = 5000;

// Pair list cache: storage key, format version, kept for 1 hour
const PAIRS_KEY = "pairs";
const PAIRS_VERSION = 1;
const PAIRS_MAX_AGE = 60 * 60 * 1000;

/** A coin traded against USDT */
export interface Pair {
	/** e.g. "BTCUSDT" */
	symbol: string;
	/** e.g. "BTC" */
	coin: string;
	/** From tickSize */
	priceDecimals: number;
	/** From stepSize */
	quantityDecimals: number;
}

/** A pair's last 24 hours */
export interface Ticker {
	symbol: string;
	lastPrice: number;
	/** e.g. -2.5 for -2.5% */
	priceChangePercent: number;
	/** Traded amount in USDT */
	quoteVolume: number;
}

/** A pair together with its 24h stats */
export type Market = Pair & Ticker;

/** One candlestick; prices in USDT */
export interface Candle {
	/** Start time in seconds (Binance sends milliseconds) */
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
}

/** One pair's full 24h stats */
export interface CoinStats {
	lastPrice: number;
	priceChangePercent: number;
	highPrice: number;
	lowPrice: number;
	/** Traded amount in the coin */
	volume: number;
	/** Traded amount in USDT */
	quoteVolume: number;
	/** Number of trades */
	trades: number;
}

/** Candle lengths Binance supports ("Kline/Candlestick chart intervals" in its docs); m = minutes, M = months */
export type CandleInterval =
	"1s" | "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

/** Order book levels: [price, quantity] strings */
export type RawLevels = [string, string][];

/** "BTC" → "BTCUSDT" */
export const toSymbol = (coin: string) => coin + QUOTE;
/** "BTCUSDT" → "BTC" */
export const toCoin = (symbol: string) => symbol.slice(0, -QUOTE.length);

/** A Ticker from mini-ticker values (REST type=MINI or the @miniTicker stream) */
export const toTicker = (symbol: string, open: string, last: string, quoteVolume: string): Ticker => ({
	symbol,
	lastPrice: Number(last),
	// mini tickers have no % change; it's calculated from the opening price
	priceChangePercent: Number(open) > 0 ? ((Number(last) - Number(open)) / Number(open)) * 100 : 0,
	quoteVolume: Number(quoteVolume),
});

/** GET request to Binance API */
const get = <T>(path: string) => getJson<T>(BASE_URL + path, "Binance");

/** Counts decimal steps in a string, e.g. "0.00100" => 3 */
const countDecimals = (step: string) => step.replace(/0+$/, "").split(".")[1]?.length ?? 0;

/** Downloads every USDT pair that is currently trading */
async function fetchTradingPairs(): Promise<Pair[]> {
	const data = await get<{
		symbols: {
			symbol: string;
			baseAsset: string;
			quoteAsset: string;
			filters: { filterType: string; tickSize?: string; stepSize?: string }[];
		}[];
	}>("/exchangeInfo?permissions=SPOT&symbolStatus=TRADING&showPermissionSets=false");

	return data.symbols
		.filter((s) => s.quoteAsset === QUOTE)
		.map((s) => {
			// finds one of the pair's trading rules
			const filter = (type: string) => s.filters.find((f) => f.filterType === type);
			return {
				symbol: s.symbol,
				coin: s.baseAsset,
				priceDecimals: countDecimals(filter("PRICE_FILTER")?.tickSize ?? "0.01"),
				quantityDecimals: countDecimals(filter("LOT_SIZE")?.stepSize ?? "0.00000001"),
			};
		});
}

/** Spot pairs trading against QUOTE, cached for an hour */
export const getTradingPairs = () => cached(PAIRS_KEY, PAIRS_VERSION, PAIRS_MAX_AGE, fetchTradingPairs);

/** 24h stats for every pair */
async function getTickers(): Promise<Ticker[]> {
	const data =
		await get<{ symbol: string; openPrice: string; lastPrice: string; quoteVolume: string }[]>("/ticker/24hr?type=MINI");
	return data.map((t) => toTicker(t.symbol, t.openPrice, t.lastPrice, t.quoteVolume));
}

/** Trading pairs with their 24h stats */
export async function getMarkets(): Promise<Market[]> {
	const [pairs, tickers] = await Promise.all([getTradingPairs(), getTickers()]);
	// match each pair with its stats; pairs without stats are dropped
	const bySymbol = new Map(tickers.map((t) => [t.symbol, t]));
	return pairs.flatMap((pair) => {
		const ticker = bySymbol.get(pair.symbol);
		return ticker ? [{ ...pair, ...ticker }] : [];
	});
}

/** 24h stats for one pair, e.g. "BTCUSDT" */
export async function getCoinStats(symbol: string): Promise<CoinStats> {
	const t = await get<{
		lastPrice: string;
		priceChangePercent: string;
		highPrice: string;
		lowPrice: string;
		volume: string;
		quoteVolume: string;
		count: number;
	}>(`/ticker/24hr?symbol=${symbol}`);
	return {
		lastPrice: Number(t.lastPrice),
		priceChangePercent: Number(t.priceChangePercent),
		highPrice: Number(t.highPrice),
		lowPrice: Number(t.lowPrice),
		volume: Number(t.volume),
		quoteVolume: Number(t.quoteVolume),
		trades: t.count,
	};
}

// ms per interval unit; "M" is the shortest month
const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000, M: 28 * 86_400_000 };

// e.g. "4h" → 14,400,000
const intervalMs = (interval: CandleInterval) =>
	Number(interval.slice(0, -1)) * UNIT_MS[interval.slice(-1) as keyof typeof UNIT_MS];

/**
 * Candles for one pair, oldest first, e.g. getCandles("BTCUSDT", "1h"): the latest `limit`,
 * or with `before` (start time in seconds) the `limit` that started before it
 */
export async function getCandles(
	symbol: string,
	interval: CandleInterval,
	limit = 500,
	before?: number,
): Promise<Candle[]> {
	// a range of exactly `limit` candles; the docs don't state what endTime alone returns
	const range =
		before === undefined ? "" : `&startTime=${before * 1000 - limit * intervalMs(interval)}&endTime=${before * 1000 - 1}`;
	// each kline is [openTime, open, high, low, close, volume, …]
	const data = await get<[number, string, string, string, string][]>(
		`/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${range}`,
	);
	return data.map(([openTime, open, high, low, close]) => ({
		time: openTime / 1000,
		open: Number(open),
		high: Number(high),
		low: Number(low),
		close: Number(close),
	}));
}

/**
 * Each coin's opening price for the last `count` candles of `interval`, oldest first; the last is the current one,
 * e.g. getPriceHistory(["BTC", "ETH"], "1h", 24) for every hour of the last day
 */
export async function getPriceHistory(
	coins: string[],
	interval: CandleInterval,
	count: number,
): Promise<PriceSnapshot[]> {
	const candles = await Promise.all(coins.map((coin) => getCandles(toSymbol(coin), interval, count)));
	// every coin has the same candle times; the times come from the first coin's candles
	return candles[0].map((candle, i) => ({
		time: candle.time * 1000,
		prices: Object.fromEntries(coins.map((coin, c) => [coin, candles[c][i].open])),
	}));
}

/** Latest price per coin */
export async function getPrices(coins: string[]): Promise<Prices> {
	const symbols = encodeURIComponent(JSON.stringify(coins.map(toSymbol)));
	const data = await get<{ symbol: string; price: string }[]>(`/ticker/price?symbols=${symbols}`);
	return Object.fromEntries(data.map((d) => [toCoin(d.symbol), Number(d.price)]));
}

/** Order book snapshot for one pair, e.g. "BTCUSDT"; `lastUpdateId` lines it up with the depth stream */
export const getDepthSnapshot = (symbol: string) =>
	get<{ lastUpdateId: number; bids: RawLevels; asks: RawLevels }>(`/depth?symbol=${symbol}&limit=${BOOK_LIMIT}`);
