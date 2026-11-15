import { useEffect, useState } from "react";
import ErrorMessage from "~/components/ErrorMessage";
import ReconnectingNote from "~/components/ReconnectingNote";
import Stat from "~/components/Stat";
import { getCoinStats, QUOTE, subscribeCoinStats, type CoinStats, type Pair } from "~/data/binance-api";
import { getCoinInfo, type CoinInfo } from "~/data/coingecko-api";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";

interface Props {
  pair: Pair;
}

/** Price and 24h stats (Binance) plus general info (CoinGecko) for one coin */
export default function CoinDetails({ pair }: Props) {
  const { coin } = pair;
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // undefined = loading, null = CoinGecko doesn't know the coin
  const [info, setInfo] = useState<CoinInfo | null>();
  const [infoFailed, setInfoFailed] = useState(false);
  // false while the live connection is down and reconnecting
  const [live, setLive] = useState(true);

  // Binance REST: 24h stats right away
  useEffect(() => {
    getCoinStats(pair.symbol)
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [pair, attempt]);

  // Binance stream: live stats; the cleanup closes the connection
  useEffect(() => subscribeCoinStats(pair.symbol, setStats, setLive), [pair]);

  // CoinGecko: optional, the page still works if it fails
  useEffect(() => {
    getCoinInfo(coin)
      .then(setInfo)
      .catch(() => setInfoFailed(true));
  }, [coin]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  // the stream may still deliver stats even if the first request failed
  if (error && !stats) return <ErrorMessage message={error} onRetry={retry} />;
  if (!stats) return <p className="bg-surface p-4 text-muted-foreground">Loading {coin}…</p>;

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

      {!live && <ReconnectingNote className="mt-3" />}
      {infoFailed && !info && (
        <p className="mt-3 text-sm text-muted-foreground">Name and market cap unavailable (CoinGecko didn't respond).</p>
      )}
      {info === null && <p className="mt-3 text-sm text-muted-foreground">No extra info available for {coin}.</p>}
    </div>
  );
}
