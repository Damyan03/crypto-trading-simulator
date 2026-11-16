import Stat from "~/components/Stat";
import { QUOTE } from "~/data/binance-api";
import { profitLoss, totalValue, type Prices, type Profile } from "~/domain/profile";
import { changeColor, formatPercent, formatSignedUsdt, formatUsdt } from "~/utils/format";

interface Props {
	profile: Profile;
	prices: Prices;
}

/** Total value, cash, holdings value and profit/loss */
export default function PortfolioSummary({ profile, prices }: Props) {
	// null until prices for all holdings are loaded; shown as "…"
	const total = totalValue(profile, prices);
	const pnl = total === null ? null : profitLoss(total);

	return (
		<dl className="grid h-full grid-cols-2 content-center gap-6 bg-surface p-6 text-xl text-foreground md:grid-cols-4">
			<Stat label="Total value" value={total === null ? "…" : `${formatUsdt(total)} ${QUOTE}`} />
			<Stat label="Cash" value={`${formatUsdt(profile.balance)} ${QUOTE}`} />
			<Stat label="Holdings" value={total === null ? "…" : `${formatUsdt(total - profile.balance)} ${QUOTE}`} />
			<Stat
				label="Profit / loss"
				value={pnl ? `${formatSignedUsdt(pnl.amount)} ${QUOTE} (${formatPercent(pnl.percent)})` : "…"}
				className={changeColor(pnl?.amount ?? 0)}
			/>
		</dl>
	);
}
