import { useState } from "react";
import CoinDetails from "~/components/market/CoinDetails";
import ErrorMessage from "~/components/ui/ErrorMessage";
import HoldingsList from "~/components/portfolio/HoldingsList";
import OrderBook from "~/components/market/OrderBook";
import PortfolioTabs, { type PortfolioTab } from "~/components/portfolio/PortfolioTabs";
import PriceChart from "~/components/market/PriceChart";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import TradeForm from "~/components/trade/TradeForm";
import TradeHistory from "~/components/portfolio/TradeHistory";
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
	const { prices, error: pricesError, live, retry: retryPrices } = useLivePrices(coins);
	useEquityRecorder(prices);
	const [tab, setTab] = useState<PortfolioTab>("holdings");

	// only the error or status until the coin is known to be traded
	if (!pair) {
		return (
			<div className="h-full bg-surface">
				{error ? (
					<ErrorMessage error={error} onRetry={retry} />
				) : (
					<p className="p-4 text-muted-foreground">
						{pair === null ? text.trade.notTraded(coin) : text.common.loadingCoin(coin)}
					</p>
				)}
			</div>
		);
	}

	// key: a new coin starts with fresh state instead of showing the previous coin's data
	return (
		// panels share 1px dividers; fills the screen on wide screens, stacks and scrolls as a page on narrow ones
		// left: coin, chart, holdings/history; right: order book above the trade form, so neither leaves an empty column
		<div className="flex min-h-full flex-col bg-surface lg:h-full lg:flex-row">
			<div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
				<section className="flex flex-col border-b lg:min-h-0 lg:flex-[3]">
					<CoinDetails key={pair.symbol} pair={pair} />
					<div className="h-80 border-t lg:h-auto lg:min-h-0 lg:flex-1">
						<PriceChart key={pair.symbol} pair={pair} />
					</div>
				</section>
				<section className="flex flex-col lg:min-h-48 lg:flex-1">
					<PortfolioTabs active={tab} onChange={setTab} />
					{/* stacked: at most the table header + 3 rows (2rem + 3 × 2.5625rem), the rest scrolls */}
					<div className="max-h-[9.6875rem] overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
						{tab === "holdings" ? (
							<>
								{pricesError && <ErrorMessage error={pricesError} onRetry={retryPrices} />}
								{!live && <ReconnectingNote className="p-4" />}
								<HoldingsList holdings={profile.holdings} prices={prices} pairs={pairs ?? {}} query="" />
							</>
						) : (
							<TradeHistory trades={profile.trades} pairs={pairs ?? {}} query="" />
						)}
					</div>
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
