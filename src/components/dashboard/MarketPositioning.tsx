import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPositioningData } from "@/lib/market-intelligence.functions";
import { useSettings } from "@/lib/settings";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
const dateEt = (value: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00-04:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }) : "—";

export function MarketPositioning() {
  const fetchData = useServerFn(getPositioningData);
  const { settings } = useSettings();
  const { data, isLoading } = useQuery({ queryKey: ["positioning-data"], queryFn: () => fetchData(), staleTime: 30 * 60_000 });

  if (!settings.showCot && !settings.showDarkPool) return null;

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {settings.showCot && (
        <div className="rounded-lg border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-foreground/20 pb-3">
            <div><h2 className="text-xs tracking-[0.3em] text-muted-foreground">CFTC · LEVERAGED FUND POSITIONING</h2><p className="mt-1 text-[0.65rem] text-muted-foreground">Weekly report · positions as of Tuesday</p></div>
            <span className="text-[0.6rem] font-bold tracking-[0.16em]">OFFICIAL COT</span>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Loading latest release…</p>}
          <div className="space-y-1">
            {data?.cot.map((row) => (
              <div key={row.symbol} className="grid grid-cols-[46px_1fr_auto] items-center gap-3 border-b border-foreground/10 py-2.5">
                <span className="font-bold">{row.symbol}</span>
                <div><p className="num text-sm font-bold">{row.net >= 0 ? "+" : ""}{compact.format(row.net)} net</p><p className="text-[0.65rem] text-muted-foreground">{row.netShare.toFixed(1)}% of OI · {dateEt(row.reportDate)}</p></div>
                <div className="text-right"><p className={`text-xs font-bold ${row.bias === "Bullish" ? "text-up" : row.bias === "Bearish" ? "text-down" : "text-muted-foreground"}`}>{row.bias.toUpperCase()}</p><p className="num text-[0.65rem] text-muted-foreground">{row.weeklyChange >= 0 ? "+" : ""}{compact.format(row.weeklyChange)} w/w</p></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.65rem] text-muted-foreground">Source: CFTC Traders in Financial Futures. Delayed weekly positioning, not a live signal.</p>
        </div>
      )}

      {settings.showDarkPool && (
        <div className="rounded-lg border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-foreground/20 pb-3">
            <div><h2 className="text-xs tracking-[0.3em] text-muted-foreground">FINRA · ATS / DARK POOL</h2><p className="mt-1 text-[0.65rem] text-muted-foreground">Weekly off-exchange ATS activity</p></div>
            <span className="text-[0.6rem] font-bold tracking-[0.16em]">2-WEEK DELAY</span>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Loading latest release…</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data?.darkPool.map((row) => (
              <div key={row.symbol} className="border-l-2 border-foreground pl-3">
                <div className="flex items-center justify-between"><span className="font-bold">{row.symbol}</span><span className="num text-xs">{compact.format(row.shares)} sh</span></div>
                <p className="num mt-2 text-lg font-bold">{money.format(row.notional)}</p>
                <p className="text-[0.65rem] text-muted-foreground">{compact.format(row.trades)} trades · avg {Math.round(row.averageTrade)} sh</p>
                <p className="mt-2 truncate text-[0.65rem] font-semibold" title={row.topVenue}>{row.topVenue}</p>
                <p className="text-[0.6rem] text-muted-foreground">Week of {dateEt(row.weekStart)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[0.65rem] text-muted-foreground">Source: FINRA OTC Transparency. ATS volume is officially reported after publication delay.</p>
        </div>
      )}
    </section>
  );
}
