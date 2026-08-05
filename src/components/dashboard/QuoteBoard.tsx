import { useEffect, useState } from "react";
import { getQuoteGroups, type Quote } from "@/lib/market-data";

function QuoteRow({ q }: { q: Quote }) {
  const up = q.change >= 0;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-foreground/10 py-1.5 last:border-b-0">
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold tracking-wider">{q.symbol}</span>
        <span className="truncate text-[0.65rem] text-muted-foreground">{q.name}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="num text-sm font-medium">{q.last.toLocaleString()}</span>
        <span className="num text-[0.65rem]" style={{ color: up ? "var(--up)" : "var(--down)" }}>
          {up ? "+" : ""}
          {q.changePct}% · {(q.volume / 1000).toFixed(0)}K
        </span>
      </div>
    </div>
  );
}

export function QuoteBoard() {
  const [groups, setGroups] = useState<ReturnType<typeof getQuoteGroups>>([]);
  useEffect(() => {
    const tick = () => setGroups(getQuoteGroups(new Date()));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-5">
      <h2 className="mb-4 text-xs tracking-[0.3em] text-muted-foreground">MARKET QUOTES · TOTAL VOLUME TODAY</h2>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-2 border-b-2 border-foreground pb-1 text-[0.7rem] font-bold tracking-[0.18em]">
              {g.title.toUpperCase()}
            </h3>
            {g.quotes.map((q) => (
              <QuoteRow key={q.symbol} q={q} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
