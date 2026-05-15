import { useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'var(--radius-lg)'
};

const center = {
  lat: 40.7128,
  lng: -74.0060
};

const MapComponent = ({ locations, itinerary, discoveryResults = [], onAddFromMap }) => {
  const [directions, setDirections] = useState(null);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapsApiKey
  });

  // Calculate real-world directions when itinerary changes
  useEffect(() => {
    if (!isLoaded || !itinerary || !itinerary.days) return;

    const google = window.google;
    const waypoints = [];

    // Flatten all locations from all days into a sequence of waypoints
    itinerary.days.forEach(day => {
      day.route.forEach(step => {
        waypoints.push({
          location: new google.maps.LatLng(step.location.lat, step.location.lng),
          stopover: true
        });
      });
    });

    if (waypoints.length < 2) return;

    const origin = waypoints.shift().location;
    const destination = waypoints.pop().location;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Directions request failed: ${status}`);
        }
      }
    );
  }, [isLoaded, itinerary]);

  const markers = useMemo(() => {
    if (!locations) return [];
    return locations.map((loc, idx) => ({
      id: idx,
      position: { lat: loc.lat, lng: loc.lng },
      label: (idx + 1).toString(),
      title: loc.name
    }));
  }, [locations]);

  const discoveryMarkers = useMemo(() => {
    if (!discoveryResults?.length) return [];
    return discoveryResults.map((loc, idx) => ({
      place: loc,
      key: loc.id != null ? `disc-${loc.id}` : `disc-idx-${idx}`,
      position: { lat: loc.lat, lng: loc.lng },
      title: loc.name,
      icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
    }));
  }, [discoveryResults]);

  const mapCenter = useMemo(() => {
    if (discoveryResults && discoveryResults.length > 0) {
      return { lat: discoveryResults[0].lat, lng: discoveryResults[0].lng };
    }
    if (markers.length > 0) {
      return markers[0].position;
    }
    return center;
  }, [markers, discoveryResults]);

  if (!mapsApiKey) {
    return (
      <div className="flex-col align-center justify-center gap-sm h-full w-full text-center p-md" style={{ background: 'var(--surface-color)' }}>
        <span className="icon" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>
          map
        </span>
        <p className="font-bold text-main">Map needs an API key</p>
        <p className="text-sm text-muted max-w-sm">
          Add <span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>VITE_GOOGLE_MAPS_API_KEY</span> to{' '}
          <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>client/.env</span>, then restart Vite.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-col align-center justify-center gap-sm h-full w-full text-center p-md" style={{ background: 'var(--surface-color)' }}>
        <span className="icon" style={{ fontSize: '48px', color: '#ef4444' }}>
          error
        </span>
        <p className="font-bold text-main">Maps failed to load</p>
        <p className="text-sm text-muted max-w-sm">Check the browser console, billing, and API restrictions for your key.</p>
      </div>
    );
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={12}
      options={{
        styles: darkMapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
      }}
    >
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          label={marker.label}
          title={marker.title}
        />
      ))}

      {discoveryMarkers.map((marker) => (
        <Marker
          key={marker.key}
          position={marker.position}
          title={marker.title}
          icon={marker.icon}
          onClick={() => onAddFromMap?.(marker.place)}
        />
      ))}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // We already have custom markers
            polylineOptions: {
              strokeColor: '#00d2ff',
              strokeOpacity: 0.85,
              strokeWeight: 5,
            }
          }}
        />
      )}
    </GoogleMap>
  ) : (
    <div className="flex-col align-center justify-center gap-sm h-full w-full" style={{ background: 'var(--surface-color)' }}>
      <div className="spinner icon" style={{ fontSize: '32px', color: 'var(--primary-color)' }}>autorenew</div>
      <p className="text-sm text-muted font-bold">Loading map…</p>
    </div>
  );
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

export default MapComponent;
