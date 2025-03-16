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
import { Toaster } from 'sonner';
import useFlowDiagram from './hooks/useFlowDiagram';
import { TourProvider, useTour } from './TourProvider';

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
  
  // Tour functionality
  const { startTour } = useTour();
  
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
    showSaveNotification
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
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

      <div className="relative container mx-auto p-4 max-w-full min-h-screen">
        {/* Header section */}
        <div className="flex flex-col items-center pt-24 pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-clip-text text-transparent 
                       bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-5">
            Flow Diagram Builder
          </h1>
          <p className="text-lg text-gray-300">
            Design • Visualize • Test
          </p>
        </div>

        {/* Action bar with main controls */}
        <TopActionBar
          onChangeMode={onChangeMode}
          onSimulate={() => setShowSimulation(true)}
          onFindPath={() => setShowPathFinder(true)}
          onClear={clearAll}
          onImport={importData}
          onExport={exportData}
          onSave={saveFlow}
          startTour={startTour}
        />
        
        {/* Main step panel for diagram editing */}
        <div className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700 shadow-md">
          <StepPanel
            steps={steps}
            connections={connections}
            onAddStep={handleAddStep}
            onUpdateStep={updateStep}
            onRemoveStep={removeStep}
            onAddConnection={addConnection}
            onRemoveConnection={removeConnection}
          />
        </div>

        {/* Modals */}
        {showSimulation && (
          <SimulationModal
            steps={steps}
            connections={connections}
            onClose={() => setShowSimulation(false)}
          />
        )}

        {showPathFinder && (
          <PathFinderModal
            steps={steps}
            connections={connections}
            onClose={() => setShowPathFinder(false)}
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