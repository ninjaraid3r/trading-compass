import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { getIntradayCandles, getOptionsAnalytics, getSpxWeek, tickCandle, type Candle } from "@/lib/market-data";
import { useSettings } from "@/lib/settings";

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

/**
 * Streams live ticks into the last bar of a series and rolls a new bar when
 * the interval elapses. Returns a cleanup function.
 */
function startLive(
  series: ISeriesApi<"Candlestick">,
  last: Candle,
  intervalSec: number,
  refreshMs: number,
) {
  let current = last;
  const vol = Math.max(0.15, Math.sqrt(intervalSec / 60) * 0.9);
  const id = window.setInterval(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(nowSec / intervalSec) * intervalSec;
    if (bucket > current.time) {
      const open = current.close;
      current = { time: bucket, open, high: open, low: open, close: open };
    } else {
      current = tickCandle(current, vol);
    }
    series.update({ ...current, time: current.time as UTCTimestamp });
  }, refreshMs);
  return () => window.clearInterval(id);
}

export function SpxChart({ showWalls = true }: { showWalls?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const { settings } = useSettings();
  const live = settings.liveSync;
  const refreshMs = settings.refreshMs;

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
    const stopLive = live ? startLive(series, candles[candles.length - 1]!, 1800, refreshMs) : undefined;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 600 }));
    ro.observe(ref.current);
    return () => {
      stopLive?.();
      ro.disconnect();
      chart.remove();
      seriesRef.current = null;
      linesRef.current = [];
    };
  }, [live, refreshMs]);

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
  }, [showWalls, live, refreshMs]);

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
  const { settings } = useSettings();
  const live = settings.liveSync;
  const refreshMs = settings.refreshMs;

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      ...baseOptions(260),
      width: ref.current.clientWidth,
      timeScale: { borderColor: "rgba(26,24,21,0.35)", timeVisible: true, secondsVisible: intervalSec < 60 },
    });
    const series = chart.addSeries(CandlestickSeries, { ...BLACK_CANDLES });
    const data = getIntradayCandles(new Date(), intervalSec, 70);
    series.setData(data.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    seriesRef.current = series;
    chart.timeScale().fitContent();
    const stopLive = live ? startLive(series, data[data.length - 1]!, intervalSec, refreshMs) : undefined;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 320 }));
    ro.observe(ref.current);
    return () => {
      stopLive?.();
      ro.disconnect();
      chart.remove();
      seriesRef.current = null;
      linesRef.current = [];
    };
  }, [intervalSec, live, refreshMs]);

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
  }, [showWalls, intervalSec, live, refreshMs]);

  return (
    <div className="rounded-lg border border-foreground/25 bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[0.7rem] font-bold tracking-[0.2em]">{title}</h3>
        {live && <LiveDot />}
      </div>
      <div ref={ref} className="w-full" />
    </div>
  );
}

export function LiveDot() {
  return (
    <span className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.2em] text-muted-foreground">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--session-nyam)]" />
      LIVE
    </span>
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
  const { settings } = useSettings();
  const live = settings.liveSync;
  const refreshMs = settings.refreshMs;

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
    const data = getIntradayCandles(new Date(), intervalSec, 70, base);
    series.setData(data.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    chart.timeScale().fitContent();
    const stopLive = live ? startLive(series, data[data.length - 1]!, intervalSec, refreshMs) : undefined;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 320 }));
    ro.observe(ref.current);
    return () => {
      stopLive?.();
      ro.disconnect();
      chart.remove();
    };
  }, [intervalSec, base, color, live, refreshMs]);

  return (
    <div className="rounded-lg border border-foreground/25 bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-foreground" style={{ backgroundColor: color }} />
          <h3 className="text-[0.7rem] font-bold tracking-[0.2em]">{symbol}</h3>
        </div>
        {live && <LiveDot />}
      </div>
      <div ref={ref} className="w-full" />
    </div>
  );
}
