import { useEffect, useMemo, useState } from "react";
import ErrorMessage from "~/components/ui/ErrorMessage";
import Notice from "~/components/ui/Notice";
import Pagination from "~/components/ui/Pagination";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import { LinkRow, Table, Td, Th } from "~/components/ui/Table";
import { getMarkets, QUOTE, subscribeTickers, type Market, type Ticker } from "~/data/binance-api";
import { useText } from "~/i18n/language";
import { changeColor, formatPercent, formatPrice, formatVolume } from "~/utils/format";
import { usePage } from "~/utils/pagination";
import { tradePath } from "~/utils/paths";
import { matchesSearch } from "~/utils/search";

// most traded first
const byVolume = (a: Market, b: Market) => b.quoteVolume - a.quoteVolume;

// rows per page; Binance lists a few hundred USDT pairs
const PAGE_SIZE = 25;

// paging or typing quickly waits this long before reconnecting, instead of opening a connection per step
const SUBSCRIBE_DELAY = 300;

interface Props {
	/** Search box text */
	query: string;
}

/** All USDT pairs with price, 24h change and volume; the coins on screen update live */
export default function CoinList({ query }: Props) {
	const { common, coinList } = useText();
	const [markets, setMarkets] = useState<Market[] | null>(null);
	const [error, setError] = useState<Error | null>(null);
	// changing this reruns the effect, i.e. loads again
	const [attempt, setAttempt] = useState(0);
	// newest stats from the stream, by symbol; drawn over the loaded list, whose order stays put
	const [tickers, setTickers] = useState<Record<string, Ticker>>({});
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);

	useEffect(() => {
		getMarkets().then(setMarkets).catch(setError);
	}, [attempt]);

	// sorts a copy, only when the data changes
	const sorted = useMemo(() => markets && [...markets].sort(byVolume), [markets]);
	// only the coins matching the search
	const visible = sorted ? sorted.filter((m) => matchesSearch(m.coin, query)) : null;
	const { shown: pageMarkets, pagination } = usePage(visible ?? [], PAGE_SIZE, query);
	const shown = pageMarkets.map((m) => ({ ...m, ...tickers[m.symbol] }));

	// e.g. "BTC,ETH"; a string so the stream only changes when the coins on screen do
	const shownCoins = shown.map((m) => m.coin).join(",");

	// live stats for the coins on screen only; the cleanup closes the connection
	useEffect(() => {
		if (!shownCoins) return;
		let unsubscribe = () => {};
		const timer = setTimeout(() => {
			unsubscribe = subscribeTickers(
				shownCoins.split(","),
				(ticker) => setTickers((prev) => ({ ...prev, [ticker.symbol]: ticker })),
				setLive,
			);
		}, SUBSCRIBE_DELAY);
		return () => {
			clearTimeout(timer);
			unsubscribe();
		};
	}, [shownCoins]);

	const retry = () => {
		setError(null);
		setAttempt((a) => a + 1);
	};

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
