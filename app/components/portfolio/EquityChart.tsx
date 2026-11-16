import { useEffect, useRef } from "react";
import {
	BaselineSeries,
	createChart,
	LineStyle,
	type IChartApi,
	type IPriceLine,
	type ISeriesApi,
	type UTCTimestamp,
} from "lightweight-charts";
import { evenEquity } from "~/domain/equity";
import { STARTING_BALANCE, type EquityPoint } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { useTheme } from "~/state/theme";
import { chartOptions, themeColor } from "~/utils/chart";

interface Props {
	points: EquityPoint[];
}

// enough for a smooth line; also sets the grid step, e.g. a week of history → hourly points
const MAX_CHART_POINTS = 500;

/** The chart spaces points evenly, so they go on an even time grid first; times in seconds */
const toChartData = (points: EquityPoint[]) =>
	evenEquity(points, MAX_CHART_POINTS).map(({ time, value }) => ({
		time: Math.floor(time / 1000) as UTCTimestamp,
		value,
	}));

// the shared chart look without grid lines
const equityChartOptions = (container: HTMLElement) => ({
	...chartOptions(container),
	grid: { vertLines: { visible: false }, horzLines: { visible: false } },
});

// line only, no fills: green above the starting balance, red below, in the current theme
const lineColors = (container: HTMLElement) => ({
	topLineColor: themeColor(container, "--color-success"),
	bottomLineColor: themeColor(container, "--color-danger"),
	topFillColor1: "transparent",
	topFillColor2: "transparent",
	bottomFillColor1: "transparent",
	bottomFillColor2: "transparent",
});

const startColor = (container: HTMLElement) => ({ color: themeColor(container, "--color-muted-foreground") });

/** Account value over time: green above the starting balance, red below (TradingView Lightweight Charts) */
export default function EquityChart({ points }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const text = useText().equityChart;
	const { theme } = useTheme();
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ISeriesApi<"Baseline"> | null>(null);
	// dotted line at the starting balance
	const startLineRef = useRef<IPriceLine | null>(null);
	// the curve last drawn: zoom to fit on the first draw and when the account is replaced, not on every new point
	const drawnRef = useRef<{ start: number; length: number } | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const chart = createChart(container, equityChartOptions(container));
		chartRef.current = chart;
		const series = chart.addSeries(BaselineSeries, {
			baseValue: { type: "price", price: STARTING_BALANCE },
			...lineColors(container),
			lineWidth: 2,
			// no dashed line across the chart at the latest value
			priceLineVisible: false,
			// whole USDT on the axis, e.g. 10,250
			priceFormat: { type: "price", precision: 0, minMove: 1 },
		});
		seriesRef.current = series;
		startLineRef.current = series.createPriceLine({
			price: STARTING_BALANCE,
			...startColor(container),
			lineWidth: 1,
			lineStyle: LineStyle.Dotted,
			axisLabelVisible: false,
		});

		return () => {
			chartRef.current = null;
			seriesRef.current = null;
			startLineRef.current = null;
			drawnRef.current = null;
			chart.remove();
		};
	}, []);

	useEffect(() => {
		if (!chartRef.current || !seriesRef.current) return;
		seriesRef.current.setData(toChartData(points));
		const start = points[0]?.time ?? 0;
		const drawn = drawnRef.current;
		// a replaced account starts earlier (demo) or has fewer points (reset); the oldest points dropping off
		// past the limit makes it start later with the same count, which keeps the zoom
		if (!drawn || start < drawn.start || points.length < drawn.length) chartRef.current.timeScale().fitContent();
		drawnRef.current = { start, length: points.length };
	}, [points]);

	// the canvas doesn't follow CSS, so a theme change repaints it with the new colours
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		chartRef.current?.applyOptions(equityChartOptions(container));
		seriesRef.current?.applyOptions(lineColors(container));
		startLineRef.current?.applyOptions(startColor(container));
	}, [theme]);

	return (
		<div className="relative h-full w-full">
			<div ref={containerRef} className="h-full w-full" />
			{points.length < 2 && (
				<p className="absolute inset-0 grid place-items-center bg-surface p-4 text-center text-sm text-muted-foreground">
					{text.empty}
				</p>
			)}
		</div>
	);
}
