import type { Prices } from "~/domain/profile";
import { load, save } from "./storage";

// Binance public REST API, no key needed
const BASE_URL = "https://api.binance.com/api/v3";

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

// "BTC" → "BTCUSDT"
const toSymbol = (coin: string) => coin + QUOTE;
// "BTCUSDT" → "BTC"
const toCoin = (symbol: string) => symbol.slice(0, -QUOTE.length);

/** Generic GET request to Binance API */
async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch {
    throw new Error("Can't reach Binance. Check your connection.");
  }
  if (!res.ok) throw new Error(`Binance request failed (${res.status})`);
  return res.json() as Promise<T>;
}

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

// Download in progress, shared so two callers don't download twice
let pairsRequest: Promise<Pair[]> | null = null;

/** Spot pairs trading against QUOTE, cached for an hour */
export function getTradingPairs(): Promise<Pair[]> {
  const cached = load<Pair[]>(PAIRS_KEY, PAIRS_VERSION, PAIRS_MAX_AGE);
  if (cached) return Promise.resolve(cached);

  pairsRequest ??= fetchTradingPairs()
    .then((pairs) => {
      save(PAIRS_KEY, PAIRS_VERSION, pairs);
      return pairs;
    })
    .finally(() => {
      pairsRequest = null;
    });
  return pairsRequest;
}

/** 24h stats for every pair */
export async function getTickers(): Promise<Ticker[]> {
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

/** Latest price per coin */
export async function getPrices(coins: string[]): Promise<Prices> {
  const symbols = encodeURIComponent(JSON.stringify(coins.map(toSymbol)));
  const data = await get<{ symbol: string; price: string }[]>(`/ticker/price?symbols=${symbols}`);
  return Object.fromEntries(data.map((d) => [toCoin(d.symbol), Number(d.price)]));
}
