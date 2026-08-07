import { useEffect, useState } from "react";
import { getBondBoard } from "@/lib/market-data";

export function BondsPanel() {
  const [board, setBoard] = useState(() => getBondBoard(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setBoard(getBondBoard(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs tracking-[0.3em] text-muted-foreground">BONDS VS YIELDS</h2>
        <span className="rounded border border-foreground px-2 py-1 text-[0.65rem] font-bold tracking-[0.2em]">
          {board.riskTone.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/30 text-[0.6rem] tracking-[0.2em] text-muted-foreground">
              <th className="pb-2">TENOR</th>
              <th className="pb-2 text-right">PRICE</th>
              <th className="pb-2 text-right">CHG</th>
              <th className="pb-2 text-right">YIELD</th>
              <th className="pb-2 text-right">BP</th>
            </tr>
          </thead>
          <tbody className="num">
            {board.rows.map((r) => (
              <tr key={r.tenor} className="border-b border-foreground/10">
                <td className="py-2 font-bold tracking-[0.15em]">{r.tenor}</td>
                <td className="py-2 text-right">{r.price.toFixed(2)}</td>
                <td
                  className="py-2 text-right"
                  style={{ color: r.priceChg >= 0 ? "var(--session-nyam)" : "var(--tag-high)" }}
                >
                  {r.priceChg >= 0 ? "+" : ""}
                  {r.priceChg.toFixed(2)}
                </td>
                <td className="py-2 text-right">{r.yieldPct.toFixed(3)}%</td>
                <td
                  className="py-2 text-right"
                  style={{ color: r.yieldBp >= 0 ? "var(--tag-high)" : "var(--session-nyam)" }}
                >
                  {r.yieldBp >= 0 ? "+" : ""}
                  {r.yieldBp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-3">
          <div className="flex items-baseline gap-3 border-b border-foreground/20 pb-2">
            <span className="text-[0.6rem] tracking-[0.2em] text-muted-foreground">2s10s CURVE</span>
            <span className="num text-xl font-bold">
              {board.curve2s10s > 0 ? "+" : ""}
              {board.curve2s10s} bp
            </span>
            <span className="text-[0.65rem] font-bold tracking-[0.2em]">{board.curveState.toUpperCase()}</span>
          </div>
          <p className="text-sm leading-relaxed">{board.opinion}</p>
          <p className="text-xs text-muted-foreground">
            Price and yield move inverse: green price / red basis points means the bond bid is back on.
          </p>
        </div>
      </div>
    </section>
  );
}
