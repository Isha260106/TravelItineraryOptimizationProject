import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Wand2, RotateCcw } from "lucide-react";
import ConstraintPanel from "@/components/planner/ConstraintPanel";
import DiscoveryPanel from "@/components/planner/DiscoveryPanel";
import ItineraryTimeline from "@/components/planner/ItineraryTimeline";
import MapComponent from "@/components/planner/MapComponent";
import { generateItinerary } from "@/lib/itinerary-generator";
import type { Constraints, DiscoveryPlace, Itinerary, PlannerLocation } from "@/lib/planner-types";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voyage — Multi-day trip planner" },
      { name: "description", content: "Plan multi-day trips with smart constraints, area discovery, and an optimized timeline." },
      { property: "og:title", content: "Voyage — Multi-day trip planner" },
      { property: "og:description", content: "Plan multi-day trips with smart constraints, area discovery, and an optimized timeline." },
    ],
  }),
  component: Index,
});

const SAMPLE: PlannerLocation[] = [
  { name: "Shibuya Crossing", lat: 35.6595, lng: 139.7004, duration: 45, mandatory: false, timeWindow: { open: 9 * 60, close: 22 * 60 } },
  { name: "Meiji Jingu Shrine", lat: 35.6764, lng: 139.6993, duration: 60, mandatory: true, timeWindow: { open: 9 * 60, close: 17 * 60 } },
  { name: "teamLab Planets", lat: 35.6486, lng: 139.7902, duration: 90, mandatory: false, timeWindow: { open: 10 * 60, close: 20 * 60 } },
];

function Index() {
  const [locations, setLocations] = useState<PlannerLocation[]>(SAMPLE);
  const [constraints, setConstraints] = useState<Constraints>({ maxDays: 2, startTime: 9 * 60 });
  const [startName, setStartName] = useState<string>("Shibuya Station, Tokyo");
  const [discovery, setDiscovery] = useState<DiscoveryPlace[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  const stops = useMemo(() => locations.length, [locations]);

  const generate = () => {
    if (!locations.length) {
      toast("Add at least one destination first.");
      return;
    }
    setItinerary(generateItinerary(locations, constraints));
    toast.success("Itinerary optimized.");
  };

  const reset = () => {
    setLocations([]);
    setItinerary(null);
    setDiscovery([]);
  };

  const addFromDiscovery = (places: PlannerLocation[]) => {
    setLocations((prev) => {
      const names = new Set(prev.map((p) => p.name));
      return [...prev, ...places.filter((p) => !names.has(p.name))];
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Toaster position="top-right" theme="dark" />
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--page-bg)]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.18_240)] shadow-[var(--shadow-glow)]">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Voyage</p>
              <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Multi-day trip planner</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--text-muted)] sm:inline-flex">
              {stops} stop{stops === 1 ? "" : "s"} · {constraints.maxDays} day{constraints.maxDays === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <RotateCcw className="size-4" /> Reset
            </button>
            <button type="button" onClick={generate} className="btn-primary-glow text-sm">
              <Wand2 className="size-4" /> Optimize
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <section className="surface-card flex h-[calc(100vh-9rem)] min-h-[640px] flex-col overflow-hidden lg:col-span-3">
          <ConstraintPanel
            locations={locations}
            setLocations={setLocations}
            constraints={constraints}
            setConstraints={setConstraints}
            startLocationName={startName}
            setStartLocationName={setStartName}
            notify={(m, k) => (k === "error" ? toast.error(m) : k === "warning" ? toast.warning(m) : toast.success(m))}
          />
        </section>

        <section className="surface-card flex h-[calc(100vh-9rem)] min-h-[640px] flex-col overflow-hidden lg:col-span-3">
          <DiscoveryPanel onAddLocations={addFromDiscovery} onSearchResults={setDiscovery} />
        </section>

        <section className="lg:col-span-6 flex flex-col gap-6">
          <div className="surface-card h-[42vh] min-h-[320px] overflow-hidden p-2">
            <MapComponent
              locations={locations}
              itinerary={itinerary}
              discoveryResults={discovery}
              onAddFromMap={(p) =>
                addFromDiscovery([
                  { name: p.name, lat: p.lat, lng: p.lng, duration: 60, mandatory: false, timeWindow: { open: 9 * 60, close: 18 * 60 } },
                ])
              }
            />
          </div>
          <div className="surface-card flex-1 min-h-[280px] overflow-hidden p-6 sm:p-7">
            <ItineraryTimeline itinerary={itinerary} />
          </div>
        </section>
      </main>
    </div>
  );
}
