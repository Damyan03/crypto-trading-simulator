import { Link } from "react-router";
import Notice from "~/components/ui/Notice";
import { LinkRow, Table, Td, Th } from "~/components/ui/Table";
import { QUOTE, type Pair } from "~/data/binance-api";
import { holdingStats, type Holdings, type Prices } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { changeColor, formatPercent, formatPrice, formatQuantity, formatSignedUsdt, formatUsdt } from "~/utils/format";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

interface Props {
	holdings: Holdings;
	prices: Prices;
	/** Keyed by coin, e.g. "BTC" */
	pairs: Record<string, Pair>;
	/** Search box text */
	query: string;
}

/** Table of owned coins with their value and profit/loss */
export default function HoldingsList({ holdings, prices, pairs, query }: Props) {
	const { common, holdings: holdingsText } = useText();

	if (Object.keys(holdings).length === 0) {
		return (
			<Notice>
				{holdingsText.empty}{" "}
				<Link to="/" className="text-primary hover:underline">
					{holdingsText.discoverLink}
				</Link>
			</Notice>
		);
	}

	// one row per matching coin; stats are null until its price is loaded
	const rows = Object.entries(holdings)
		.filter(([coin]) => matchesSearch(coin, query))
		.map(([coin, holding]) => {
			const price = prices[coin];
			const stats = price === undefined ? null : holdingStats(holding, price);
			return { coin, ...holding, price, stats, pair: pairs[coin] };
		})
		// biggest position first
		.sort((a, b) => (b.stats?.value ?? 0) - (a.stats?.value ?? 0));

	if (rows.length === 0) return <Notice>{holdingsText.noMatch(query)}</Notice>;

	return (
		<Table
			head={
				<>
					<Th align="left">{common.coin}</Th>
					<Th>{common.quantity}</Th>
					<Th>{holdingsText.avgPrice}</Th>
					<Th>{common.price}</Th>
					<Th>{holdingsText.value(QUOTE)}</Th>
					<Th>{common.profitLoss}</Th>
				</>
			}
		>
			{rows.map((r) => (
				<LinkRow key={r.coin} to={tradePath(r.coin)}>
					<Td align="left" className="font-semibold">
						{r.coin}
					</Td>
					<Td>{formatQuantity(r.quantity, r.pair?.quantityDecimals)}</Td>
					<Td>{formatPrice(r.avgPrice, r.pair?.priceDecimals)}</Td>
					<Td>{r.price === undefined ? "…" : formatPrice(r.price, r.pair?.priceDecimals)}</Td>
					<Td>{r.stats ? formatUsdt(r.stats.value) : "…"}</Td>
					<Td className={changeColor(r.stats?.pnl.amount ?? 0)}>
						{r.stats ? `${formatSignedUsdt(r.stats.pnl.amount)} (${formatPercent(r.stats.pnl.percent)})` : "…"}
					</Td>
				</LinkRow>
			))}
		</Table>
	);
}
