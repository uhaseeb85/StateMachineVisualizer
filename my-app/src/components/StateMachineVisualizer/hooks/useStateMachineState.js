/**
 * useStateMachineState.js
 * 
 * Core state management hook (SRP).
 * Manages states and selected state only - no persistence, import/export, or undo/redo.
 */

import { useState, useCallback } from 'react';
import { generateId } from '../utils';

/**
 * Hook for core state machine state management
 * Provides CRUD operations for states without side effects
 * @param {Array} initialStates - Initial states array
 * @param {string} initialSelectedState - Initial selected state ID
 * @returns {Object} State management methods and state
 */
export const useStateMachineState = (initialStates = [], initialSelectedState = null) => {
  const [states, setStates] = useState(initialStates);
  const [selectedState, setSelectedState] = useState(initialSelectedState);

  /**
   * Add a new state
   * @param {string} name - Name of the new state
   * @returns {Object} The new state object
   */
  const addState = useCallback((name) => {
    if (!name || !name.trim()) {
      throw new Error('State name is required');
    }

    const newState = {
      id: generateId(),
      name: name.trim(),
      rules: []
    };

    setStates(prev => [...prev, newState]);
    return newState;
  }, []);

  /**
   * Edit a state's name
   * @param {string} stateId - ID of the state to edit
   * @param {string} newName - New name for the state
   * @returns {Object} Updated state object or null if not found
   */
  const editState = useCallback((stateId, newName) => {
    if (!newName || !newName.trim()) {
      throw new Error('State name is required');
    }

    let updatedState = null;
    setStates(prev => {
      return prev.map(state => {
        if (state.id === stateId) {
          updatedState = { ...state, name: newName.trim() };
          return updatedState;
        }
        return state;
      });
    });

    return updatedState;
  }, []);

  /**
   * Delete a state
   * @param {string} stateId - ID of the state to delete
   * @returns {boolean} True if deleted, false if state has references
   */
  const deleteState = useCallback((stateId) => {
    let canDelete = true;
    let stateToDelete = null;

    setStates(prev => {
      stateToDelete = prev.find(s => s.id === stateId);
      if (!stateToDelete) {
        canDelete = false;
        return prev;
      }

      // Check if any other state has a rule pointing to this state
      const referencingStates = prev.filter(state => 
        state.id !== stateId &&
        state.rules.some(rule => rule.nextState === stateId)
      );

      if (referencingStates.length > 0) {
        canDelete = false;
        return prev;
      }

      // If selected state is being deleted, clear selection
      if (selectedState === stateId) {
        setSelectedState(null);
      }

      return prev.filter(state => state.id !== stateId);
    });

    return canDelete;
  }, [selectedState]);

  /**
   * Add a rule to a state
   * @param {string} stateId - ID of the state
   * @param {Object} rule - Rule object {id, condition, nextState, priority}
   */
  const addRule = useCallback((stateId, rule) => {
    setStates(prev => {
      return prev.map(state => {
        if (state.id === stateId) {
          return {
            ...state,
            rules: [...state.rules, rule]
          };
        }
        return state;
      });
    });
  }, []);

  /**
   * Update a rule in a state
   * @param {string} stateId - ID of the state
   * @param {string} ruleId - ID of the rule
   * @param {Object} updates - Rule updates
   */
  const updateRule = useCallback((stateId, ruleId, updates) => {
    setStates(prev => {
      return prev.map(state => {
        if (state.id === stateId) {
          return {
            ...state,
            rules: state.rules.map(rule => 
              rule.id === ruleId ? { ...rule, ...updates } : rule
            )
          };
        }
        return state;
      });
    });
  }, []);

  /**
   * Delete a rule from a state
   * @param {string} stateId - ID of the state
   * @param {string} ruleId - ID of the rule
   */
  const deleteRule = useCallback((stateId, ruleId) => {
    setStates(prev => {
      return prev.map(state => {
        if (state.id === stateId) {
          return {
            ...state,
            rules: state.rules.filter(rule => rule.id !== ruleId)
          };
        }
        return state;
      });
    });
  }, []);

  /**
   * Get a state by ID
   * @param {string} stateId - ID of the state
   * @returns {Object|null} State object or null
   */
  const getState = useCallback((stateId) => {
    return states.find(s => s.id === stateId) || null;
  }, [states]);

  /**
   * Get the selected state object
   * @returns {Object|null} Selected state object or null
   */
  const getSelectedStateObject = useCallback(() => {
    return selectedState ? getState(selectedState) : null;
  }, [selectedState, getState]);

  /**
   * Clear all states
   */
  const clearStates = useCallback(() => {
    setStates([]);
    setSelectedState(null);
  }, []);

  /**
   * Replace all states (for import operations)
   * @param {Array} newStates - New states array
   */
  const replaceStates = useCallback((newStates) => {
    if (!Array.isArray(newStates)) {
      throw new Error('States must be an array');
    }
    setStates(newStates);
  }, []);

  return {
    // State
    states,
    selectedState,
    
    // Setters (for external control if needed)
    setStates,
    setSelectedState,
    
    // CRUD operations
    addState,
    editState,
    deleteState,
    addRule,
    updateRule,
    deleteRule,
    
    // Queries
    getState,
    getSelectedStateObject,
    
    // Bulk operations
    clearStates,
    replaceStates
  };
};
