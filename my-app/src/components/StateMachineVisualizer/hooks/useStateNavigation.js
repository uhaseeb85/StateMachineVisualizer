/**
 * useStateNavigation Hook
 * 
 * Provides state navigation and traversal utilities.
 * Implements Interface Segregation Principle by focusing only on navigation.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles state navigation and traversal
 * - Interface Segregation: Components use only navigation, not full state management
 */

import { useCallback } from 'react';
import { getPathFindingService } from '../services/pathfinding/PathFindingService';
import { getRuleNavigationService } from '../services/rules/RuleNavigationService';

/**
 * Custom hook for state navigation operations
 * 
 * @param {Array} states - Current states array
 * @returns {Object} Navigation functions
 */
export const useStateNavigation = (states) => {
  const pathFindingService = getPathFindingService();
  const ruleNavigationService = getRuleNavigationService();

  /**
   * Finds a state by name
   * 
   * @param {string} name - State name to find
   * @param {Object} options - Search options { exact, caseSensitive }
   * @returns {Object|null} State object or null
   */
  const findStateByName = useCallback((name, options = {}) => {
    return ruleNavigationService.findStateByName(states, name, options);
  }, [states]);

  /**
   * Finds a state by ID
   * 
   * @param {string} id - State ID
   * @returns {Object|null} State object or null
   */
  const findStateById = useCallback((id) => {
    return ruleNavigationService.findStateById(states, id);
  }, [states]);

  /**
   * Gets the target state for a rule
   * 
   * @param {Object} rule - Rule object
   * @returns {Object|null} Target state or null
   */
  const getTargetState = useCallback((rule) => {
    return ruleNavigationService.getTargetState(states, rule);
  }, [states]);

  /**
   * Finds all states that reference a given state
   * 
   * @param {string} stateId - State ID to check
   * @returns {Array} Array of referencing states
   */
  const getReferencingStates = useCallback((stateId) => {
    return ruleNavigationService.getReferencingStates(states, stateId);
  }, [states]);

  /**
   * Finds all states reachable from a given state
   * 
   * @param {string} stateId - Starting state ID
   * @returns {Array} Array of reachable states
   */
  const getReachableStates = useCallback((stateId) => {
    return ruleNavigationService.getReachableStates(states, stateId);
  }, [states]);

  /**
   * Finds orphaned states (states with no incoming edges)
   * 
   * @returns {Array} Array of orphaned states
   */
  const findOrphanedStates = useCallback(() => {
    return ruleNavigationService.findOrphanedStates(states);
  }, [states]);

  /**
   * Finds dead-end states (states with no outgoing edges)
   * 
   * @returns {Array} Array of dead-end states
   */
  const findDeadEndStates = useCallback(() => {
    return ruleNavigationService.findDeadEndStates(states);
  }, [states]);

  /**
   * Finds the shortest path between two states
   * 
   * @param {string} fromStateId - Starting state ID
   * @param {string} toStateId - Target state ID
   * @returns {Object|null} Path object or null if no path exists
   */
  const findShortestPath = useCallback((fromStateId, toStateId) => {
    return pathFindingService.findShortestPath(states, fromStateId, toStateId);
  }, [states]);

  /**
   * Checks if a state is reachable from another state
   * 
   * @param {string} fromStateId - Starting state ID
   * @param {string} toStateId - Target state ID
   * @returns {boolean} True if reachable
   */
  const isReachable = useCallback((fromStateId, toStateId) => {
    return pathFindingService.isReachable(states, fromStateId, toStateId);
  }, [states]);

  /**
   * Scrolls to a state element in the UI
   * 
   * @param {string} stateId - State ID
   * @param {Object} options - Scroll options { behavior, block }
   */
  const scrollToState = useCallback((stateId, options = {}) => {
    const {
      behavior = 'smooth',
      block = 'nearest'
    } = options;

    const stateElement = document.querySelector(`[data-state-id="${stateId}"]`);
    if (stateElement) {
      stateElement.scrollIntoView({ behavior, block });
    }
  }, []);

  /**
   * Builds an adjacency map of the state machine
   * 
   * @returns {Map} Adjacency map (stateId -> array of connected state IDs)
   */
  const buildAdjacencyMap = useCallback(() => {
    return ruleNavigationService.buildAdjacencyMap(states);
  }, [states]);

  return {
    findStateByName,
    findStateById,
    getTargetState,
    getReferencingStates,
    getReachableStates,
    findOrphanedStates,
    findDeadEndStates,
    findShortestPath,
    isReachable,
    scrollToState,
    buildAdjacencyMap
  };
};

export default useStateNavigation;
