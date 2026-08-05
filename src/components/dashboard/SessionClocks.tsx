import { useEffect, useState } from "react";
import { currentSession, partsIn } from "@/lib/sessions";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

function Clock({ label, zone, now }: { label: string; zone: string; now: Date | null }) {
  const t = now ? partsIn(now, zone) : null;
  const suffix = t ? (t.hour >= 12 ? "PM" : "AM") : "";
  const h12 = t ? t.hour % 12 || 12 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[0.7rem] tracking-[0.35em] text-muted-foreground">{label}</span>
      <div className="num flex items-baseline gap-2">
        <span className="text-5xl leading-none font-semibold sm:text-6xl">
          {t ? `${pad(h12)}:${pad(t.minute)}` : "--:--"}
        </span>
        <span className="text-2xl leading-none font-medium sm:text-3xl">{t ? pad(t.second) : "--"}</span>
        <span className="text-sm tracking-widest">{suffix}</span>
      </div>
    </div>
  );
}

export function SessionClocks() {
  const now = useNow();
  const session = now ? currentSession(now) : null;

  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-6 sm:p-8">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
        <Clock label="PST" zone="America/Los_Angeles" now={now} />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[0.65rem] tracking-[0.3em] text-muted-foreground">ACTIVE SESSION</span>
          <div
            className="rounded-md border-2 px-5 py-3 text-center"
            style={{
              borderColor: session?.color ?? "var(--session-closed)",
              color: session?.color ?? "var(--session-closed)",
              backgroundColor: session
                ? `color-mix(in oklab, ${session.color} 12%, transparent)`
                : "transparent",
            }}
          >
            <span className="text-xl font-bold tracking-[0.2em] sm:text-2xl">{session?.label ?? "—"}</span>
          </div>
          <span className="num text-[0.7rem] text-muted-foreground">
            {now
              ? now.toLocaleDateString("en-US", {
                  timeZone: "America/New_York",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
        <Clock label="EST" zone="America/New_York" now={now} />
      </div>
    </section>
  );
}
