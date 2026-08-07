import { Settings as SettingsIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettings, type Settings } from "@/lib/settings";

type BoolKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

type Row = { key: BoolKey; label: string; hint: string };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "CLOCKS",
    rows: [
      { key: "clock24h", label: "24-hour clocks", hint: "Show PST/EST time without AM/PM" },
      { key: "showSeconds", label: "Show seconds", hint: "Display the seconds counter" },
    ],
  },
  {
    title: "DATA SYNC",
    rows: [{ key: "liveSync", label: "Live chart sync", hint: "Stream ticks into the newest candle" }],
  },
  {
    title: "SECTIONS",
    rows: [
      { key: "showRail", label: "Session rail", hint: "Left colour rail with session markers" },
      { key: "showQuotes", label: "Quote board", hint: "Futures, FX, commodities and VIX" },
      { key: "showCalendar", label: "Macro calendar", hint: "Monthly grid with event badges" },
      { key: "showSpx", label: "SPX & options flow", hint: "Weekly candles, walls and gamma" },
      { key: "showMultiTimeframe", label: "Multi-timeframe row", hint: "15s / 30s / 1m ES charts" },
      { key: "showSymbols", label: "NQ · ES · YM charts", hint: "Coloured candle comparison row" },
      { key: "showBonds", label: "Bonds vs yields", hint: "Curve table and desk opinion" },
      { key: "showFedMeter", label: "Fed meter", hint: "Hawkish / dovish sentiment gauge" },
    ],
  },
];

const SPEEDS = [
  { label: "FAST", ms: 500 },
  { label: "NORMAL", ms: 1000 },
  { label: "SLOW", ms: 3000 },
];

export function SettingsButton() {
  const { settings, setSetting } = useSettings();

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Open settings"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-foreground text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        <SettingsIcon size={16} />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="tracking-[0.2em]">SETTINGS</SheetTitle>
          <SheetDescription>Desk preferences are saved on this device.</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-8">
          {GROUPS.map((group) => (
            <div key={group.title} className="space-y-4">
              <Separator />
              <p className="text-[0.65rem] font-bold tracking-[0.3em] text-muted-foreground">{group.title}</p>
              {group.rows.map((row) => (
                <div key={row.key} className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor={row.key} className="text-sm font-medium">
                      {row.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{row.hint}</p>
                  </div>
                  <Switch
                    id={row.key}
                    checked={settings[row.key]}
                    onCheckedChange={(v) => setSetting(row.key, v)}
                  />
                </div>
              ))}
              {group.title === "DATA SYNC" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tick speed</Label>
                  <div className="flex gap-1">
                    {SPEEDS.map((s) => (
                      <button
                        key={s.ms}
                        type="button"
                        onClick={() => setSetting("refreshMs", s.ms)}
                        aria-pressed={settings.refreshMs === s.ms}
                        className={`flex-1 rounded border px-2 py-1 text-[0.65rem] font-semibold tracking-[0.15em] transition-colors ${
                          settings.refreshMs === s.ms
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/40 text-foreground hover:bg-foreground/10"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
