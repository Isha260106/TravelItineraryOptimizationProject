/**
 * CAA-TIOS Optimization Engine
 * Implements a Genetic Algorithm (GA) for Constraint-Aware Travel Itinerary Optimization.
 */

class OptimizationEngine {
  constructor(config = {}) {
    this.popSize = config.popSize || 100;
    this.generations = config.generations || 200;
    this.mutationRate = config.mutationRate || 0.1;
    this.crossoverRate = config.crossoverRate || 0.8;
    this.tournamentSize = config.tournamentSize || 5;
    
    // Constraint Weights
    this.weights = {
      travelTime: 1.0,
      distance: 0.5,
      timeWindowPenalty: 5000,
      mandatoryPenalty: 10000,
      tripOverflowPenalty: 2000,
      breakViolationPenalty: 1000
    };
  }

  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    console.log("GA Engine: Weights updated to", this.weights);
  }

  /**
   * Main entry point for optimization
   * @param {Object} data - { source, destinations, constraints }
   */
  optimize(data) {
    const { source, destinations, constraints } = data;
    const allLocations = [source, ...destinations];
    const n = destinations.length;
    
    let population = this.initializePopulation(n);
    
    for (let g = 0; g < this.generations; g++) {
      const fitnesses = population.map(chromo => this.evaluate(chromo, allLocations, constraints));
      const nextGen = [];
      
      while (nextGen.length < this.popSize) {
        const parent1 = this.select(population, fitnesses);
        const parent2 = this.select(population, fitnesses);
        
        let child = parent1;
        if (Math.random() < this.crossoverRate) {
          child = this.crossover(parent1, parent2);
        }
        
        if (Math.random() < this.mutationRate) {
          child = this.mutate(child);
        }
        
        nextGen.push(child);
      }
      population = nextGen;
    }
    
    // Return best solution
    const finalFitnesses = population.map(chromo => this.evaluate(chromo, allLocations, constraints));
    const bestIdx = finalFitnesses.indexOf(Math.min(...finalFitnesses));
    const bestChromo = population[bestIdx];
    
    return this.decode(bestChromo, allLocations, constraints);
  }

  initializePopulation(n) {
    const population = [];
    for (let i = 0; i < this.popSize; i++) {
      const chromo = Array.from({ length: n }, (_, k) => k + 1); // 1 to n (destinations)
      this.shuffle(chromo);
      population.push(chromo);
    }
    return population;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  select(population, fitnesses) {
    let bestIdx = -1;
    for (let i = 0; i < this.tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.length);
      if (bestIdx === -1 || fitnesses[idx] < fitnesses[bestIdx]) {
        bestIdx = idx;
      }
    }
    return population[bestIdx];
  }

  crossover(p1, p2) {
    // Ordered Crossover (OX)
    const size = p1.length;
    const [start, end] = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)].sort((a, b) => a - b);
    
    const child = Array(size).fill(null);
    for (let i = start; i <= end; i++) {
      child[i] = p1[i];
    }
    
    let current = (end + 1) % size;
    for (let i = 0; i < size; i++) {
      const val = p2[(end + 1 + i) % size];
      if (!child.includes(val)) {
        child[current] = val;
        current = (current + 1) % size;
      }
    }
    return child;
  }

  mutate(chromo) {
    // Swap Mutation
    const idx1 = Math.floor(Math.random() * chromo.length);
    const idx2 = Math.floor(Math.random() * chromo.length);
    const newChromo = [...chromo];
    [newChromo[idx1], newChromo[idx2]] = [newChromo[idx2], newChromo[idx1]];
    return newChromo;
  }

  /**
   * Evaluates a chromosome and returns a "score" (lower is better)
   */
  evaluate(chromo, allLocations, constraints) {
    const itinerary = this.decode(chromo, allLocations, constraints);
    let score = itinerary.totalTravelTime * this.weights.travelTime +
                itinerary.totalDistance * this.weights.distance;
    
    // Penalties
    score += itinerary.violations.timeWindow * this.weights.timeWindowPenalty;
    score += itinerary.violations.mandatoryMissing * this.weights.mandatoryPenalty;
    score += itinerary.violations.tripOverflow * this.weights.tripOverflowPenalty;
    score += itinerary.violations.breakViolation * this.weights.breakViolationPenalty;
    
    return score;
  }

  /**
   * Decodes a chromosome into a detailed itinerary with timestamps and feasibility checks
   */
  decode(chromo, allLocations, constraints) {
    const routeIndices = [0, ...chromo]; // Start with source (index 0)
    const itinerary = {
      days: [],
      totalTravelTime: 0,
      totalDistance: 0,
      violations: {
        timeWindow: 0,
        mandatoryMissing: 0,
        tripOverflow: 0,
        breakViolation: 0
      },
      warnings: []
    };

    let currentDay = 1;
    let currentTime = constraints.startTime || 9 * 60; // Default 9 AM in minutes
    let currentLocIdx = 0;
    let dayRoute = [];

    // Human-centric model (minutes from midnight)
    const SLEEP_START = 22 * 60; // 10 PM
    const SLEEP_END = 6 * 60;    // 6 AM
    const MEALS = [
      { name: 'Breakfast', start: 8 * 60, end: 9 * 60 },
      { name: 'Lunch', start: 13 * 60, end: 14 * 60 },
      { name: 'Dinner', start: 20 * 60, end: 21 * 60 }
    ];

    for (let i = 1; i < routeIndices.length; i++) {
      const nextLocIdx = routeIndices[i];
      const from = allLocations[currentLocIdx];
      const to = allLocations[nextLocIdx];
      
      // Get travel time and distance (mocked or from distance matrix service)
      const travelTime = this.getTravelTime(from, to, currentTime);
      const distance = this.getDistance(from, to);

      let arrivalTime = currentTime + travelTime;
      
      // Check if arrival overflows current day
      if (arrivalTime > SLEEP_START) {
        // End current day
        itinerary.days.push({ day: currentDay, route: dayRoute });
        currentDay++;
        currentTime = SLEEP_END; // Start next day
        arrivalTime = currentTime + travelTime;
        dayRoute = [];
        
        if (currentDay > constraints.maxDays) {
          itinerary.violations.tripOverflow++;
          itinerary.warnings.push(`Trip exceeds maximum allowed days (${constraints.maxDays})`);
        }
      }

      // Check Meal Breaks
      for (const meal of MEALS) {
        if (arrivalTime > meal.start && arrivalTime < meal.end) {
          itinerary.violations.breakViolation++;
          itinerary.warnings.push(`Arrival at ${to.name} overlaps with ${meal.name}`);
        }
      }

      // Check Time Window
      if (to.timeWindow) {
        const { open, close } = to.timeWindow;
        if (arrivalTime < open) {
          // Arrived early, wait until opening
          arrivalTime = open;
        } else if (arrivalTime > close) {
          itinerary.violations.timeWindow++;
          itinerary.warnings.push(`${to.name} is closed upon arrival (${this.formatTime(arrivalTime)})`);
        }
        
        if (arrivalTime + to.duration > close) {
          itinerary.violations.timeWindow++;
          itinerary.warnings.push(`Not enough time at ${to.name} before closing`);
        }
      }

      const departureTime = arrivalTime + (to.duration || 60);
      
      dayRoute.push({
        location: to,
        arrivalTime: this.formatTime(arrivalTime),
        departureTime: this.formatTime(departureTime),
        travelFromPrev: travelTime
      });

      itinerary.totalTravelTime += travelTime;
      itinerary.totalDistance += distance;
      currentTime = departureTime;
      currentLocIdx = nextLocIdx;
    }

    // Add last day
    if (dayRoute.length > 0) {
      itinerary.days.push({ day: currentDay, route: dayRoute });
    }

    // Check mandatory locations
    const visitedIndices = new Set(routeIndices);
    allLocations.forEach((loc, idx) => {
      if (loc.mandatory && !visitedIndices.has(idx)) {
        itinerary.violations.mandatoryMissing++;
        itinerary.warnings.push(`Mandatory location ${loc.name} is missing from itinerary`);
      }
    });

    return itinerary;
  }

  // Utilities
  getTravelTime(from, to, timeOfDay) {
    // In a real app, this would use Google Distance Matrix API with traffic
    // For the engine logic, we assume a base time + traffic factor
    const baseTime = 30; // 30 mins
    const trafficFactor = 1 + 0.5 * Math.sin((timeOfDay / (24 * 60)) * 2 * Math.PI); // Peak hours simulation
    return Math.floor(baseTime * trafficFactor);
  }

  getDistance(from, to) {
    return 10; // 10 km
  }

  formatTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

module.exports = OptimizationEngine;
