import { SESSIONS, partsIn, type SessionDef } from "./sessions";

export type RangeBar = { time: number; high: number; low: number; close: number };
export type SessionRange = {
  id: string;
  session: SessionDef;
  start: number;
  end: number;
  high: number | null;
  low: number | null;
  points: number | null;
  bars: number;
  active: boolean;
};

export function easternDay(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}

export function minuteInEasternDay(time: number): number {
  const { hour, minute, second } = partsIn(new Date(time * 1000), "America/New_York");
  return hour * 60 + minute + second / 60;
}

export function currentDayBars(bars: RangeBar[], now: Date): RangeBar[] {
  const day = easternDay(now);
  const unique = new Map<number, RangeBar>();
  for (const bar of bars) {
    if (bar.time * 1000 > now.getTime() || easternDay(new Date(bar.time * 1000)) !== day) continue;
    if (![bar.high, bar.low, bar.close].every(Number.isFinite) || bar.high < bar.low) continue;
    unique.set(bar.time, bar);
  }
  return [...unique.values()].sort((a, b) => a.time - b.time);
}

/** Split overnight Asia at midnight; never mix yesterday's prices into today's ranges. */
export function calculateSessionRanges(bars: RangeBar[], now: Date): SessionRange[] {
  const today = currentDayBars(bars, now).map((bar) => ({ ...bar, minute: minuteInEasternDay(bar.time) }));
  const { hour, minute } = partsIn(now, "America/New_York");
  const minutesNow = hour * 60 + minute;
  return SESSIONS.flatMap((session) => {
    const windows = session.start > session.end
      ? [{ start: 0, end: session.end, suffix: "AM" }, { start: session.start, end: 1440, suffix: "PM" }]
      : [{ start: session.start, end: session.end, suffix: "" }];
    return windows.map(({ start, end, suffix }) => {
      const matched = today.filter((bar) => bar.minute >= start && bar.minute < end);
      const high = matched.length ? Math.max(...matched.map((bar) => bar.high)) : null;
      const low = matched.length ? Math.min(...matched.map((bar) => bar.low)) : null;
      return {
        id: `${session.key}${suffix ? `-${suffix}` : ""}`, session, start, end,
        high, low, points: high !== null && low !== null ? high - low : null,
        bars: matched.length, active: minutesNow >= start && minutesNow < end,
      };
    });
  }).sort((a, b) => a.start - b.start);
}

export function sessionTimeLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}