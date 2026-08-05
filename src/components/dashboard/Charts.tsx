import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  LineSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { getOptionsAnalytics, getSpxWeek } from "@/lib/market-data";

const BLACK = "#1a1815";

function baseOptions(height: number) {
  return {
    height,
    layout: {
      background: { color: "transparent" },
      textColor: BLACK,
      fontFamily: "'IBM Plex Mono', monospace",
    },
    grid: {
      vertLines: { color: "rgba(26,24,21,0.08)" },
      horzLines: { color: "rgba(26,24,21,0.08)" },
    },
    rightPriceScale: { borderColor: "rgba(26,24,21,0.35)" },
    timeScale: { borderColor: "rgba(26,24,21,0.35)", timeVisible: true, secondsVisible: false },
    crosshair: { vertLine: { color: BLACK }, horzLine: { color: BLACK } },
  };
}

export function SpxChart() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart: IChartApi = createChart(ref.current, {
      ...baseOptions(360),
      width: ref.current.clientWidth,
    });
    const candles = getSpxWeek(new Date());
    const analytics = getOptionsAnalytics(new Date());

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#2f7a52",
      downColor: "#b3402c",
      wickUpColor: "#2f7a52",
      wickDownColor: "#b3402c",
      borderVisible: false,
    });
    series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));

    series.createPriceLine({
      price: analytics.callWall,
      color: "#1a1815",
      lineWidth: 2,
      title: `CALL WALL ${analytics.callWall}`,
      axisLabelVisible: true,
    });
    series.createPriceLine({
      price: analytics.putWall,
      color: "#1a1815",
      lineWidth: 2,
      title: `PUT WALL ${analytics.putWall}`,
      axisLabelVisible: true,
    });

    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 600 }));
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  return <div ref={ref} className="w-full" />;
}

export function RangeChart({ seed, base, title }: { seed: number; base: number; title: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, { ...baseOptions(200), width: ref.current.clientWidth });
    import("@/lib/market-data").then(({ getRangeSeries }) => {
      const data = getRangeSeries(new Date(), seed, base);
      const hi = chart.addSeries(LineSeries, { color: "#1c9bb0", lineWidth: 2, title: "OR HIGH" });
      const lo = chart.addSeries(LineSeries, { color: "#1c9bb0", lineWidth: 2, title: "OR LOW" });
      hi.setData(data.map((d) => ({ time: d.time as UTCTimestamp, value: d.high })));
      lo.setData(data.map((d) => ({ time: d.time as UTCTimestamp, value: d.low })));
      chart.timeScale().fitContent();
    });
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 400 }));
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [seed, base]);

  return (
    <div>
      <h3 className="mb-2 text-[0.7rem] font-bold tracking-[0.2em]">{title}</h3>
      <div ref={ref} className="w-full" />
    </div>
  );
}
