export type TimeWindow = { open: number; close: number };

export type PlannerLocation = {
  name: string;
  lat: number;
  lng: number;
  duration: number;
  mandatory: boolean;
  timeWindow: TimeWindow;
};

export type Constraints = {
  maxDays: number;
  startTime: number; // minutes from midnight
};

export type DiscoveryPlace = {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  distance: number; // meters
};

export type ItineraryStep = {
  location: PlannerLocation;
  arrivalTime: string;
  departureTime: string;
  travelFromPrev: number;
};

export type Itinerary = {
  days: { day: number; route: ItineraryStep[] }[];
  warnings: string[];
};
