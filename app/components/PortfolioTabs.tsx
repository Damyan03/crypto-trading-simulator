export type PortfolioTab = "holdings" | "history";

const LABELS: Record<PortfolioTab, string> = { holdings: "Holdings", history: "Trade history" };

interface Props {
  active: PortfolioTab;
  onChange: (tab: PortfolioTab) => void;
}

/** Switches between current holdings and past trades */
export default function PortfolioTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-4 border-b bg-surface px-4">
      {(Object.keys(LABELS) as PortfolioTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`-mb-px border-b-2 py-2 text-sm font-semibold ${
            tab === active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
