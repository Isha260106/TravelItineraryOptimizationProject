import { useEffect, useMemo, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { MapPin, KeyRound, AlertTriangle, Loader2 } from "lucide-react";
import type { DiscoveryPlace, Itinerary, PlannerLocation } from "@/lib/planner-types";

const containerStyle = { width: "100%", height: "100%" };
const fallbackCenter = { lat: 40.7128, lng: -74.006 };

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#141432" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141432" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a78a8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#a5a3d8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#a5a3d8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2645" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e1e5a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0a0a1a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4f46e5" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e1e5a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a1a" }] },
];

type Props = {
  locations: PlannerLocation[];
  itinerary: Itinerary | null;
  discoveryResults?: DiscoveryPlace[];
  onAddFromMap?: (place: DiscoveryPlace) => void;
};

export default function MapComponent({ locations, itinerary, discoveryResults = [], onAddFromMap }: Props) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || "";
  const { isLoaded, loadError } = useJsApiLoader({ id: "google-map-script", googleMapsApiKey: apiKey });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (!isLoaded || !itinerary?.days) return;
    const g = window.google;
    const wp: google.maps.DirectionsWaypoint[] = [];
    itinerary.days.forEach((d) => d.route.forEach((s) => wp.push({ location: new g.maps.LatLng(s.location.lat, s.location.lng), stopover: true })));
    if (wp.length < 2) return;
    const origin = wp.shift()!.location as google.maps.LatLng;
    const destination = wp.pop()!.location as google.maps.LatLng;
    new g.maps.DirectionsService().route(
      { origin, destination, waypoints: wp, travelMode: g.maps.TravelMode.DRIVING },
      (res, status) => {
        if (status === g.maps.DirectionsStatus.OK && res) setDirections(res);
      },
    );
  }, [isLoaded, itinerary]);

  const markers = useMemo(
    () => locations.map((l, i) => ({ id: i, position: { lat: l.lat, lng: l.lng }, label: String(i + 1), title: l.name })),
    [locations],
  );

  const center = useMemo(() => {
    if (discoveryResults[0]) return { lat: discoveryResults[0].lat, lng: discoveryResults[0].lng };
    if (locations[0]) return { lat: locations[0].lat, lng: locations[0].lng };
    return fallbackCenter;
  }, [locations, discoveryResults]);

  if (!apiKey) return <Fallback locations={locations} discoveryResults={discoveryResults} reason="key" />;
  if (loadError) return <Fallback locations={locations} discoveryResults={discoveryResults} reason="error" />;
  if (!isLoaded)
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading map…
      </div>
    );

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      options={{ styles: darkMapStyles, disableDefaultUI: true, zoomControl: true }}
    >
      {markers.map((m) => (
        <Marker key={m.id} position={m.position} label={m.label} title={m.title} />
      ))}
      {discoveryResults.map((p, i) => (
        <Marker
          key={`d-${p.id ?? i}`}
          position={{ lat: p.lat, lng: p.lng }}
          title={p.name}
          icon="http://maps.google.com/mapfiles/ms/icons/purple-dot.png"
          onClick={() => onAddFromMap?.(p)}
        />
      ))}
      {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#7c6cff", strokeWeight: 4 } }} />}
    </GoogleMap>
  );
}

function Fallback({
  locations,
  discoveryResults,
  reason,
}: {
  locations: PlannerLocation[];
  discoveryResults: DiscoveryPlace[];
  reason: "key" | "error";
}) {
  // Simple normalized projection so dots show roughly relative positions.
  const all = [...locations.map((l) => ({ lat: l.lat, lng: l.lng, kind: "stop" as const, name: l.name })), ...discoveryResults.map((p) => ({ lat: p.lat, lng: p.lng, kind: "discovery" as const, name: p.name }))];
  const xs = all.map((p) => p.lng);
  const ys = all.map((p) => p.lat);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 1;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const proj = (lng: number, lat: number) => {
    const x = maxX === minX ? 50 : ((lng - minX) / (maxX - minX)) * 80 + 10;
    const y = maxY === minY ? 50 : 90 - ((lat - minY) / (maxY - minY)) * 80;
    return { x, y };
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[var(--surface-elevated)]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.55 0.12 275 / 0.08) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.12 275 / 0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "var(--gradient-aurora)" }} />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {locations.length > 1 && (
          <polyline
            fill="none"
            stroke="oklch(0.72 0.18 275)"
            strokeWidth="0.5"
            strokeDasharray="1.5 1"
            points={locations.map((l) => {
              const { x, y } = proj(l.lng, l.lat);
              return `${x},${y}`;
            }).join(" ")}
          />
        )}
        {locations.map((l, i) => {
          const { x, y } = proj(l.lng, l.lat);
          return (
            <g key={`s-${i}`}>
              <circle cx={x} cy={y} r="2.4" fill="oklch(0.62 0.22 275)" stroke="white" strokeWidth="0.4" />
              <text x={x} y={y + 0.8} fontSize="2.4" textAnchor="middle" fill="white" fontWeight="700">
                {i + 1}
              </text>
            </g>
          );
        })}
        {discoveryResults.map((p, i) => {
          const { x, y } = proj(p.lng, p.lat);
          return <circle key={`d-${i}`} cx={x} cy={y} r="1.4" fill="oklch(0.78 0.16 320)" opacity="0.85" />;
        })}
      </svg>

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--text-muted)] backdrop-blur">
        <MapPin className="size-3.5 text-[oklch(0.78_0.16_275)]" />
        Schematic view
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/90 p-3 text-xs text-[var(--text-muted)] backdrop-blur">
        {reason === "key" ? <KeyRound className="mt-0.5 size-4 text-[oklch(0.78_0.16_275)]" /> : <AlertTriangle className="mt-0.5 size-4 text-amber-400" />}
        <p>
          {reason === "key" ? (
            <>Add <span className="font-data-tabular text-[var(--text-primary)]">VITE_GOOGLE_MAPS_API_KEY</span> to enable the live map. Until then, this schematic shows your stops.</>
          ) : (
            <>Maps failed to load. Check the browser console, billing, and key restrictions.</>
          )}
        </p>
      </div>
    </div>
  );
}
