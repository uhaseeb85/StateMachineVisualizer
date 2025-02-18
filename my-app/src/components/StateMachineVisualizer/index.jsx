/**
 * StateMachineVisualizer
 * 
 * The main container component for the state machine visualization application.
 * This component orchestrates all sub-components and manages the global state.
 * 
 * Key Features:
 * - State and rule management
 * - Dark/Light theme support
 * - Import/Export functionality (JSON and CSV)
 * - Interactive simulation
 * - Path finding between states
 * - Local storage persistence
 * - Change history tracking
 * - Guided tour
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
// Core components
import StatePanel from './StatePanel';
import RulesPanel from './RulesPanel';
import TopActionBar from './TopActionBar';
import SimulationModal from './SimulationModal';
import PathFinderModal from './PathFinderModal';
import UserGuideModal from './UserGuideModal';
import ChangeLog from './ChangeLog';
import VersionInfo from './VersionInfo';
import SplunkConfig from './SplunkConfig';

// Custom hooks
import useStateMachine from './hooks/useStateMachine';
import useSimulation from './hooks/useSimulation';

// UI Components and utilities
import { TourProvider } from './TourProvider';
import { Toaster } from 'sonner';
import { Book, History } from 'lucide-react';
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx-js-style';

// Constants
const DICTIONARY_STORAGE_KEY = 'ruleDictionary';

/**
 * Main content component that manages the application state and renders all sub-components
 * @param {Object} props - Component props
 * @param {Function} props.startTour - Function to initiate the guided tour
 * @param {Function} props.onChangeMode - Function to change the theme mode
 */
const StateMachineVisualizerContent = ({ startTour, onChangeMode }) => {
  // Core state machine functionality from custom hook
  const {
    states,
    setStates,
    selectedState,
    setSelectedState,
    addState,
    saveFlow,
    handleExcelImport,
    isDarkMode,
    toggleTheme,
    showSaveNotification,
    handleRuleDictionaryImport: originalHandleRuleDictionaryImport,
    changeLog,
    setChangeLog,
    addToChangeLog,
    handleDeleteState
  } = useStateMachine();

  // Simulation functionality from custom hook
  const {
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
  } = useSimulation(states);

  // Modal visibility states
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [showSplunkConfig, setShowSplunkConfig] = useState(false);

  // Dictionary states with localStorage persistence
  const [loadedDictionary, setLoadedDictionary] = useState(() => {
    const savedDictionary = localStorage.getItem(DICTIONARY_STORAGE_KEY);
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });

  const [loadedStateDictionary, setLoadedStateDictionary] = useState(() => {
    const savedDictionary = localStorage.getItem('stateDictionary');
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });

  /**
   * Handles the import of rule dictionaries
   * Processes the imported file and updates both state and localStorage
   */
  const handleRuleDictionaryImport = async (event) => {
    try {
      const result = await originalHandleRuleDictionaryImport(event);
      if (result?.dictionary) {
        setLoadedDictionary(result.dictionary);
        localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(result.dictionary));
      }
    } catch (error) {
      console.error("Error importing dictionary:", error);
    }
  };

  /**
   * Handles state selection with optional scrolling
   * @param {string} stateId - ID of the state to select
   * @param {boolean} shouldScroll - Whether to scroll to the selected state
   */
  const handleStateSelect = (stateId, shouldScroll = true) => {
    setSelectedState(stateId);
    
    if (shouldScroll) {
      const stateElement = document.querySelector(`[data-state-id="${stateId}"]`);
      if (stateElement) {
        stateElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Common button styling for utility buttons
  const buttonClass = "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md \
                      bg-transparent \
                      text-gray-700 dark:text-gray-200 \
                      border border-gray-300 dark:border-gray-600 \
                      hover:bg-gray-50/50 dark:hover:bg-gray-700/50 \
                      hover:text-gray-900 dark:hover:text-white \
                      transition-all duration-200 ease-in-out \
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400";

  /**
   * Handles CSV export with preservation of additional columns
   * Merges current state data with previously imported data
   */
  const handleExportCSV = () => {
    const lastImportedData = localStorage.getItem('lastImportedCSV');
    let baseData = lastImportedData ? JSON.parse(lastImportedData) : [];
    
    // Create current state data
    const currentData = states.flatMap(sourceState => 
      sourceState.rules.map(rule => {
        const destState = states.find(s => s.id === rule.nextState);
        return {
          'Source Node': sourceState.name,
          'Destination Node': destState ? destState.name : rule.nextState,
          'Rule List': rule.condition
        };
      })
    );

    // Merge with existing data or use current data only
    let csvData;
    if (baseData.length > 0) {
      const allColumns = Object.keys(baseData[0]);
      
      csvData = currentData.map(currentRow => {
        const newRow = {};
        const matchingRow = baseData.find(
          baseRow => 
            baseRow['Source Node'] === currentRow['Source Node'] &&
            baseRow['Destination Node'] === currentRow['Destination Node']
        );

        allColumns.forEach(column => {
          if (['Source Node', 'Destination Node', 'Rule List'].includes(column)) {
            newRow[column] = currentRow[column];
          } else {
            newRow[column] = matchingRow ? matchingRow[column] : '';
          }
        });
        return newRow;
      });
    } else {
      csvData = currentData;
    }

    // Generate and download the CSV file
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(csvData);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, 'state_machine_export.csv');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Toast notifications */}
      <Toaster richColors />

      {/* Save success notification */}
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

      {/* Main content container */}
      <div className="container mx-auto p-4 max-w-full min-h-screen 
                    bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50
                    dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-5 tracking-wide">
            State Machine Visualizer
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design • Visualize • Validate
          </p>
        </div>

        {/* Top Action Bar */}
        <TopActionBar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onSave={saveFlow}
          onExcelImport={handleRuleDictionaryImport}
          onSimulate={() => setShowStartModal(true)}
          onFindPaths={() => setShowPathFinder(true)}
          startTour={startTour}
          onExportCSV={handleExportCSV}
          onChangeMode={onChangeMode}
        />

        {/* Main Panels */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <StatePanel
            states={states}
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
            onStateAdd={addState}
            onStateDelete={handleDeleteState}
            loadedStateDictionary={loadedStateDictionary}
            setLoadedStateDictionary={setLoadedStateDictionary}
          />

          <RulesPanel
            states={states}
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
            setStates={setStates}
            onRuleDictionaryImport={handleRuleDictionaryImport}
            loadedDictionary={loadedDictionary}
            setLoadedDictionary={setLoadedDictionary}
            setChangeLog={setChangeLog}
            addToChangeLog={addToChangeLog}
            loadedStateDictionary={loadedStateDictionary}
          />
        </div>

        {/* Modals */}
        {showSimulation && (
          <SimulationModal
            states={states}
            simulationState={simulationState}
            onStateClick={handleStateClick}
            onRuleClick={handleRuleClick}
            onOutcome={handleOutcome}
            onReset={resetSimulation}
            onClose={() => setShowSimulation(false)}
            onUndo={undo}
            canUndo={canUndo}
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

        <ChangeLog 
          changeLog={changeLog}
          isOpen={showChangeLog}
          onClose={() => setShowChangeLog(false)}
          setChangeLog={setChangeLog}
        />
      </div>

      {/* Utility buttons */}
      <div className="fixed bottom-4 right-[29px] flex flex-col gap-2">
        <Button
          onClick={() => setShowChangeLog(true)}
          title="View Local History"
          className={buttonClass}
        >
          <History className="w-4 h-4 mr-2" />
          Local History
        </Button>

        <Button
          onClick={() => setShowUserGuide(true)}
          className={buttonClass}
        >
          <Book className="w-4 h-4 mr-2" />
          User Guide
        </Button>
      </div>

      {/* Additional modals */}
      {showUserGuide && (
        <UserGuideModal onClose={() => setShowUserGuide(false)} />
      )}

      {showSplunkConfig && (
        <SplunkConfig
          onClose={() => setShowSplunkConfig(false)}
          onSave={() => {
            setShowSplunkConfig(false);
          }}
        />
      )}

      {/* Version information */}
      <VersionInfo />
    </div>
  );
};

StateMachineVisualizerContent.propTypes = {
  startTour: PropTypes.func.isRequired,
  onChangeMode: PropTypes.func.isRequired
};

/**
 * Root component wrapped with TourProvider for guided tour functionality
 */
const StateMachineVisualizer = ({ onChangeMode }) => {
  return (
    <TourProvider>
      <StateMachineVisualizerContent startTour={() => {}} onChangeMode={onChangeMode} />
    </TourProvider>
  );
};

StateMachineVisualizer.propTypes = {
  onChangeMode: PropTypes.func.isRequired
};

export default StateMachineVisualizer;
