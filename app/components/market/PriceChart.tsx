import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import ErrorMessage from "~/components/ui/ErrorMessage";
import ReconnectingNote from "~/components/ui/ReconnectingNote";
import SegmentedControl from "~/components/ui/SegmentedControl";
import { getCandles, subscribeCandles, type Candle, type CandleInterval, type Pair } from "~/data/binance-api";
import { useText } from "~/i18n/language";
import { useTheme } from "~/state/theme";
import { chartOptions, themeColor } from "~/utils/chart";

// candle lengths to pick from; 500 candles each ≈ 5 days, 3 weeks, 3 months, 1.4 years, 10 years
const TIMEFRAMES = ["15m", "1h", "4h", "1d", "1w"] as const satisfies readonly CandleInterval[];
type Timeframe = (typeof TIMEFRAMES)[number];

interface Props {
	pair: Pair;
}

// the chart wants its own timestamp type
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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [attempt, setAttempt] = useState(0);
	// false while the live connection is down and reconnecting
	const [live, setLive] = useState(true);
	const [timeframe, setTimeframe] = useState<Timeframe>("1h");

	// a new timeframe builds a new chart with its own candles and stream
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const chart = createChart(container, chartOptions(container));
		const series = chart.addSeries(CandlestickSeries, {
			...candleColors(container),
			borderVisible: false,
			// same decimals as the rest of the app (from the pair's tickSize)
			priceFormat: { type: "price", precision: pair.priceDecimals, minMove: 1 / 10 ** pair.priceDecimals },
		});
		chartRef.current = chart;
		seriesRef.current = series;

		// the chart can't be used after chart.remove(), so late responses must be ignored
		let disposed = false;
		let unsubscribe = () => {};

		getCandles(pair.symbol, timeframe)
			.then((candles) => {
				if (disposed) return;
				series.setData(candles.map(toBar));
				chart.timeScale().fitContent();
				setLoading(false);
				// live updates only after the history is drawn
				unsubscribe = subscribeCandles(pair.symbol, timeframe, (candle) => series.update(toBar(candle)), setLive);
			})
			.catch((e: Error) => {
				if (!disposed) setError(e);
			});

		return () => {
			disposed = true;
			unsubscribe();
			chartRef.current = null;
			seriesRef.current = null;
			chart.remove();
		};
	}, [pair, attempt, timeframe]);

	//sets the chart and series colors when the theme changes
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		chartRef.current?.applyOptions(chartOptions(container));
		seriesRef.current?.applyOptions(candleColors(container));
	}, [theme]);

	const retry = () => {
		setError(null);
		setLoading(true);
		setAttempt((a) => a + 1);
	};

	const pickTimeframe = (next: Timeframe) => {
		setError(null);
		setLoading(true);
		setTimeframe(next);
	};

	return (
		<div className="flex h-full w-full flex-col">
			<SegmentedControl
				options={TIMEFRAMES}
				value={timeframe}
				onChange={pickTimeframe}
				label={(t) => text.timeframes[t]}
				className="border-b px-3 py-1 text-xs"
			/>
			<div className="relative min-h-0 flex-1">
				<div ref={containerRef} className="h-full w-full" />
				{loading && !error && (
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
