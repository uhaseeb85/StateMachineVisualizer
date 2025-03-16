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
    
    // Create current state data with updated values
    const currentData = states.flatMap(sourceState => 
      sourceState.rules.map(rule => {
        const destState = states.find(s => s.id === rule.nextState);
        return {
          'Source Node': sourceState.name,
          'Destination Node': destState ? destState.name : rule.nextState,
          'Rule List': rule.condition,
          'Priority': rule.priority !== undefined && rule.priority !== null ? rule.priority : 50,
          'Operation / Edge Effect': rule.operation || ''
        };
      })
    );

    // Merge with existing data or use current data only
    let csvData;
    if (baseData.length > 0) {
      // Get all columns from the base data to preserve original order
      const allColumns = Object.keys(baseData[0]);
      
      csvData = currentData.map(currentRow => {
        const newRow = {};
        const matchingRow = baseData.find(
          baseRow => 
            baseRow['Source Node'] === currentRow['Source Node'] &&
            baseRow['Destination Node'] === currentRow['Destination Node']
        );

        // Use the original column order from the imported CSV
        allColumns.forEach(column => {
          if (column === 'Source Node' || column === 'Destination Node' || column === 'Rule List') {
            newRow[column] = currentRow[column];
          } else if (column === 'Priority') {
            newRow[column] = currentRow['Priority'];
          } else if (column === 'Operation / Edge Effect') {
            newRow[column] = currentRow['Operation / Edge Effect'];
          } else {
            newRow[column] = matchingRow ? matchingRow[column] : '';
          }
        });
        
        return newRow;
      });
    } else {
      // If no previous data, create a structure with columns in standard order
      csvData = currentData;
    }

    // Generate and download the CSV file with special handling for zeros
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(csvData);
    
    // Find the column index for Priority
    const range = XLSX.utils.decode_range(ws['!ref']);
    let priorityCol = -1;
    
    // Look for the Priority column
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({r:0, c:C});
      if (ws[cellAddress] && ws[cellAddress].v === 'Priority') {
        priorityCol = C;
        break;
      }
    }
    
    // If we found the Priority column, explicitly set cell types for all values
    if (priorityCol !== -1) {
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({r:R, c:priorityCol});
        if (ws[cellAddress]) {
          const value = ws[cellAddress].v;
          
          // Force numeric type for priority values
          ws[cellAddress] = {
            t: 'n',  // numeric type
            v: value === 0 || value === '0' ? 0 : (value || 50),
            w: value === 0 || value === '0' ? '0' : (value || '50').toString()
          };
        }
      }
    }
    
    // Use the modified worksheet and only export CSV
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, 'state_machine_export.csv', { bookType: 'csv', rawNumbers: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative container mx-auto p-4 max-w-full min-h-screen">
        {/* Header */}
        <div className="flex flex-col items-center pt-24 pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-clip-text text-transparent 
                       bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-5">
            State Machine Visualizer
          </h1>
          <p className="text-lg text-gray-300">
            Design • Visualize • Validate
          </p>
        </div>

        {/* Top Action Bar */}
        <TopActionBar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onSave={saveFlow}
          onExcelImport={handleExcelImport}
          onSimulate={() => setShowStartModal(true)}
          onFindPaths={() => setShowPathFinder(true)}
          startTour={startTour}
          onExportCSV={handleExportCSV}
          onChangeMode={onChangeMode}
        />

        {/* Main Panels */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <div className="lg:w-1/3">
            <StatePanel
              states={states}
              selectedState={selectedState}
              onStateSelect={handleStateSelect}
              onStateAdd={addState}
              onStateDelete={handleDeleteState}
              loadedStateDictionary={loadedStateDictionary}
              setLoadedStateDictionary={setLoadedStateDictionary}
            />
          </div>

          <div className="lg:w-2/3">
            <RulesPanel
              states={states}
              selectedState={selectedState}
              onStateSelect={handleStateSelect}
              setStates={setStates}
              onRuleDictionaryImport={handleRuleDictionaryImport}
              loadedDictionary={loadedDictionary}
              setLoadedDictionary={setLoadedDictionary}
              addToChangeLog={addToChangeLog}
              loadedStateDictionary={loadedStateDictionary}
            />
          </div>
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
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96 border border-gray-700 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">
                Start Simulation
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Starting State
                </label>
                <select
                  value={startState || ''}
                  onChange={(e) => setStartState(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm
                           bg-gray-700 text-white border-gray-600"
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
                  onClick={() => {
                    setShowStartModal(false);
                    setStartState(null);
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowStartModal(false);
                    startSimulation();
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  disabled={!startState && states.length > 1}
                >
                  Start
                </Button>
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
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Button
          onClick={() => setShowChangeLog(true)}
          title="View Local History"
          className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 backdrop-blur-sm"
        >
          <History className="w-4 h-4 mr-2" />
          Local History
        </Button>

        <Button
          onClick={() => setShowUserGuide(true)}
          className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 backdrop-blur-sm"
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
