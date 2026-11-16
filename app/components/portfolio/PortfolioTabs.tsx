import { useText } from "~/i18n/language";

export type PortfolioTab = "holdings" | "history";

const TABS: PortfolioTab[] = ["holdings", "history"];

interface Props {
	active: PortfolioTab;
	onChange: (tab: PortfolioTab) => void;
}

/** Switches between current holdings and past trades */
export default function PortfolioTabs({ active, onChange }: Props) {
	const labels = useText().portfolio.tabs;
	return (
		<div className="flex gap-4 border-b bg-surface px-4">
			{TABS.map((tab) => (
				<button
					key={tab}
					type="button"
					onClick={() => onChange(tab)}
					className={`-mb-px border-b-2 py-2 text-sm font-semibold ${
						tab === active
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					{labels[tab]}
				</button>
			))}
		</div>
	);
}
