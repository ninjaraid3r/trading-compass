/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { calculateSessionRanges, currentDayBars, easternDay } from "./session-ranges";

const bar = (iso: string, high: number, low: number) => ({ time: Date.parse(iso) / 1000, high, low, close: low });
const now = new Date("2026-10-09T23:59:00-04:00");

describe("daily session ranges", () => {
  test("includes only the current Eastern day, not the UTC date or yesterday", () => {
    const bars = [bar("2026-10-08T23:59:00-04:00", 999, 1), bar("2026-10-09T23:30:00-04:00", 110, 100)];
    expect(currentDayBars(bars, now)).toEqual([bars[1]]);
    expect(easternDay(new Date("2026-10-10T02:00:00Z"))).toBe("2026-10-09");
  });
  test("NY AM runs 9:30 to 11:30 and points equal measured high minus low", () => {
    const ranges = calculateSessionRanges([
      bar("2026-10-09T09:29:00-04:00", 999, 1),
      bar("2026-10-09T09:30:00-04:00", 110, 100),
      bar("2026-10-09T11:29:00-04:00", 125, 95),
      bar("2026-10-09T11:30:00-04:00", 999, 1),
    ], now);
    expect(ranges.find((range) => range.id === "NYAM")).toMatchObject({ high: 125, low: 95, points: 30, bars: 2 });
  });
  test("London and premarket both count overlapping prices independently", () => {
    const ranges = calculateSessionRanges([bar("2026-10-09T08:00:00-04:00", 150, 120)], now);
    expect(ranges.find((range) => range.id === "LONDON")?.points).toBe(30);
    expect(ranges.find((range) => range.id === "PREMARKET")?.points).toBe(30);
  });
  test("keeps midnight and evening Asia fragments separate", () => {
    const ranges = calculateSessionRanges([
      bar("2026-10-09T00:30:00-04:00", 110, 100), bar("2026-10-09T18:30:00-04:00", 210, 180),
    ], now);
    expect(ranges.find((range) => range.id === "ASIA-AM")?.points).toBe(10);
    expect(ranges.find((range) => range.id === "ASIA-PM")?.points).toBe(30);
  });
  test("power hour and MOC overlap from 3:50 to 4 PM", () => {
    const ranges = calculateSessionRanges([
      bar("2026-10-09T15:49:00-04:00", 200, 100), bar("2026-10-09T15:50:00-04:00", 160, 140),
      bar("2026-10-09T16:00:00-04:00", 999, 1),
    ], now);
    expect(ranges.find((range) => range.id === "POWERHOUR")?.points).toBe(100);
    expect(ranges.find((range) => range.id === "MOC")?.points).toBe(20);
  });
  test("empty day has no invented levels and midnight resets completed ranges", () => {
    const ranges = calculateSessionRanges([bar("2026-10-09T10:00:00-04:00", 200, 100)], new Date("2026-10-10T00:00:00-04:00"));
    expect(ranges.every((range) => range.high === null && range.points === null)).toBe(true);
  });
  test("Eastern day follows daylight saving time", () => {
    expect(easternDay(new Date("2026-11-02T04:30:00Z"))).toBe("2026-11-01");
    expect(easternDay(new Date("2026-07-02T04:30:00Z"))).toBe("2026-07-02");
  });
});