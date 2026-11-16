import EquityChart from "~/components/portfolio/EquityChart";
import PortfolioPanel from "~/components/portfolio/PortfolioPanel";
import PortfolioSummary from "~/components/portfolio/PortfolioSummary";
import { useEquityRecorder } from "~/state/equity";
import { useLivePrices } from "~/state/live-prices";
import { usePairs } from "~/state/pairs";
import { useProfile } from "~/state/store";

export default function Portfolio() {
	const { profile } = useProfile();
	const livePrices = useLivePrices(Object.keys(profile.holdings));
	useEquityRecorder(livePrices.prices);
	// decimals for formatting; if this fails, formatting falls back to default decimals
	const { pairs = {} } = usePairs();

	return (
		// fills the screen on wide screens (the list scrolls); stacks and scrolls as a page on narrow ones
		<div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 lg:h-full">
			<section className="shrink-0 overflow-hidden border bg-surface">
				<PortfolioSummary profile={profile} prices={livePrices.prices} />
			</section>
			<section className="h-64 shrink-0 overflow-hidden border bg-surface">
				<EquityChart points={profile.equity} />
			</section>
			<section className="flex h-96 flex-col overflow-hidden border bg-surface lg:h-auto lg:min-h-48 lg:flex-1">
				<PortfolioPanel livePrices={livePrices} pairs={pairs} searchable />
			</section>
		</div>
	);
}
