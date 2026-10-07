import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Settings = {
  showSeconds: boolean;
  showQuotes: boolean;
  showCalendar: boolean;
  showSpx: boolean;
  showSymbols: boolean;
  showBonds: boolean;
  showFedMeter: boolean;
  showSeasonality: boolean;
  showCot: boolean;
  showDarkPool: boolean;
  showTrumpWire: boolean;
  showTrumpSpeech: boolean;
  showRail: boolean;
  liveSync: boolean;
  refreshMs: number;
};

const DEFAULTS: Settings = {
  showSeconds: true,
  showQuotes: true,
  showCalendar: true,
  showSpx: true,
  showSymbols: true,
  showBonds: true,
  showFedMeter: true,
  showSeasonality: true,
  showCot: true,
  showDarkPool: true,
  showTrumpWire: true,
  showTrumpSpeech: true,
  showRail: true,
  liveSync: true,
  refreshMs: 1000,
};

const STORAGE_KEY = "tj-desk-settings";

type Ctx = { settings: Settings; setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void };

const SettingsContext = createContext<Ctx>({ settings: DEFAULTS, setSetting: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      settings,
      setSetting: (key, val) =>
        setSettings((prev) => {
          const next = { ...prev, [key]: val };
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* ignore quota errors */
          }
          return next;
        }),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
