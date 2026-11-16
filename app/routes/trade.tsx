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
import { useEquityRecorder } from "~/state/equity";
import { useLivePrices } from "~/state/live-prices";
import { usePairs } from "~/state/pairs";
import { useProfile } from "~/state/store";
import type { Route } from "./+types/trade";

export default function Trade({ params }: Route.ComponentProps) {
	// "/trade/btc" → "BTC"
	const coin = params.coin.toUpperCase();
	const { profile } = useProfile();
	const { pairs, error, retry } = usePairs();
	// undefined = loading, null = not traded here
	const pair = pairs && (pairs[coin] ?? null);

	// held coins plus this one (once it's known to be traded), on one live connection
	const held = Object.keys(profile.holdings);
	const coins = pair && !held.includes(coin) ? [...held, coin] : held;
	const { prices, error: pricesError, live, retry: retryPrices } = useLivePrices(coins);
	useEquityRecorder(prices);
	const [tab, setTab] = useState<PortfolioTab>("holdings");

	return (
		<div className="flex h-full w-full bg-red-500">
			<div className="flex flex-col w-9/12 h-full bg-green-500">
				<div className="flex w-full h-9/12 bg-blue-500">
					<div className="flex flex-col w-4/5 bg-yellow-500 h-full">
						<div className="w-full bg-green-500">
							{error && <ErrorMessage message={error} onRetry={retry} />}
							{!error && pair === undefined && <p className="bg-surface p-4 text-muted-foreground">Loading {coin}…</p>}
							{pair === null && <p className="bg-surface p-4 text-muted-foreground">{coin} isn't traded on this platform.</p>}
							{/* key: a new coin starts with fresh state instead of showing the previous coin's data */}
							{pair && <CoinDetails key={pair.symbol} pair={pair} />}
						</div>
						<div className="bg-orange-500 flex-1 min-h-0">{pair && <PriceChart key={pair.symbol} pair={pair} />}</div>
					</div>
					<div className="flex-1 min-w-0 bg-cyan-500 h-full">
						{pair && <OrderBook key={pair.symbol} pair={pair} price={prices[coin]} />}
					</div>
				</div>
				<div className="flex flex-col flex-1 min-h-0 bg-surface">
					<PortfolioTabs active={tab} onChange={setTab} />
					<div className="flex-1 min-h-0 overflow-y-auto">
						{tab === "holdings" ? (
							<>
								{pricesError && <ErrorMessage message={pricesError} onRetry={retryPrices} />}
								{!live && <ReconnectingNote className="p-4" />}
								<HoldingsList holdings={profile.holdings} prices={prices} pairs={pairs ?? {}} query="" />
							</>
						) : (
							<TradeHistory trades={profile.trades} pairs={pairs ?? {}} query="" />
						)}
					</div>
				</div>
			</div>
			<div className="flex-1 bg-amber-500">{pair && <TradeForm key={pair.symbol} pair={pair} price={prices[coin]} />}</div>
		</div>
	);
}
