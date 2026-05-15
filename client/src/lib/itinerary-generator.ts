import type { Constraints, Itinerary, ItineraryStep, PlannerLocation } from "./planner-types";

function fmt(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function haversine(a: PlannerLocation, b: PlannerLocation) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function generateItinerary(locations: PlannerLocation[], constraints: Constraints): Itinerary {
  if (locations.length === 0) return { days: [], warnings: [] };

  // Greedy nearest-neighbor ordering, mandatory first.
  const sorted = [...locations].sort((a, b) => Number(b.mandatory) - Number(a.mandatory));
  const ordered: PlannerLocation[] = [];
  const remaining = [...sorted];
  let current = remaining.shift()!;
  ordered.push(current);
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((r, i) => {
      const d = haversine(current, r);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    current = remaining.splice(bestIdx, 1)[0];
    ordered.push(current);
  }

  const days: Itinerary["days"] = [];
  const warnings: string[] = [];
  let dayIndex = 1;
  let cursor = constraints.startTime;
  let route: ItineraryStep[] = [];
  let prev: PlannerLocation | null = null;
  const dailyEnd = 20 * 60;

  for (const loc of ordered) {
    const travel = prev ? Math.max(10, Math.round(haversine(prev, loc) * 3)) : 0;
    let arrive = cursor + travel;
    if (arrive < loc.timeWindow.open) arrive = loc.timeWindow.open;
    const depart = arrive + loc.duration;

    const wouldOverflow = depart > dailyEnd;
    if (wouldOverflow && route.length > 0 && dayIndex < constraints.maxDays) {
      days.push({ day: dayIndex, route });
      dayIndex += 1;
      route = [];
      prev = null;
      cursor = constraints.startTime;
      // Re-evaluate this loc as first stop of new day.
      const a2 = Math.max(cursor, loc.timeWindow.open);
      const d2 = a2 + loc.duration;
      if (d2 > loc.timeWindow.close) warnings.push(`${loc.name} closes before visit ends.`);
      route.push({ location: loc, arrivalTime: fmt(a2), departureTime: fmt(d2), travelFromPrev: 0 });
      cursor = d2;
      prev = loc;
      continue;
    }

    if (depart > loc.timeWindow.close) warnings.push(`${loc.name} closes before visit ends.`);
    if (depart > dailyEnd) warnings.push(`${loc.name} runs past 8:00 PM on Day ${dayIndex}.`);

    route.push({ location: loc, arrivalTime: fmt(arrive), departureTime: fmt(depart), travelFromPrev: travel });
    cursor = depart;
    prev = loc;
  }

  if (route.length) days.push({ day: dayIndex, route });
  return { days, warnings };
}
