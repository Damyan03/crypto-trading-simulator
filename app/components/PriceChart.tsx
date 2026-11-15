import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import ErrorMessage from "~/components/ErrorMessage";
import { getCandles, subscribeCandles, type Candle, type Pair } from "~/data/binance-api";

// 500 one-hour candles ≈ the last 3 weeks
const INTERVAL = "1h";

interface Props {
  pair: Pair;
}

/** Resolves a theme colour, e.g. "--color-success", to a plain colour the chart's canvas understands */
function themeColor(element: HTMLElement, variable: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${variable})`;
  element.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

// the chart wants its own timestamp type
const toBar = (candle: Candle) => ({ ...candle, time: candle.time as UTCTimestamp });

/** Live candlestick chart for one pair (TradingView Lightweight Charts) */
export default function PriceChart({ pair }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // false while the live connection is down and reconnecting
  const [live, setLive] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const color = (variable: string) => themeColor(container, variable);

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: color("--color-surface") },
        textColor: color("--color-muted-foreground"),
        // TradingView link on the chart, required by the library's licence
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: color("--color-chart-grid") },
        horzLines: { color: color("--color-chart-grid") },
      },
      timeScale: { timeVisible: true },
    });

    const up = color("--color-success");
    const down = color("--color-danger");
    const series = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      wickUpColor: up,
      wickDownColor: down,
      borderVisible: false,
      // same decimals as the rest of the app (from the pair's tickSize)
      priceFormat: { type: "price", precision: pair.priceDecimals, minMove: 1 / 10 ** pair.priceDecimals },
    });

    // the chart can't be used after chart.remove(), so late responses must be ignored
    let disposed = false;
    let unsubscribe = () => {};

    getCandles(pair.symbol, INTERVAL)
      .then((candles) => {
        if (disposed) return;
        series.setData(candles.map(toBar));
        chart.timeScale().fitContent();
        setLoading(false);
        // live updates only after the history is drawn
        unsubscribe = subscribeCandles(pair.symbol, INTERVAL, (candle) => series.update(toBar(candle)), setLive);
      })
      .catch((e: Error) => {
        if (!disposed) setError(e.message);
      });

    return () => {
      disposed = true;
      unsubscribe();
      chart.remove();
    };
  }, [pair, attempt]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {loading && !error && (
        <p className="absolute inset-0 grid place-items-center bg-surface text-muted-foreground">Loading chart…</p>
      )}
      {error && (
        <div className="absolute inset-0 bg-surface">
          <ErrorMessage message={error} onRetry={retry} />
        </div>
      )}
      {!live && <p className="absolute left-3 top-3 text-sm text-warning">Live updates paused, reconnecting…</p>}
    </div>
  );
}
