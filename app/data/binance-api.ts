import type { Prices } from "~/domain/profile";
import { getJson } from "./http";
import { cached } from "./storage";

// Binance public REST API, no key needed
const BASE_URL = "https://api.binance.com/api/v3";
// Binance live market data, combined streams: "/stream?streams=a/b/c"
const STREAM_URL = "wss://stream.binance.com:9443/stream?streams=";
const RECONNECT_DELAY = 3000;

/** The only quote currency the app trades against */
export const QUOTE = "USDT";

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
interface Ticker {
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

/** One pair's full 24h stats, for the trade page */
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

/** One order book price level */
export interface DepthLevel {
  price: number;
  /** Coins waiting to be bought (bid) or sold (ask) at this price */
  quantity: number;
}

/** Top of the order book; best price first on both sides */
export interface Depth {
  bids: DepthLevel[];
  asks: DepthLevel[];
}

/** Levels per side the depth stream supports */
export type DepthLevels = 5 | 10 | 20;

// "BTC" → "BTCUSDT"
const toSymbol = (coin: string) => coin + QUOTE;
// "BTCUSDT" → "BTC"
const toCoin = (symbol: string) => symbol.slice(0, -QUOTE.length);

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
  const data = await get<{ symbol: string; openPrice: string; lastPrice: string; quoteVolume: string }[]>(
    "/ticker/24hr?type=MINI",
  );
  return data.map((t) => {
    const open = Number(t.openPrice);
    const last = Number(t.lastPrice);
    return {
      symbol: t.symbol,
      lastPrice: last,
      // MINI has no % change, so it's calculated from the opening price
      priceChangePercent: open > 0 ? ((last - open) / open) * 100 : 0,
      quoteVolume: Number(t.quoteVolume),
    };
  });
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

/** Candles for one pair, oldest first, e.g. getCandles("BTCUSDT", "1h") */
export async function getCandles(symbol: string, interval: string, limit = 500): Promise<Candle[]> {
  // each kline is [openTime, open, high, low, close, volume, …]
  const data = await get<[number, string, string, string, string][]>(
    `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
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
    // dropped (network, Binance's 24h limit…): try again unless we closed it ourselves
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
  interval: string,
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

/** Live price of each coin, about once a second, all on one connection */
export const subscribePrices = (
  coins: string[],
  onUpdate: (coin: string, price: number) => void,
  onLiveChange: (live: boolean) => void,
) =>
  subscribe<{ s: string; c: string }>(
    coins.map((coin) => `${toSymbol(coin).toLowerCase()}@miniTicker`).join("/"),
    (t) => onUpdate(toCoin(t.s), Number(t.c)),
    onLiveChange,
  );

/** Latest price per coin */
export async function getPrices(coins: string[]): Promise<Prices> {
  const symbols = encodeURIComponent(JSON.stringify(coins.map(toSymbol)));
  const data = await get<{ symbol: string; price: string }[]>(`/ticker/price?symbols=${symbols}`);
  return Object.fromEntries(data.map((d) => [toCoin(d.symbol), Number(d.price)]));
}

/** Binance's order book: [price, quantity] strings */
type RawDepth = { bids: [string, string][]; asks: [string, string][] };

/** The docs don't state an order, so it's sorted here */
function toDepth(data: RawDepth): Depth {
  const levels = (list: [string, string][]) =>
    list.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) }));
  return {
    bids: levels(data.bids).sort((a, b) => b.price - a.price),
    asks: levels(data.asks).sort((a, b) => a.price - b.price),
  };
}

/** Order book snapshot for one pair */
export const getDepth = async (symbol: string, levels: DepthLevels) =>
  toDepth(await get<RawDepth>(`/depth?symbol=${symbol}&limit=${levels}`));

/** Live order book snapshot, every second */
export const subscribeDepth = (
  symbol: string,
  levels: DepthLevels,
  onUpdate: (depth: Depth) => void,
  onLiveChange: (live: boolean) => void,
) => subscribe<RawDepth>(`${symbol.toLowerCase()}@depth${levels}`, (d) => onUpdate(toDepth(d)), onLiveChange);
