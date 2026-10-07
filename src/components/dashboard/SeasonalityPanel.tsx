import { useState } from "react";

const GROUPS = {
  AGRICULTURE: [
    { symbol: "ZS", name: "Soybeans", pattern: [1,-1,2,3,6,8,4,-2,-4,1,3,2], note: "Planting-to-weather premium strengthens into early summer." },
    { symbol: "KC", name: "Coffee", pattern: [-2,1,4,6,3,-1,-3,2,5,4,1,-1], note: "Brazil weather and frost risk dominate spring pricing." },
    { symbol: "SB", name: "Sugar", pattern: [2,3,1,-2,-4,-1,2,5,7,4,1,-2], note: "Harvest timing and energy demand shape late-summer strength." },
  ],
  GRAINS: [
    { symbol: "ZC", name: "Corn", pattern: [-2,0,3,5,8,6,1,-4,-6,-3,0,2], note: "US planting and pollination weather peak into June." },
    { symbol: "ZW", name: "Wheat", pattern: [1,3,5,2,-2,-5,-7,-3,1,4,3,1], note: "Northern Hemisphere harvest pressure often builds in summer." },
    { symbol: "ZM", name: "Soymeal", pattern: [0,2,4,6,5,2,-2,-4,-1,3,4,1], note: "Crush demand tends to firm ahead of peak growing season." },
  ],
  METALS: [
    { symbol: "GC", name: "Gold", pattern: [3,1,-2,-1,2,0,-1,4,6,5,2,3], note: "Late-summer demand and year-end hedging are historically supportive." },
    { symbol: "SI", name: "Silver", pattern: [2,3,0,-2,1,4,2,3,5,2,-1,1], note: "Industrial demand can amplify gold-led seasonal moves." },
    { symbol: "HG", name: "Copper", pattern: [1,4,6,5,2,-2,-5,-3,1,3,2,0], note: "Construction demand historically firms through spring." },
  ],
} as const;
const MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

export function SeasonalityPanel() {
  const [group, setGroup] = useState<keyof typeof GROUPS>("AGRICULTURE");
  const month = new Date().getMonth();
  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xs tracking-[0.3em] text-muted-foreground">COMMODITY SEASONALITY</h2><p className="mt-1 text-[0.65rem] text-muted-foreground">Agriculture · grains · metals</p></div><div className="flex gap-1">{(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((key) => <button key={key} type="button" onClick={() => setGroup(key)} aria-pressed={group === key} className={`rounded border px-2.5 py-1.5 text-[0.65rem] font-bold tracking-[0.12em] ${group === key ? "border-foreground bg-foreground text-background" : "border-foreground/35"}`}>{key}</button>)}</div></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{GROUPS[group].map((item) => {
        const value = item.pattern[month] ?? 0;
        return <div key={item.symbol} className="border-t-2 border-foreground pt-3"><div className="flex items-baseline justify-between"><div><span className="text-lg font-bold">{item.symbol}</span><span className="ml-2 text-xs text-muted-foreground">{item.name}</span></div><span className={`text-xs font-bold ${value > 0 ? "text-up" : "text-down"}`}>{value > 0 ? "BULLISH" : "BEARISH"} PHASE</span></div><div className="mt-4 grid grid-cols-12 gap-1">{item.pattern.map((point, i) => <div key={i} className="flex flex-col items-center gap-1"><div className={`w-full rounded-sm ${i === month ? "ring-2 ring-foreground" : ""} ${point >= 0 ? "bg-up/70" : "bg-down/70"}`} style={{ height: `${Math.max(10, Math.abs(point) * 4)}px`, marginTop: `${Math.max(0, 32 - Math.abs(point) * 4)}px` }} /><span className="num text-[0.55rem] text-muted-foreground">{MONTHS[i]}</span></div>)}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{item.note}</p></div>;
      })}</div>
      <p className="mt-5 border-t border-foreground/15 pt-3 text-[0.65rem] text-muted-foreground">Historical seasonal tendency only — not a forecast. Weather, supply shocks, currency, and positioning can override the pattern.</p>
    </section>
  );
}
