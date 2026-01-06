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
import { TourProvider } from './TourProvider';

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

  // Initialize flow diagram hook with storage key
  const {
    steps,
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
    // File history functionality
    currentFileName,
    fileHistory,
    loadFileFromHistory,
    checkFileExists,
    removeFileFromHistory,
    clearFileHistory,
    // Action history functionality
    actionHistory,
    clearActionHistory,
    exportHistoryToExcel,
    getEventCount,
    restoreFromHistory
  } = useFlowDiagram(STORAGE_KEY);

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
   * Handles selection of a file from history
   * @param {string} fileName - Name of the file to load
   */
  const handleSelectFile = (fileName) => {
    loadFileFromHistory(fileName);
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Toast notifications */}
      <Toaster richColors />

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
          actionHistoryCount={getEventCount()}
          onClear={clearAll}
          onImport={importData}
          onExport={exportData}
          onSave={saveFlow}
          steps={steps}
          connections={connections}
          // File history props
          currentFileName={currentFileName}
          fileHistory={fileHistory}
          onSelectFile={handleSelectFile}
          onFileExists={checkFileExists}
          onRemoveFile={removeFileFromHistory}
          onClearHistory={clearFileHistory}
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
            onRestore={restoreFromHistory}
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
