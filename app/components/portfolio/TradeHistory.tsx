import Notice from "~/components/ui/Notice";
import Pagination from "~/components/ui/Pagination";
import { LinkRow, Table, Td, Th } from "~/components/ui/Table";
import type { Pair } from "~/data/binance-api";
import { QUOTE, type Trade } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { formatPrice, formatQuantity, formatTime, formatUsdt } from "~/utils/format";
import { usePage } from "~/utils/pagination";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

// rows per page; only the current page is rendered
const PAGE_SIZE = 20;

interface Props {
	trades: Trade[];
	/** Keyed by coin, e.g. "BTC" */
	pairs: Record<string, Pair>;
	/** Search box text */
	query: string;
}

/** Table of past trades, newest first, a page at a time */
export default function TradeHistory({ trades, pairs, query }: Props) {
	const { common, history } = useText();
	// trades are stored oldest first
	const rows = trades.filter((t) => matchesSearch(t.coin, query)).reverse();
	const { shown, pagination } = usePage(rows, PAGE_SIZE, query);

	if (trades.length === 0) return <Notice>{history.empty}</Notice>;
	if (rows.length === 0) return <Notice>{history.noMatch(query)}</Notice>;

	return (
		<>
			<Table
				head={
					<>
						<Th align="left">{history.time}</Th>
						<Th align="left">{common.coin}</Th>
						<Th align="left">{history.side}</Th>
						<Th>{common.price}</Th>
						<Th>{common.quantity}</Th>
						<Th>{history.total(QUOTE)}</Th>
						<Th>{history.fee(QUOTE)}</Th>
					</>
				}
			>
				{shown.map((t) => {
					const pair = pairs[t.coin];
					return (
						<LinkRow key={t.id} to={tradePath(t.coin)}>
							<Td align="left" className="text-muted-foreground">
								{formatTime(t.time)}
							</Td>
							<Td align="left" className="font-semibold">
								{t.coin}
							</Td>
							<Td align="left" className={`font-semibold ${t.side === "BUY" ? "text-success" : "text-danger"}`}>
								{common.side[t.side]}
							</Td>
							<Td>{formatPrice(t.price, pair?.priceDecimals)}</Td>
							<Td>{formatQuantity(t.quantity, pair?.quantityDecimals)}</Td>
							<Td>{formatUsdt(t.quantity * t.price)}</Td>
							<Td className="text-muted-foreground">{formatUsdt(t.fee)}</Td>
						</LinkRow>
					);
				})}
			</Table>
			<Pagination {...pagination} />
		</>
	);
}
