import ErrorMessage from "~/components/ui/ErrorMessage";
import Notice from "~/components/ui/Notice";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import Stat from "~/components/ui/Stat";
import type { Pair } from "~/data/binance-api";
import { QUOTE } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { useCoinInfo, useCoinStats } from "~/state/coin";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";

interface Props {
	pair: Pair;
}

/** Price and 24h stats (Binance) plus general info (CoinGecko) for one coin */
export default function CoinDetails({ pair }: Props) {
	const { coin } = pair;
	const { common, coinDetails } = useText();
	const { stats, error, live, retry } = useCoinStats(pair.symbol);
	// optional; without it the CoinGecko stats are left out
	const { info, failed: infoFailed } = useCoinInfo(coin);

	// the error shows only while there are no stats; the stream can still deliver them
	if (error && !stats) return <ErrorMessage error={error} onRetry={retry} />;
	if (!stats) return <Notice>{common.loadingCoin(coin)}</Notice>;

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
