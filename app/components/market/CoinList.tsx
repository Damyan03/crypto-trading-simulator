import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ErrorMessage from "~/components/ui/ErrorMessage";
import Pagination from "~/components/ui/Pagination";
import { getMarkets, QUOTE, type Market } from "~/data/binance-api";
import { useText } from "~/i18n/language";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

// most traded first
const byVolume = (a: Market, b: Market) => b.quoteVolume - a.quoteVolume;

// rows per page; Binance lists a few hundred USDT pairs
const PAGE_SIZE = 25;

interface Props {
	/** Search box text */
	query: string;
}

/** All USDT pairs with price, 24h change and volume */
export default function CoinList({ query }: Props) {
	const navigate = useNavigate();
	const { common, coinList } = useText();
	const [markets, setMarkets] = useState<Market[] | null>(null);
	const [error, setError] = useState<Error | null>(null);
	// changing this reruns the effect, i.e. loads again
	const [attempt, setAttempt] = useState(0);
	// kept with the search it belongs to, so a new search starts on the first page
	const [paging, setPaging] = useState({ query, page: 0 });

	useEffect(() => {
		getMarkets().then(setMarkets).catch(setError);
	}, [attempt]);

	// sorts a copy, only when the data changes
	const sorted = useMemo(() => markets && [...markets].sort(byVolume), [markets]);
	// only the coins matching the search
	const visible = sorted ? sorted.filter((m) => matchesSearch(m.coin, query)) : null;

	const pageCount = Math.max(1, Math.ceil((visible?.length ?? 0) / PAGE_SIZE));
	// stays in range if the list got shorter, e.g. after reloading it
	const page = Math.min(paging.query === query ? paging.page : 0, pageCount - 1);
	const shown = visible?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];

	const retry = () => {
		setError(null);
		setAttempt((a) => a + 1);
	};

	// shared cell styles
	const th = "px-4 py-2 text-right font-normal whitespace-nowrap";
	const td = "px-4 py-2 text-right whitespace-nowrap";

	return (
		<div className="h-full overflow-y-auto bg-surface text-foreground">
			{!sorted && !error && <p className="p-4 text-muted-foreground">{coinList.loading}</p>}
			{sorted?.length === 0 && <p className="p-4 text-muted-foreground">{coinList.empty}</p>}
			{sorted && sorted.length > 0 && visible?.length === 0 && (
				<p className="p-4 text-muted-foreground">{coinList.noMatch(query)}</p>
			)}
			{error && <ErrorMessage error={error} onRetry={retry} />}

			{visible && visible.length > 0 && (
				<>
					<table className="w-full">
						<thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
							<tr>
								<th className="w-full px-4 py-2 text-left font-normal">{common.coin}</th>
								<th className={th}>{common.price}</th>
								<th className={th}>{coinList.change}</th>
								<th className={th}>{coinList.volume}</th>
							</tr>
						</thead>
						<tbody>
							{shown.map((m) => (
								<tr
									key={m.symbol}
									onClick={() => navigate(tradePath(m.coin))}
									className="cursor-pointer border-b tabular-nums hover:bg-muted"
								>
									<td className="px-4 py-2 text-left">
										<span className="font-semibold">{m.coin}</span>
										<span className="ml-2 text-sm text-muted-foreground">/{QUOTE}</span>
									</td>
									<td className={td}>{formatPrice(m.lastPrice, m.priceDecimals)}</td>
									<td className={`${td} ${changeColor(m.priceChangePercent)}`}>{formatPercent(m.priceChangePercent)}</td>
									<td className={`${td} text-muted-foreground`}>{formatVolume(m.quoteVolume)}</td>
								</tr>
							))}
						</tbody>
					</table>
					<Pagination
						page={page}
						pageSize={PAGE_SIZE}
						total={visible.length}
						onChange={(next) => setPaging({ query, page: next })}
					/>
				</>
			)}
		</div>
	);
}
