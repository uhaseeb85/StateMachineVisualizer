import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Save, Upload, Trash2, Play, RotateCcw, Moon, Sun, Download, Camera } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import HelpGuide from './HelpGuide';
import html2canvas from 'html2canvas';
import Joyride, { STATUS } from 'react-joyride';

const StateMachineVisualizer = () => {
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [startState, setStartState] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);
  const [runTour, setRunTour] = useState(false);

  const tourSteps = [
    {
      target: '.add-state-section',
      content: 'Start by adding a state. Enter a name and click Add to create a new state.',
      disableBeacon: true,
    },
    {
      target: '.states-list',
      content: 'Your states will appear here. Click on a state to manage its rules.',
    },
    {
      target: '.rules-section',
      content: 'Once you select a state, you can add rules here. Rules determine how your state machine transitions.',
    },
    {
      target: '.simulate-button',
      content: 'Click Simulate to test your state machine and see how it flows.',
    },
    {
      target: '.save-button',
      content: 'Remember to save your work! This will store your state machine locally.',
    },
    {
      target: '.export-button',
      content: 'You can export your state machine configuration to share or backup.',
    },
    {
      target: '.import-button',
      content: 'Import previously exported configurations here.',
    },
    {
      target: '.theme-toggle',
      content: 'Toggle between light and dark themes for comfortable viewing.',
    }
  ];

  const handleTourCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  useEffect(() => {
    const savedFlow = localStorage.getItem('ivrFlow');
    if (savedFlow) {
      setStates(JSON.parse(savedFlow));
    }
  }, []);

  useEffect(() => {
    const darkModePreference = localStorage.getItem('darkMode');
    setIsDarkMode(darkModePreference === null ? false : darkModePreference === 'true');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    document.title = 'State Machine Visualizer';
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const saveFlow = () => {
    localStorage.setItem('ivrFlow', JSON.stringify(states));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000); // Hide after 2 seconds
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

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          // Add confirmation dialog
          if (window.confirm('Are you sure you want to import? This will overwrite your current configuration.')) {
            setStates(importedData);
            localStorage.setItem('ivrFlow', JSON.stringify(importedData));
            alert('Configuration imported successfully!');
          }
        } catch (error) {
          alert('Error importing file. Please make sure it\'s a valid configuration file.');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const startSimulation = () => {
    if (states.length === 0) {
      alert("Please add at least one state to simulate");
      return;
    }

    const initialStateId = startState || states[0].id;
    const initialState = states.find(s => String(s.id) === String(initialStateId));
    
    if (!initialState) {
      console.error('Initial state not found:', initialStateId);
      console.error('Available states:', states.map(s => s.id));
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

    // Add type conversion for comparison
    const findStateById = (stateId) => {
      return states.find(s => String(s.id) === String(stateId));
    };

    if (outcome === 'success' && currentRule?.nextState) {
      const nextState = findStateById(currentRule.nextState);
      if (!nextState) {
        console.error('Next state not found. Rule points to:', currentRule.nextState);
        console.error('Available state IDs:', states.map(s => s.id));
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
      } else if (currentRule?.nextState) {
        const nextState = findStateById(currentRule.nextState);
        if (!nextState) {
          console.error('Next state not found. Rule points to:', currentRule.nextState);
          console.error('Available state IDs:', states.map(s => s.id));
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
            min-w-[5rem] min-h-[5rem] w-auto h-auto p-4
            rounded-full flex items-center justify-center text-white text-sm
            ${node.id === 'end' 
              ? 'bg-gray-500' 
              : simulationState.status === 'active' && node.id === simulationState.currentState
                ? 'bg-blue-600 cursor-pointer hover:bg-blue-700'
                : 'bg-blue-400 dark:bg-white dark:text-blue-600'
            }
            transition-colors
          `}
          onClick={() => {
            if (simulationState.status === 'active' && node.id === simulationState.currentState) {
              handleStateClick(node.id);
            }
          }}
        >
          <span className="px-2 text-center break-words max-w-[150px]">
            {state?.name || 'Unknown'}
          </span>
        </div>
      );
    }

    if (node.type === 'rule') {
      // Find the rule information and outcome from the path history
      const ruleState = simulationState.path
        .slice(0, index)
        .reverse()
        .find(n => n.type === 'state');
      
      const stateWithRule = states.find(s => s.id === ruleState?.id);
      const rule = stateWithRule?.rules.find(r => r.id === node.id);

      // Find if this rule has an outcome in the path
      const nextNode = simulationState.path[index + 1];
      const hasOutcome = nextNode && nextNode.type === 'state' && nextNode.id !== 'end';
      const isFailure = nextNode && nextNode.type === 'rule'; // If next node is a rule, this one failed

      return (
        <div className="flex flex-col items-center gap-2">
          <div 
            className={`
              min-w-[8rem] min-h-[3.5rem] w-auto h-auto p-4
              rounded-full flex items-center justify-center
              ${simulationState.status === 'evaluating' && node.id === simulationState.currentRule
                ? 'bg-white text-gray-900 cursor-pointer hover:bg-gray-100'
                : simulationState.status === 'deciding' && node.id === simulationState.currentRule
                  ? 'bg-white text-gray-900'
                  : hasOutcome
                    ? 'bg-green-500 text-white' // Success outcome
                    : isFailure
                      ? 'bg-red-500 text-white' // Failure outcome
                      : 'bg-white text-gray-900'
              }
              transition-colors duration-300 border border-gray-200
            `}
            onClick={() => {
              if (simulationState.status === 'evaluating' && node.id === simulationState.currentRule) {
                handleRuleClick(node.id);
              }
            }}
          >
            <span className="text-xs px-2 text-center break-words max-w-[150px]">
              {rule?.condition || 'Unknown'}
            </span>
          </div>
          
          {simulationState.status === 'deciding' && 
           simulationState.currentRule === node.id && (
            <div className="flex gap-4 -mt-1">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOutcome('success');
                }}
                className="min-w-[4rem] min-h-[2rem] w-auto h-auto p-2
                         rounded-full bg-green-500 hover:bg-green-600 
                         text-white text-xs flex items-center justify-center 
                         transition-colors shadow-sm hover:shadow"
              >
                Success
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOutcome('failure');
                }}
                className="min-w-[4rem] min-h-[2rem] w-auto h-auto p-2
                         rounded-full bg-red-500 hover:bg-red-600 
                         text-white text-xs flex items-center justify-center 
                         transition-colors shadow-sm hover:shadow"
              >
                Failure
              </Button>
            </div>
          )}
        </div>
      );
    }
  };

  const exportConfiguration = () => {
    // Prompt for file name
    const defaultName = `state-machine-config-${new Date().toISOString().slice(0, 10)}`;
    const fileName = window.prompt('Enter file name:', defaultName);
    
    // If user cancels or enters empty name, don't proceed
    if (!fileName) return;
    
    // Add .json extension if not present
    const finalFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    
    const configuration = JSON.stringify(states, null, 2);
    const blob = new Blob([configuration], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const SimulationStartModal = ({ onStart, onCancel }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Start Simulation
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Select Starting State
            </label>
            <select
              value={startState || ''}
              onChange={(e) => setStartState(e.target.value)}
              className="w-full border rounded-md p-2 text-sm
                       dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">Select a state</option>
              {states.map(state => (
                <option key={state.id} value={String(state.id)}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={onStart}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!startState && states.length > 1}
            >
              Start
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const exportSimulationImage = async () => {
    const simulationElement = document.querySelector('.simulation-content');
    if (!simulationElement) {
      console.error('Simulation element not found');
      return;
    }

    try {
      // Prompt for file name
      const defaultName = `state-machine-simulation-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter file name:', defaultName);
      
      // If user cancels or enters empty name, don't proceed
      if (!fileName) return;
      
      // Add .png extension if not present
      const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

      const canvas = await html2canvas(simulationElement);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting simulation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#10B981', // Green color to match theme
            zIndex: 1000,
          },
        }}
      />

      {/* Save Notification */}
      {showSaveNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg 
                        transition-opacity duration-300 flex items-center space-x-2
                        animate-fade-in-out">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-lg font-medium">Flow saved successfully!</span>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-full min-h-screen 
                    bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50
                    dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-5
                 tracking-wide">
            State Machine Visualizer
          </h1>
        </div>

        {/* Top Panel with Buttons - updated with subtle background */}
        <div className="mb-8 p-6 border border-gray-200/20 rounded-xl 
                        bg-white/40 dark:bg-gray-800/40 shadow-xl backdrop-blur-sm
                        hover:bg-white/50 dark:hover:bg-gray-800/50 
                        transition-all duration-300">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => setRunTour(true)}
              className="bg-gray-900 hover:bg-blue-600 text-white text-sm
                       dark:bg-gray-700 dark:text-white dark:hover:bg-blue-600
                       transform transition-all duration-200 hover:scale-110"
            >
              Getting Started
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                className="theme-toggle w-10 h-10 p-0 text-gray-900 dark:text-white
                         transform transition-all duration-200 hover:scale-110"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <Button 
                onClick={() => setShowStartModal(true)}
                className="simulate-button bg-green-500 hover:bg-green-600 text-white text-sm
                         dark:bg-green-500 dark:text-white dark:hover:bg-green-600
                         transform transition-all duration-200 hover:scale-110"
              >
                <Play className="w-4 h-4 mr-2" />
                Simulate
              </Button>
              <Button 
                onClick={saveFlow}
                className="save-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                         dark:bg-gray-700 dark:text-white dark:hover:bg-blue-600
                         transform transition-all duration-200 hover:scale-110"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Flow
              </Button>
              <Button 
                onClick={exportConfiguration}
                className="export-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                         dark:bg-gray-700 dark:text-white dark:hover:bg-blue-600
                         transform transition-all duration-200 hover:scale-110"
              >
                <Upload className="w-4 h-4 mr-2" />
                Export
              </Button>
              <input
                type="file"
                id="flow-import"
                className="hidden"
                accept=".json"
                onChange={handleImport}
                onClick={(e) => e.target.value = null}
              />
              <Button 
                onClick={() => document.getElementById('flow-import').click()}
                className="import-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                         dark:bg-gray-700 dark:text-white dark:hover:bg-blue-600
                         transform transition-all duration-200 hover:scale-110"
              >
                <Download className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>

        {/* Main content - updated with subtle backgrounds */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* States section */}
          <div className="w-full lg:w-1/3 border border-gray-200/20 dark:border-gray-700/20 
                          rounded-xl p-6 
                          bg-white/40 dark:bg-gray-800/40 shadow-xl 
                          hover:bg-white/50 dark:hover:bg-gray-800/50
                          transition-all duration-300 backdrop-blur-sm">
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 add-state-section">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">States</h2>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  placeholder="Enter state name"
                  className="flex-1 text-sm h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Button 
                  onClick={addState}
                  className="bg-gray-900 hover:bg-blue-600 text-white text-sm h-8
                           dark:bg-gray-700 dark:text-white dark:hover:bg-blue-600
                           transform transition-all duration-200 hover:scale-110"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-1 states-list">
              {states.map(state => (
                <div 
                  key={state.id} 
                  className={`
                    py-1 px-3 rounded-lg border transition-all duration-200 text-sm
                    ${selectedState === state.id 
                      ? 'border-blue-500 bg-blue-600 text-white dark:bg-blue-600 dark:text-white transform scale-105 shadow-lg'
                      : 'border-gray-200 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 hover:scale-105 hover:shadow-md'
                    }
                    cursor-pointer flex justify-between items-center
                    transform transition-all duration-200
                  `}
                  onClick={() => setSelectedState(state.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-medium ${
                      selectedState === state.id 
                        ? 'text-white dark:text-white'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {state.name}
                      <span className="text-xs ml-2 opacity-75">
                        {state.rules.length} rule{state.rules.length !== 1 ? 's' : ''}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteState(state.id);
                      }}
                      className={`
                        p-1 h-6 hover:bg-red-500/10
                        text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                        transform transition-all duration-200 hover:scale-110
                      `}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules section */}
          <div className="w-full lg:w-1/2 border border-gray-200/20 dark:border-gray-700/20 
                          rounded-xl p-6 
                          bg-white/40 dark:bg-gray-800/40 shadow-xl 
                          hover:bg-white/50 dark:hover:bg-gray-800/50
                          transition-all duration-300 backdrop-blur-sm">
            {selectedState ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {states.find(s => s.id === selectedState)?.name}
                  </h2>
                </div>

                {/* Rules Section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                      Rules
                    </h3>
                    <Button 
                      onClick={() => addRule(selectedState)}
                      className="bg-gray-900 hover:bg-blue-600 text-white text-sm h-8
                               transform transition-all duration-200 hover:scale-110
                               shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Rule
                    </Button>
                  </div>

                  {/* Column Headers */}
                  <div className="grid grid-cols-[1fr,1fr,auto] gap-2 mb-2 px-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rule Name
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target State
                    </div>
                    <div className="w-8"></div>
                  </div>
                  
                  <div className="space-y-1">
                    {states
                      .find(s => s.id === selectedState)
                      ?.rules.map((rule, index) => (
                        <div 
                          key={rule.id} 
                          className={`
                            py-1 px-3 rounded-lg border transition-colors duration-200 text-sm
                            border-gray-200 bg-gray-200 text-gray-900 hover:bg-gray-300 
                            dark:bg-gray-400 dark:text-white dark:hover:bg-gray-500
                            dark:border-gray-300
                          `}
                        >
                          <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
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
                              className="text-sm h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                              className="w-full border rounded-md h-8 px-2 text-sm
                                       dark:bg-gray-700 dark:text-white dark:border-gray-600"
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
                              onClick={() => deleteRule(selectedState, rule.id)}
                              className="p-1 h-8 text-red-500 hover:text-red-700 
                                      dark:text-red-500 dark:hover:text-red-400 
                                      hover:bg-gray-300 dark:hover:bg-gray-500
                                      min-w-[32px] flex items-center justify-center"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                Select a state to manage its rules
              </div>
            )}
          </div>
        </div>

        {/* Simulation Modal */}
        {showSimulation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-4/5 h-4/5 overflow-auto">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Flow Simulation</h2>
                <div className="space-x-2">
                  <Button
                    onClick={() => setIsVerticalLayout(!isVerticalLayout)}
                    className="bg-gray-900 hover:bg-blue-600 text-white 
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transition-colors duration-200"
                  >
                    {isVerticalLayout ? 'Horizontal' : 'Vertical'} Layout
                  </Button>
                  <Button
                    onClick={exportSimulationImage}
                    className="bg-gray-900 hover:bg-blue-600 text-white 
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transition-colors duration-200"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Export Image
                  </Button>
                  <Button
                    onClick={() => {
                      setStartState(null);
                      startSimulation();
                    }}
                    className="bg-gray-900 hover:bg-blue-600 text-white 
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transition-colors duration-200"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={() => setShowSimulation(false)}
                    className="bg-gray-900 hover:bg-red-600 text-white 
                     dark:bg-white dark:text-gray-900 dark:hover:bg-red-600 dark:hover:text-white
                     transition-colors duration-200"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Simulation Content */}
              <div className="simulation-content min-h-[400px] border dark:border-gray-700 rounded-lg p-4 relative bg-gray-50 dark:bg-gray-900">
                {/* Path Visualization */}
                <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row flex-wrap'} gap-6 items-center ${isVerticalLayout ? 'justify-center' : 'justify-start'} p-4`}>
                  {simulationState.path.map((node, index) => (
                    <div key={index} className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} items-center`}>
                      {renderSimulationNode(node, index)}
                      {index < simulationState.path.length - 1 && (
                        <div 
                          className={`
                            bg-gray-400
                            ${isVerticalLayout 
                              ? 'h-6 w-0.5 my-2' 
                              : 'w-6 h-0.5 mx-2'
                            }
                          `}
                        />
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

        {/* Add Feedback Form Modal */}
        {showFeedback && (
          <FeedbackForm onClose={() => setShowFeedback(false)} />
        )}

        {/* Help Modal */}
        {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}

        {/* Fixed bottom right buttons */}
        <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
          <Button
            onClick={() => setShowHelp(true)}
            className="bg-gray-900 hover:bg-blue-600 text-white text-sm
                     dark:bg-gray-700 dark:hover:bg-blue-600 shadow-lg
                     transform transition-all duration-200 hover:scale-110"
          >
            User Guide
          </Button>
          <Button
            onClick={() => setShowFeedback(true)}
            className="bg-gray-900 hover:bg-blue-600 text-white text-sm
                     dark:bg-gray-700 dark:hover:bg-blue-600 shadow-lg
                     transform transition-all duration-200 hover:scale-110"
          >
            Feedback
          </Button>
        </div>

        {showStartModal && (
          <SimulationStartModal
            onStart={() => {
              setShowStartModal(false);
              startSimulation();
            }}
            onCancel={() => {
              setShowStartModal(false);
              setStartState(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StateMachineVisualizer; 