import { useEffect, useState } from "react";
import ErrorMessage from "~/components/ErrorMessage";
import HoldingsList from "~/components/HoldingsList";
import PortfolioSummary from "~/components/PortfolioSummary";
import { getPrices, getTradingPairs, type Pair } from "~/data/api";
import type { Prices } from "~/domain/profile";
import { useProfile } from "~/state/store";

export default function Portfolio() {
  const { profile } = useProfile();
  const [prices, setPrices] = useState<Prices>({});
  const [pairs, setPairs] = useState<Record<string, Pair>>({});
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // e.g. "BTC,ETH"; a string so the effects only rerun when the coins change
  const coins = Object.keys(profile.holdings).join(",");

  // prices of the coins you hold
  useEffect(() => {
    if (!coins) return;
    setError(null);
    getPrices(coins.split(","))
      .then(setPrices)
      .catch((e: Error) => setError(e.message));
  }, [coins, attempt]);

  // decimals for formatting each coin (cached after the first load)
  useEffect(() => {
    if (!coins) return;
    getTradingPairs()
      .then((list) => setPairs(Object.fromEntries(list.map((p) => [p.coin, p]))))
      .catch(() => {}); // formatting falls back to default decimals
  }, [coins]);

  // reruns the prices effect
  const retry = () => setAttempt((a) => a + 1);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-red-500">
      <div className="flex flex-col w-2/3 h-full bg-green-500">
        <div className="items-center justify-center w-full h-2/5 bg-blue-500">
          <PortfolioSummary profile={profile} prices={prices} />
        </div>
        <div className="flex flex-col flex-1 min-h-0 bg-orange-500">
          <div className="p-4 bg-emerald-500 w-full h-1/10">active / history</div>
          <div className="p-4 bg-purple-500 w-full h-1/10">search N Filter</div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-surface">
            {error && <ErrorMessage message={error} onRetry={retry} />}
            <HoldingsList holdings={profile.holdings} prices={prices} pairs={pairs} />
          </div>
        </div>
      </div>
    </div>
  );
}
