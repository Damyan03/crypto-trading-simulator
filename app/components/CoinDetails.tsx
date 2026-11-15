import { useEffect, useState } from "react";
import ErrorMessage from "~/components/ErrorMessage";
import Stat from "~/components/Stat";
import { getCoinStats, getTradingPairs, QUOTE, type CoinStats, type Pair } from "~/data/binance-api";
import { getCoinInfo, type CoinInfo } from "~/data/coingecko-api";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";

interface Props {
  /** e.g. "BTC" */
  coin: string;
}

/** Price and 24h stats (Binance) plus general info (CoinGecko) for one coin */
export default function CoinDetails({ coin }: Props) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // undefined = loading, null = CoinGecko doesn't know the coin
  const [info, setInfo] = useState<CoinInfo | null>();
  const [infoFailed, setInfoFailed] = useState(false);

  // Binance: check the coin is traded here, then load its 24h stats
  useEffect(() => {
    getTradingPairs()
      .then((pairs) => {
        const found = pairs.find((p) => p.coin === coin);
        if (!found) {
          setNotFound(true);
          return;
        }
        setPair(found);
        return getCoinStats(found.symbol).then(setStats);
      })
      .catch((e: Error) => setError(e.message));
  }, [coin, attempt]);

  // CoinGecko: only for coins traded here; optional, the page still works if it fails
  useEffect(() => {
    if (!pair) return;
    getCoinInfo(coin)
      .then(setInfo)
      .catch(() => setInfoFailed(true));
  }, [coin, pair]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  if (notFound) return <p className="p-4 text-muted-foreground">{coin} isn't traded on this platform.</p>;
  if (error) return <ErrorMessage message={error} onRetry={retry} />;
  if (!pair || !stats) return <p className="p-4 text-muted-foreground">Loading {coin}…</p>;

  // "—" for values CoinGecko doesn't have
  const price = (value: number | null) => (value === null ? "—" : formatPrice(value, pair.priceDecimals));
  const amount = (value: number | null) => (value === null ? "—" : formatVolume(value));

  return (
    <div className="bg-surface p-4 text-foreground">
      <div className="flex items-center gap-3">
        {info && <img src={info.image} alt="" className="size-8" />}
        <h2 className="text-xl font-semibold">{info?.name ?? coin}</h2>
        <span className="text-muted-foreground">
          {coin}/{QUOTE}
        </span>
        <span className="ml-auto text-xl font-semibold tabular-nums">{price(stats.lastPrice)}</span>
        <span className={`tabular-nums ${changeColor(stats.priceChangePercent)}`}>
          {formatPercent(stats.priceChangePercent)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="24h high" value={price(stats.highPrice)} />
        <Stat label="24h low" value={price(stats.lowPrice)} />
        <Stat label={`24h volume (${coin})`} value={amount(stats.volume)} />
        <Stat label={`24h volume (${QUOTE})`} value={amount(stats.quoteVolume)} />
        <Stat label="24h trades" value={amount(stats.trades)} />
        {info && (
          <>
            <Stat label="Market cap (USD)" value={amount(info.marketCap)} />
            <Stat label="Rank" value={info.rank === null ? "—" : `#${info.rank}`} />
            <Stat label="Circulating supply" value={amount(info.circulatingSupply)} />
            <Stat label="Max supply" value={amount(info.maxSupply)} />
            <Stat label="All-time high (USD)" value={price(info.ath)} />
          </>
        )}
      </dl>

      {infoFailed && !info && (
        <p className="mt-3 text-sm text-muted-foreground">Name and market cap unavailable (CoinGecko didn't respond).</p>
      )}
      {info === null && <p className="mt-3 text-sm text-muted-foreground">No extra info available for {coin}.</p>}
    </div>
  );
}
