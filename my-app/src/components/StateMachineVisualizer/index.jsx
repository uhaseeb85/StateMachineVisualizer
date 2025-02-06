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
import { ChevronDown, ChevronUp, Book, History } from 'lucide-react';
import UserGuideModal from './UserGuideModal';
import { Button } from "@/components/ui/button";
import VersionInfo from './VersionInfo';
import ChangeLog from './ChangeLog';
import * as XLSX from 'xlsx-js-style';

const DICTIONARY_STORAGE_KEY = 'ruleDictionary';

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
    handleRuleDictionaryImport: originalHandleRuleDictionaryImport,
    changeLog,
    setChangeLog,
    addToChangeLog,
    handleDeleteState
  } = useStateMachine();

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

  const [showPathFinder, setShowPathFinder] = useState(false);
  const [loadedDictionary, setLoadedDictionary] = useState(() => {
    const savedDictionary = localStorage.getItem(DICTIONARY_STORAGE_KEY);
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });
  const [isDictionaryExpanded, setIsDictionaryExpanded] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);

  const handleRuleDictionaryImport = async (event) => {
    console.log("Import started with file:", event);
    try {
      const result = await originalHandleRuleDictionaryImport(event);
      console.log("Import result:", result);
      if (result?.dictionary) {
        setLoadedDictionary(result.dictionary);
        localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(result.dictionary));
        console.log("Dictionary state updated and saved:", result);
      } else {
        console.log("No result from import");
      }
    } catch (error) {
      console.error("Error importing dictionary:", error);
    }
  };

  const clearDictionary = () => {
    setLoadedDictionary(null);
    localStorage.removeItem(DICTIONARY_STORAGE_KEY);
  };

  // Add new state for state dictionary
  const [loadedStateDictionary, setLoadedStateDictionary] = useState(() => {
    const savedDictionary = localStorage.getItem('stateDictionary');
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });

  const handleStateSelect = (stateId, shouldScroll = true) => {
    setSelectedState(stateId);
    
    // Only scroll if shouldScroll is true
    if (shouldScroll) {
      const stateElement = document.querySelector(`[data-state-id="${stateId}"]`);
      if (stateElement) {
        stateElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // First, add the button style as a constant (same as in TopActionBar)
  const buttonClass = "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md \
                      bg-transparent \
                      text-gray-700 dark:text-gray-200 \
                      border border-gray-300 dark:border-gray-600 \
                      hover:bg-gray-50/50 dark:hover:bg-gray-700/50 \
                      hover:text-gray-900 dark:hover:text-white \
                      transition-all duration-200 ease-in-out \
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400";

  const handleExportCSV = () => {
    // Get the original data with all columns from localStorage if it exists
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

    // If we have base data, merge current state with original additional columns
    let csvData;
    if (baseData.length > 0) {
      // Get all column names from the original data
      const allColumns = Object.keys(baseData[0]);
      
      // Create new rows with all columns
      csvData = currentData.map(currentRow => {
        const newRow = {};
        
        // Find matching row from original data based only on Source and Destination
        const matchingRow = baseData.find(
          baseRow => 
            baseRow['Source Node'] === currentRow['Source Node'] &&
            baseRow['Destination Node'] === currentRow['Destination Node']
        );

        allColumns.forEach(column => {
          if (['Source Node', 'Destination Node', 'Rule List'].includes(column)) {
            // Use current state data for these columns
            newRow[column] = currentRow[column];
          } else {
            // For other columns, use data from matching row if found
            newRow[column] = matchingRow ? matchingRow[column] : '';
          }
        });
        return newRow;
      });
    } else {
      // If no original data, just use current state
      csvData = currentData;
    }

    // Create workbook and add sheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(csvData);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Generate and download file
    XLSX.writeFile(wb, 'state_machine_export.csv');
  };

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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design • Visualize • Validate
          </p>
        </div>

        <TopActionBar
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onSave={saveFlow}
          onExport={exportConfiguration}
          onImport={handleImport}
          onExcelImport={handleExcelImport}
          onSimulate={() => setShowStartModal(true)}
          onFindPaths={() => setShowPathFinder(true)}
          startTour={startTour}
          onShowChangeLog={() => setShowChangeLog(true)}
          onExportCSV={handleExportCSV}
        />

        {/* States and Rules panels first */}
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
          />
        </div>

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

      {/* Bottom right buttons - moved 25px to the left */}
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

      {/* User Guide Modal */}
      {showUserGuide && (
        <UserGuideModal onClose={() => setShowUserGuide(false)} />
      )}

      <VersionInfo />
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
