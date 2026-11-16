import { useMemo } from "react";
import ErrorMessage from "~/components/ui/ErrorMessage";
import Notice from "~/components/ui/Notice";
import Pagination from "~/components/ui/Pagination";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import { LinkRow, Table, Td, Th } from "~/components/ui/Table";
import type { Market } from "~/data/binance-rest";
import { QUOTE } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { useLiveTickers, useMarkets } from "~/state/markets";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";
import { usePage } from "~/utils/pagination";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

// most traded first
const byVolume = (a: Market, b: Market) => b.quoteVolume - a.quoteVolume;

// rows per page
const PAGE_SIZE = 25;

interface Props {
	/** Search box text */
	query: string;
}

/** All USDT pairs with price, 24h change and volume; the coins on screen update live */
export default function CoinList({ query }: Props) {
	const { common, coinList } = useText();
	const { markets, error, retry } = useMarkets();

	// sorts a copy, only when the data changes
	const sorted = useMemo(() => markets && [...markets].sort(byVolume), [markets]);
	// only the coins matching the search
	const visible = sorted ? sorted.filter((m) => matchesSearch(m.coin, query)) : null;
	const { shown: pageMarkets, pagination } = usePage(visible ?? [], PAGE_SIZE, query);

	// live stats for the coins on screen only, drawn over the loaded ones; the order stays put
	const { tickers, live } = useLiveTickers(pageMarkets.map((m) => m.coin));
	const shown = pageMarkets.map((m) => ({ ...m, ...tickers[m.symbol] }));

	return (
		<div className="h-full overflow-y-auto bg-surface text-foreground">
			{!sorted && !error && <Notice>{coinList.loading}</Notice>}
			{sorted?.length === 0 && <Notice>{coinList.empty}</Notice>}
			{sorted && sorted.length > 0 && visible?.length === 0 && <Notice>{coinList.noMatch(query)}</Notice>}
			{error && <ErrorMessage error={error} onRetry={retry} />}
			{!live && <ReconnectingNote className="px-4 py-2" />}

			{shown.length > 0 && (
				<>
					<Table
						head={
							<>
								<Th align="left" className="w-full">
									{common.coin}
								</Th>
								<Th>{common.price}</Th>
								<Th>{coinList.change}</Th>
								<Th>{coinList.volume}</Th>
							</>
						}
					>
						{shown.map((m) => (
							<LinkRow key={m.symbol} to={tradePath(m.coin)}>
								<Td align="left">
									<span className="font-semibold">{m.coin}</span>
									<span className="ml-2 text-sm text-muted-foreground">/{QUOTE}</span>
								</Td>
								<Td>{formatPrice(m.lastPrice, m.priceDecimals)}</Td>
								<Td className={changeColor(m.priceChangePercent)}>{formatPercent(m.priceChangePercent)}</Td>
								<Td className="text-muted-foreground">{formatVolume(m.quoteVolume)}</Td>
							</LinkRow>
						))}
					</Table>
					<Pagination {...pagination} />
				</>
			)}
		</div>
	);
}
