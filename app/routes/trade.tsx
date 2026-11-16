import CoinDetails from "~/components/market/CoinDetails";
import ErrorMessage from "~/components/ui/ErrorMessage";
import Notice from "~/components/ui/Notice";
import OrderBook from "~/components/market/OrderBook";
import PortfolioPanel from "~/components/portfolio/PortfolioPanel";
import PriceChart from "~/components/market/PriceChart";
import TradeForm from "~/components/trade/TradeForm";
import { useText } from "~/i18n/language";
import { useEquityRecorder } from "~/state/equity";
import { useLivePrices } from "~/state/live-prices";
import { usePairs } from "~/state/pairs";
import { useProfile } from "~/state/store";
import type { Route } from "./+types/trade";

export default function Trade({ params }: Route.ComponentProps) {
	// "/trade/btc" → "BTC"
	const coin = params.coin.toUpperCase();
	const { profile } = useProfile();
	const text = useText();
	const { pairs, error, retry } = usePairs();
	// undefined = loading, null = not traded here
	const pair = pairs && (pairs[coin] ?? null);

	// held coins plus this one (once it's known to be traded), on one live connection
	const held = Object.keys(profile.holdings);
	const coins = pair && !held.includes(coin) ? [...held, coin] : held;
	const livePrices = useLivePrices(coins);
	const { prices } = livePrices;
	useEquityRecorder(prices);

	// only the error or status until the coin is known to be traded
	if (!pair) {
		return (
			<div className="h-full bg-surface">
				{error ? (
					<ErrorMessage error={error} onRetry={retry} />
				) : (
					<Notice>{pair === null ? text.trade.notTraded(coin) : text.common.loadingCoin(coin)}</Notice>
				)}
			</div>
		);
	}

	// key: a new coin remounts with fresh state
	return (
		// panels share 1px dividers; fills the screen on wide screens, stacks and scrolls as a page on narrow ones
		// left: coin, chart, holdings/history; right: order book above the trade form
		<div className="flex min-h-full flex-col bg-surface lg:h-full lg:flex-row">
			<div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
				<section className="flex flex-col border-b lg:min-h-0 lg:flex-3">
					<CoinDetails key={pair.symbol} pair={pair} />
					<div className="h-80 border-t lg:h-auto lg:min-h-0 lg:flex-1">
						<PriceChart key={pair.symbol} pair={pair} />
					</div>
				</section>
				<section className="flex flex-col lg:min-h-48 lg:flex-1">
					{/* stacked: at most the table header + 3 rows (2rem + 3 × 2.5625rem), the rest scrolls */}
					<PortfolioPanel
						livePrices={livePrices}
						pairs={pairs ?? {}}
						listClassName="max-h-38.75 lg:max-h-none lg:min-h-0 lg:flex-1"
					/>
				</section>
			</div>
			<aside className="flex flex-col border-t lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0">
				<div className="h-96 lg:h-auto lg:min-h-0 lg:flex-1">
					<OrderBook key={pair.symbol} pair={pair} price={prices[coin]} />
				</div>
				<div className="border-t">
					<TradeForm key={pair.symbol} pair={pair} price={prices[coin]} />
				</div>
			</aside>
		</div>
	);
}
