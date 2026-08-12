import { createFileRoute } from "@tanstack/react-router";
import { SessionClocks } from "@/components/dashboard/SessionClocks";
import { QuoteBoard } from "@/components/dashboard/QuoteBoard";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { OptionsPanel } from "@/components/dashboard/OptionsPanel";
import { SpxChart, TimeframeChart, SymbolChart, TIMEFRAMES, LiveDot } from "@/components/dashboard/Charts";
import { BondsPanel } from "@/components/dashboard/BondsPanel";
import { FedMeter } from "@/components/dashboard/FedMeter";
import { SettingsButton } from "@/components/dashboard/SettingsButton";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { SESSIONS } from "@/lib/sessions";
import { useState } from "react";

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
    <SettingsProvider>
      <DashboardBody />
    </SettingsProvider>
  );
}

const SYMBOLS = [
  { symbol: "NQ · NASDAQ 100", base: 20450, color: "#0b7fd4", ticker: "NQ=F" },
  { symbol: "ES · S&P 500", base: 5720, color: "#c0392b", ticker: "ES=F" },
  { symbol: "YM · DOW 30", base: 42180, color: "#1c3f94", ticker: "YM=F" },
];

function DashboardBody() {
  const { settings } = useSettings();
  const [showWalls, setShowWalls] = useState(true);
  const [tf, setTf] = useState(86400);


  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {settings.showRail && <Rail />}
      <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-8 sm:px-8">
        <header className="flex items-end justify-between border-b-2 border-foreground pb-4">
          <h1 className="text-2xl font-bold tracking-[0.25em] sm:text-3xl">TRADING JOURNAL</h1>
          <div className="flex items-center gap-4">
            <p className="hidden text-[0.65rem] tracking-[0.25em] text-muted-foreground sm:block">
              SESSIONS · MACRO · FLOW
            </p>
            {settings.liveSync && <LiveDot />}
            <SettingsButton />
          </div>
        </header>

        <SessionClocks />
        {settings.showQuotes && <QuoteBoard />}
        {settings.showCalendar && <MonthCalendar />}

        {settings.showSpx && (
        <section className="rounded-lg border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs tracking-[0.3em] text-muted-foreground">
              SPX · WEEKLY CANDLES WITH DEALER LEVELS
            </h2>
            <button
              type="button"
              onClick={() => setShowWalls((v) => !v)}
              aria-pressed={showWalls}
              className={`rounded-md border px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.15em] transition-colors ${
                showWalls
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/50 text-foreground hover:bg-foreground/10"
              }`}
            >
              {showWalls ? "PUT / CALL WALLS: ON" : "PUT / CALL WALLS: OFF"}
            </button>
          </div>
          <SpxChart showWalls={showWalls} />
          <div className="mt-5">
            <OptionsPanel />
          </div>
        </section>
        )}

        {settings.showMultiTimeframe && (
        <section className="rounded-lg border border-foreground/25 bg-card p-5">
          <h2 className="mb-4 text-xs tracking-[0.3em] text-muted-foreground">
            ES · MULTI-TIMEFRAME COMPARISON
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TimeframeChart intervalSec={15} title="15 SECOND" showWalls={showWalls} />
            <TimeframeChart intervalSec={30} title="30 SECOND" showWalls={showWalls} />
            <TimeframeChart intervalSec={60} title="1 MINUTE" showWalls={showWalls} />
          </div>
        </section>
        )}

        {settings.showSymbols && (
        <section className="rounded-lg border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs tracking-[0.3em] text-muted-foreground">NQ · ES · YM</h2>
            <div className="flex flex-wrap gap-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.sec}
                  type="button"
                  onClick={() => setTf(t.sec)}
                  aria-pressed={tf === t.sec}
                  className={`rounded border px-2 py-1 text-[0.65rem] font-semibold tracking-[0.1em] transition-colors ${
                    tf === t.sec
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/40 text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {SYMBOLS.map((s) => (
              <SymbolChart key={s.symbol} {...s} intervalSec={tf} />
            ))}
          </div>
        </section>
        )}

        {settings.showBonds && <BondsPanel />}
        {settings.showFedMeter && <FedMeter />}



      </main>
    </div>
  );
}
