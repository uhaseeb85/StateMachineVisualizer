/**
 * FlowDiagramVisualizer Component
 * Main component for the flow diagram visualization and editing interface.
 * Provides functionality for:
 * - Creating and editing flow diagram steps
 * - Managing connections between steps
 * - Simulating flow execution
 * - Finding paths in the flow
 * - Importing/Exporting diagram data
 * - Guided tour functionality
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TopActionBar from './TopActionBar';
import StepPanel from './StepPanel';
import SimulationModal from './SimulationModal';
import PathFinderModal from './PathFinderModal';
import UnconnectedStepsModal from './UnconnectedStepsModal';
import AllAssumptionsQuestionsModal from './AllAssumptionsQuestionsModal';
import ActionHistoryModal from './ActionHistoryModal';
import FlowDiagramComparer from './FlowDiagramComparer';
import { Toaster } from 'sonner';
import useFlowDiagram from './hooks/useFlowDiagram';
import useStepDictionary from './hooks/useStepDictionary';
import StepDictionaryModal from './StepDictionaryModal';
import { TourProvider } from './TourProvider';
import { migrateFromLocalStorage } from '@/utils/storageWrapper';

/** Key used for localStorage persistence of flow diagram data */
const STORAGE_KEY = 'flowDiagramData';

/**
 * Main content component for the Flow Diagram Visualizer
 * Manages the state and interactions between different subcomponents
 * 
 * @param {Object} props
 * @param {Function} props.onChangeMode - Callback for changing the application mode
 */
const FlowDiagramVisualizerContent = ({ onChangeMode }) => {
  console.log('Rendering FlowDiagramVisualizer');

  // Modal visibility state
  const [showSimulation, setShowSimulation] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [showUnconnectedSteps, setShowUnconnectedSteps] = useState(false);
  const [showAllAssumptionsQuestions, setShowAllAssumptionsQuestions] = useState(false);
  const [showActionHistory, setShowActionHistory] = useState(false);
  const [showComparer, setShowComparer] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [showStepDictionary, setShowStepDictionary] = useState(false);

  // Initialize flow diagram hook with storage key
  const {
    steps,
    isLoading,
    addStep,
    updateStep,
    removeStep,
    connections,
    addConnection,
    removeConnection,
    clearAll,
    importData,
    exportData,
    saveFlow,
    showSaveNotification,
    currentFileName,
    classificationRules,
    updateClassificationRules,
    // Undo/Redo functionality
    undo,
    redo,
    canUndo,
    canRedo,
    // Action history functionality
    actionHistory,
    clearActionHistory,
    exportHistoryToExcel,
    getEventCount
  } = useFlowDiagram(STORAGE_KEY);

  // Initialize step dictionary hook
  const dictionaryHook = useStepDictionary();

  /**
   * Run one-time migration from localStorage to IndexedDB on mount
   */
  useEffect(() => {
    const runMigration = async () => {
      try {
        await migrateFromLocalStorage();
      } catch (error) {
        console.error('Migration error:', error);
      }
    };
    runMigration();
  }, []); // Run once on mount

  /**
   * Debug logging for steps and connections changes
   */
  useEffect(() => {
    console.log('Current steps:', steps);
    console.log('Current connections:', connections);
  }, [steps, connections]);

  /**
   * Handles adding a new step to the diagram
   * @param {Object} stepData - Data for the new step
   * @returns {string} ID of the newly created step
   */
  const handleAddStep = (stepData) => {
    console.log('Adding step:', stepData);
    const stepId = addStep(stepData);
    console.log('Added step with ID:', stepId);
    return stepId;
  };

  /**
   * Handles showing the missing connections modal
   */
  const handleShowMissingConnections = () => {
    setShowUnconnectedSteps(true);
  };

  /**
   * Handles showing the all assumptions and questions modal
   */
  const handleShowAllAssumptionsQuestions = () => {
    setShowAllAssumptionsQuestions(true);
  };

  /**
   * Handles showing the action history modal
   */
  const handleShowActionHistory = () => {
    setShowActionHistory(true);
  };

  /**
   * Handles showing the flow diagram comparer modal
   */
  const handleShowComparer = () => {
    setShowComparer(true);
  };

  /**
   * Handles showing the step dictionary modal
   */
  const handleShowStepDictionary = () => {
    setShowStepDictionary(true);
  };

  /**
   * Handles export button click - prepares filename and shows dialog
   */
  const handleExportClick = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let defaultName;
    
    if (currentFileName) {
      // Remove any existing version suffix (e.g., "_v2026-01-15") before adding new one
      const baseNameWithoutVersion = currentFileName.replace(/_v\d{4}-\d{2}-\d{2}(?:_v\d{4}-\d{2}-\d{2})*/g, '');
      defaultName = `${baseNameWithoutVersion}_v${timestamp}`;
    } else {
      defaultName = `flow_diagram_${timestamp}`;
    }
    
    setExportFileName(defaultName);
    setShowExportDialog(true);
  };

  /**
   * Confirms export with user-specified filename
   */
  const confirmExport = () => {
    if (exportFileName.trim()) {
      // Pass the filename to exportData function
      exportData(exportFileName.trim());
      setShowExportDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Toast notifications */}
      <Toaster richColors />

      {/* Loading state */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading diagram...</p>
          </div>
        </div>
      )}

      {/* Save success notification overlay */}
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

      {/* Main content container with gradient background */}
      <div className="container mx-auto p-4 max-w-full min-h-screen 
                    bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50
                    dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        {/* Header section */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-5 tracking-wide">
            Flow Diagram Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design • Visualize • Test
          </p>
        </div>

        {/* Action bar with main controls */}
        <TopActionBar
          onChangeMode={onChangeMode}
          onSimulate={() => setShowSimulation(true)}
          onFindPath={() => setShowPathFinder(true)}
          onShowMissingConnections={handleShowMissingConnections}
          onShowAllAssumptionsQuestions={handleShowAllAssumptionsQuestions}
          onShowActionHistory={handleShowActionHistory}
          onShowComparer={handleShowComparer}
          onShowStepDictionary={handleShowStepDictionary}
          actionHistoryCount={getEventCount()}
          onClear={clearAll}
          onImport={importData}
          onExport={handleExportClick}
          onSave={saveFlow}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          steps={steps}
          connections={connections}
          currentFileName={currentFileName}
          onUpdateStep={updateStep}
          classificationRules={classificationRules}
          onUpdateClassificationRules={updateClassificationRules}
          dictionaryHook={dictionaryHook}
        />

        {/* Main step panel for diagram editing */}
        <div className="mt-8 bg-background rounded-xl border shadow-sm">
          <StepPanel
            steps={steps}
            connections={connections}
            onAddStep={handleAddStep}
            onUpdateStep={updateStep}
            onRemoveStep={removeStep}
            onAddConnection={addConnection}
            onRemoveConnection={removeConnection}
            onSave={saveFlow}
            dictionaryHook={dictionaryHook}
          />
        </div>

        {/* Modals */}
        {showSimulation && (
          <SimulationModal
            steps={steps}
            connections={connections}
            onClose={() => setShowSimulation(false)}
            onAddStep={handleAddStep}
            onUpdateStep={updateStep}
            onRemoveStep={removeStep}
            onAddConnection={addConnection}
            onRemoveConnection={removeConnection}
            dictionaryHook={dictionaryHook}
          />
        )}

        {showPathFinder && (
          <PathFinderModal
            steps={steps}
            connections={connections}
            onClose={() => setShowPathFinder(false)}
          />
        )}

        {showUnconnectedSteps && (
          <UnconnectedStepsModal
            isOpen={showUnconnectedSteps}
            onClose={() => setShowUnconnectedSteps(false)}
            steps={steps}
            connections={connections}
          />
        )}

        {showAllAssumptionsQuestions && (
          <AllAssumptionsQuestionsModal
            isOpen={showAllAssumptionsQuestions}
            onClose={() => setShowAllAssumptionsQuestions(false)}
            steps={steps}
          />
        )}

        {showActionHistory && (
          <ActionHistoryModal
            isOpen={showActionHistory}
            onClose={() => setShowActionHistory(false)}
            history={actionHistory}
            onExportToExcel={exportHistoryToExcel}
            onClearHistory={clearActionHistory}
          />
        )}

        {showComparer && (
          <FlowDiagramComparer
            isOpen={showComparer}
            onClose={() => setShowComparer(false)}
            steps={steps}
            connections={connections}
          />
        )}

        {showStepDictionary && (
          <StepDictionaryModal
            isOpen={showStepDictionary}
            onClose={() => setShowStepDictionary(false)}
            dictionaryHook={dictionaryHook}
            steps={steps}
            onUpdateStep={updateStep}
          />
        )}

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Export Flow Diagram
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter a name for the exported file:
              </p>
              <input
                type="text"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmExport();
                  } else if (e.key === 'Escape') {
                    setShowExportDialog(false);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-md bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-gray-100 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         mb-4"
                placeholder="flow_diagram"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 
                           hover:bg-gray-100 dark:hover:bg-gray-700 
                           rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExport}
                  disabled={!exportFileName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md 
                           hover:bg-green-700 disabled:bg-gray-400 
                           disabled:cursor-not-allowed transition-colors"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

FlowDiagramVisualizerContent.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
};

/**
 * Wrapper component that provides tour functionality to the main content
 * @param {Object} props
 * @param {Function} props.onChangeMode - Callback for changing the application mode
 */
const FlowDiagramVisualizer = ({ onChangeMode }) => {
  return (
    <TourProvider>
      <FlowDiagramVisualizerContent onChangeMode={onChangeMode} />
    </TourProvider>
  );
};

FlowDiagramVisualizer.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
};

export default FlowDiagramVisualizer;
