import { useEffect, useState } from "react";
import { getOptionsAnalytics } from "@/lib/market-data";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md border border-foreground/20 p-3">
      <p className="text-[0.6rem] tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-lg font-semibold" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

export function OptionsPanel() {
  const [a, setA] = useState<ReturnType<typeof getOptionsAnalytics> | null>(null);
  useEffect(() => setA(getOptionsAnalytics(new Date())), []);
  if (!a) return <div className="min-h-[120px]" />;

  const positive = a.netGamma >= 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="IV RANK" value={`${a.ivRank}`} />
      <Stat label="IV PERCENTILE" value={`${a.ivPercentile}`} />
      <Stat
        label="DEALER GAMMA"
        value={`${a.netGamma > 0 ? "+" : ""}${a.netGamma}M`}
        color={positive ? "var(--up)" : "var(--down)"}
      />
      <Stat label="REGIME" value={a.regime.toUpperCase()} color={positive ? "var(--up)" : "var(--down)"} />
      <Stat label="CALL WALL" value={`${a.callWall}`} />
      <Stat label="PUT WALL" value={`${a.putWall}`} />
      <Stat label="EXPECTED MOVE 1D" value={`±${a.expectedMove1D}%`} />
      <Stat label="EXPECTED MOVE 5D" value={`±${a.expectedMove5D}%`} />
    </div>
  );
}
