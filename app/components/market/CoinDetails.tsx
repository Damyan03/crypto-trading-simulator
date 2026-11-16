import { useEffect, useState } from "react";
import ErrorMessage from "~/components/ui/ErrorMessage";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import Stat from "~/components/ui/Stat";
import { getCoinStats, QUOTE, subscribeCoinStats, type CoinStats, type Pair } from "~/data/binance-api";
import { getCoinInfo, type CoinInfo } from "~/data/coingecko-api";
import { useText } from "~/i18n/language";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";

interface Props {
	pair: Pair;
}

/** Price and 24h stats (Binance) plus general info (CoinGecko) for one coin */
export default function CoinDetails({ pair }: Props) {
	const { coin } = pair;
	const { common, coinDetails } = useText();
	const [stats, setStats] = useState<CoinStats | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// undefined = loading, null = CoinGecko doesn't know the coin
	const [info, setInfo] = useState<CoinInfo | null>();
	const [infoFailed, setInfoFailed] = useState(false);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	// Binance REST: 24h stats right away
	useEffect(() => {
		getCoinStats(pair.symbol).then(setStats).catch(setError);
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
	if (error && !stats) return <ErrorMessage error={error} onRetry={retry} />;
	if (!stats) return <p className="bg-surface p-4 text-muted-foreground">{common.loadingCoin(coin)}</p>;

	// "—" for values CoinGecko doesn't have
	const price = (value: number | null) => (value === null ? "—" : formatPrice(value, pair.priceDecimals));
	const amount = (value: number | null) => (value === null ? "—" : formatVolume(value));

	return (
		<div className="bg-surface px-4 py-3 text-foreground">
			<div className="flex items-center gap-2">
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

			<dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
				<Stat label={coinDetails.high} value={price(stats.highPrice)} />
				<Stat label={coinDetails.low} value={price(stats.lowPrice)} />
				<Stat label={coinDetails.volume(coin)} value={amount(stats.volume)} />
				<Stat label={coinDetails.volume(QUOTE)} value={amount(stats.quoteVolume)} />
				<Stat label={coinDetails.trades} value={amount(stats.trades)} />
				{info && (
					<>
						<Stat label={coinDetails.marketCap} value={amount(info.marketCap)} />
						<Stat label={coinDetails.rank} value={info.rank === null ? "—" : `#${info.rank}`} />
						<Stat label={coinDetails.circulatingSupply} value={amount(info.circulatingSupply)} />
						<Stat label={coinDetails.maxSupply} value={amount(info.maxSupply)} />
						<Stat label={coinDetails.allTimeHigh} value={price(info.ath)} />
					</>
				)}
			</dl>

			{!live && <ReconnectingNote className="mt-2" />}
			{infoFailed && !info && <p className="mt-2 text-sm text-muted-foreground">{coinDetails.infoFailed}</p>}
			{info === null && <p className="mt-2 text-sm text-muted-foreground">{coinDetails.noInfo(coin)}</p>}
		</div>
	);
}
