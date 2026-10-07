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
import { useLiveSeries } from "@/lib/use-live-series";
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
 * Streams simulated ticks into the last bar of a series (fallback only, used
 * when the real feed is unavailable). Returns a cleanup function.
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

/** Yahoo bars can repeat a timestamp; lightweight-charts needs strictly ascending unique times. */
function normalize(candles: Candle[]): Candle[] {
  const seen = new Set<number>();
  return candles
    .slice()
    .sort((a, b) => a.time - b.time)
    .filter((c) => (seen.has(c.time) ? false : (seen.add(c.time), true)));
}

function FeedBadge({ live, real }: { live: boolean; real: boolean }) {
  if (!real) return live ? <LiveDot /> : null;
  return (
    <span className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.2em] text-muted-foreground">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--session-nyam)]" />
      REAL
    </span>
  );
}

export function SpxChart({ showWalls = true, intervalSec = 86400 }: { showWalls?: boolean; intervalSec?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const { settings } = useSettings();
  const live = settings.liveSync;
  const refreshMs = settings.refreshMs;
  const { data } = useLiveSeries("^GSPC", intervalSec, live, refreshMs);
  const real = (data?.candles.length ?? 0) > 0;

  useEffect(() => {
    if (!ref.current) return;
    const chart: IChartApi = createChart(ref.current, {
      ...baseOptions(360),
      width: ref.current.clientWidth,
    });
    const fallback = intervalSec === 1800 ? getSpxWeek(new Date()) : getIntradayCandles(new Date(), intervalSec, 90, 5720);
    const candles = normalize(real && data ? data.candles : fallback);

    const series = chart.addSeries(CandlestickSeries, { ...BLACK_CANDLES });
    series.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    seriesRef.current = series;

    chart.timeScale().fitContent();
    const stopLive =
      live && !real && candles.length > 0 ? startLive(series, candles[candles.length - 1] as Candle, intervalSec, refreshMs) : undefined;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 600 }));
    ro.observe(ref.current);
    return () => {
      stopLive?.();
      ro.disconnect();
      chart.remove();
      seriesRef.current = null;
      linesRef.current = [];
    };
  }, [live, refreshMs, real, data, intervalSec]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    if (!showWalls) return;
    const analytics = getOptionsAnalytics(new Date());
    const spot = data?.last ?? analytics.spot;
    const callWall = Math.round((spot * (analytics.callWall / analytics.spot)) / 5) * 5;
    const putWall = Math.round((spot * (analytics.putWall / analytics.spot)) / 5) * 5;
    linesRef.current = [
      series.createPriceLine({
        price: callWall,
        color: CALL_WALL_COLOR,
        lineWidth: 2,
        title: `CALL WALL ${callWall}`,
        axisLabelVisible: true,
      }),
      series.createPriceLine({
        price: putWall,
        color: PUT_WALL_COLOR,
        lineWidth: 2,
        title: `PUT WALL ${putWall}`,
        axisLabelVisible: true,
      }),
    ];
  }, [showWalls, live, refreshMs, real, data, intervalSec]);

  return <div ref={ref} className="w-full" />;
}

export function TimeframeChart({
  intervalSec,
  title,
  showWalls = false,
  ticker = "ES=F",
}: {
  intervalSec: number;
  title: string;
  showWalls?: boolean;
  ticker?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const { settings } = useSettings();
  const live = settings.liveSync;
  const refreshMs = settings.refreshMs;
  const { data } = useLiveSeries(ticker, intervalSec, live, refreshMs);
  const real = (data?.candles.length ?? 0) > 0;

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      ...baseOptions(260),
      width: ref.current.clientWidth,
      timeScale: { borderColor: "rgba(26,24,21,0.35)", timeVisible: true, secondsVisible: intervalSec < 60 },
    });
    const series = chart.addSeries(CandlestickSeries, { ...BLACK_CANDLES });
    const source = real ? data!.candles.slice(-90) : getIntradayCandles(new Date(), intervalSec, 70);
    const bars = normalize(source);
    series.setData(bars.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    seriesRef.current = series;
    chart.timeScale().fitContent();
    const stopLive =
      live && !real ? startLive(series, bars[bars.length - 1]!, intervalSec, refreshMs) : undefined;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 320 }));
    ro.observe(ref.current);
    return () => {
      stopLive?.();
      ro.disconnect();
      chart.remove();
      seriesRef.current = null;
      linesRef.current = [];
    };
  }, [intervalSec, live, refreshMs, real, data]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    linesRef.current.forEach((l) => series.removePriceLine(l));
    linesRef.current = [];
    if (!showWalls) return;
    const a = getOptionsAnalytics(new Date());
    const spot = data?.last ?? a.spot;
    const callWall = Math.round((spot * (a.callWall / a.spot)) / 5) * 5;
    const putWall = Math.round((spot * (a.putWall / a.spot)) / 5) * 5;
    linesRef.current = [
      series.createPriceLine({
        price: callWall,
        color: CALL_WALL_COLOR,
        lineWidth: 2,
        title: `CALL ${callWall}`,
        axisLabelVisible: true,
      }),
      series.createPriceLine({
        price: putWall,
        color: PUT_WALL_COLOR,
        lineWidth: 2,
        title: `PUT ${putWall}`,
        axisLabelVisible: true,
      }),
    ];
  }, [showWalls, intervalSec, live, refreshMs, real, data]);

  return (
    <div className="rounded-lg border border-foreground/25 bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[0.7rem] font-bold tracking-[0.2em]">{title}</h3>
        <FeedBadge live={live} real={real} />
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
  ticker,
}: {
  symbol: string;
  base: number;
  color: string;
  intervalSec: number;
  ticker?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const live = settings.liveSync;
  const refreshMs = settings.refreshMs;
  const { data } = useLiveSeries(ticker, intervalSec, live, refreshMs);
  const real = (data?.candles.length ?? 0) > 0;

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
    const source = real ? data!.candles.slice(-120) : getIntradayCandles(new Date(), intervalSec, 70, base);
    const bars = normalize(source);
    series.setData(bars.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
    chart.timeScale().fitContent();
    const stopLive =
      live && !real ? startLive(series, bars[bars.length - 1]!, intervalSec, refreshMs) : undefined;
    const ro = new ResizeObserver(() => chart.applyOptions({ width: ref.current?.clientWidth ?? 320 }));
    ro.observe(ref.current);
    return () => {
      stopLive?.();
      ro.disconnect();
      chart.remove();
    };
  }, [intervalSec, base, color, live, refreshMs, real, data]);

  const lastPx = real ? data!.last : null;

  return (
    <div className="rounded-lg border border-foreground/25 bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-foreground" style={{ backgroundColor: color }} />
          <h3 className="text-[0.7rem] font-bold tracking-[0.2em]">{symbol}</h3>
          {lastPx != null && <span className="num text-[0.7rem] font-bold">{lastPx.toFixed(2)}</span>}
        </div>
        <FeedBadge live={live} real={real} />
      </div>
      <div ref={ref} className="w-full" />
    </div>
  );
}
