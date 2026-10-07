import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getTrumpWire } from "@/lib/market-intelligence.functions";
import { useSettings } from "@/lib/settings";

function eastern(value: string) {
  return new Date(value).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) + " ET";
}

export function TrumpWire() {
  const fetchWire = useServerFn(getTrumpWire);
  const { settings } = useSettings();
  const { data, isLoading } = useQuery({ queryKey: ["trump-wire"], queryFn: () => fetchWire(), refetchInterval: 120_000, staleTime: 60_000 });
  if (!settings.showTrumpWire) return null;

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-foreground/25 bg-card p-5">
        <h2 className="text-xs tracking-[0.3em] text-muted-foreground">TRUMP · MARKET SENTIMENT</h2>
        <div className="mt-4 flex items-end gap-3 border-b border-foreground/20 pb-4">
          <span className={`text-3xl font-bold ${data?.sentiment.label === "Risk-on" ? "text-up" : data?.sentiment.label === "Risk-off" ? "text-down" : "text-foreground"}`}>{data?.sentiment.label.toUpperCase() ?? "—"}</span>
          <span className="num pb-1 text-sm text-muted-foreground">{data ? `${data.sentiment.score > 0 ? "+" : ""}${data.sentiment.score}` : ""}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Automated wording read from recent public posts. It measures market tone, not political approval or trading advice.</p>
        <div className="mt-4 flex flex-wrap gap-2">{data?.sentiment.themes.map((theme) => <span key={theme} className="rounded border border-foreground/30 px-2 py-1 text-[0.65rem] font-bold tracking-[0.12em]">{theme.toUpperCase()}</span>)}</div>
        {settings.showTrumpSpeech && (
          <div className="mt-6 border-t-2 border-foreground pt-4">
            <p className="text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground">NEXT CONFIRMED SPEECH</p>
            <p className="mt-2 text-lg font-bold">{data?.nextSpeech.timestamp ? data.nextSpeech.title : "NOT YET CONFIRMED"}</p>
            <p className="mt-1 text-sm">{data?.nextSpeech.timestamp ? eastern(data.nextSpeech.timestamp) : "Official schedule has not published a future time."}</p>
            <p className="text-xs text-muted-foreground">{data?.nextSpeech.venue} · {data?.nextSpeech.channel}</p>
            <Button asChild variant="outline" size="sm" className="mt-3"><a href={data?.nextSpeech.url ?? "https://www.whitehouse.gov/live/"} target="_blank" rel="noreferrer">WATCH SOURCE <ExternalLink /></a></Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-foreground/25 bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xs tracking-[0.3em] text-muted-foreground">TRUMP TRUTH SOCIAL TRACKER</h2><p className="mt-1 text-[0.65rem] text-muted-foreground">Public posts · newest first · 12-hour Eastern Time</p></div><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-up" /></div>
        {isLoading && <p className="text-sm text-muted-foreground">Loading public feed…</p>}
        {!isLoading && data?.posts.length === 0 && <p className="text-sm text-muted-foreground">The public Truth Social feed is temporarily unavailable.</p>}
        <div className="max-h-[430px] space-y-0 overflow-y-auto border-y border-foreground/20">
          {data?.posts.map((post) => (
            <article key={post.id} className="border-b border-foreground/15 py-4 last:border-0">
              <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[0.65rem] font-bold tracking-[0.16em]">{post.source.toUpperCase()}</span><time className="num text-[0.65rem] text-muted-foreground">{post.id.startsWith("archive-") ? `RETRIEVED ${eastern(post.timestamp)}` : eastern(post.timestamp)}</time></div>
              <p className="line-clamp-4 text-sm leading-relaxed">{post.text}</p>
              <a className="mt-2 inline-flex items-center gap-1 text-[0.65rem] font-bold tracking-[0.1em] hover:underline" href={post.url} target="_blank" rel="noreferrer">OPEN POST <ExternalLink size={12} /></a>
            </article>
          ))}
        </div>
        <p className="mt-3 text-[0.65rem] text-muted-foreground">Truth Social is primary. X can be added after its developer connection is authorized.</p>
      </div>
    </section>
  );
}
