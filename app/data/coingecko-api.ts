import { getJson } from "./http";
import { cached } from "./storage";

// CoinGecko public API, used without a key; rate limited per IP, so results are cached
const BASE_URL = "https://api.coingecko.com/api/v3";

const INFO_VERSION = 1;
const INFO_MAX_AGE = 60 * 60 * 1000;

/** General coin info that Binance doesn't have; amounts in USD */
export interface CoinInfo {
  name: string;
  /** Logo URL */
  image: string;
  marketCap: number | null;
  /** Position by market cap, e.g. 1 for Bitcoin */
  rank: number | null;
  circulatingSupply: number | null;
  maxSupply: number | null;
  /** All-time high price */
  ath: number | null;
}

async function fetchCoinInfo(coin: string): Promise<CoinInfo | null> {
  // `symbols` returns the top-ranked coin with that ticker
  const data = await getJson<
    {
      name: string;
      image: string;
      market_cap: number | null;
      market_cap_rank: number | null;
      circulating_supply: number | null;
      max_supply: number | null;
      ath: number | null;
    }[]
  >(`${BASE_URL}/coins/markets?vs_currency=usd&symbols=${coin.toLowerCase()}`, "CoinGecko");

  const c = data[0];
  if (!c) return null;
  return {
    name: c.name,
    image: c.image,
    marketCap: c.market_cap,
    rank: c.market_cap_rank,
    circulatingSupply: c.circulating_supply,
    maxSupply: c.max_supply,
    ath: c.ath,
  };
}

/** Info for a coin like "BTC", cached for an hour; null if CoinGecko doesn't know it */
export const getCoinInfo = (coin: string) =>
  cached(`coin-info-${coin}`, INFO_VERSION, INFO_MAX_AGE, () => fetchCoinInfo(coin));
