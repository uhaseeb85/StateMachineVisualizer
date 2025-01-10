import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Save, Upload, Trash2, Play } from 'lucide-react';

const IVRFlowDesigner = () => {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationState, setSimulationState] = useState({
    currentState: null,
    selectedRule: null,
    ruleOutcome: null
  });
  const [newStateName, setNewStateName] = useState('');

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedFlow = localStorage.getItem('ivrFlow');
    if (savedFlow) {
      setStates(JSON.parse(savedFlow));
    }
  }, []);

  // Save state to localStorage
  const saveFlow = () => {
    localStorage.setItem('ivrFlow', JSON.stringify(states));
  };

  // Export flow as JSON file
  const exportFlow = () => {
    const dataStr = JSON.stringify(states, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'ivr-flow.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import flow from JSON file
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

  // Add new state
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

  // Add rule to state
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

  // Update rule
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

  // Delete rule
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

  // Delete state
  const deleteState = (stateId) => {
    setStates(states.filter(state => state.id !== stateId));
    if (selectedState === stateId) {
      setSelectedState(null);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="text-2xl font-bold">IVR Flow Designer</div>
          <div className="space-x-2">
            <Button onClick={saveFlow}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={exportFlow}>Export</Button>
            <Button onClick={() => {
              setShowSimulation(true);
              setSimulationState({
                currentState: states[0]?.id || null,
                selectedRule: null,
                ruleOutcome: null
              });
            }}>
              <Play className="w-4 h-4 mr-2" />
              Simulate
            </Button>
            <Button className="relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={importFlow}
                accept=".json"
              />
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* States List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">States</h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="New state name"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addState}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {states.map(state => (
                  <div
                    key={state.id}
                    className="flex items-center justify-between p-2 rounded border hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedState(state.id)}
                  >
                    <span className="font-medium">{state.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteState(state.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Editor */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {selectedState
                  ? `Rules for ${states.find(s => s.id === selectedState)?.name}`
                  : 'Select a state to edit rules'}
              </h3>
              {selectedState && (
                <Button onClick={() => addRule(selectedState)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedState && (
                <div className="space-y-4">
                  {states
                    .find(s => s.id === selectedState)
                    ?.rules.map(rule => (
                      <div
                        key={rule.id}
                        className="flex items-center space-x-2 p-4 border rounded"
                      >
                        <Input
                          placeholder="Condition"
                          value={rule.condition}
                          onChange={(e) =>
                            updateRule(
                              selectedState,
                              rule.id,
                              'condition',
                              e.target.value
                            )
                          }
                          className="flex-1"
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
                          className="border rounded p-2"
                        >
                          <option value="">Select next state</option>
                          {states.map(state => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(selectedState, rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simulation Modal */}
      {showSimulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-4/5 h-4/5 overflow-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Flow Simulation</h2>
              <Button onClick={() => setShowSimulation(false)}>Close</Button>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center items-center min-h-96">
              {/* Current State Block */}
              {simulationState.currentState && (
                <div 
                  className="relative"
                  onClick={() => {
                    if (!simulationState.selectedRule) {
                      setSimulationState(prev => ({
                        ...prev,
                        selectedRule: states.find(s => s.id === prev.currentState)?.rules[0]?.id || null
                      }));
                    }
                  }}
                >
                  <div className={`p-4 rounded-lg ${
                    !simulationState.selectedRule ? 'bg-blue-500 cursor-pointer' : 'bg-gray-400'
                  } text-white font-semibold min-w-40 text-center`}>
                    {states.find(s => s.id === simulationState.currentState)?.name}
                  </div>
                  {simulationState.selectedRule && (
                    <div className="h-8 w-0.5 bg-black mx-auto mt-2" />
                  )}
                </div>
              )}

              {/* Rule Block */}
              {simulationState.selectedRule && !simulationState.ruleOutcome && (
                <div className="relative">
                  <div 
                    className="p-4 rounded-lg bg-yellow-500 text-white font-semibold min-w-40 text-center cursor-pointer"
                    onClick={() => setSimulationState(prev => ({...prev, ruleOutcome: 'pending'}))}
                  >
                    {states
                      .find(s => s.id === simulationState.currentState)
                      ?.rules.find(r => r.id === simulationState.selectedRule)
                      ?.condition}
                  </div>
                  {simulationState.ruleOutcome && (
                    <div className="h-8 w-0.5 bg-black mx-auto mt-2" />
                  )}
                </div>
              )}

              {/* Outcome Blocks */}
              {simulationState.ruleOutcome === 'pending' && (
                <div className="flex gap-8">
                  <div 
                    className="p-4 rounded-lg bg-green-500 text-white font-semibold min-w-40 text-center cursor-pointer"
                    onClick={() => {
                      const rule = states
                        .find(s => s.id === simulationState.currentState)
                        ?.rules.find(r => r.id === simulationState.selectedRule);
                      setSimulationState({
                        currentState: rule?.nextState || null,
                        selectedRule: null,
                        ruleOutcome: null
                      });
                    }}
                  >
                    Success
                  </div>
                  <div 
                    className="p-4 rounded-lg bg-red-500 text-white font-semibold min-w-40 text-center cursor-pointer"
                    onClick={() => {
                      const currentRules = states
                        .find(s => s.id === simulationState.currentState)
                        ?.rules || [];
                      const currentRuleIndex = currentRules
                        .findIndex(r => r.id === simulationState.selectedRule);
                      const nextRule = currentRules[currentRuleIndex + 1];
                      
                      setSimulationState({
                        currentState: simulationState.currentState,
                        selectedRule: nextRule?.id || null,
                        ruleOutcome: null
                      });
                    }}
                  >
                    Failure
                  </div>
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