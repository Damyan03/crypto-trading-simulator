const BASE_URL = "https://api.binance.com/api/v3";

export interface Pair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  priceDecimals: number;
}

export interface Ticker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
}

export type Market = Pair & Ticker;

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

/** Spot pairs trading against `quote` */
export async function getTradingPairs(quote = "USDT"): Promise<Pair[]> {
  const data = await get<{
    symbols: {
      symbol: string;
      baseAsset: string;
      quoteAsset: string;
      filters: { filterType: string; tickSize?: string }[];
    }[];
  }>("/exchangeInfo?permissions=SPOT&symbolStatus=TRADING&showPermissionSets=false");

  return data.symbols
    .filter((s) => s.quoteAsset === quote)
    .map((s) => ({
      symbol: s.symbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
      priceDecimals: countDecimals(s.filters.find((f) => f.filterType === "PRICE_FILTER")?.tickSize ?? "0.01"),
    }));
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
      priceChangePercent: open > 0 ? ((last - open) / open) * 100 : 0,
      quoteVolume: Number(t.quoteVolume),
    };
  });
}

/** Trading pairs with their 24h stats */
export async function getMarkets(quote = "USDT"): Promise<Market[]> {
  const [pairs, tickers] = await Promise.all([getTradingPairs(quote), getTickers()]);
  const bySymbol = new Map(tickers.map((t) => [t.symbol, t]));
  return pairs.flatMap((pair) => {
    const ticker = bySymbol.get(pair.symbol);
    return ticker ? [{ ...pair, ...ticker }] : [];
  });
}
