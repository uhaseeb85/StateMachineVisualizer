import React, { useState } from 'react';
import SimulationModal from './SimulationModal';
import StatePanel from './StatePanel';
import RulesPanel from './RulesPanel';
import TopActionBar from './TopActionBar';
import useStateMachine from './hooks/useStateMachine';
import useSimulation from './hooks/useSimulation';
import { TourProvider } from './TourProvider';
import { Toaster } from 'sonner';
import PathFinderModal from './PathFinderModal';

const StateMachineVisualizerContent = ({ startTour }) => {
  const {
    states,
    setStates,
    selectedState,
    setSelectedState,
    addState,
    deleteState,
    saveFlow,
    handleImport,
    handleExcelImport,
    exportConfiguration,
    isDarkMode,
    toggleTheme,
    showSaveNotification,
    handleRuleDictionaryImport
  } = useStateMachine();

  const {
    showSimulation,
    setShowSimulation,
    simulationState,
    startSimulation,
    handleStateClick,
    handleRuleClick,
    handleOutcome,
    resetSimulation,
    handleUndo,
    startState,
    setStartState,
    showStartModal,
    setShowStartModal
  } = useSimulation(states);

  const [showPathFinder, setShowPathFinder] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      <Toaster richColors />
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
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-5 tracking-wide">
            State Machine Visualizer
          </h1>
        </div>

        <TopActionBar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onSave={saveFlow}
          onExport={exportConfiguration}
          onImport={handleImport}
          onExcelImport={handleExcelImport}
          onRuleDictionaryImport={handleRuleDictionaryImport}
          onSimulate={() => setShowStartModal(true)}
          onFindPaths={() => setShowPathFinder(true)}
          startTour={startTour}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          <StatePanel
            states={states}
            selectedState={selectedState}
            onStateSelect={setSelectedState}
            onStateAdd={addState}
            onStateDelete={deleteState}
          />

          <RulesPanel
            states={states}
            selectedState={selectedState}
            onStateSelect={setSelectedState}
            setStates={setStates}
          />
        </div>

        {showSimulation && (
          <SimulationModal
            states={states}
            simulationState={simulationState}
            onStateClick={handleStateClick}
            onRuleClick={handleRuleClick}
            onOutcome={handleOutcome}
            onUndo={handleUndo}
            onReset={resetSimulation}
            onClose={() => setShowSimulation(false)}
          />
        )}

        {showStartModal && (
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
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setStartState(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    startSimulation();
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                  disabled={!startState && states.length > 1}
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}

        {showPathFinder && (
          <PathFinderModal
            states={states}
            onClose={() => setShowPathFinder(false)}
          />
        )}
      </div>
    </div>
  );
};

const StateMachineVisualizer = () => {
  return (
    <TourProvider>
      <StateMachineVisualizerContent />
    </TourProvider>
  );
};

export default StateMachineVisualizer; 