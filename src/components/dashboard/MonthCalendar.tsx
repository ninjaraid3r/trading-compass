import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getMonthEvents, TAG_STYLE, type DayEvent } from "@/lib/market-data";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function TagBadge({ tag }: { tag: DayEvent["tag"] }) {
  const style = TAG_STYLE[tag];
  return (
    <span
      className="num neon-tag rounded-[4px] px-1.5 py-0.5 text-[0.85rem] leading-[1.1] font-bold"
      style={{
        color: style.color,
        border: `1px solid color-mix(in oklab, ${style.color} 70%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${style.color} 14%, transparent)`,
      }}
      title={style.label}
    >
      {tag}
    </span>
  );
}


function DayCell({
  day,
  isToday,
  events,
}: {
  day: number | null;
  isToday: boolean;
  events: DayEvent[];
}) {
  if (day === null) return <div className="min-h-[92px] rounded-md bg-foreground/[0.03]" />;

  const us = events.filter((e) => e.region === "US");
  const tags = Array.from(new Set(us.map((e) => e.tag)));

  return (
    <HoverCard openDelay={80}>
      <HoverCardTrigger asChild>
        <div
          className={`min-h-[92px] rounded-md border border-foreground/20 p-1.5 transition-colors hover:bg-foreground/5 ${
            isToday ? "today-glow" : ""
          }`}
        >
          <div className="num mb-1 flex items-center justify-between text-[0.7rem] font-semibold">
            <span>{day}</span>
            {us.length > 0 && <span className="text-muted-foreground">{us.length}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <TagBadge key={t} tag={t} />
            ))}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 border-foreground/30 bg-popover" align="start">
        <p className="mb-2 text-xs font-bold tracking-[0.2em]">DAY {day} · US EVENTS</p>
        {us.length === 0 && <p className="text-xs text-muted-foreground">No scheduled US releases.</p>}
        <ul className="space-y-2">
          {us.map((e, i) => (
            <li key={i} className="flex gap-2">
              <TagBadge tag={e.tag} />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{e.title}</p>
                <p className="num text-[0.65rem] text-muted-foreground">{e.time}</p>
                <p className="text-[0.65rem] text-muted-foreground">{e.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

export function MonthCalendar() {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();
  const events = useMemo(() => getMonthEvents(year, month), [year, month]);
  const [open, setOpen] = useState(false);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const worldNews = Object.entries(events).flatMap(([d, list]) =>
    list.filter((e) => e.region === "WORLD").map((e) => ({ ...e, day: Number(d) })),
  );

  return (
    <section className="rounded-lg border border-foreground/25 bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs tracking-[0.3em] text-muted-foreground">
          {now.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()} · US ECONOMIC CALENDAR
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="rounded-md border border-foreground px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.15em] transition-colors hover:bg-foreground hover:text-background">
            WORLD NEWS & CURRENT AFFAIRS
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto border-foreground/30 bg-popover sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="tracking-[0.2em]">GLOBAL RELEASES & HEADLINES</DialogTitle>
            </DialogHeader>
            <ul className="space-y-3">
              {worldNews.map((e, i) => (
                <li key={i} className="flex gap-3 border-b border-foreground/10 pb-3">
                  <span className="num w-12 shrink-0 text-xs font-bold">
                    {now.toLocaleDateString("en-US", { month: "short" })} {e.day}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="num text-[0.65rem] text-muted-foreground">{e.time}</p>
                    <p className="text-xs text-muted-foreground">{e.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[0.6rem] tracking-[0.2em] text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => (
          <DayCell key={i} day={d} isToday={d === now.getDate()} events={d ? (events[d] ?? []) : []} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-foreground/15 pt-3">
        {(Object.keys(TAG_STYLE) as (keyof typeof TAG_STYLE)[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            <TagBadge tag={t} />
            {TAG_STYLE[t].label}
          </span>
        ))}
      </div>
    </section>
  );
}
