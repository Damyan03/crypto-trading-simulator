import { ColorType, type ChartOptions, type DeepPartial } from "lightweight-charts";

/** Resolves a theme colour, e.g. "--color-success", to a plain colour the chart's canvas understands */
export function themeColor(element: HTMLElement, variable: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${variable})`;
  element.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Options every chart shares: theme colours, time axis and the TradingView logo */
export function chartOptions(container: HTMLElement): DeepPartial<ChartOptions> {
  const color = (variable: string) => themeColor(container, variable);
  return {
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
  };
}
