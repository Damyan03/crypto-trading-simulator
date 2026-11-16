import Stat from "~/components/ui/Stat";
import { QUOTE } from "~/data/binance-api";
import { holdingsValue, profitLoss, totalValue, type Prices, type Profile } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { changeColor, formatPercent, formatSignedUsdt, formatUsdt } from "~/utils/format";

interface Props {
	profile: Profile;
	prices: Prices;
}

/** Total value, cash, holdings value and profit/loss */
export default function PortfolioSummary({ profile, prices }: Props) {
	const { common, portfolio } = useText();
	// null until prices for all holdings are loaded; shown as "…"
	const total = totalValue(profile, prices);
	const holdings = holdingsValue(profile.holdings, prices);
	const pnl = total === null ? null : profitLoss(total);

	return (
		<dl className="grid grid-cols-2 gap-6 bg-surface p-6 text-xl text-foreground md:grid-cols-4">
			<Stat label={portfolio.totalValue} value={total === null ? "…" : `${formatUsdt(total)} ${QUOTE}`} />
			<Stat label={portfolio.cash} value={`${formatUsdt(profile.balance)} ${QUOTE}`} />
			<Stat label={portfolio.holdings} value={holdings === null ? "…" : `${formatUsdt(holdings)} ${QUOTE}`} />
			<Stat
				label={common.profitLoss}
				value={pnl ? `${formatSignedUsdt(pnl.amount)} ${QUOTE} (${formatPercent(pnl.percent)})` : "…"}
				className={changeColor(pnl?.amount ?? 0)}
			/>
		</dl>
	);
}
