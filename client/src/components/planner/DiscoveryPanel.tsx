import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Compass, Plus, CheckCircle2, Circle, Star, Navigation, Radar, ListPlus } from "lucide-react";
import { nearbyPlaces } from "@/lib/mock-planner-api";
import type { DiscoveryPlace, PlannerLocation } from "@/lib/planner-types";
import { Chip } from "./Chip";

type Props = {
  onAddLocations: (locs: PlannerLocation[]) => void;
  onSearchResults?: (places: DiscoveryPlace[]) => void;
};

export default function DiscoveryPanel({ onAddLocations, onSearchResults }: Props) {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5000);
  const [results, setResults] = useState<DiscoveryPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const search = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await nearbyPlaces(query, radius);
      setResults(res.places);
      onSearchResults?.(res.places);
    } catch {
      setError("Search failed. Try another area.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (p: DiscoveryPlace) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.add(p.id);
      return next;
    });
  };

  const integrate = () => {
    const picked: PlannerLocation[] = results
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        duration: 60,
        mandatory: false,
        timeWindow: { open: 9 * 60, close: 18 * 60 },
      }));
    onAddLocations(picked);
    setResults([]);
    onSearchResults?.([]);
    setSelectedIds(new Set());
    setQuery("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-5 border-b border-[var(--border)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Explore an area</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Search a city, then scan for nearby sights.</p>
          </div>
          <Chip variant="primary">Step 2</Chip>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
            <input
              type="text"
              placeholder="e.g. Tokyo, Paris, New York"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query && !loading) {
                  e.preventDefault();
                  search();
                }
              }}
              className="input-elegant pl-10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
              <span>Search radius</span>
              <span className="font-data-tabular text-[oklch(0.85_0.10_275)]">{(radius / 1000).toFixed(0)} km</span>
            </div>
            <input
              type="range"
              min={1000}
              max={20000}
              step={1000}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--surface-hover)] accent-[var(--primary)]"
            />
          </div>

          <button
            type="button"
            onClick={search}
            disabled={loading || !query}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            ) : (
              <>
                <Compass className="size-4" />
                Scan area
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-6 sm:p-7">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Results</h3>
          <span className="text-xs font-medium text-[var(--text-muted)]">{results.length} places</span>
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {error && (
            <div className="rounded-xl border border-rose-500/25 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">{error}</div>
          )}

          {results.length > 0
            ? results.map((place) => {
                const isSel = selectedIds.has(place.id);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={place.id}
                    onClick={() => toggle(place)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(place);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isSel
                        ? "border-primary/40 bg-primary/[0.10] ring-1 ring-primary/20"
                        : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-semibold leading-snug text-[var(--text-primary)]">{place.name}</h4>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="inline-flex items-center gap-1 text-amber-200/90">
                            <Star className="size-3.5 fill-current" /> {place.rating}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Navigation className="size-3.5" /> {(place.distance / 1000).toFixed(1)} km
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddLocations([
                              {
                                name: place.name,
                                lat: place.lat,
                                lng: place.lng,
                                duration: 60,
                                mandatory: false,
                                timeWindow: { open: 9 * 60, close: 18 * 60 },
                              },
                            ]);
                          }}
                          className="flex size-9 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text-muted)] transition hover:border-primary/40 hover:text-[oklch(0.85_0.10_275)]"
                          title="Add to trip"
                        >
                          <Plus className="size-4" />
                        </button>
                        {isSel ? (
                          <CheckCircle2 className="size-5 text-[oklch(0.78_0.16_275)]" />
                        ) : (
                          <Circle className="size-5 text-[var(--text-muted)] opacity-60" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            : !loading && (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-12 text-center">
                  <Radar className="mb-3 size-8 text-[var(--text-muted)] opacity-60" aria-hidden />
                  <p className="font-medium text-[var(--text-muted)]">Nothing scanned yet</p>
                  <p className="mt-2 max-w-xs text-sm text-[var(--text-muted)]">Try “Tokyo”, “Paris”, or “New York”, then tap Scan.</p>
                </div>
              )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-muted)] p-6 sm:px-7">
          <button type="button" onClick={integrate} className="btn-primary-glow w-full">
            <ListPlus className="size-4" />
            Add {selectedIds.size} to trip
          </button>
        </div>
      )}
    </div>
  );
}
