import { useState } from 'react';

export default function useSimulation(states) {
  const [showSimulation, setShowSimulation] = useState(false);
  const [startState, setStartState] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [simulationState, setSimulationState] = useState({
    currentState: null,
    currentRule: null,
    path: [],
    status: 'initial'
  });

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

  const handleRuleClick = (ruleId) => {
    if (simulationState.status !== 'evaluating') return;
    
    setSimulationState(prev => ({
      ...prev,
      status: 'deciding'
    }));
  };

  const handleOutcome = (outcome) => {
    if (simulationState.status !== 'deciding') return;

    const currentState = states.find(s => s.id === simulationState.currentState);
    const currentRule = currentState?.rules.find(r => r.id === simulationState.currentRule);

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

  const handleUndo = () => {
    setSimulationState(prev => {
      if (prev.path.length <= 1) return prev;

      const newPath = prev.path.slice(0, -1);
      const lastNode = newPath[newPath.length - 1];

      return {
        ...prev,
        currentState: lastNode.type === 'state' ? lastNode.id : prev.currentState,
        currentRule: lastNode.type === 'rule' ? lastNode.id : null,
        path: newPath,
        status: lastNode.type === 'state' ? 'active' : 'evaluating'
      };
    });
  };

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
    handleUndo,
    resetSimulation
  };
} 