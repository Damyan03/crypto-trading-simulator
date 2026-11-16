import { useEffect, useRef, useState } from "react";
import {
	CandlestickSeries,
	createChart,
	type IChartApi,
	type ISeriesApi,
	type LogicalRange,
	type UTCTimestamp,
} from "lightweight-charts";
import ErrorMessage from "~/components/ui/ErrorMessage";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import SegmentedControl from "~/components/ui/SegmentedControl";
import type { Candle, CandleInterval, Pair } from "~/data/binance-rest";
import { useText } from "~/i18n/language";
import { useCandles } from "~/state/candles";
import { useTheme } from "~/state/theme";
import { chartOptions, themeColor } from "~/utils/chart";

// candle lengths to pick from
const TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"] as const satisfies readonly CandleInterval[];
type Timeframe = (typeof TIMEFRAMES)[number];

// bars left of the view below which older candles load
const LOAD_EDGE = 50;

interface Props {
	pair: Pair;
}

// a Candle with the chart's timestamp type
const toBar = (candle: Candle) => ({ ...candle, time: candle.time as UTCTimestamp });

// green up, red down, in the current theme
function candleColors(container: HTMLElement) {
	const up = themeColor(container, "--color-success");
	const down = themeColor(container, "--color-danger");
	return { upColor: up, downColor: down, wickUpColor: up, wickDownColor: down };
}

/** Live candlestick chart for one pair (TradingView Lightweight Charts) */
export default function PriceChart({ pair }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
	const text = useText().priceChart;
	const { theme } = useTheme();
	const [timeframe, setTimeframe] = useState<Timeframe>("1h");
	const { candles, error, live, retry, loadOlder } = useCandles(pair.symbol, timeframe);
	// what the series shows: its first candle's start time and the number of candles; null when empty
	const drawnRef = useRef<{ first: number; length: number } | null>(null);

	// the cleanup removes the chart
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const chart = createChart(container, chartOptions(container));
		seriesRef.current = chart.addSeries(CandlestickSeries, {
			...candleColors(container),
			borderVisible: false,
			// the pair's price decimals (from tickSize)
			priceFormat: { type: "price", precision: pair.priceDecimals, minMove: 1 / 10 ** pair.priceDecimals },
		});
		chartRef.current = chart;

		return () => {
			chartRef.current = null;
			seriesRef.current = null;
			drawnRef.current = null;
			chart.remove();
		};
	}, [pair]);

	useEffect(() => {
		const series = seriesRef.current;
		if (!series) return;
		const drawn = drawnRef.current;

		// loading: empty
		if (!candles?.length) {
			series.setData([]);
			drawnRef.current = null;
			return;
		}

		if (drawn?.first === candles[0].time && candles.length - drawn.length <= 1) {
			// live update: the newest candle changed, or a new one started
			series.update(toBar(candles[candles.length - 1]));
		} else {
			// new history (timeframe, retry) or older candles at the start; the view stays put for older ones
			series.setData(candles.map(toBar));
			// new history: latest candles at the default zoom
			if (!drawn) chartRef.current?.timeScale().resetTimeScale();
		}
		drawnRef.current = { first: candles[0].time, length: candles.length };
	}, [candles]);

	// older candles load near the left edge
	const oldest = candles?.[0]?.time;
	useEffect(() => {
		const timeScale = chartRef.current?.timeScale();
		if (!timeScale || oldest === undefined) return;
		const onRangeChange = (range: LogicalRange | null) => {
			if (range && range.from < LOAD_EDGE) loadOlder(oldest);
		};
		timeScale.subscribeVisibleLogicalRangeChange(onRangeChange);
		return () => timeScale.unsubscribeVisibleLogicalRangeChange(onRangeChange);
	}, [oldest, loadOlder]);

	// a theme change repaints the canvas with the new colors
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		chartRef.current?.applyOptions(chartOptions(container));
		seriesRef.current?.applyOptions(candleColors(container));
	}, [theme]);

	return (
		<div className="flex h-full w-full flex-col">
			<SegmentedControl
				options={TIMEFRAMES}
				value={timeframe}
				onChange={setTimeframe}
				label={(t) => text.timeframes[t]}
				className="border-b px-3 py-1 text-xs"
			/>
			<div className="relative min-h-0 flex-1">
				<div ref={containerRef} className="h-full w-full" />
				{!candles && !error && (
					<p className="absolute inset-0 grid place-items-center bg-surface text-muted-foreground">{text.loading}</p>
				)}
				{error && (
					<div className="absolute inset-0 bg-surface">
						<ErrorMessage error={error} onRetry={retry} />
					</div>
				)}
				{!live && <ReconnectingNote className="absolute left-3 top-3" />}
			</div>
		</div>
	);
}
