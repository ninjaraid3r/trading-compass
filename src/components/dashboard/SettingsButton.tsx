import { Settings as SettingsIcon } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSettings, type Settings } from "@/lib/settings";

const ROWS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: "clock24h", label: "24-hour clocks", hint: "Show PST/EST time without AM/PM" },
  { key: "showSeconds", label: "Show seconds", hint: "Display the seconds counter" },
  { key: "showQuotes", label: "Quote board", hint: "Futures, FX, commodities and VIX" },
  { key: "showCalendar", label: "Macro calendar", hint: "Monthly grid with event badges" },
  { key: "showOpeningRange", label: "Opening range charts", hint: "ORB and NDOR panels" },
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
      <SheetContent className="bg-card">
        <SheetHeader>
          <SheetTitle className="tracking-[0.2em]">SETTINGS</SheetTitle>
          <SheetDescription>Desk preferences are saved on this device.</SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="space-y-5 px-4">
          {ROWS.map((row) => (
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
