import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveSeries, yahooParams, type LiveSeries } from "@/lib/market-live.functions";

/**
 * Real OHLC bars for a Yahoo ticker at the closest supported interval.
 * Polls while live sync is on; returns empty candles when the feed is unreachable
 * so callers can fall back to the deterministic model.
 */
export function useLiveSeries(ticker: string | undefined, intervalSec: number, live: boolean, refreshMs: number) {
  const fetchSeries = useServerFn(getLiveSeries);
  const { interval, range } = yahooParams(intervalSec);

  return useQuery<LiveSeries>({
    queryKey: ["live-series", ticker, interval, range],
    enabled: Boolean(ticker),
    queryFn: () => fetchSeries({ data: { symbol: ticker!, interval, range } }),
    refetchInterval: live ? Math.max(5000, refreshMs) : false,
    staleTime: 5000,
  });
}
