import { useEffect, useState } from "react";
import { getFedSentiment } from "@/lib/market-data";

/** Semi-circular gauge: -100 (dovish) on the left, +100 (hawkish) on the right. */
export function FedMeter() {
  const [fed, setFed] = useState(() => getFedSentiment(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setFed(getFedSentiment(new Date())), 120_000);
    return () => window.clearInterval(id);
  }, []);

  const angle = (fed.score / 100) * 90; // -90deg .. +90deg
  const hawkish = fed.score > 0;

  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-5">
      <h2 className="mb-4 text-xs tracking-[0.3em] text-muted-foreground">FED METER · CHAIR SENTIMENT</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="mx-auto w-full max-w-[220px]">
          <svg viewBox="0 0 200 116" className="w-full" role="img" aria-label={`Fed sentiment ${fed.label}`}>
            <defs>
              <linearGradient id="fedArc" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--session-london)" />
                <stop offset="50%" stopColor="var(--tag-medium)" />
                <stop offset="100%" stopColor="var(--tag-high)" />
              </linearGradient>
            </defs>
            <path
              d="M 12 100 A 88 88 0 0 1 188 100"
              fill="none"
              stroke="url(#fedArc)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <g transform={`rotate(${angle} 100 100)`}>
              <line x1="100" y1="100" x2="100" y2="26" stroke="#1a1815" strokeWidth="4" strokeLinecap="round" />
            </g>
            <circle cx="100" cy="100" r="7" fill="#1a1815" />
          </svg>
          <div className="flex justify-between text-[0.6rem] font-bold tracking-[0.2em] text-muted-foreground">
            <span>DOVISH</span>
            <span>NEUTRAL</span>
            <span>HAWKISH</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <span
              className="text-2xl font-bold tracking-[0.15em]"
              style={{ color: hawkish ? "var(--tag-high)" : "var(--session-london)" }}
            >
              {fed.label.toUpperCase()}
            </span>
            <span className="num text-sm text-muted-foreground">
              {fed.score > 0 ? "+" : ""}
              {fed.score}
            </span>
          </div>
          <p className="text-sm italic leading-relaxed">{fed.quote}</p>
          <div className="grid grid-cols-2 gap-3 border-t border-foreground/20 pt-3 text-xs">
            <div>
              <p className="tracking-[0.2em] text-muted-foreground">SPEAKER</p>
              <p className="font-bold">{fed.lastSpeaker}</p>
              <p className="text-muted-foreground">{fed.lastVenue}</p>
            </div>
            <div>
              <p className="tracking-[0.2em] text-muted-foreground">NEXT-MEETING CUT ODDS</p>
              <p className="num text-lg font-bold">{fed.cutOdds}%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
