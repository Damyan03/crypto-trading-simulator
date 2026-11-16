import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import ErrorMessage from "~/components/ui/ErrorMessage";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import SegmentedControl from "~/components/ui/SegmentedControl";
import type { Candle, CandleInterval, Pair } from "~/data/binance-api";
import { useText } from "~/i18n/language";
import { useCandles } from "~/state/candles";
import { useTheme } from "~/state/theme";
import { chartOptions, themeColor } from "~/utils/chart";

// candle lengths to pick from; 500 candles each ≈ 5 days, 3 weeks, 3 months, 1.4 years, 10 years
const TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"] as const satisfies readonly CandleInterval[];
type Timeframe = (typeof TIMEFRAMES)[number];

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
	const { candles, latest, error, live, retry } = useCandles(pair.symbol, timeframe);

	// the cleanup removes the chart
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const chart = createChart(container, chartOptions(container));
		seriesRef.current = chart.addSeries(CandlestickSeries, {
			...candleColors(container),
			borderVisible: false,
			// same decimals as the rest of the app (from the pair's tickSize)
			priceFormat: { type: "price", precision: pair.priceDecimals, minMove: 1 / 10 ** pair.priceDecimals },
		});
		chartRef.current = chart;

		return () => {
			chartRef.current = null;
			seriesRef.current = null;
			chart.remove();
		};
	}, [pair]);

	// new history (another timeframe, a retry) replaces every candle; empty while loading
	useEffect(() => {
		seriesRef.current?.setData(candles ? candles.map(toBar) : []);
		if (candles) chartRef.current?.timeScale().fitContent();
	}, [candles]);

	// a live update changes the newest candle, or adds one when a new candle starts
	useEffect(() => {
		if (latest) seriesRef.current?.update(toBar(latest));
	}, [latest]);

	//sets the chart and series colors when the theme changes
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
