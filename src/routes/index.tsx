import { createFileRoute } from "@tanstack/react-router";
import { SessionClocks } from "@/components/dashboard/SessionClocks";
import { QuoteBoard } from "@/components/dashboard/QuoteBoard";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { OptionsPanel } from "@/components/dashboard/OptionsPanel";
import { SpxChart, RangeChart } from "@/components/dashboard/Charts";
import { SESSIONS } from "@/lib/sessions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trading Journal Desk · Sessions, Macro & Options Flow" },
      {
        name: "description",
        content:
          "One-page trading desk: PST/EST session clocks, macro calendar, futures quotes, SPX chart and dealer gamma levels.",
      },
      { property: "og:title", content: "Trading Journal Desk" },
      {
        property: "og:description",
        content: "Session clocks, macro calendar, quotes and options analytics in a single scroll.",
      },
    ],
  }),
  component: Dashboard,
});

function Rail() {
  return (
    <aside className="sticky top-0 hidden h-screen w-14 shrink-0 flex-col items-center justify-between border-r-2 border-foreground bg-sidebar py-6 lg:flex">
      <span className="num text-xs font-bold">TJ</span>
      <div className="flex flex-col items-center gap-3">
        {SESSIONS.map((s) => (
          <span
            key={s.key}
            title={s.label}
            className="h-6 w-1.5 rounded-full"
            style={{ backgroundColor: s.color }}
          />
        ))}
      </div>
      <span className="text-[0.6rem] tracking-[0.3em] [writing-mode:vertical-rl]">DESK</span>
    </aside>
  );
}

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Rail />
      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-8 sm:px-8">
        <header className="flex items-end justify-between border-b-2 border-foreground pb-4">
          <h1 className="text-2xl font-bold tracking-[0.25em] sm:text-3xl">TRADING JOURNAL</h1>
          <p className="text-[0.65rem] tracking-[0.25em] text-muted-foreground">SESSIONS · MACRO · FLOW</p>
        </header>

        <SessionClocks />
        <QuoteBoard />
        <MonthCalendar />

        <section className="rounded-lg border border-foreground/25 bg-card p-5">
          <h2 className="mb-4 text-xs tracking-[0.3em] text-muted-foreground">
            SPX · WEEKLY CANDLES WITH DEALER LEVELS
          </h2>
          <SpxChart />
          <div className="mt-5">
            <OptionsPanel />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-foreground/25 bg-card p-5">
            <RangeChart seed={11} base={5720} title="OPENING RANGE · 09:30–10:00 ET" />
          </div>
          <div className="rounded-lg border border-foreground/25 bg-card p-5">
            <RangeChart seed={29} base={5715} title="NEW DAY OPENING RANGE · 00:00–00:30 ET" />
          </div>
        </section>
      </main>
    </div>
  );
}
