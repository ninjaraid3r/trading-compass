import { useEffect, useState } from "react";
import { currentSession, partsIn } from "@/lib/sessions";
import { useSettings } from "@/lib/settings";

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

function Clock({
  label,
  zone,
  now,
  clock24h,
  showSeconds,
}: {
  label: string;
  zone: string;
  now: Date | null;
  clock24h: boolean;
  showSeconds: boolean;
}) {
  const t = now ? partsIn(now, zone) : null;
  const suffix = clock24h ? "" : t ? (t.hour >= 12 ? "PM" : "AM") : "";
  const hour = t ? (clock24h ? t.hour : t.hour % 12 || 12) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[0.7rem] tracking-[0.35em] text-muted-foreground">{label}</span>
      <div className="num flex items-baseline gap-2">
        <span className="text-5xl leading-none font-semibold sm:text-6xl">
          {t ? `${pad(hour)}:${pad(t.minute)}` : "--:--"}
        </span>
        {showSeconds && (
          <span className="text-2xl leading-none font-medium sm:text-3xl">{t ? pad(t.second) : "--"}</span>
        )}
        {suffix && <span className="text-sm tracking-widest">{suffix}</span>}
      </div>
    </div>
  );
}

export function SessionClocks() {
  const now = useNow();
  const session = now ? currentSession(now) : null;
  const { settings } = useSettings();


  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-6 sm:p-8">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
        <Clock label="PST" zone="America/Los_Angeles" now={now} clock24h={settings.clock24h} showSeconds={settings.showSeconds} />
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
        <Clock label="EST" zone="America/New_York" now={now} clock24h={settings.clock24h} showSeconds={settings.showSeconds} />
      </div>
    </section>
  );
}
