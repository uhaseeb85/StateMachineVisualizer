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

import { useState, useEffect } from 'react';
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
import GraphSplitterModal from './GraphSplitterModal';
import ImportConfirmModal from './ImportConfirmModal';
import StateMachineComparer from './StateMachineComparer';

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
    handleDeleteState,
    editState,
    clearData
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
  const [showGraphSplitter, setShowGraphSplitter] = useState(false);
  const [showStateMachineComparer, setShowStateMachineComparer] = useState(false);
  
  // Import confirmation modal state
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportEvent, setPendingImportEvent] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  
  // Track imported file names
  const [importedFileNames, setImportedFileNames] = useState(() => {
    try {
      const savedNames = localStorage.getItem('importedFileNames');
      return savedNames ? JSON.parse(savedNames) : [];
    } catch (error) {
      return [];
    }
  });
  
  // Save imported file names to localStorage when they change
  useEffect(() => {
    localStorage.setItem('importedFileNames', JSON.stringify(importedFileNames));
  }, [importedFileNames]);
  
  // Add a new imported file name to the list
  const addImportedFileName = (fileName) => {
    if (fileName && !importedFileNames.includes(fileName)) {
      setImportedFileNames(prev => [...prev, fileName]);
    }
  };

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
   * When multiple files were imported, exports each as a separate CSV
   */
  const handleExportCSV = () => {
    // If no files were imported or no states exist, create a single generic export
    if (importedFileNames.length === 0 || states.length === 0) {
      exportSingleCSV();
      return;
    }
    
    // Group states by their source file
    const statesBySource = {};
    
    // First, categorize states by their source file
    states.forEach(state => {
      const source = state.graphSource || 'unknown';
      if (!statesBySource[source]) {
        statesBySource[source] = [];
      }
      statesBySource[source].push(state);
    });
    
    // If only one source or no source information, export as a single file
    if (Object.keys(statesBySource).length <= 1) {
      exportSingleCSV();
      return;
    }
    
    // Export each source as its own CSV
    Object.entries(statesBySource).forEach(([source, sourceStates]) => {
      if (source === 'unknown') {
        exportStatesAsCSV(sourceStates, 'state_machine_new_data.csv');
      } else {
        // Create a clean filename derived from the original
        const baseFilename = source.replace(/\.[^/.]+$/, ""); // Remove extension
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const exportFilename = `${baseFilename}_export_${timestamp}.csv`;
        exportStatesAsCSV(sourceStates, exportFilename);
      }
    });
    
    // Show success message for multiple exports
    toast.success(`Exported ${Object.keys(statesBySource).length} CSV files successfully.`);
  };

  /**
   * Exports a specific group of states as a CSV file
   * @param {Array} statesToExport - States to include in the export
   * @param {string} filename - Name for the exported file
   */
  const exportStatesAsCSV = (statesToExport, filename) => {
    // Get the source filename from the first state in the group
    const sourceFile = statesToExport[0]?.graphSource;
    
    // Try to get the original imported data specific to this file, if available
    let baseData = [];
    if (sourceFile) {
      const fileSpecificData = localStorage.getItem(`importedCSV_${sourceFile}`);
      if (fileSpecificData) {
        baseData = JSON.parse(fileSpecificData);
      } else {
        // Fall back to the legacy storage if file-specific data not found
        const lastImportedData = localStorage.getItem('lastImportedCSV');
        baseData = lastImportedData ? JSON.parse(lastImportedData) : [];
      }
    } else {
      // Fall back to the legacy storage if no source file is found
      const lastImportedData = localStorage.getItem('lastImportedCSV');
      baseData = lastImportedData ? JSON.parse(lastImportedData) : [];
    }
    
    // Create current state data with updated values
    const currentData = statesToExport.flatMap(sourceState => 
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
    XLSX.writeFile(wb, filename, { bookType: 'csv', rawNumbers: true });
  };

  /**
   * Exports all states as a single CSV file (legacy behavior)
   */
  const exportSingleCSV = () => {
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

  /**
   * Handles the initial CSV/Excel import
   * Shows confirmation modal if there are existing states or if filename already exists
   */
  const handleInitialImport = (event) => {
    // We need to clone the event since the original will be cleared
    const clonedEvent = {
      target: {
        files: event.target.files
      }
    };
    
    const fileName = event.target.files[0]?.name || "file";
    const isDuplicate = importedFileNames.includes(fileName);
    
    // Set confirmation type
    setIsDuplicateName(isDuplicate);
    
    // Only show confirmation if there are actual states or it's a duplicate filename
    const hasExistingStates = Array.isArray(states) && states.length > 0;
    
    if (hasExistingStates || isDuplicate) {
      setPendingImportEvent(clonedEvent);
      setImportFileName(fileName);
      setShowImportConfirm(true);
    } else {
      // No existing states and not a duplicate, just import directly
      handleImportAndTrack(clonedEvent);
    }
  };
  
  /**
   * Handles import with replacing existing states
   */
  const handleReplaceImport = () => {
    if (pendingImportEvent) {
      handleImportAndTrack(pendingImportEvent, { replaceExisting: true });
      setShowImportConfirm(false);
      setPendingImportEvent(null);
    }
  };
  
  /**
   * Handles import to display alongside existing states
   */
  const handleDisplayAlongsideImport = () => {
    if (pendingImportEvent) {
      handleImportAndTrack(pendingImportEvent, { replaceExisting: false });
      setShowImportConfirm(false);
      setPendingImportEvent(null);
    }
  };
  
  /**
   * Wrapper for handleExcelImport that also tracks the imported file name
   */
  const handleImportAndTrack = async (event, options) => {
    const fileName = event.target.files[0]?.name;
    const result = await handleExcelImport(event, options);
    
    // If import was successful, add filename to tracked list
    if (result && !result.error && fileName) {
      addImportedFileName(fileName);
    }
    
    return result;
  };

  /**
   * Handles clearing all data, including imported file tracking
   */
  const handleClearAll = () => {
    // Call the original clear function
    clearData();
    
    // Also clear the imported filenames tracking
    setImportedFileNames([]);
    localStorage.removeItem('importedFileNames');
    
    // Clear any file-specific CSV data by finding and removing keys that start with 'importedCSV_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('importedCSV_')) {
        localStorage.removeItem(key);
      }
    }
    
    // Reset any pending import
    setPendingImportEvent(null);
    setShowImportConfirm(false);
  };

  /**
   * Opens the state machine comparer modal
   */
  const handleCompareStateMachines = () => {
    setShowStateMachineComparer(true);
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
          onExcelImport={handleInitialImport}
          onSimulate={() => setShowStartModal(true)}
          onFindPaths={() => setShowPathFinder(true)}
          startTour={startTour}
          onExportCSV={handleExportCSV}
          onChangeMode={onChangeMode}
          onClearData={handleClearAll}
          onSplitGraph={() => setShowGraphSplitter(true)}
          onCompareStateMachines={handleCompareStateMachines}
        />

        {/* Main Panels */}
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          <StatePanel
            states={states}
            selectedState={selectedState}
            onStateSelect={handleStateSelect}
            onStateAdd={addState}
            onStateDelete={handleDeleteState}
            onStateEdit={editState}
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
            onSelectState={handleStateSelect}
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

      {showGraphSplitter && (
        <GraphSplitterModal
          onClose={() => setShowGraphSplitter(false)}
          states={states}
        />
      )}

      {/* Import confirmation modal */}
      <ImportConfirmModal
        isOpen={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false);
          setPendingImportEvent(null);
        }}
        onReplace={handleReplaceImport}
        onDisplayAlongside={handleDisplayAlongsideImport}
        importFileName={importFileName}
        isDuplicateName={isDuplicateName}
      />

      {/* Version information */}
      <VersionInfo />

      {/* State Machine Comparer Modal */}
      <StateMachineComparer
        isOpen={showStateMachineComparer}
        onClose={() => setShowStateMachineComparer(false)}
        states={states}
      />
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
