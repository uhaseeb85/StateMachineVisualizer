/**
 * Custom hook for managing state machine simulation
 * Provides functionality for:
 * - Starting and resetting simulation
 * - Stepping through states and rules
 * - Managing simulation path and history
 * - Handling rule outcomes and state transitions
 * - Undo functionality
 */

import { useState } from 'react';

/**
 * @typedef {Object} Rule
 * @property {string} id - Unique identifier for the rule
 * @property {string} [nextState] - ID of the next state if rule succeeds
 */

/**
 * @typedef {Object} State
 * @property {string} id - Unique identifier for the state
 * @property {Rule[]} rules - Array of rules for this state
 */

/**
 * @typedef {Object} PathItem
 * @property {'state' | 'rule'} type - Type of path item
 * @property {string} id - ID of the state or rule
 */

/**
 * @typedef {Object} SimulationState
 * @property {string | null} currentState - ID of the current state
 * @property {string | null} currentRule - ID of the current rule being evaluated
 * @property {PathItem[]} path - Array tracking simulation history
 * @property {'initial' | 'active' | 'evaluating' | 'deciding' | 'completed'} status - Current simulation status
 */

/**
 * Hook for managing state machine simulation
 * @param {State[]} states - Array of states in the state machine
 * @returns {Object} Simulation management methods and state
 */
export default function useSimulation(states) {
  // Modal visibility state
  const [showSimulation, setShowSimulation] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  
  // Simulation configuration
  const [startState, setStartState] = useState(null);
  
  // Core simulation state
  const [simulationState, setSimulationState] = useState({
    currentState: null,
    currentRule: null,
    path: [],
    status: 'initial'
  });

  /** Flag indicating if undo operation is available */
  const canUndo = simulationState.path.length > 1;

  /**
   * Undoes the last action in the simulation
   * Restores the previous state or rule evaluation
   */
  const undo = () => {
    if (!canUndo) return;

    // Remove only the last item from the path
    const newPath = simulationState.path.slice(0, -1);
    
    // Get the last state from the path
    const lastItem = newPath[newPath.length - 1];
    
    // If last item is a state, use that. If it's a rule, find the state it belongs to
    let lastStateId;
    if (lastItem.type === 'state') {
      lastStateId = lastItem.id;
    } else if (lastItem.type === 'rule') {
      // Find the state that contains this rule
      const stateWithRule = states.find(s => s.rules.some(r => r.id === lastItem.id));
      lastStateId = stateWithRule?.id;
    }

    // Determine the new status
    let newStatus = 'active';
    if (lastItem.type === 'rule') {
      newStatus = 'evaluating';
    }

    setSimulationState({
      currentState: lastStateId,
      currentRule: lastItem.type === 'rule' ? lastItem.id : null,
      path: newPath,
      status: newStatus
    });
  };

  /**
   * Starts the simulation from the selected start state
   * If no start state is selected, uses the first state
   */
  const startSimulation = () => {
    if (states.length === 0) {
      alert("Please add at least one state to simulate");
      return;
    }

    const initialStateId = startState || states[0].id;
    const initialState = states.find(s => String(s.id) === String(initialStateId));
    
    if (!initialState) {
      console.error('Initial state not found:', initialStateId);
      alert("Selected state not found. Please try again.");
      return;
    }
    
    setSimulationState({
      currentState: initialState.id,
      currentRule: null,
      path: [{ type: 'state', id: initialState.id }],
      status: 'active'
    });
    setShowSimulation(true);
  };

  /**
   * Handles clicking on a state in the simulation
   * Transitions to the first rule of the clicked state
   * @param {string} stateId - ID of the clicked state
   */
  const handleStateClick = (stateId) => {
    if (simulationState.status !== 'active') return;

    const currentState = states.find(s => s.id === stateId);
    if (!currentState || currentState.rules.length === 0) {
      alert("This state has no rules. Simulation ended.");
      setSimulationState(prev => ({
        ...prev,
        path: [...prev.path, { type: 'state', id: 'end' }],
        status: 'completed'
      }));
      return;
    }

    setSimulationState(prev => ({
      ...prev,
      currentState: stateId,
      currentRule: currentState.rules[0].id,
      path: [...prev.path, { type: 'rule', id: currentState.rules[0].id }],
      status: 'evaluating'
    }));
  };

  /**
   * Handles clicking on a rule in the simulation
   * Transitions to decision state for rule evaluation
   * @param {string} ruleId - ID of the clicked rule
   */
  const handleRuleClick = (ruleId) => {
    if (simulationState.status !== 'evaluating') return;
    
    setSimulationState(prev => ({
      ...prev,
      status: 'deciding'
    }));
  };

  /**
   * Handles the outcome of a rule evaluation
   * On success: Transitions to the next state specified by the rule
   * On failure: Moves to the next rule in the current state
   * @param {'success' | 'failure'} outcome - Result of rule evaluation
   */
  const handleOutcome = (outcome) => {
    if (simulationState.status !== 'deciding') return;

    const currentState = states.find(s => s.id === simulationState.currentState);
    const currentRule = currentState?.rules.find(r => r.id === simulationState.currentRule);

    /**
     * Helper function to find a state by its ID
     * @param {string} stateId - ID of the state to find
     * @returns {State | undefined} Found state or undefined
     */
    const findStateById = (stateId) => {
      return states.find(s => String(s.id) === String(stateId));
    };

    if (outcome === 'success' && currentRule?.nextState) {
      const nextState = findStateById(currentRule.nextState);
      if (!nextState) {
        setSimulationState(prev => ({
          ...prev,
          path: [...prev.path, { type: 'state', id: 'end' }],
          status: 'completed'
        }));
        return;
      }
      
      setSimulationState(prev => ({
        currentState: nextState.id,
        currentRule: null,
        path: [...prev.path, { type: 'state', id: nextState.id }],
        status: 'active'
      }));
    } else {
      const currentRuleIndex = currentState.rules.findIndex(r => r.id === simulationState.currentRule);
      const nextRule = currentState.rules[currentRuleIndex + 1];

      if (nextRule) {
        setSimulationState(prev => ({
          ...prev,
          currentRule: nextRule.id,
          path: [...prev.path, { type: 'rule', id: nextRule.id }],
          status: 'evaluating'
        }));
      } else {
        setSimulationState(prev => ({
          ...prev,
          path: [...prev.path, { type: 'state', id: 'end' }],
          status: 'completed'
        }));
      }
    }
  };

  /**
   * Resets the simulation to its initial state
   * Uses the selected start state or the first state
   */
  const resetSimulation = () => {
    const initialStateId = startState || states[0].id;
    const initialState = states.find(s => String(s.id) === String(initialStateId));
    
    setSimulationState({
      currentState: initialState.id,
      currentRule: null,
      path: [{ type: 'state', id: initialState.id }],
      status: 'active'
    });
  };

  return {
    showSimulation,
    setShowSimulation,
    simulationState,
    startState,
    setStartState,
    showStartModal,
    setShowStartModal,
    startSimulation,
    handleStateClick,
    handleRuleClick,
    handleOutcome,
    resetSimulation,
    canUndo,
    undo
  };
} 