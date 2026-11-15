import { useState } from "react";
import ErrorMessage from "~/components/ErrorMessage";
import HoldingsList from "~/components/HoldingsList";
import PortfolioSummary from "~/components/PortfolioSummary";
import ReconnectingNote from "~/components/ReconnectingNote";
import SearchBox from "~/components/SearchBox";
import { useLivePrices } from "~/state/live-prices";
import { usePairs } from "~/state/pairs";
import { useProfile } from "~/state/store";

export default function Portfolio() {
  const { profile } = useProfile();
  const { prices, error, live, retry } = useLivePrices(Object.keys(profile.holdings));
  // decimals for formatting; if this fails, formatting falls back to default decimals
  const { pairs = {} } = usePairs();
  // text in the search box, passed to the table as a filter
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-red-500">
      <div className="flex flex-col w-2/3 h-full bg-green-500">
        <div className="items-center justify-center w-full h-2/5 bg-blue-500">
          <PortfolioSummary profile={profile} prices={prices} />
        </div>
        <div className="flex flex-col flex-1 min-h-0 bg-orange-500">
          <div className="p-4 bg-emerald-500 w-full h-1/10">active / history</div>
          <div className="flex items-center px-4 bg-purple-500 w-full h-1/10">
            <SearchBox value={query} onChange={setQuery} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-surface">
            {error && <ErrorMessage message={error} onRetry={retry} />}
            {!live && <ReconnectingNote className="p-4" />}
            <HoldingsList holdings={profile.holdings} prices={prices} pairs={pairs} query={query} />
          </div>
        </div>
      </div>
    </div>
  );
}
