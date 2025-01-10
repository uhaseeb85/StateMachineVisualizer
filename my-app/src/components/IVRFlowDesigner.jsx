import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Save, Upload, Trash2, Play, RotateCcw } from 'lucide-react';

const IVRFlowDesigner = () => {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [newStateName, setNewStateName] = useState('');
  const [simulationState, setSimulationState] = useState({
    currentState: null,
    currentRule: null,
    path: [],
    status: 'initial'
  });

  useEffect(() => {
    const savedFlow = localStorage.getItem('ivrFlow');
    if (savedFlow) {
      setStates(JSON.parse(savedFlow));
    }
  }, []);

  const saveFlow = () => {
    localStorage.setItem('ivrFlow', JSON.stringify(states));
  };

  const addState = () => {
    if (newStateName.trim()) {
      const newState = {
        id: Date.now(),
        name: newStateName,
        rules: [],
      };
      setStates([...states, newState]);
      setNewStateName('');
    }
  };

  const addRule = (stateId) => {
    const updatedStates = states.map(state => {
      if (state.id === stateId) {
        return {
          ...state,
          rules: [...state.rules, {
            id: Date.now(),
            condition: '',
            nextState: '',
          }],
        };
      }
      return state;
    });
    setStates(updatedStates);
  };

  const updateRule = (stateId, ruleId, field, value) => {
    const updatedStates = states.map(state => {
      if (state.id === stateId) {
        const updatedRules = state.rules.map(rule => {
          if (rule.id === ruleId) {
            return { ...rule, [field]: value };
          }
          return rule;
        });
        return { ...state, rules: updatedRules };
      }
      return state;
    });
    setStates(updatedStates);
  };

  const deleteRule = (stateId, ruleId) => {
    const updatedStates = states.map(state => {
      if (state.id === stateId) {
        return {
          ...state,
          rules: state.rules.filter(rule => rule.id !== ruleId),
        };
      }
      return state;
    });
    setStates(updatedStates);
  };

  const deleteState = (stateId) => {
    setStates(states.filter(state => state.id !== stateId));
    if (selectedState === stateId) {
      setSelectedState(null);
    }
  };

  const importFlow = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedStates = JSON.parse(e.target.result);
        setStates(importedStates);
        localStorage.setItem('ivrFlow', JSON.stringify(importedStates));
      } catch (error) {
        console.error('Error importing flow:', error);
      }
    };
    
    reader.readAsText(file);
  };

  const startSimulation = () => {
    if (states.length === 0) {
      alert("Please add at least one state to simulate");
      return;
    }
    
    setSimulationState({
      currentState: states[0].id,
      currentRule: null,
      path: [{ type: 'state', id: states[0].id }],
      status: 'initial'
    });
    setShowSimulation(true);
  };

  const handleStateClick = (stateId) => {
    const currentState = states.find(s => s.id === stateId);
    if (!currentState || currentState.rules.length === 0) {
      alert("This state has no rules");
      return;
    }

    if (simulationState.status !== 'initial') return;

    const firstRule = currentState.rules[0];
    setSimulationState(prev => ({
      ...prev,
      currentRule: firstRule.id,
      path: [...prev.path, { type: 'rule', id: firstRule.id }],
      status: 'selecting-rule'
    }));
  };

  const handleRuleClick = (ruleId) => {
    if (simulationState.status !== 'selecting-rule') return;
    
    setSimulationState(prev => ({
      ...prev,
      status: 'showing-outcomes'
    }));
  };

  const handleOutcome = (outcome) => {
    const currentState = states.find(s => s.id === simulationState.currentState);
    const currentRule = currentState?.rules.find(r => r.id === simulationState.currentRule);

    if (outcome === 'success' && currentRule?.nextState) {
      setSimulationState(prev => ({
        currentState: currentRule.nextState,
        currentRule: null,
        path: [...prev.path, { type: 'state', id: currentRule.nextState }],
        status: 'initial'
      }));
    } else if (outcome === 'failure') {
      const currentRuleIndex = currentState.rules.findIndex(r => r.id === simulationState.currentRule);
      const nextRule = currentState.rules[currentRuleIndex + 1];

      if (nextRule) {
        setSimulationState(prev => ({
          ...prev,
          currentRule: nextRule.id,
          path: [...prev.path, { type: 'rule', id: nextRule.id }],
          status: 'selecting-rule'
        }));
      } else {
        // No more rules, end simulation
        setSimulationState(prev => ({
          ...prev,
          path: [...prev.path, { type: 'state', id: 'end' }],
          status: 'completed'
        }));
      }
    }
  };

  const renderSimulationNode = (node, index) => {
    if (node.type === 'state') {
      const state = node.id === 'end' ? { name: 'END' } : states.find(s => s.id === node.id);
      return (
        <div 
          key={index}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center text-white text-sm
            ${node.id === 'end' 
              ? 'bg-gray-500' 
              : simulationState.status === 'initial' && node.id === simulationState.currentState
                ? 'bg-blue-600 cursor-pointer hover:bg-blue-700'
                : 'bg-blue-400'
            }
            transition-colors
          `}
          onClick={() => {
            if (simulationState.status === 'initial' && node.id === simulationState.currentState) {
              handleStateClick(node.id);
            }
          }}
        >
          <span className="px-2 text-center">
            {state?.name || 'Unknown'}
          </span>
        </div>
      );
    }

    if (node.type === 'rule') {
      const currentState = states.find(s => s.id === simulationState.currentState);
      const rule = currentState?.rules.find(r => r.id === node.id);
      return (
        <div className="flex flex-col items-center gap-2">
          <div 
            className={`
              w-20 h-20 rotate-45 flex items-center justify-center
              ${simulationState.status === 'selecting-rule' && node.id === simulationState.currentRule
                ? 'bg-yellow-600 cursor-pointer hover:bg-yellow-700'
                : 'bg-yellow-400'
              }
              transition-colors
            `}
            onClick={() => {
              if (simulationState.status === 'selecting-rule' && node.id === simulationState.currentRule) {
                handleRuleClick(node.id);
              }
            }}
          >
            <span className="-rotate-45 text-white text-xs px-2 text-center">
              {rule?.condition || 'Unknown'}
            </span>
          </div>
          
          {/* Success/Failure buttons directly under the active rule */}
          {simulationState.status === 'showing-outcomes' && 
           simulationState.currentRule === node.id && (
            <div className="flex gap-2 -mt-1">
              <button
                onClick={() => handleOutcome('success')}
                className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
              >
                Success
              </button>
              <button
                onClick={() => handleOutcome('failure')}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
              >
                Failure
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">IVR Flow Designer</h1>
      
      {/* Add State Section */}
      <div className="mb-4 flex gap-4 items-center">
        <Input
          type="text"
          value={newStateName}
          onChange={(e) => setNewStateName(e.target.value)}
          placeholder="Enter state name"
          className="max-w-xs"
        />
        <Button onClick={addState}>
          <Plus className="w-4 h-4 mr-2" />
          Add State
        </Button>
        <Button onClick={saveFlow}>
          <Save className="w-4 h-4 mr-2" />
          Save Flow
        </Button>
        <Button onClick={startSimulation}>
          <Play className="w-4 h-4 mr-2" />
          Simulate
        </Button>
        <input
          type="file"
          onChange={importFlow}
          className="hidden"
          id="flow-import"
        />
        <Button onClick={() => document.getElementById('flow-import').click()}>
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </div>

      {/* States List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {states.map(state => (
          <Card key={state.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{state.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteState(state.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              onClick={() => setSelectedState(state.id === selectedState ? null : state.id)}
              className="w-full mb-2"
            >
              {state.id === selectedState ? 'Hide Rules' : 'Manage Rules'}
            </Button>

            {selectedState === state.id && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={() => addRule(state.id)}
                  className="w-full"
                >
                  Add Rule
                </Button>
                {state.rules.map(rule => (
                  <div key={rule.id} className="space-y-2 p-2 border rounded">
                    <Input
                      value={rule.condition}
                      onChange={(e) => updateRule(state.id, rule.id, 'condition', e.target.value)}
                      placeholder="Rule condition"
                    />
                    <select
                      value={rule.nextState}
                      onChange={(e) => updateRule(state.id, rule.id, 'nextState', e.target.value)}
                      className="w-full border rounded p-2"
                    >
                      <option value="">Select next state</option>
                      {states.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(state.id, rule.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Simulation Modal */}
      {showSimulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-4/5 h-4/5 overflow-auto relative">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Flow Simulation</h2>
              <Button
                onClick={() => setShowSimulation(false)}
                className="bg-red-500 hover:bg-red-600 transition"
              >
                Close
              </Button>
            </div>

            {/* Simulation Content */}
            <div className="min-h-[400px] border rounded-lg p-4 relative">
              {/* Path Visualization */}
              <div className="flex flex-wrap gap-4 items-center justify-start">
                {simulationState.path.map((node, index) => (
                  <div key={index} className="flex items-center">
                    {renderSimulationNode(node, index)}
                    {index < simulationState.path.length - 1 && (
                      <div className="w-4 h-0.5 bg-gray-400 mx-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Instructions */}
              {simulationState.status === 'initial' && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm">
                  Click on the state to see its rules
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IVRFlowDesigner; 