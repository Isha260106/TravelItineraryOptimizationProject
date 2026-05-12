const axios = require('axios');
require('dotenv').config();

class PlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.weights = {
      rating: 0.5,
      popularity: 0.3,
      distance: 0.2
    };
  }

  async getCoordinates(query) {
    if (!this.apiKey) throw new Error("API Key missing for Geocoding");

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: query, key: this.apiKey }
      });
      
      if (response.data.status === 'REQUEST_DENIED') {
        console.warn("Geocoding API Denied, falling back to mock data");
        return this.getMockCoordinates(query);
      }
      if (response.data.status === 'ZERO_RESULTS') throw new Error("Location not found");
      if (response.data.status !== 'OK') throw new Error(`Geocoding Error: ${response.data.status}`);
      
      return response.data.results[0].geometry.location;
    } catch (error) {
      console.warn("Geocoding Error, falling back to mock data:", error.message);
      return this.getMockCoordinates(query);
    }
  }

  async getMockCoordinates(query) {
    try {
      // Free open-source geocoding fallback
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'TravelItineraryApp/1.0 (test)' }
      });
      if (response.data && response.data.length > 0) {
        return { 
          lat: parseFloat(response.data[0].lat), 
          lng: parseFloat(response.data[0].lon) 
        };
      }
    } catch (err) {
      console.warn("Nominatim fallback failed:", err.message);
    }
    // Default to London if everything fails
    return { lat: 51.5074, lng: -0.1278 };
  }

  async findNearby(lat, lng, radius = 5000, type = 'tourist_attraction') {
    if (!this.apiKey) throw new Error("API Key missing for Nearby Search");

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: radius,
          type: type,
          key: this.apiKey
        }
      });

      if (response.data.status === 'REQUEST_DENIED') {
        console.warn("Places API Denied, falling back to mock data");
        return this.getMockPlaces(lat, lng);
      }

      if (response.data.status === 'ZERO_RESULTS') return [];
      
      if (response.data.status !== 'OK') {
        throw new Error(`Places API Error: ${response.data.status}`);
      }

      const places = response.data.results.map(p => ({
        id: p.place_id,
        name: p.name,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        rating: p.rating || 0,
        userRatingsTotal: p.user_ratings_total || 0,
        distance: this.calculateDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng)
      }));

      return this.rankPlaces(places);
    } catch (error) {
      console.warn("Places Search Error, falling back to mock data:", error.message);
      return this.getMockPlaces(lat, lng);
    }
  }

  getMockPlaces(lat, lng) {
    const mockPlaces = [
      { id: "mock1", name: "Mock Attraction 1", geometry: { location: { lat: lat + 0.01, lng: lng + 0.01 } }, rating: 4.5, user_ratings_total: 1200 },
      { id: "mock2", name: "Mock Attraction 2", geometry: { location: { lat: lat - 0.01, lng: lng - 0.02 } }, rating: 4.2, user_ratings_total: 800 },
      { id: "mock3", name: "Mock Attraction 3", geometry: { location: { lat: lat + 0.02, lng: lng - 0.01 } }, rating: 4.8, user_ratings_total: 2500 }
    ];
    
    const places = mockPlaces.map(p => ({
      id: p.id,
      name: p.name,
      lat: p.geometry.location.lat,
      lng: p.geometry.location.lng,
      rating: p.rating || 0,
      userRatingsTotal: p.user_ratings_total || 0,
      distance: this.calculateDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng)
    }));

    return this.rankPlaces(places);
  }

  rankPlaces(places) {
    return places.map(p => {
      const normRating = p.rating / 5;
      const normPopularity = Math.min(p.userRatingsTotal / 1000, 1);
      const normDistance = 1 / (1 + p.distance / 1000);

      const score = (normRating * this.weights.rating) + 
                    (normPopularity * this.weights.popularity) + 
                    (normDistance * this.weights.distance);

      return { ...p, score: parseFloat(score.toFixed(4)) };
    }).sort((a, b) => b.score - a.score);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; 
  }
}

module.exports = new PlacesService();
