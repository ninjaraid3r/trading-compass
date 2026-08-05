import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Settings = {
  clock24h: boolean;
  showSeconds: boolean;
  showQuotes: boolean;
  showCalendar: boolean;
  showOpeningRange: boolean;
};

const DEFAULTS: Settings = {
  clock24h: false,
  showSeconds: true,
  showQuotes: true,
  showCalendar: true,
  showOpeningRange: true,
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
