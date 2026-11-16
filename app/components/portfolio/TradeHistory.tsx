import { useState } from "react";
import { useNavigate } from "react-router";
import Pagination from "~/components/ui/Pagination";
import { QUOTE, type Pair } from "~/data/binance-api";
import type { Trade } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { formatPrice, formatQuantity, formatTime, formatUsdt } from "~/utils/format";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

// rows per page; only these are rendered, so thousands of trades stay fast
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
	const navigate = useNavigate();
	const { common, history } = useText();
	// kept with the search it belongs to, so a new search starts on the first page
	const [paging, setPaging] = useState({ query, page: 0 });

	if (trades.length === 0) return <p className="p-4 text-muted-foreground">{history.empty}</p>;

	// trades are stored oldest first
	const rows = trades.filter((t) => matchesSearch(t.coin, query)).reverse();

	if (rows.length === 0) return <p className="p-4 text-muted-foreground">{history.noMatch(query)}</p>;

	const pageCount = Math.ceil(rows.length / PAGE_SIZE);
	// stays in range if trades were removed, e.g. by a reset
	const page = Math.min(paging.query === query ? paging.page : 0, pageCount - 1);
	const shown = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	// shared cell styles
	const thLeft = "px-4 py-2 text-left font-normal";
	const th = "px-4 py-2 text-right font-normal whitespace-nowrap";
	const td = "px-4 py-2 text-right whitespace-nowrap";

	return (
		<>
			<table className="w-full">
				<thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
					<tr>
						<th className={thLeft}>{history.time}</th>
						<th className={thLeft}>{common.coin}</th>
						<th className={thLeft}>{history.side}</th>
						<th className={th}>{common.price}</th>
						<th className={th}>{common.quantity}</th>
						<th className={th}>{history.total(QUOTE)}</th>
						<th className={th}>{history.fee(QUOTE)}</th>
					</tr>
				</thead>
				<tbody>
					{shown.map((t) => {
						const pair = pairs[t.coin];
						return (
							<tr
								key={t.id}
								onClick={() => navigate(tradePath(t.coin))}
								className="cursor-pointer border-b tabular-nums hover:bg-muted"
							>
								<td className="px-4 py-2 text-left whitespace-nowrap text-muted-foreground">{formatTime(t.time)}</td>
								<td className="px-4 py-2 text-left font-semibold">{t.coin}</td>
								<td className={`px-4 py-2 text-left font-semibold ${t.side === "BUY" ? "text-success" : "text-danger"}`}>
									{common.side[t.side]}
								</td>
								<td className={td}>{formatPrice(t.price, pair?.priceDecimals)}</td>
								<td className={td}>{formatQuantity(t.quantity, pair?.quantityDecimals)}</td>
								<td className={td}>{formatUsdt(t.quantity * t.price)}</td>
								<td className={`${td} text-muted-foreground`}>{formatUsdt(t.fee)}</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<Pagination
				page={page}
				pageSize={PAGE_SIZE}
				total={rows.length}
				onChange={(next) => setPaging({ query, page: next })}
			/>
		</>
	);
}
