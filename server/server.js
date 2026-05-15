const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const OptimizationEngine = require('./services/optimizationEngine');
const googleMapsService = require('./services/googleMapsService');
const placesService = require('./services/placesService');
const adaptiveLearningService = require('./services/adaptiveLearningService');
const Itinerary = require('./models/Itinerary');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

/**
 * @route GET /api/health
 * @desc Liveness check for the UI status indicator
 */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mongo: mongoose.connection.readyState === 1 });
});

/**
 * @route GET /api/nearby-places
 * @desc Discover points of interest around a location
 */
app.get('/api/nearby-places', async (req, res) => {
  try {
    const { location, radius, type } = req.query;
    
    // 1. Resolve coordinates
    const coords = await placesService.getCoordinates(location);
    
    // 2. Search nearby
    const places = await placesService.findNearby(coords.lat, coords.lng, radius, type);
    
    res.json({ center: coords, places });
  } catch (error) {
    console.error("Discovery error:", error);
    res.status(500).json({ error: "Failed to discover nearby places" });
  }
});

/**
 * @route GET /api/autocomplete
 * @desc Get asynchronous place predictions
 */
app.get('/api/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input || input.length < 3) return res.json({ predictions: [] });
    const predictions = await placesService.autocomplete(input);
    res.json({ predictions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    res.status(500).json({ error: "Failed to fetch autocomplete suggestions" });
  }
});

// MongoDB Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));
}

const engine = new OptimizationEngine();

/**
 * @route POST /api/optimize
 * @desc Generate optimized itinerary
 */
app.post('/api/optimize', async (req, res) => {
  try {
    const { source, destinations, constraints } = req.body;
    
    if (!source || !destinations || destinations.length === 0) {
      return res.status(400).json({ error: "Source and destinations are required" });
    }

    // Get learned weights from the RL agent
    const learnedWeights = adaptiveLearningService.getWeights();
    engine.updateWeights(learnedWeights);

    // Fetch real distance matrix
    const allLocations = [source, ...destinations];
    const distanceMatrix = await googleMapsService.getDistanceMatrix(allLocations, allLocations);

    // Run GA Optimization
    const result = engine.optimize({ source, destinations, constraints, distanceMatrix });
    
    res.json({ ...result, learnedWeights });
  } catch (error) {
    console.error("Optimization error:", error);
    res.status(500).json({ error: "Internal server error during optimization" });
  }
});

/**
 * @route POST /api/save-itinerary
 * @desc Save generated itinerary
 */
app.post('/api/save-itinerary', async (req, res) => {
  try {
    const itinerary = new Itinerary(req.body);
    await itinerary.save();
    res.json({ success: true, id: itinerary._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to save itinerary" });
  }
});

/**
 * @route POST /api/validate
 * @desc Validate a manually modified itinerary
 */
app.post('/api/validate', async (req, res) => {
  try {
    const { chromo, source, destinations, constraints } = req.body;
    const allLocations = [source, ...destinations];
    
    // Fetch matrix to properly decode the travel times
    const distanceMatrix = await googleMapsService.getDistanceMatrix(allLocations, allLocations);
    engine.distanceMatrix = distanceMatrix;
    
    const result = engine.decode(chromo, allLocations, constraints);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

/**
 * @route POST /api/feedback
 * @desc Provide feedback to the Adaptive Learning Agent
 */
app.post('/api/feedback', (req, res) => {
  try {
    const { actionType } = req.body;
    const newWeights = adaptiveLearningService.learnFromUserAction(actionType);
    res.json({ success: true, newWeights });
  } catch (error) {
    res.status(500).json({ error: "Feedback processing failed" });
  }
});

app.listen(PORT, () => {
  console.log(`CAA-TIOS Server running on port ${PORT}`);
});
