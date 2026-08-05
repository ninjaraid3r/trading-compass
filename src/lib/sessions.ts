export type SessionKey =
  | "ASIA"
  | "LONDON"
  | "PREMARKET"
  | "NYAM"
  | "NYLUNCH"
  | "NYPM"
  | "POWERHOUR"
  | "MOC"
  | "CLOSED";

export type SessionDef = {
  key: SessionKey;
  label: string;
  /** minutes from ET midnight */
  start: number;
  end: number;
  /** css var token */
  color: string;
  priority: number;
};

const m = (h: number, min = 0) => h * 60 + min;

export const SESSIONS: SessionDef[] = [
  { key: "ASIA", label: "ASIA", start: m(18), end: m(1, 30), color: "var(--session-asia)", priority: 1 },
  { key: "LONDON", label: "LONDON", start: m(1, 30), end: m(11), color: "var(--session-london)", priority: 2 },
  { key: "PREMARKET", label: "PRE-MARKET", start: m(6), end: m(9, 30), color: "var(--session-premarket)", priority: 3 },
  { key: "NYAM", label: "NY AM", start: m(9, 30), end: m(11, 30), color: "var(--session-nyam)", priority: 4 },
  { key: "NYLUNCH", label: "NY LUNCH", start: m(11, 30), end: m(13, 30), color: "var(--session-nylunch)", priority: 5 },
  { key: "NYPM", label: "NY PM", start: m(13, 30), end: m(15), color: "var(--session-nypm)", priority: 6 },
  { key: "POWERHOUR", label: "POWER HOUR", start: m(15), end: m(16), color: "var(--session-power)", priority: 7 },
  { key: "MOC", label: "MARKET ON CLOSE", start: m(15, 50), end: m(16), color: "var(--session-moc)", priority: 8 },
];

const CLOSED: SessionDef = {
  key: "CLOSED",
  label: "MARKET CLOSED",
  start: 0,
  end: 0,
  color: "var(--session-closed)",
  priority: 0,
};

function inWindow(minutes: number, s: SessionDef) {
  if (s.start <= s.end) return minutes >= s.start && minutes < s.end;
  // wraps midnight
  return minutes >= s.start || minutes < s.end;
}

export function partsIn(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const hour = Number(p["hour"]) % 24;
  return { hour, minute: Number(p["minute"]), second: Number(p["second"]) };
}

export function currentSession(date: Date): SessionDef {
  const { hour, minute } = partsIn(date, "America/New_York");
  const mins = hour * 60 + minute;
  const active = SESSIONS.filter((s) => inWindow(mins, s));
  if (!active.length) return CLOSED;
  return active.reduce((a, b) => (b.priority > a.priority ? b : a));
}

export function upcomingSessions(date: Date) {
  const { hour, minute } = partsIn(date, "America/New_York");
  const mins = hour * 60 + minute;
  return SESSIONS.map((s) => ({ ...s, active: inWindow(mins, s) }));
}
