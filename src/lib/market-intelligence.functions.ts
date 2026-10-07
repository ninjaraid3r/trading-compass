import { createServerFn } from "@tanstack/react-start";

export type CotRow = {
  symbol: string;
  market: string;
  reportDate: string;
  net: number;
  weeklyChange: number;
  openInterest: number;
  netShare: number;
  bias: "Bullish" | "Bearish" | "Neutral";
};

export type DarkPoolRow = {
  symbol: string;
  weekStart: string;
  publishedDate: string;
  shares: number;
  trades: number;
  notional: number;
  averageTrade: number;
  topVenue: string;
};

export type TrumpPost = { id: string; text: string; timestamp: string; url: string; source: "Truth Social" | "X" };
export type TrumpWire = {
  posts: TrumpPost[];
  sentiment: { score: number; label: string; themes: string[] };
  nextSpeech: { title: string; timestamp: string | null; venue: string; channel: string; url: string };
  updatedAt: string;
};

const CFTC_URL = "https://publicreporting.cftc.gov/resource/gpe5-46if.json";
const FINRA_URL = "https://api.finra.org/data/group/otcmarket/name/weeklysummary";
const TRUTH_URL = "https://www.trumpstruth.org/?per_page=8";
const MARKET_CODES = [
  ["ES", "E-mini S&P 500", "13874A"],
  ["NQ", "E-mini Nasdaq 100", "209742"],
  ["YM", "E-mini Dow", "124603"],
  ["VIX", "CBOE VIX", "1170E1"],
] as const;

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textContent(html: string) {
  return html
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export const getPositioningData = createServerFn({ method: "GET" }).handler(async () => {
  const cot = await Promise.all(
    MARKET_CODES.map(async ([symbol, market, code]): Promise<CotRow | null> => {
      const endpoint = symbol === "VIX" ? "https://publicreporting.cftc.gov/resource/6dca-aqww.json" : CFTC_URL;
      const params = new URLSearchParams({
        cftc_contract_market_code: code,
        "$limit": "2",
        "$order": "report_date_as_yyyy_mm_dd DESC",
      });
      try {
        const response = await fetch(`${endpoint}?${params}`, { headers: { Accept: "application/json" } });
        if (!response.ok) return null;
        const rows = (await response.json()) as Record<string, string>[];
        const row = rows[0];
        if (!row) return null;
        const long = number(row["lev_money_positions_long"] ?? row["noncomm_positions_long_all"]);
        const short = number(row["lev_money_positions_short"] ?? row["noncomm_positions_short_all"]);
        const previous = rows[1];
        const previousNet = previous
          ? number(previous["lev_money_positions_long"] ?? previous["noncomm_positions_long_all"]) -
            number(previous["lev_money_positions_short"] ?? previous["noncomm_positions_short_all"])
          : 0;
        const net = long - short;
        const openInterest = number(row["open_interest_all"]);
        const netShare = openInterest ? (net / openInterest) * 100 : 0;
        return {
          symbol,
          market,
          reportDate: row["report_date_as_yyyy_mm_dd"] ?? "",
          net,
          weeklyChange: net - previousNet,
          openInterest,
          netShare,
          bias: netShare > 1 ? "Bullish" : netShare < -1 ? "Bearish" : "Neutral",
        };
      } catch {
        return null;
      }
    }),
  );

  const cutoff = new Date(Date.now() - 50 * 86400000).toISOString().slice(0, 10);
  const darkPool = await Promise.all(
    ["SPY", "QQQ", "IWM"].map(async (symbol): Promise<DarkPoolRow | null> => {
      const body = {
        limit: 5000,
        compareFilters: [
          { fieldName: "summaryTypeCode", fieldValue: "ATS_W_SMBL_FIRM", compareType: "EQUAL" },
          { fieldName: "issueSymbolIdentifier", fieldValue: symbol, compareType: "EQUAL" },
          { fieldName: "weekStartDate", fieldValue: cutoff, compareType: "GREATER_THAN_OR_EQUAL" },
        ],
      };
      try {
        const response = await fetch(FINRA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) return null;
        const rows = (await response.json()) as Record<string, unknown>[];
        const latestWeek = rows.map((row) => String(row["weekStartDate"] ?? "")).sort().at(-1);
        const latest = rows.filter((row) => row["weekStartDate"] === latestWeek);
        if (!latestWeek || latest.length === 0) return null;
        const shares = latest.reduce((sum, row) => sum + number(row["totalWeeklyShareQuantity"]), 0);
        const trades = latest.reduce((sum, row) => sum + number(row["totalWeeklyTradeCount"]), 0);
        const notional = latest.reduce((sum, row) => sum + number(row["totalNotionalSum"]), 0);
        const top = latest.slice().sort((a, b) => number(b["totalWeeklyShareQuantity"]) - number(a["totalWeeklyShareQuantity"]))[0];
        return {
          symbol,
          weekStart: latestWeek,
          publishedDate: String(latest.map((row) => row["initialPublishedDate"] ?? "").sort().at(-1) ?? ""),
          shares,
          trades,
          notional,
          averageTrade: trades ? shares / trades : 0,
          topVenue: String(top?.["marketParticipantName"] ?? "Not reported"),
        };
      } catch {
        return null;
      }
    }),
  );

  return { cot: cot.filter((row): row is CotRow => row !== null), darkPool: darkPool.filter((row): row is DarkPoolRow => row !== null) };
});

function scorePosts(posts: TrumpPost[]) {
  const positive = /deal|growth|great|win|peace|strong|jobs|cut taxes|success|agreement/gi;
  const negative = /tariff|war|sanction|attack|threat|shutdown|inflation|crime|out of control/gi;
  const corpus = posts.map((post) => post.text).join(" ");
  const score = Math.max(-100, Math.min(100, (corpus.match(positive)?.length ?? 0) * 12 - (corpus.match(negative)?.length ?? 0) * 14));
  const themes = [
    [/tariff|trade|china|import/gi, "Trade"],
    [/oil|energy|gas|drill/gi, "Energy"],
    [/war|peace|military|iran|russia|ukraine/gi, "Geopolitics"],
    [/fed|rate|inflation|dollar/gi, "Rates"],
  ] as const;
  return {
    score,
    label: score >= 25 ? "Risk-on" : score <= -25 ? "Risk-off" : "Mixed",
    themes: themes.filter(([pattern]) => pattern.test(corpus)).map(([, label]) => label).slice(0, 3),
  };
}

export const getTrumpWire = createServerFn({ method: "GET" }).handler(async (): Promise<TrumpWire> => {
  const posts: TrumpPost[] = [];
  try {
    const response = await fetch(TRUTH_URL, { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" } });
    if (response.ok) {
      const html = await response.text();
      const blocks = html.match(/<div class="status"[\s\S]*?<div class="status__footer">[\s\S]*?<\/div>\s*<\/div>/g) ?? [];
      for (const block of blocks.slice(0, 6)) {
        const id = block.match(/data-status-url="[^"]*\/(\d+)"/)?.[1];
        const timestamp = block.match(/<time datetime="([^"]+)"/)?.[1];
        const url = block.match(/class="status__external-link" href="([^"]+)"/)?.[1];
        const content = block.match(/<div class="status__content"[^>]*>([\s\S]*?)<\/div>/)?.[1];
        if (id && timestamp && url && content) posts.push({ id, timestamp, url, text: textContent(content), source: "Truth Social" });
      }
    }
  } catch {
    // The panel renders a clear unavailable state.
  }

  return {
    posts,
    sentiment: scorePosts(posts),
    nextSpeech: {
      title: "Next presidential remarks",
      timestamp: null,
      venue: "No confirmed event published",
      channel: "White House Live / Trump TV",
      url: "https://www.whitehouse.gov/live/",
    },
    updatedAt: new Date().toISOString(),
  };
});
