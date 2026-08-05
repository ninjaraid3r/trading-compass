/**
 * Deterministic market data model for the journal dashboard.
 *
 * Live feeds (FRED economic releases, Tastytrade options analytics) plug into
 * these same shapes once API credentials are connected.
 */

export type Quote = {
  symbol: string;
  name: string;
  last: number;
  change: number;
  changePct: number;
  volume: number;
};

export type QuoteGroup = { title: string; quotes: Quote[] };

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const daySeed = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

function mk(symbol: string, name: string, base: number, r: () => number): Quote {
  const changePct = (r() - 0.45) * 1.6;
  const change = (base * changePct) / 100;
  return {
    symbol,
    name,
    last: Number((base + change).toFixed(base > 1000 ? 2 : 4)),
    change: Number(change.toFixed(base > 1000 ? 2 : 4)),
    changePct: Number(changePct.toFixed(2)),
    volume: Math.round(r() * 1_800_000 + 120_000),
  };
}

export function getQuoteGroups(now: Date): QuoteGroup[] {
  const r = rng(daySeed(now) + now.getHours());
  return [
    {
      title: "Index Futures",
      quotes: [
        mk("NQ", "Nasdaq 100", 20450, r),
        mk("ES", "S&P 500", 5720, r),
        mk("YM", "Dow 30", 42180, r),
        mk("NIFTY50", "India 50", 24310, r),
        mk("FESX", "EuroStoxx 50", 4980, r),
        mk("GER40", "DAX", 18620, r),
      ],
    },
    {
      title: "FX & Rates",
      quotes: [
        mk("6E", "Euro FX Future", 1.0842, r),
        mk("DXY", "Dollar Index", 104.32, r),
        mk("EURUSD", "Euro", 1.0839, r),
        mk("GBPUSD", "Cable", 1.2714, r),
        mk("USDJPY", "Yen", 151.42, r),
        mk("AUDUSD", "Aussie", 0.6612, r),
      ],
    },
    {
      title: "Commodities",
      quotes: [
        mk("CL", "Crude Oil", 78.44, r),
        mk("GC", "Gold", 2338.6, r),
        mk("SI", "Silver", 27.35, r),
        mk("NG", "Nat Gas", 2.612, r),
        mk("HG", "Copper", 4.412, r),
        mk("ZC", "Corn", 442.5, r),
      ],
    },
    {
      title: "Volatility",
      quotes: [mk("VIX", "Options VIX", 14.62, r), mk("VX", "ES Futures VIX", 15.21, r)],
    },
  ];
}

/* ---------------- Economic / expiration calendar ---------------- */

export type EventTag = "H" | "M" | "L" | "K" | "O" | "V" | "FED";

export type DayEvent = {
  tag: EventTag;
  time: string;
  title: string;
  region: "US" | "WORLD";
  detail: string;
};

const US_HIGH = [
  "Non-Farm Payrolls",
  "CPI m/m",
  "FOMC Rate Decision",
  "Core PCE Price Index",
  "ISM Manufacturing PMI",
];
const US_MED = ["Retail Sales", "PPI m/m", "Durable Goods Orders", "Consumer Confidence", "Housing Starts"];
const US_LOW = ["Wholesale Inventories", "API Crude Stock", "Baker Hughes Rig Count", "Redbook Index"];
const KEY_RELEASES = ["Unemployment Claims", "GDP Advance", "JOLTS Job Openings"];
const WORLD = [
  { title: "China Caixin Manufacturing PMI", detail: "Beijing – factory activity read for the mainland." },
  { title: "ECB Press Conference", detail: "Frankfurt – policy tone for the euro bloc." },
  { title: "BoJ Policy Statement", detail: "Tokyo – yield curve control guidance." },
  { title: "UK Employment Change", detail: "London – labour market update." },
  { title: "China Industrial Production", detail: "Beijing – y/y output growth." },
  { title: "German Ifo Business Climate", detail: "Munich – sentiment survey." },
];

function nthWeekday(year: number, month: number, weekday: number, n: number) {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

export function getMonthEvents(year: number, month: number): Record<number, DayEvent[]> {
  const days = new Date(year, month + 1, 0).getDate();
  const opex = nthWeekday(year, month, 5, 3);
  const map: Record<number, DayEvent[]> = {};

  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const r = rng(daySeed(date));
    const list: DayEvent[] = [];

    if (dow === 0 || dow === 6) {
      map[d] = list;
      continue;
    }

    if (r() > 0.68)
      list.push({
        tag: "H",
        time: "08:30 ET",
        title: US_HIGH[Math.floor(r() * US_HIGH.length)]!,
        region: "US",
        detail: "High impact – expect elevated volatility into the release.",
      });
    if (r() > 0.5)
      list.push({
        tag: "M",
        time: "10:00 ET",
        title: US_MED[Math.floor(r() * US_MED.length)]!,
        region: "US",
        detail: "Medium impact – can shift intraday trend.",
      });
    if (r() > 0.45)
      list.push({
        tag: "L",
        time: "14:00 ET",
        title: US_LOW[Math.floor(r() * US_LOW.length)]!,
        region: "US",
        detail: "Low impact – background data point.",
      });
    if (dow === 4)
      list.push({
        tag: "K",
        time: "08:30 ET",
        title: KEY_RELEASES[Math.floor(r() * KEY_RELEASES.length)]!,
        region: "US",
        detail: "Key weekly release tracked by the desk.",
      });
    if (d === opex)
      list.push({
        tag: "O",
        time: "16:00 ET",
        title: "Monthly Options Expiration",
        region: "US",
        detail: "Third Friday – monthly equity and index option expiry.",
      });
    if (dow === 3)
      list.push({
        tag: "V",
        time: "09:30 ET",
        title: "VIX Expiration",
        region: "US",
        detail: "Weekly VIX futures/options settlement.",
      });
    if (r() > 0.85)
      list.push({
        tag: "FED",
        time: "13:00 ET",
        title: "Fed Chair Speech",
        region: "US",
        detail: "Prepared remarks followed by Q&A – headline risk.",
      });

    for (let i = 0; i < 2; i++) {
      if (r() > 0.55) {
        const w = WORLD[Math.floor(r() * WORLD.length)]!;
        list.push({ tag: r() > 0.5 ? "H" : "M", time: "03:00 ET", title: w.title, region: "WORLD", detail: w.detail });
      }
    }

    map[d] = list;
  }
  return map;
}

export const TAG_STYLE: Record<EventTag, { color: string; label: string }> = {
  H: { color: "var(--tag-high)", label: "High impact" },
  M: { color: "var(--tag-medium)", label: "Medium impact" },
  L: { color: "var(--tag-low)", label: "Low impact" },
  K: { color: "var(--tag-key)", label: "Key release" },
  O: { color: "var(--tag-opex)", label: "Options expiration" },
  V: { color: "var(--tag-vix)", label: "VIX expiration" },
  FED: { color: "var(--tag-fed)", label: "Fed chair speech" },
};

/* ---------------- Price series ---------------- */

export type Candle = { time: number; open: number; high: number; low: number; close: number };

export function getSpxWeek(now: Date): Candle[] {
  const r = rng(daySeed(now));
  const out: Candle[] = [];
  let price = 5710;
  // 5 sessions of 30-min bars, 13 bars per session
  const start = Math.floor(now.getTime() / 1000) - 5 * 24 * 3600;
  for (let i = 0; i < 65; i++) {
    const open = price;
    const drift = (r() - 0.48) * 12;
    const close = open + drift;
    const high = Math.max(open, close) + r() * 5;
    const low = Math.min(open, close) - r() * 5;
    out.push({
      time: start + i * 1800,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
    price = close;
  }
  return out;
}

export type RangeSeries = { time: number; high: number; low: number }[];

export function getRangeSeries(now: Date, seedOffset: number, base: number): RangeSeries {
  const r = rng(daySeed(now) + seedOffset);
  const out: RangeSeries = [];
  const start = Math.floor(now.getTime() / 1000) - 3600;
  let hi = base + 6;
  let lo = base - 6;
  for (let i = 0; i < 30; i++) {
    hi += (r() - 0.4) * 1.4;
    lo -= (r() - 0.4) * 1.4;
    out.push({ time: start + i * 60, high: Number(hi.toFixed(2)), low: Number(lo.toFixed(2)) });
  }
  return out;
}

export function getOptionsAnalytics(now: Date) {
  const r = rng(daySeed(now) + 7);
  const gamma = Number(((r() - 0.4) * 900).toFixed(0));
  const spot = 5720;
  return {
    ivRank: Math.round(r() * 100),
    ivPercentile: Math.round(r() * 100),
    netGamma: gamma,
    regime: gamma >= 0 ? ("Positive Gamma" as const) : ("Negative Gamma" as const),
    callWall: Math.round((spot + 40 + r() * 60) / 5) * 5,
    putWall: Math.round((spot - 40 - r() * 60) / 5) * 5,
    expectedMove1D: Number((0.5 + r() * 0.7).toFixed(2)),
    expectedMove5D: Number((1.3 + r() * 1.6).toFixed(2)),
    spot,
  };
}
