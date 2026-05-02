const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  duration: Number,
  mandatory: Boolean,
  timeWindow: {
    open: Number,
    close: Number
  }
});

const ItinerarySchema = new mongoose.Schema({
  userId: String,
  name: String,
  source: LocationSchema,
  destinations: [LocationSchema],
  constraints: {
    maxDays: Number,
    startTime: Number
  },
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Itinerary', ItinerarySchema);
