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
		<div className="flex flex-col items-center justify-center h-full w-full bg-red-500">
			<div className="flex flex-col w-2/3 h-full bg-green-500">
				<div className="items-center justify-center w-full h-2/5 bg-blue-500">
					<PortfolioSummary profile={profile} prices={prices} />
				</div>
				<div className="w-full h-1/4 min-h-0 bg-surface">
					<EquityChart points={profile.equity} />
				</div>
				<div className="flex flex-col flex-1 min-h-0 bg-orange-500">
					<PortfolioTabs active={tab} onChange={setTab} />
					<div className="flex items-center px-4 bg-purple-500 w-full h-1/10">
						<SearchBox value={query} onChange={setQuery} />
					</div>
					<div className="flex-1 min-h-0 overflow-y-auto bg-surface">
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
				</div>
			</div>
		</div>
	);
}
