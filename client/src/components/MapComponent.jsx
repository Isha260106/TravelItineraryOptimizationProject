import React, { useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 40.7128,
  lng: -74.0060
};

const MapComponent = ({ locations, itinerary }) => {
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

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={markers[0]?.position || center}
      zoom={12}
      options={{
        styles: darkMapStyles,
        disableDefaultUI: true,
        zoomControl: true,
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

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // We already have custom markers
            polylineOptions: {
              strokeColor: '#38bdf8',
              strokeOpacity: 0.8,
              strokeWeight: 5,
            }
          }}
        />
      )}
    </GoogleMap>
  ) : <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">Loading Map...</div>;
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  // ... more dark styles can be added for premium look
];

export default MapComponent;
