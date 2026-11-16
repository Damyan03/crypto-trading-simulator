import { useState } from "react";
import ErrorMessage from "~/components/ui/ErrorMessage";
import HoldingsList from "~/components/portfolio/HoldingsList";
import PortfolioTabs, { type PortfolioTab } from "~/components/portfolio/PortfolioTabs";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import SearchBox from "~/components/ui/SearchBox";
import TradeHistory from "~/components/portfolio/TradeHistory";
import type { Pair } from "~/data/binance-rest";
import type { LivePrices } from "~/state/live-prices";
import { useProfile } from "~/state/store";

interface Props {
	/** The page's live prices, so the panel shares their connection */
	livePrices: LivePrices;
	/** Keyed by coin, e.g. "BTC" */
	pairs: Record<string, Pair>;
	/** Shows a search box above the list */
	searchable?: boolean;
	/** Sizes the scrolling list */
	listClassName?: string;
}

/** Holdings and trade history tabs over one scrolling list; place inside a flex column */
export default function PortfolioPanel({
	livePrices,
	pairs,
	searchable = false,
	listClassName = "min-h-0 flex-1",
}: Props) {
	const { profile } = useProfile();
	const { prices, error, live, retry } = livePrices;
	const [tab, setTab] = useState<PortfolioTab>("holdings");
	// text in the search box, passed to the list as a filter
	const [query, setQuery] = useState("");

	return (
		<>
			<PortfolioTabs active={tab} onChange={setTab} />
			{searchable && (
				<div className="border-b p-3">
					<SearchBox value={query} onChange={setQuery} />
				</div>
			)}
			<div className={`overflow-y-auto ${listClassName}`}>
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
		</>
	);
}
