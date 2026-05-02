/**
 * CAA-TIOS Adaptive Learning Service
 * Implements a simple Reinforcement Learning-inspired agent that adjusts
 * GA weights based on user feedback and manual modifications.
 */

class AdaptiveLearningService {
  constructor() {
    // Initial weights (Starting point)
    this.currentWeights = {
      travelTime: 1.0,
      distance: 0.5,
      timeWindowPenalty: 5000,
      mandatoryPenalty: 10000,
      tripOverflowPenalty: 2000,
      breakViolationPenalty: 1000
    };

    this.learningRate = 0.05;
  }

  /**
   * Adjusts weights based on user behavior (e.g., user reorders a route)
   * @param {Object} feedback - { type: 'reorder', originalScore, userScore, diff }
   */
  learnFromUserAction(actionType, metrics) {
    console.log(`RL Agent: Learning from ${actionType}...`);
    
    switch (actionType) {
      case 'PREFERENCE_TIME':
        // User seems to care more about time than distance
        this.currentWeights.travelTime += this.learningRate;
        this.currentWeights.distance -= this.learningRate;
        break;
      case 'PREFERENCE_DISTANCE':
        this.currentWeights.distance += this.learningRate;
        this.currentWeights.travelTime -= this.learningRate;
        break;
      case 'SKIP_LOCATION':
        // Increase penalty for missing mandatory locations if user skips many
        this.currentWeights.mandatoryPenalty *= 1.1;
        break;
      default:
        break;
    }

    // Clamp weights to keep them sane
    this.currentWeights.travelTime = Math.max(0.1, this.currentWeights.travelTime);
    this.currentWeights.distance = Math.max(0.1, this.currentWeights.distance);
    
    console.log("RL Agent: Updated Weights:", this.currentWeights);
    return this.currentWeights;
  }

  getWeights() {
    return this.currentWeights;
  }
}

module.exports = new AdaptiveLearningService();
