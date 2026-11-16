import type { Depth } from "~/domain/order-book";
import {
	getDepthSnapshot,
	toCoin,
	toSymbol,
	toTicker,
	type Candle,
	type CandleInterval,
	type CoinStats,
	type RawLevels,
	type Ticker,
} from "./binance-rest";

// Binance live market data, combined streams: "/stream?streams=a/b/c"
const STREAM_URL = "wss://stream.binance.com:9443/stream?streams=";
const RECONNECT_DELAY = 3000;

/**
 * Opens Binance streams on one connection, e.g. "btcusdt@ticker" or "btcusdt@miniTicker/ethusdt@miniTicker",
 * and reconnects by itself if it drops.
 * `onLiveChange` reports whether it's connected. Returns a function that closes it for good.
 */
function subscribe<T>(stream: string, onMessage: (data: T) => void, onLiveChange: (live: boolean) => void) {
	let ws: WebSocket;
	let stopped = false;
	let retryTimer: ReturnType<typeof setTimeout>;

	const connect = () => {
		ws = new WebSocket(STREAM_URL + stream);
		ws.onopen = () => onLiveChange(true);
		// combined streams wrap each message: { stream, data }
		ws.onmessage = (event) => onMessage((JSON.parse(event.data) as { data: T }).data);
		// dropped (network, Binance's 24h limit…): reconnects unless closed by the returned function
		ws.onclose = () => {
			if (stopped) return;
			onLiveChange(false);
			retryTimer = setTimeout(connect, RECONNECT_DELAY);
		};
	};

	connect();
	return () => {
		stopped = true;
		clearTimeout(retryTimer);
		ws.close();
	};
}

/** Live 24h stats for one pair, about once a second */
export const subscribeCoinStats = (
	symbol: string,
	onUpdate: (stats: CoinStats) => void,
	onLiveChange: (live: boolean) => void,
) =>
	// stream names must be lowercase
	subscribe<{ c: string; P: string; h: string; l: string; v: string; q: string; n: number }>(
		`${symbol.toLowerCase()}@ticker`,
		(t) =>
			onUpdate({
				lastPrice: Number(t.c),
				priceChangePercent: Number(t.P),
				highPrice: Number(t.h),
				lowPrice: Number(t.l),
				volume: Number(t.v),
				quoteVolume: Number(t.q),
				trades: t.n,
			}),
		onLiveChange,
	);

/** Live updates of the current candle, every 2 seconds; a new start time means a new candle */
export const subscribeCandles = (
	symbol: string,
	interval: CandleInterval,
	onUpdate: (candle: Candle) => void,
	onLiveChange: (live: boolean) => void,
) =>
	subscribe<{ k: { t: number; o: string; h: string; l: string; c: string } }>(
		`${symbol.toLowerCase()}@kline_${interval}`,
		({ k }) =>
			onUpdate({
				time: k.t / 1000,
				open: Number(k.o),
				high: Number(k.h),
				low: Number(k.l),
				close: Number(k.c),
			}),
		onLiveChange,
	);

// one mini-ticker stream per coin, e.g. "btcusdt@miniTicker/ethusdt@miniTicker"
const miniTickerStreams = (coins: string[]) =>
	coins.map((coin) => `${toSymbol(coin).toLowerCase()}@miniTicker`).join("/");

/** Live price of each coin, about once a second, all on one connection */
export const subscribePrices = (
	coins: string[],
	onUpdate: (coin: string, price: number) => void,
	onLiveChange: (live: boolean) => void,
) =>
	subscribe<{ s: string; c: string }>(miniTickerStreams(coins), (t) => onUpdate(toCoin(t.s), Number(t.c)), onLiveChange);

/** Live 24h stats (price, % change, volume) of each coin, about once a second, all on one connection */
export const subscribeTickers = (
	coins: string[],
	onUpdate: (ticker: Ticker) => void,
	onLiveChange: (live: boolean) => void,
) =>
	subscribe<{ s: string; o: string; c: string; q: string }>(
		miniTickerStreams(coins),
		(t) => onUpdate(toTicker(t.s, t.o, t.c, t.q)),
		onLiveChange,
	);

/** One change event from the diff depth stream */
interface DepthUpdate {
	/** First update ID in the event */
	U: number;
	/** Final update ID in the event */
	u: number;
	b: RawLevels;
	a: RawLevels;
}

/** Sets each level's new quantity; 0 removes the level */
function setLevels(book: Map<number, number>, levels: RawLevels) {
	for (const [price, quantity] of levels) {
		if (Number(quantity) === 0) book.delete(Number(price));
		else book.set(Number(price), Number(quantity));
	}
}

/** Sorted with `order` (the docs don't state one) */
const toLevels = (book: Map<number, number>, order: (a: number, b: number) => number) =>
	[...book].sort(([a], [b]) => order(a, b)).map(([price, quantity]) => ({ price, quantity }));

/**
 * Live local order book, kept in sync as Binance's docs describe ("How to manage a local order book correctly"):
 * buffer stream events, load a REST snapshot, then apply the buffered and every new change; missed events start over.
 * Returns a function that closes it.
 */
export function subscribeOrderBook(
	symbol: string,
	onUpdate: (depth: Depth) => void,
	onLiveChange: (live: boolean) => void,
	onError: (error: Error) => void,
) {
	const bids = new Map<number, number>();
	const asks = new Map<number, number>();
	// update ID of the local book
	let bookId = 0;
	// events wait here while a snapshot loads; null once the book is in sync
	let buffer: DepthUpdate[] | null = [];
	let stopped = false;

	const emit = () => onUpdate({ bids: toLevels(bids, (a, b) => b - a), asks: toLevels(asks, (a, b) => a - b) });

	const loadSnapshot = async (): Promise<void> => {
		try {
			const snapshot = await getDepthSnapshot(symbol);
			if (stopped || !buffer) return;
			// older than the first buffered event: fetch again
			if (snapshot.lastUpdateId < buffer[0].U) return loadSnapshot();
			bids.clear();
			asks.clear();
			setLevels(bids, snapshot.bids);
			setLevels(asks, snapshot.asks);
			bookId = snapshot.lastUpdateId;
			const pending = buffer;
			buffer = null;
			// skips events the snapshot already includes
			pending.filter((event) => event.u > bookId).forEach(handle);
			if (!buffer) emit();
		} catch (e) {
			if (stopped) return;
			// a failed snapshot closes the stream; Retry opens a new connection
			stopped = true;
			unsubscribe();
			onError(e as Error);
		}
	};

	const handle = (event: DepthUpdate) => {
		if (buffer) {
			// the first buffered event starts loading a snapshot
			if (buffer.push(event) === 1) loadSnapshot();
			return;
		}
		if (event.u < bookId) return;
		if (event.U > bookId + 1) {
			// missed events (e.g. after a reconnect): start over
			buffer = [];
			handle(event);
			return;
		}
		setLevels(bids, event.b);
		setLevels(asks, event.a);
		bookId = event.u;
	};

	const unsubscribe = subscribe<DepthUpdate>(
		`${symbol.toLowerCase()}@depth`,
		(event) => {
			handle(event);
			if (!buffer) emit();
		},
		onLiveChange,
	);

	return () => {
		stopped = true;
		unsubscribe();
	};
}
