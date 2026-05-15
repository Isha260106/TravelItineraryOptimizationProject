import { motion } from "framer-motion";
import { MapPin, Clock, Route, AlertTriangle, ShieldAlert } from "lucide-react";
import type { Itinerary } from "@/lib/planner-types";

export default function ItineraryTimeline({ itinerary }: { itinerary: Itinerary | null }) {
  if (!itinerary) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-10 text-center">
        <Route className="mb-3 size-9 text-[var(--text-muted)] opacity-60" aria-hidden />
        <p className="font-medium text-[var(--text-muted)]">No itinerary yet</p>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">Add destinations on the left, then generate an optimized timeline.</p>
      </div>
    );
  }

  const warnings = itinerary.warnings ?? [];

  return (
    <div className="custom-scrollbar flex h-full min-h-0 flex-col gap-10 overflow-y-auto pb-16 pr-1">
      <header className="shrink-0 border-b border-[var(--border)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Optimized plan</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">Your timeline</h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
          Stops and travel segments per day. Warnings flag tight timing or closed venues.
        </p>
      </header>

      {itinerary.days.map((day) => (
        <div key={day.day} className="relative">
          <div className="sticky top-0 z-10 mb-6 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--page-bg)]/80 py-3 backdrop-blur-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/40 to-[oklch(0.55_0.18_240)]/30 text-sm font-bold text-[oklch(0.92_0.06_275)] ring-1 ring-primary/30">
              {day.day}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Day {day.day}</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {day.route.length} stop{day.route.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="relative ml-1 border-l-2 border-primary/25 pl-8 md:pl-10">
            {day.route.map((step, sIdx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.05 }}
                key={sIdx}
                className="relative pb-8 last:pb-2"
              >
                <div className="absolute -left-[21px] top-3 size-3.5 rounded-full border-2 border-primary bg-[var(--page-bg)] shadow-[0_0_0_4px_var(--page-bg)] md:-left-[23px]" />

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 shadow-[var(--shadow-elevated)] transition hover:border-[var(--border-strong)] md:p-5">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <h4 className="flex min-w-0 items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                      <MapPin className="size-4 shrink-0 text-[oklch(0.78_0.16_275)]" aria-hidden />
                      <span className="truncate">{step.location.name}</span>
                    </h4>
                    <span className="shrink-0 rounded-full border border-primary/25 bg-primary/15 px-3 py-1 font-data-tabular text-xs font-medium text-[oklch(0.88_0.10_275)]">
                      {step.arrivalTime} – {step.departureTime}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {step.location.duration} min on site
                    </span>
                    {step.travelFromPrev > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Route className="size-3.5" /> {step.travelFromPrev} min travel
                      </span>
                    )}
                  </div>

                  {warnings
                    .filter((w) => w.includes(step.location.name))
                    .map((w, wIdx) => (
                      <div
                        key={wIdx}
                        className="mt-4 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-950/40 px-3 py-2.5 text-xs text-amber-100"
                      >
                        <AlertTriangle className="size-4 shrink-0 text-amber-400" aria-hidden />
                        {w}
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-950/35 p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-100">
            <ShieldAlert className="size-4" aria-hidden /> Planner notes
          </h4>
          <ul className="space-y-2 text-sm text-rose-100/90">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-rose-400" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
