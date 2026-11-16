import { useEffect, useRef } from "react";
import { BaselineSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { STARTING_BALANCE, type EquityPoint } from "~/domain/profile";
import { useText } from "~/i18n/language";
import { useTheme } from "~/state/theme";
import { chartOptions, themeColor } from "~/utils/chart";

interface Props {
	points: EquityPoint[];
}

/** The chart needs ascending times in seconds, one point each; the last point in a second wins */
function toChartData(points: EquityPoint[]) {
	const bySecond = new Map<number, number>();
	for (const { time, value } of points) bySecond.set(Math.floor(time / 1000), value);
	return [...bySecond].map(([time, value]) => ({ time: time as UTCTimestamp, value }));
}

// green above the starting balance, red below, in the current theme
function equityColors(container: HTMLElement) {
	const color = (variable: string) => themeColor(container, variable);
	return {
		topLineColor: color("--color-success"),
		topFillColor1: color("--color-success-subtle"),
		topFillColor2: color("--color-surface"),
		bottomLineColor: color("--color-danger"),
		bottomFillColor1: color("--color-surface"),
		bottomFillColor2: color("--color-danger-subtle"),
	};
}

/** Account value over time: green above the starting balance, red below (TradingView Lightweight Charts) */
export default function EquityChart({ points }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const text = useText().equityChart;
	const { theme } = useTheme();
	const chartRef = useRef<IChartApi | null>(null);
	const seriesRef = useRef<ISeriesApi<"Baseline"> | null>(null);
	// zoom to fit only the first time, so new points don't reset the user's zoom
	const fittedRef = useRef(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const chart = createChart(container, chartOptions(container));
		chartRef.current = chart;
		seriesRef.current = chart.addSeries(BaselineSeries, {
			baseValue: { type: "price", price: STARTING_BALANCE },
			lineWidth: 2,
			...equityColors(container),
			priceFormat: { type: "price", precision: 2, minMove: 0.01 },
		});

		return () => {
			chartRef.current = null;
			seriesRef.current = null;
			fittedRef.current = false;
			chart.remove();
		};
	}, []);

	useEffect(() => {
		if (!chartRef.current || !seriesRef.current) return;
		seriesRef.current.setData(toChartData(points));
		if (!fittedRef.current) {
			chartRef.current.timeScale().fitContent();
			fittedRef.current = true;
		}
	}, [points]);

	// the canvas doesn't follow CSS, so a theme change repaints it with the new colours
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		chartRef.current?.applyOptions(chartOptions(container));
		seriesRef.current?.applyOptions(equityColors(container));
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
