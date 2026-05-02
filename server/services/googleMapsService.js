const axios = require('axios');
require('dotenv').config();

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.cache = new Map();
  }

  /**
   * Fetches distance matrix for a set of locations
   * @param {Array} origins 
   * @param {Array} destinations 
   */
  async getDistanceMatrix(origins, destinations, departureTime = 'now') {
    const originStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const cacheKey = `${originStr}-${destStr}-${departureTime}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!this.apiKey) {
      console.warn("Google Maps API Key missing. Using simulated data.");
      return this.simulateDistanceMatrix(origins, destinations);
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: originStr,
          destinations: destStr,
          departure_time: departureTime,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API Error: ${response.data.status}`);
      }

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching distance matrix:", error.message);
      return this.simulateDistanceMatrix(origins, destinations);
    }
  }

  simulateDistanceMatrix(origins, destinations) {
    // Return a mocked distance matrix if API is unavailable
    const rows = origins.map(() => ({
      elements: destinations.map(() => ({
        distance: { text: "10 km", value: 10000 },
        duration: { text: "20 mins", value: 1200 },
        status: "OK"
      }))
    }));

    return { status: "OK", rows };
  }
}

module.exports = new GoogleMapsService();
