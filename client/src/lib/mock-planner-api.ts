import type { DiscoveryPlace } from "./planner-types";

const SEED: { area: string; lat: number; lng: number; places: Omit<DiscoveryPlace, "distance">[] }[] = [
  {
    area: "tokyo",
    lat: 35.6595,
    lng: 139.7004,
    places: [
      { id: "t1", name: "Shibuya Crossing", lat: 35.6595, lng: 139.7004, rating: 4.6 },
      { id: "t2", name: "Meiji Jingu Shrine", lat: 35.6764, lng: 139.6993, rating: 4.7 },
      { id: "t3", name: "teamLab Planets", lat: 35.6486, lng: 139.7902, rating: 4.5 },
      { id: "t4", name: "Senso-ji Temple", lat: 35.7148, lng: 139.7967, rating: 4.6 },
      { id: "t5", name: "Tokyo Skytree", lat: 35.7101, lng: 139.8107, rating: 4.5 },
      { id: "t6", name: "Shinjuku Gyoen", lat: 35.6852, lng: 139.7100, rating: 4.6 },
    ],
  },
  {
    area: "paris",
    lat: 48.8566,
    lng: 2.3522,
    places: [
      { id: "p1", name: "Eiffel Tower", lat: 48.8584, lng: 2.2945, rating: 4.7 },
      { id: "p2", name: "Louvre Museum", lat: 48.8606, lng: 2.3376, rating: 4.8 },
      { id: "p3", name: "Notre-Dame", lat: 48.8530, lng: 2.3499, rating: 4.7 },
      { id: "p4", name: "Musée d'Orsay", lat: 48.8600, lng: 2.3266, rating: 4.7 },
      { id: "p5", name: "Sacré-Cœur", lat: 48.8867, lng: 2.3431, rating: 4.7 },
    ],
  },
  {
    area: "new york",
    lat: 40.7128,
    lng: -74.006,
    places: [
      { id: "n1", name: "Central Park", lat: 40.7829, lng: -73.9654, rating: 4.8 },
      { id: "n2", name: "The Met", lat: 40.7794, lng: -73.9632, rating: 4.8 },
      { id: "n3", name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969, rating: 4.7 },
      { id: "n4", name: "MoMA", lat: 40.7614, lng: -73.9776, rating: 4.6 },
      { id: "n5", name: "High Line", lat: 40.7480, lng: -74.0048, rating: 4.7 },
    ],
  },
];

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function autocomplete(input: string): Promise<{ place_id: string; description: string }[]> {
  await new Promise((r) => setTimeout(r, 120));
  const q = input.toLowerCase();
  const seeds = ["Tokyo, Japan", "Shibuya, Tokyo", "Paris, France", "Le Marais, Paris", "New York, NY", "Brooklyn, NY", "Kyoto, Japan", "Lisbon, Portugal", "Barcelona, Spain"];
  return seeds
    .filter((s) => s.toLowerCase().includes(q))
    .slice(0, 6)
    .map((s, i) => ({ place_id: `${i}-${s}`, description: s }));
}

export async function nearbyPlaces(location: string, radius: number): Promise<{ center: { lat: number; lng: number }; places: DiscoveryPlace[] }> {
  await new Promise((r) => setTimeout(r, 240));
  const q = location.toLowerCase();
  const region = SEED.find((s) => q.includes(s.area)) ?? SEED[0];
  const places: DiscoveryPlace[] = region.places.map((p) => ({
    ...p,
    distance: dist(region.lat, region.lng, p.lat, p.lng),
  })).filter((p) => p.distance <= radius || true);
  return { center: { lat: region.lat, lng: region.lng }, places };
}
