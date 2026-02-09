/**
 * useRuleOperations Hook
 * 
 * Provides focused rule CRUD operations for the State Machine Visualizer.
 * Implements Interface Segregation Principle by separating rule operations from other concerns.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles rule CRUD operations
 * - Interface Segregation: Components use only rule operations, not entire state machine
 */

import { useCallback } from 'react';
import { sortRulesByPriority } from '../utils';

/**
 * Custom hook for rule operations
 * 
 * @param {Array} states - Current states array
 * @param {Function} setStates - State setter function
 * @param {Function} addToChangeLog - Change log callback
 * @param {Function} withUndoCapture - Undo capture wrapper
 * @returns {Object} Rule operation functions
 */
export const useRuleOperations = (states, setStates, addToChangeLog = () => {}, withUndoCapture = (fn) => fn()) => {
  /**
   * Adds a new rule to a state
   * 
   * @param {string} stateId - State ID to add rule to
   * @param {Object} rule - Rule object { condition, nextState, priority, operation }
   * @returns {boolean} True if successful
   */
  const addRule = useCallback((stateId, rule) => {
    if (!rule.condition?.trim() || !rule.nextState) {
      return false;
    }

    let success = false;

    const updatedStates = states.map(state => {
      if (state.id === stateId) {
        // Check for duplicate
        const existingRule = state.rules.find(
          r => r.condition.trim().toLowerCase() === rule.condition.trim().toLowerCase()
        );

        if (existingRule) {
          return state; // No change
        }

        const targetState = states.find(s => s.id === rule.nextState);
        addToChangeLog(
          `Added new rule to state "${state.name}": ${rule.condition.trim()} → ${targetState?.name} (Priority: ${rule.priority ?? 50})`
        );

        const newRules = [...state.rules, {
          id: Date.now(),
          condition: rule.condition.trim(),
          nextState: rule.nextState,
          priority: rule.priority ?? 50,
          operation: rule.operation || ''
        }];

        success = true;
        return {
          ...state,
          rules: sortRulesByPriority(newRules)
        };
      }
      return state;
    });

    if (success) {
      withUndoCapture(() => setStates(updatedStates));
    }

    return success;
  }, [states, setStates, addToChangeLog, withUndoCapture]);

  /**
   * Updates an existing rule
   * 
   * @param {string} stateId - State ID containing the rule
   * @param {string|number} ruleId - Rule ID to update
   * @param {Object} updates - Rule updates { condition, nextState, priority, operation }
   * @returns {boolean} True if successful
   */
  const updateRule = useCallback((stateId, ruleId, updates) => {
    const updatedStates = states.map(state => {
      if (state.id === stateId) {
        const rule = state.rules.find(r => r.id === ruleId);
        if (!rule) return state;

        addToChangeLog(
          `Updated rule in state "${state.name}": ${rule.condition} → Modified`
        );

        const updatedRules = state.rules.map(r =>
          r.id === ruleId
            ? {
                ...r,
                condition: updates.condition !== undefined ? updates.condition.trim() : r.condition,
                nextState: updates.nextState !== undefined ? updates.nextState : r.nextState,
                priority: updates.priority !== undefined ? updates.priority : r.priority,
                operation: updates.operation !== undefined ? updates.operation : r.operation
              }
            : r
        );

        return {
          ...state,
          rules: sortRulesByPriority(updatedRules)
        };
      }
      return state;
    });

    withUndoCapture(() => setStates(updatedStates));
    return true;
  }, [states, setStates, addToChangeLog, withUndoCapture]);

  /**
   * Deletes a rule from a state
   * 
   * @param {string} stateId - State ID containing the rule
   * @param {string|number} ruleId - Rule ID to delete
   */
  const deleteRule = useCallback((stateId, ruleId) => {
    const updatedStates = states.map(state => {
      if (state.id === stateId) {
        const ruleToDelete = state.rules.find(rule => rule.id === ruleId);
        if (!ruleToDelete) return state;

        const targetState = states.find(s => s.id === ruleToDelete.nextState);
        addToChangeLog(
          `Deleted rule from state "${state.name}": ${ruleToDelete.condition} → ${targetState?.name}`
        );

        return {
          ...state,
          rules: state.rules.filter(rule => rule.id !== ruleId)
        };
      }
      return state;
    });

    withUndoCapture(() => setStates(updatedStates));
  }, [states, setStates, addToChangeLog, withUndoCapture]);

  /**
   * Copies a rule within a state or to another state
   * 
   * @param {string} sourceStateId - Source state ID
   * @param {string|number} ruleId - Rule ID to copy
   * @param {string} targetStateId - Target state ID (defaults to source)
   */
  const copyRule = useCallback((sourceStateId, ruleId, targetStateId = sourceStateId) => {
    const sourceState = states.find(s => s.id === sourceStateId);
    if (!sourceState) return;

    const ruleToCopy = sourceState.rules.find(r => r.id === ruleId);
    if (!ruleToCopy) return;

    const updatedStates = states.map(state => {
      if (state.id === targetStateId) {
        addToChangeLog(
          `Copied rule to state "${state.name}": ${ruleToCopy.condition}`
        );

        const newRules = [...state.rules, {
          ...ruleToCopy,
          id: Date.now()
        }];

        return {
          ...state,
          rules: sortRulesByPriority(newRules)
        };
      }
      return state;
    });

    withUndoCapture(() => setStates(updatedStates));
  }, [states, setStates, addToChangeLog, withUndoCapture]);

  /**
   * Gets all rules for a state
   * 
   * @param {string} stateId - State ID
   * @returns {Array} Array of rules
   */
  const getRules = useCallback((stateId) => {
    const state = states.find(s => s.id === stateId);
    return state?.rules || [];
  }, [states]);

  /**
   * Gets a specific rule
   * 
   * @param {string} stateId - State ID
   * @param {string|number} ruleId - Rule ID
   * @returns {Object|null} Rule object or null
   */
  const getRule = useCallback((stateId, ruleId) => {
    const state = states.find(s => s.id === stateId);
    return state?.rules.find(r => r.id === ruleId) || null;
  }, [states]);

  return {
    addRule,
    updateRule,
    deleteRule,
    copyRule,
    getRules,
    getRule
  };
};

export default useRuleOperations;
