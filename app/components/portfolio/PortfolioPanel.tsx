import { useState } from "react";
import ErrorMessage from "~/components/ui/ErrorMessage";
import HoldingsList from "~/components/portfolio/HoldingsList";
import PortfolioTabs, { type PortfolioTab } from "~/components/portfolio/PortfolioTabs";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import SearchBox from "~/components/ui/SearchBox";
import SegmentedControl from "~/components/ui/SegmentedControl";
import TradeHistory from "~/components/portfolio/TradeHistory";
import type { Pair } from "~/data/binance-rest";
import type { Side } from "~/domain/profile";
import { useText } from "~/i18n/language";
import type { LivePrices } from "~/state/live-prices";
import { useProfile } from "~/state/store";

// trade history side filter
const SIDES = ["ALL", "BUY", "SELL"] as const;

interface Props {
	/** The page's live prices; the panel shares their connection */
	livePrices: LivePrices;
	/** Keyed by coin, e.g. "BTC" */
	pairs: Record<string, Pair>;
	/** Shows a search box above the list */
	searchable?: boolean;
	/** Sizes the scrolling list */
	listClassName?: string;
}

/** Holdings and trade history tabs over one scrolling list, as children of a flex column */
export default function PortfolioPanel({
	livePrices,
	pairs,
	searchable = false,
	listClassName = "min-h-0 flex-1",
}: Props) {
	const { profile } = useProfile();
	const { prices, error, live, retry } = livePrices;
	const filter = useText().history.filter;
	const [tab, setTab] = useState<PortfolioTab>("holdings");
	// text in the search box, passed to the list as a filter
	const [query, setQuery] = useState("");
	const [side, setSide] = useState<Side | "ALL">("ALL");

	return (
		<>
			<PortfolioTabs active={tab} onChange={setTab} />
			{(searchable || tab === "history") && (
				<div className="flex items-center gap-3 border-b p-3">
					{searchable && (
						<div className="min-w-0 flex-1">
							<SearchBox value={query} onChange={setQuery} />
						</div>
					)}
					{tab === "history" && (
						<SegmentedControl options={SIDES} value={side} onChange={setSide} label={(s) => filter[s]} className="text-sm" />
					)}
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
					<TradeHistory trades={profile.trades} pairs={pairs} query={query} side={side} />
				)}
			</div>
		</>
	);
}
