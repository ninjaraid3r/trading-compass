import { createServerFn } from "@tanstack/react-start";

export type LiveCandle = { time: number; open: number; high: number; low: number; close: number };

export type LiveSeries = {
  symbol: string;
  candles: LiveCandle[];
  last: number | null;
  previousClose: number | null;
};

/** Map a bar interval in seconds to the closest Yahoo interval + lookback range. */
export function yahooParams(intervalSec: number): { interval: string; range: string } {
  if (intervalSec <= 60) return { interval: "1m", range: "1d" };
  if (intervalSec <= 300) return { interval: "5m", range: "5d" };
  if (intervalSec <= 900) return { interval: "15m", range: "1mo" };
  if (intervalSec <= 1800) return { interval: "30m", range: "1mo" };
  if (intervalSec <= 5400) return { interval: "60m", range: "3mo" };
  if (intervalSec <= 14400) return { interval: "60m", range: "6mo" };
  if (intervalSec <= 86400) return { interval: "1d", range: "1y" };
  return { interval: "1wk", range: "5y" };
}

type YahooChart = {
  chart?: {
    result?: {
      meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
      timestamp?: number[];
      indicators?: {
        quote?: { open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[] }[];
      };
    }[];
  };
};

/** Real OHLC bars from the public Yahoo Finance chart endpoint. */
export const getLiveSeries = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol: string; interval: string; range: string }) => input)
  .handler(async ({ data }): Promise<LiveSeries> => {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(data.symbol)}` +
      `?interval=${encodeURIComponent(data.interval)}&range=${encodeURIComponent(data.range)}`;

    const empty: LiveSeries = { symbol: data.symbol, candles: [], last: null, previousClose: null };
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } });
      if (!res.ok) return empty;
      const json = (await res.json()) as YahooChart;
      const result = json.chart?.result?.[0];
      const q = result?.indicators?.quote?.[0];
      const ts = result?.timestamp ?? [];
      if (!q || ts.length === 0) return empty;

      const candles: LiveCandle[] = [];
      for (let i = 0; i < ts.length; i++) {
        const o = q.open?.[i];
        const h = q.high?.[i];
        const l = q.low?.[i];
        const c = q.close?.[i];
        if (o == null || h == null || l == null || c == null) continue;
        candles.push({ time: ts[i]!, open: o, high: h, low: l, close: c });
      }
      return {
        symbol: data.symbol,
        candles,
        last: result?.meta?.regularMarketPrice ?? candles[candles.length - 1]?.close ?? null,
        previousClose: result?.meta?.chartPreviousClose ?? result?.meta?.previousClose ?? null,
      };
    } catch {
      return empty;
    }
  });
