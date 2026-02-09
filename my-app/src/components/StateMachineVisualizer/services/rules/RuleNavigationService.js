/**
 * RuleNavigationService.js
 * 
 * Service for rule-related navigation operations (SRP).
 * Extracted from RulesPanel.jsx to separate business logic from UI.
 */

/**
 * Rule navigation service
 * Handles navigation to target states from rules
 */
export class RuleNavigationService {
  /**
   * Find state by name (handles partial matches and case-insensitive search)
   * @param {Array} states - All states
   * @param {string} targetName - Target state name
   * @returns {Object|null} Found state or null
   */
  findStateByName(states, targetName) {
    if (!targetName || !Array.isArray(states)) {
      return null;
    }

    const trimmedTarget = targetName.trim();

    // Try exact match first (case-sensitive)
    let foundState = states.find(s => s.name === trimmedTarget);
    if (foundState) return foundState;

    // Try exact match (case-insensitive)
    foundState = states.find(s => 
      s.name.toLowerCase() === trimmedTarget.toLowerCase()
    );
    if (foundState) return foundState;

    // Try partial match (case-insensitive)
    foundState = states.find(s =>
      s.name.toLowerCase().includes(trimmedTarget.toLowerCase())
    );
    if (foundState) return foundState;

    // Try reverse partial match (target contains state name)
    foundState = states.find(s =>
      trimmedTarget.toLowerCase().includes(s.name.toLowerCase())
    );
    
    return foundState || null;
  }

  /**
   * Find state by ID
   * @param {Array} states - All states
   * @param {string} stateId - State ID
   * @returns {Object|null} Found state or null
   */
  findStateById(states, stateId) {
    if (!stateId || !Array.isArray(states)) {
      return null;
    }
    return states.find(s => s.id === stateId) || null;
  }

  /**
   * Get target state for a rule
   * @param {Array} states - All states
   * @param {Object} rule - Rule object with nextState ID
   * @returns {Object|null} Target state or null
   */
  getTargetState(states, rule) {
    if (!rule || !rule.nextState) {
      return null;
    }
    return this.findStateById(states, rule.nextState);
  }

  /**
   * Check if target state exists
   * @param {Array} states - All states
   * @param {string} targetName - Target state name
   * @returns {boolean} True if state exists
   */
  targetStateExists(states, targetName) {
    return this.findStateByName(states, targetName) !== null;
  }

  /**
   * Get all states that reference a specific state
   * @param {Array} states - All states
   * @param {string} stateId - State ID to check references for
   * @returns {Array} Array of states that reference the given state
   */
  getReferencingStates(states, stateId) {
    if (!stateId || !Array.isArray(states)) {
      return [];
    }

    return states.filter(state =>
      state.rules.some(rule => rule.nextState === stateId)
    );
  }

  /**
   * Get all states that a state can transition to
   * @param {Object} state - State object
   * @param {Array} allStates - All states
   * @returns {Array} Array of reachable states
   */
  getReachableStates(state, allStates) {
    if (!state || !state.rules || !Array.isArray(allStates)) {
      return [];
    }

    const reachableStateIds = new Set(
      state.rules
        .map(rule => rule.nextState)
        .filter(id => id !== null && id !== undefined)
    );

    return allStates.filter(s => reachableStateIds.has(s.id));
  }

  /**
   * Check if a state has any rules
   * @param {Object} state - State object
   * @returns {boolean} True if state has rules
   */
  hasRules(state) {
    return state && Array.isArray(state.rules) && state.rules.length > 0;
  }

  /**
   * Get rule by ID from a state
   * @param {Object} state - State object
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule object or null
   */
  getRuleById(state, ruleId) {
    if (!state || !state.rules || !ruleId) {
      return null;
    }
    return state.rules.find(r => r.id === ruleId) || null;
  }

  /**
   * Find all orphaned states (states with no incoming transitions)
   * @param {Array} states - All states
   * @returns {Array} Array of orphaned states
   */
  findOrphanedStates(states) {
    if (!Array.isArray(states)) {
      return [];
    }

    const referencedStateIds = new Set();
    
    states.forEach(state => {
      if (state.rules) {
        state.rules.forEach(rule => {
          if (rule.nextState) {
            referencedStateIds.add(rule.nextState);
          }
        });
      }
    });

    return states.filter(state => !referencedStateIds.has(state.id));
  }

  /**
   * Find all dead-end states (states with no outgoing transitions)
   * @param {Array} states - All states
   * @returns {Array} Array of dead-end states
   */
  findDeadEndStates(states) {
    if (!Array.isArray(states)) {
      return [];
    }

    return states.filter(state => !this.hasRules(state));
  }

  /**
   * Build adjacency map for graph algorithms
   * @param {Array} states - All states
   * @returns {Map} Map of state ID to array of connected state IDs
   */
  buildAdjacencyMap(states) {
    const adjacencyMap = new Map();

    if (!Array.isArray(states)) {
      return adjacencyMap;
    }

    states.forEach(state => {
      const connections = new Set();
      
      if (state.rules) {
        state.rules.forEach(rule => {
          if (rule.nextState) {
            connections.add(rule.nextState);
          }
        });
      }

      adjacencyMap.set(state.id, Array.from(connections));
    });

    return adjacencyMap;
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get singleton instance of RuleNavigationService
 * @returns {RuleNavigationService} Service instance
 */
export const getRuleNavigationService = () => {
  if (!serviceInstance) {
    serviceInstance = new RuleNavigationService();
  }
  return serviceInstance;
};
