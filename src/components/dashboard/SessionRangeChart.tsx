import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { useLiveSeries } from "@/lib/use-live-series";
import { calculateSessionRanges, currentDayBars, easternDay, minuteInEasternDay, sessionTimeLabel } from "@/lib/session-ranges";

const WIDTH = 900;
const HEIGHT = 360;
const LEFT = 18;
const RIGHT = 95;
const TOP = 25;
const BOTTOM = 48;

export function SessionRangeChart({ ticker, symbol }: { ticker: string; symbol: string }) {
  const { settings } = useSettings();
  const { data, isPending, isError } = useLiveSeries(ticker, 60, settings.liveSync, settings.refreshMs, "5d");
  const [now, setNow] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const bars = useMemo(() => now ? currentDayBars(data?.candles ?? [], now) : [], [data, now]);
  const ranges = useMemo(() => now ? calculateSessionRanges(bars, now) : [], [bars, now]);
  const min = bars.length ? Math.min(...bars.map((bar) => bar.low)) : 0;
  const max = bars.length ? Math.max(...bars.map((bar) => bar.high)) : 1;
  const padding = Math.max((max - min) * 0.15, 1);
  const lower = min - padding;
  const upper = max + padding;
  const x = (minute: number) => LEFT + minute / 1440 * (WIDTH - LEFT - RIGHT);
  const y = (price: number) => TOP + (upper - price) / (upper - lower) * (HEIGHT - TOP - BOTTOM);
  const day = now ? easternDay(now) : "";
  const lastBar = bars[bars.length - 1];
  const emptyMessage = isPending || !now ? "Loading today’s prices…" : isError || !data?.candles.length
    ? "Intraday feed unavailable — no estimated ranges."
    : "No prices reported for today yet.";

  return (
    <section aria-label={`${symbol} daily session ranges`} className="mt-5 border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-bold">{symbol} · TODAY’S SESSION RANGES</h3>
        <span className="num text-[0.65rem] text-muted-foreground">{day} · ET · 1m data</span>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-background">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-[360px] w-full min-w-[740px]" role="img" aria-label={`${symbol} session highs, lows and point ranges for ${day}`}>
          {[0, 1, 2, 3, 4].map((index) => {
            const price = lower + (upper - lower) * index / 4;
            return <g key={index}>
              <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(price)} y2={y(price)} className="stroke-border" />
              {bars.length > 0 && <text x={WIDTH - RIGHT + 10} y={y(price) + 4} className="fill-foreground num text-[11px]">{price.toFixed(2)}</text>}
            </g>;
          })}
          {[0, 180, 360, 540, 720, 900, 1080, 1260, 1440].map((minute) => <g key={minute}>
            <line x1={x(minute)} x2={x(minute)} y1={TOP} y2={HEIGHT - BOTTOM} className="stroke-border" />
            <text x={x(minute)} y={HEIGHT - 25} textAnchor={minute === 0 ? "start" : minute === 1440 ? "end" : "middle"} className="fill-muted-foreground num text-[10px]">{sessionTimeLabel(minute)}</text>
          </g>)}
          <text x={WIDTH - RIGHT + 10} y={14} className="fill-muted-foreground text-[10px]">PRICE</text>
          <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">TIME · ET</text>
          {bars.length > 0 && <path d={bars.map((bar, index) => `${index ? "L" : "M"}${x(minuteInEasternDay(bar.time))},${y(bar.close)}`).join(" ")} fill="none" className="stroke-foreground/30" strokeWidth={1} />}
          {ranges.map((range) => {
            if (range.high === null || range.low === null || range.points === null || !now) return null;
            const end = range.active ? Math.min(range.end, minuteInEasternDay(now.getTime() / 1000)) : range.end;
            const centerX = (x(range.start) + x(end)) / 2;
            const centerY = (y(range.high) + y(range.low)) / 2;
            return <g key={range.id} style={{ color: range.session.color }} opacity={selected && selected !== range.id ? 0.12 : 1}>
              <title>{range.session.label} · {sessionTimeLabel(range.start)}–{sessionTimeLabel(range.end)} ET · High {range.high.toFixed(2)} · Low {range.low.toFixed(2)} · {range.points.toFixed(2)} points · {range.bars} bars</title>
              <line x1={x(range.start)} x2={x(end)} y1={y(range.high)} y2={y(range.high)} stroke="currentColor" strokeWidth={2.5} />
              <line x1={x(range.start)} x2={x(end)} y1={y(range.low)} y2={y(range.low)} stroke="currentColor" strokeWidth={2.5} />
              <line x1={centerX} x2={centerX} y1={y(range.high)} y2={y(range.low)} stroke="currentColor" strokeWidth={1} strokeDasharray="3 4" />
              <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="central" fill="currentColor" className="session-range-label num text-[11px] font-bold">{range.points.toFixed(2)} pts</text>
            </g>;
          })}
          {bars.length === 0 && <text x={(WIDTH - RIGHT) / 2} y={HEIGHT / 2} textAnchor="middle" className="fill-muted-foreground text-[13px]">{emptyMessage}</text>}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-1.5">
        {ranges.map((range) => <Button key={range.id} variant={selected === range.id ? "secondary" : "ghost"} onClick={() => setSelected((value) => value === range.id ? null : range.id)} aria-pressed={selected === range.id} title={`${sessionTimeLabel(range.start)}–${sessionTimeLabel(range.end)} ET`} className="h-auto min-h-10 justify-start gap-2 px-2 py-1.5 text-left">
          <span className="h-5 w-1 shrink-0" style={{ backgroundColor: range.session.color }} />
          <span className="min-w-0">
            <span className="block text-[0.6rem] font-bold">{range.session.label}{range.session.key === "ASIA" ? ` · ${range.id.endsWith("AM") ? "AM" : "PM"}` : ""}{range.active ? " · ACTIVE" : ""}</span>
            <span className="num block whitespace-normal text-[0.6rem] font-normal text-muted-foreground">{range.points === null ? "—" : `${range.points.toFixed(2)} pts · H ${range.high?.toFixed(2)} / L ${range.low?.toFixed(2)}`}</span>
          </span>
        </Button>)}
      </div>
      {lastBar && <p className="num mt-2 text-[0.6rem] text-muted-foreground">Last bar {new Date(lastBar.time * 1000).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true })} ET · Reported bars only; gaps may omit session extremes.</p>}
    </section>
  );
}