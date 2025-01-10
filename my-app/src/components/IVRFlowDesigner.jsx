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
          
          {/* Round Yes/No buttons under the active rule */}
          {simulationState.status === 'showing-outcomes' && 
           simulationState.currentRule === node.id && (
            <div className="flex gap-4 -mt-1">
              <button
                onClick={() => handleOutcome('success')}
                className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 
                         text-white text-xs flex items-center justify-center 
                         transition-colors shadow-sm hover:shadow"
              >
                Yes
              </button>
              <button
                onClick={() => handleOutcome('failure')}
                className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 
                         text-white text-xs flex items-center justify-center 
                         transition-colors shadow-sm hover:shadow"
              >
                No
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">IVR Flow Designer</h1>
        <div className="space-x-2">
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
      </div>

      <div className="flex gap-6">
        {/* Left Side - States List */}
        <div className="w-1/3 border rounded-lg p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">States</h2>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="Enter state name"
                className="flex-1"
              />
              <Button onClick={addState}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {states.map(state => (
              <div 
                key={state.id} 
                className={`
                  p-3 rounded-lg border cursor-pointer
                  ${selectedState === state.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                `}
                onClick={() => setSelectedState(state.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{state.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteState(state.id);
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {state.rules.length} rule{state.rules.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Rule Management */}
        <div className="w-2/3 border rounded-lg p-4">
          {selectedState ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Rules for {states.find(s => s.id === selectedState)?.name}
                </h2>
                <Button onClick={() => addRule(selectedState)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
              
              <div className="space-y-4">
                {states
                  .find(s => s.id === selectedState)
                  ?.rules.map((rule, index) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Rule {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(selectedState, rule.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          value={rule.condition}
                          onChange={(e) =>
                            updateRule(
                              selectedState,
                              rule.id,
                              'condition',
                              e.target.value
                            )
                          }
                          placeholder="Rule condition"
                        />
                        <select
                          value={rule.nextState}
                          onChange={(e) =>
                            updateRule(
                              selectedState,
                              rule.id,
                              'nextState',
                              e.target.value
                            )
                          }
                          className="w-full border rounded-md p-2"
                        >
                          <option value="">Select next state</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a state to manage its rules
            </div>
          )}
        </div>
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