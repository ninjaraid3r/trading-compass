import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  LineSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { getIntradayCandles, getOptionsAnalytics, getSpxWeek } from "@/lib/market-data";

const BLACK = "#1a1815";
const CALL_WALL_COLOR = "#2f7a52";
const PUT_WALL_COLOR = "#b3402c";

/** Every candlestick series on the desk renders in black only. */
const BLACK_CANDLES = {
  upColor: BLACK,
  downColor: BLACK,
  wickUpColor: BLACK,
  wickDownColor: BLACK,
  borderUpColor: BLACK,
  borderDownColor: BLACK,
  borderVisible: true,
} as const;

function baseOptions(height: number) {
  return {
    height,
    localization: { locale: "en-US" },
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

export function SpxChart({ showWalls = true }: { showWalls?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    if (!ref.current) return;
    const chart: IChartApi = createChart(ref.current, {
      ...baseOptions(360),
      width: ref.current.clientWidth,
    });
    const candles = getSpxWeek(new Date());

    const series = chart.addSeries(CandlestickSeries, { ...BLACK_CANDLES });
    series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    seriesRef.current = series;

    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 600 }));
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
      seriesRef.current = null;
      linesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    if (!showWalls) return;
    const analytics = getOptionsAnalytics(new Date());
    linesRef.current = [
      series.createPriceLine({
        price: analytics.callWall,
        color: CALL_WALL_COLOR,
        lineWidth: 2,
        title: `CALL WALL ${analytics.callWall}`,
        axisLabelVisible: true,
      }),
      series.createPriceLine({
        price: analytics.putWall,
        color: PUT_WALL_COLOR,
        lineWidth: 2,
        title: `PUT WALL ${analytics.putWall}`,
        axisLabelVisible: true,
      }),
    ];
  }, [showWalls]);

  return <div ref={ref} className="w-full" />;
}

export function TimeframeChart({
  intervalSec,
  title,
  showWalls = false,
}: {
  intervalSec: number;
  title: string;
  showWalls?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      ...baseOptions(260),
      width: ref.current.clientWidth,
      timeScale: { borderColor: "rgba(26,24,21,0.35)", timeVisible: true, secondsVisible: intervalSec < 60 },
    });
    const series = chart.addSeries(CandlestickSeries, { ...BLACK_CANDLES });
    series.setData(
      getIntradayCandles(new Date(), intervalSec, 70).map((c) => ({ ...c, time: c.time as UTCTimestamp })),
    );
    seriesRef.current = series;
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 320 }));
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
      seriesRef.current = null;
      linesRef.current = [];
    };
  }, [intervalSec]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    if (!showWalls) return;
    const a = getOptionsAnalytics(new Date());
    linesRef.current = [
      series.createPriceLine({
        price: a.callWall,
        color: CALL_WALL_COLOR,
        lineWidth: 2,
        title: `CALL ${a.callWall}`,
        axisLabelVisible: true,
      }),
      series.createPriceLine({
        price: a.putWall,
        color: PUT_WALL_COLOR,
        lineWidth: 2,
        title: `PUT ${a.putWall}`,
        axisLabelVisible: true,
      }),
    ];
  }, [showWalls, intervalSec]);

  return (
    <div className="rounded-lg border border-foreground/25 bg-card p-4">
      <h3 className="mb-2 text-[0.7rem] font-bold tracking-[0.2em]">{title}</h3>
      <div ref={ref} className="w-full" />
    </div>
  );
}

export const TIMEFRAMES = [
  { label: "15s", sec: 15 },
  { label: "30s", sec: 30 },
  { label: "1m", sec: 60 },
  { label: "3m", sec: 180 },
  { label: "5m", sec: 300 },
  { label: "15m", sec: 900 },
  { label: "30m", sec: 1800 },
  { label: "1h", sec: 3600 },
  { label: "90m", sec: 5400 },
  { label: "4h", sec: 14400 },
  { label: "D", sec: 86400 },
  { label: "W", sec: 604800 },
] as const;

/** Colored body, black border + wicks. */
export function SymbolChart({
  symbol,
  base,
  color,
  intervalSec,
}: {
  symbol: string;
  base: number;
  color: string;
  intervalSec: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      ...baseOptions(260),
      width: ref.current.clientWidth,
      timeScale: {
        borderColor: "rgba(26,24,21,0.35)",
        timeVisible: intervalSec < 86400,
        secondsVisible: intervalSec < 60,
      },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: color,
      downColor: color,
      wickUpColor: BLACK,
      wickDownColor: BLACK,
      borderUpColor: BLACK,
      borderDownColor: BLACK,
      borderVisible: true,
    });
    series.setData(
      getIntradayCandles(new Date(), intervalSec, 70, base).map((c) => ({
        ...c,
        time: c.time as UTCTimestamp,
      })),
    );
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 320 }));
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [intervalSec, base, color]);

  return (
    <div className="rounded-lg border border-foreground/25 bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm border border-foreground" style={{ backgroundColor: color }} />
        <h3 className="text-[0.7rem] font-bold tracking-[0.2em]">{symbol}</h3>
      </div>
      <div ref={ref} className="w-full" />
    </div>
  );
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
