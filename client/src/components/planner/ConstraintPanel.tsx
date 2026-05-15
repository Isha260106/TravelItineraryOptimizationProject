import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, CheckCircle2, Plus, Star, ShieldCheck, Trash2, PinOff } from "lucide-react";
import { autocomplete, nearbyPlaces } from "@/lib/mock-planner-api";
import type { Constraints, PlannerLocation } from "@/lib/planner-types";
import { Chip } from "./Chip";

function formatMinutesLabel(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

type Props = {
  locations: PlannerLocation[];
  setLocations: React.Dispatch<React.SetStateAction<PlannerLocation[]>>;
  constraints: Constraints;
  setConstraints: React.Dispatch<React.SetStateAction<Constraints>>;
  startLocationName: string;
  setStartLocationName: (v: string) => void;
  notify?: (msg: string, kind?: "success" | "error" | "warning") => void;
};

export default function ConstraintPanel({
  locations,
  setLocations,
  constraints,
  setConstraints,
  startLocationName,
  setStartLocationName,
  notify = () => {},
}: Props) {
  const [newLocName, setNewLocName] = useState("");
  const [startSugs, setStartSugs] = useState<{ place_id: string; description: string }[]>([]);
  const [destSugs, setDestSugs] = useState<{ place_id: string; description: string }[]>([]);
  const [showStart, setShowStart] = useState(false);
  const [showDest, setShowDest] = useState(false);

  useEffect(() => {
    if (!startLocationName || startLocationName.length < 2) {
      setStartSugs([]);
      return;
    }
    const t = setTimeout(() => autocomplete(startLocationName).then(setStartSugs), 200);
    return () => clearTimeout(t);
  }, [startLocationName]);

  useEffect(() => {
    if (!newLocName || newLocName.length < 2) {
      setDestSugs([]);
      return;
    }
    const t = setTimeout(() => autocomplete(newLocName).then(setDestSugs), 200);
    return () => clearTimeout(t);
  }, [newLocName]);

  const verifyStart = async () => {
    if (!startLocationName) return;
    try {
      await nearbyPlaces(startLocationName, 100);
      notify("Starting location verified.", "success");
    } catch {
      notify("Could not verify that location.", "error");
    }
  };

  const addLocation = async () => {
    if (!newLocName) return;
    try {
      const res = await nearbyPlaces(newLocName, 5000);
      const place = res.places[0];
      if (!place) {
        notify(`No places found near "${newLocName}".`, "warning");
      } else {
        const exists = new Set(locations.map((l) => l.name));
        if (!exists.has(place.name)) {
          setLocations((prev) => [
            ...prev,
            {
              name: place.name,
              lat: place.lat,
              lng: place.lng,
              duration: 60,
              mandatory: false,
              timeWindow: { open: 9 * 60, close: 18 * 60 },
            },
          ]);
        }
      }
    } catch {
      notify("Could not load places.", "error");
    }
    setNewLocName("");
  };

  const updateLocation = <K extends keyof PlannerLocation>(idx: number, field: K, value: PlannerLocation[K]) => {
    setLocations((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const removeLocation = (idx: number) => setLocations((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 space-y-6 border-b border-[var(--border)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Schedule &amp; start</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Trip length, first departure, and where the day begins.</p>
          </div>
          <Chip variant="primary">Step 1</Chip>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Trip length</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
              <input
                type="number"
                min={1}
                max={30}
                value={constraints.maxDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setConstraints({ ...constraints, maxDays: Number.isFinite(v) ? Math.min(30, Math.max(1, v)) : 1 });
                }}
                className="input-elegant pl-10 font-data-tabular"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">days</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">First departure</label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
              <input
                type="number"
                min={0}
                max={1439}
                value={constraints.startTime}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setConstraints({ ...constraints, startTime: Number.isFinite(v) ? Math.min(1439, Math.max(0, v)) : 540 });
                }}
                className="input-elegant pl-10 font-data-tabular"
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">{formatMinutesLabel(constraints.startTime)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Starting point</label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
              <input
                type="text"
                value={startLocationName}
                onChange={(e) => {
                  setStartLocationName(e.target.value);
                  setShowStart(true);
                }}
                onFocus={() => setShowStart(true)}
                onBlur={() => setTimeout(() => setShowStart(false), 180)}
                placeholder={locations.length ? `Defaults to ${locations[0].name}` : "Hotel, station, or address…"}
                className="input-elegant pl-10"
              />
              {showStart && startSugs.length > 0 && (
                <div className="custom-scrollbar absolute left-0 right-0 top-full z-50 mt-2 max-h-44 overflow-y-auto rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] py-1 shadow-2xl backdrop-blur-xl">
                  {startSugs.map((s) => (
                    <button
                      type="button"
                      key={s.place_id}
                      className="block w-full truncate px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setStartLocationName(s.description);
                        setShowStart(false);
                      }}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={verifyStart}
              className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 text-[var(--text-muted)] transition hover:border-primary/40 hover:bg-primary/10 hover:text-[oklch(0.85_0.10_275)]"
              title="Verify location"
            >
              <CheckCircle2 className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-6 sm:p-7">
        <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Destinations</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Build your list — order optimizes automatically.</p>
          </div>
          <Chip>{locations.length} stops</Chip>
        </div>

        <div className="mb-5 shrink-0 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Add a place</label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search city or place name…"
                value={newLocName}
                onChange={(e) => {
                  setNewLocName(e.target.value);
                  setShowDest(true);
                }}
                onFocus={() => setShowDest(true)}
                onBlur={() => setTimeout(() => setShowDest(false), 180)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLocation();
                  }
                }}
                className="input-elegant"
              />
              {showDest && destSugs.length > 0 && (
                <div className="custom-scrollbar absolute left-0 right-0 top-full z-50 mt-2 max-h-44 overflow-y-auto rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] py-1 shadow-2xl backdrop-blur-xl">
                  {destSugs.map((s) => (
                    <button
                      type="button"
                      key={s.place_id}
                      className="block w-full truncate px-4 py-2.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNewLocName(s.description);
                        setShowDest(false);
                      }}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={addLocation} className="btn-primary-glow !px-4 !py-0" title="Add destination">
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {locations.map((loc, idx) => (
            <div
              key={`${loc.name}-${idx}`}
              className={`rounded-xl border p-4 transition ${
                loc.mandatory
                  ? "border-primary/40 bg-primary/[0.08] ring-1 ring-primary/15"
                  : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-[var(--text-primary)]" title={loc.name}>
                    {loc.name}
                  </h3>
                  <div className="mt-1.5">
                    <Chip variant={loc.mandatory ? "primary" : "default"}>{loc.mandatory ? "Must visit" : "Optional"}</Chip>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => updateLocation(idx, "mandatory", !loc.mandatory)}
                    className={`rounded-lg p-2 transition ${
                      loc.mandatory ? "text-[oklch(0.85_0.10_275)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    }`}
                    title={loc.mandatory ? "Mark optional" : "Mark must-visit"}
                  >
                    {loc.mandatory ? <ShieldCheck className="size-5" /> : <Star className="size-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLocation(idx)}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-300"
                    title="Remove"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Visit (min)</p>
                  <input
                    type="number"
                    value={loc.duration}
                    onChange={(e) => updateLocation(idx, "duration", parseInt(e.target.value, 10) || 0)}
                    className="input-elegant py-2 font-data-tabular text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Closing (min)</p>
                  <input
                    type="number"
                    value={loc.timeWindow.close}
                    onChange={(e) =>
                      updateLocation(idx, "timeWindow", { ...loc.timeWindow, close: parseInt(e.target.value, 10) || 0 })
                    }
                    className="input-elegant py-2 font-data-tabular text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-10 text-center">
              <PinOff className="mb-3 size-8 text-[var(--text-muted)] opacity-60" aria-hidden />
              <p className="font-medium text-[var(--text-muted)]">No stops yet</p>
              <p className="mt-2 max-w-xs text-sm text-[var(--text-muted)]">Search above or use Explore to add places.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
