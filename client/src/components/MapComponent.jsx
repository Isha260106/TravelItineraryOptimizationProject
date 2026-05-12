import { useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 40.7128,
  lng: -74.0060
};

const MapComponent = ({ locations, itinerary, discoveryResults = [] }) => {
  const [directions, setDirections] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
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
    if (!discoveryResults) return [];
    return discoveryResults.map((loc, idx) => ({
      id: `disc-${loc.id || idx}`,
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

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={12}
      options={{
        styles: naturalMapStyles,
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

      {discoveryMarkers.map(marker => (
        <Marker
          key={marker.id}
          position={marker.position}
          title={marker.title}
          icon={marker.icon}
        />
      ))}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // We already have custom markers
            polylineOptions: {
              strokeColor: '#2563eb', // Royal blue for visibility on light natural map
              strokeOpacity: 0.9,
              strokeWeight: 6,
            }
          }}
        />
      )}
    </GoogleMap>
  ) : <div className="w-full h-full flex items-center justify-center bg-[var(--bg-dark)] text-[var(--text-muted)]">Loading Map...</div>;
};

const naturalMapStyles = [
  { featureType: "water", stylers: [{ color: "#aee0f4" }] },
  { featureType: "landscape.man_made", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "landscape.natural", stylers: [{ color: "#d2f3e0" }] },
  { featureType: "poi.park", stylers: [{ color: "#b6e5cb" }] },
  { featureType: "road.highway", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
  { featureType: "road.arterial", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local", stylers: [{ color: "#ffffff" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#555555" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 2 }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
];

export default MapComponent;
