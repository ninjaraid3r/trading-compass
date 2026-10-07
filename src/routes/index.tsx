import { createFileRoute } from "@tanstack/react-router";
import { SessionClocks } from "@/components/dashboard/SessionClocks";
import { QuoteBoard } from "@/components/dashboard/QuoteBoard";
import { MonthCalendar } from "@/components/dashboard/MonthCalendar";
import { OptionsPanel } from "@/components/dashboard/OptionsPanel";
import { SpxChart, SymbolChart, TIMEFRAMES, LiveDot } from "@/components/dashboard/Charts";
import { BondsPanel } from "@/components/dashboard/BondsPanel";
import { FedMeter } from "@/components/dashboard/FedMeter";
import { MarketPositioning } from "@/components/dashboard/MarketPositioning";
import { SeasonalityPanel } from "@/components/dashboard/SeasonalityPanel";
import { TrumpWire } from "@/components/dashboard/TrumpWire";
import { SettingsButton } from "@/components/dashboard/SettingsButton";
import { Button } from "@/components/ui/button";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [spxTf, setSpxTf] = useState(86400);


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
        {settings.showFedMeter && <FedMeter />}
        {settings.showCalendar && <MonthCalendar />}

        {settings.showSpx && (
        <section className="rounded-lg border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs tracking-[0.3em] text-muted-foreground">
              SPX · CANDLES WITH DEALER LEVELS
            </h2>
            <Button type="button" size="sm" variant={showWalls ? "default" : "outline"} onClick={() => setShowWalls((v) => !v)} aria-pressed={showWalls} className="text-[0.7rem] tracking-[0.15em]">
              {showWalls ? "PUT / CALL WALLS: ON" : "PUT / CALL WALLS: OFF"}
            </Button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {TIMEFRAMES.map((t) => (
              <Button key={t.sec} type="button" size="sm" variant={spxTf === t.sec ? "default" : "outline"} onClick={() => setSpxTf(t.sec)} aria-pressed={spxTf === t.sec} className="h-7 px-2 text-[0.65rem] tracking-[0.1em]">
                {t.label}
              </Button>
            ))}
          </div>
          <SpxChart showWalls={showWalls} intervalSec={spxTf} />
          <div className="mt-5">
            <OptionsPanel />
          </div>
        </section>
        )}

        {settings.showSymbols && (
        <section className="rounded-lg border border-foreground/25 bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs tracking-[0.3em] text-muted-foreground">NQ · ES · YM</h2>
            <div className="flex flex-wrap gap-1">
              {TIMEFRAMES.map((t) => (
                <Button
                  key={t.sec}
                  type="button"
                  size="sm"
                  variant={tf === t.sec ? "default" : "outline"}
                  onClick={() => setTf(t.sec)}
                  aria-pressed={tf === t.sec}
                  className="h-7 px-2 text-[0.65rem] tracking-[0.1em]"
                >
                  {t.label}
                </Button>
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
        <MarketPositioning />
        {settings.showSeasonality && <SeasonalityPanel />}
        <TrumpWire />
      </main>
    </div>
  );
}
