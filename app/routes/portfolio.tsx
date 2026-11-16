import { useState } from "react";
import EquityChart from "~/components/portfolio/EquityChart";
import ErrorMessage from "~/components/ui/ErrorMessage";
import HoldingsList from "~/components/portfolio/HoldingsList";
import PortfolioSummary from "~/components/portfolio/PortfolioSummary";
import PortfolioTabs, { type PortfolioTab } from "~/components/portfolio/PortfolioTabs";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import SearchBox from "~/components/ui/SearchBox";
import TradeHistory from "~/components/portfolio/TradeHistory";
import { useEquityRecorder } from "~/state/equity";
import { useLivePrices } from "~/state/live-prices";
import { usePairs } from "~/state/pairs";
import { useProfile } from "~/state/store";

export default function Portfolio() {
	const { profile } = useProfile();
	const { prices, error, live, retry } = useLivePrices(Object.keys(profile.holdings));
	useEquityRecorder(prices);
	// decimals for formatting; if this fails, formatting falls back to default decimals
	const { pairs = {} } = usePairs();
	// text in the search box, passed to the table as a filter
	const [query, setQuery] = useState("");
	const [tab, setTab] = useState<PortfolioTab>("holdings");

	return (
		// fills the screen on wide screens (the list scrolls); stacks and scrolls as a page on narrow ones
		<div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 lg:h-full">
			<section className="shrink-0 overflow-hidden border bg-surface">
				<PortfolioSummary profile={profile} prices={prices} />
			</section>
			<section className="h-64 shrink-0 overflow-hidden border bg-surface">
				<EquityChart points={profile.equity} />
			</section>
			<section className="flex h-96 flex-col overflow-hidden border bg-surface lg:h-auto lg:min-h-48 lg:flex-1">
				<PortfolioTabs active={tab} onChange={setTab} />
				<div className="border-b p-3">
					<SearchBox value={query} onChange={setQuery} />
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{tab === "holdings" ? (
						<>
							{error && <ErrorMessage error={error} onRetry={retry} />}
							{!live && <ReconnectingNote className="p-4" />}
							<HoldingsList holdings={profile.holdings} prices={prices} pairs={pairs} query={query} />
						</>
					) : (
						<TradeHistory trades={profile.trades} pairs={pairs} query={query} />
					)}
				</div>
			</section>
		</div>
	);
}
