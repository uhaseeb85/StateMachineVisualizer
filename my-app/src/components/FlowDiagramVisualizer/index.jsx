import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TopActionBar from './TopActionBar';
import StepPanel from './StepPanel';
import SimulationModal from './SimulationModal';
import PathFinderModal from './PathFinderModal';
import { Toaster } from 'sonner';
import useFlowDiagram from './hooks/useFlowDiagram';
import { TourProvider, useTour } from './TourProvider';

const STORAGE_KEY = 'flowDiagramData';

const FlowDiagramVisualizerContent = ({ onChangeMode }) => {
  console.log('Rendering FlowDiagramVisualizer');
  const [showSimulation, setShowSimulation] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  const { startTour } = useTour();
  
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

  useEffect(() => {
    console.log('Current steps:', steps);
    console.log('Current connections:', connections);
  }, [steps, connections]);

  const handleAddStep = (stepData) => {
    console.log('Adding step:', stepData);
    const stepId = addStep(stepData);
    console.log('Added step with ID:', stepId);
    return stepId;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
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

      <div className="container mx-auto p-4 max-w-full min-h-screen 
                    bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50
                    dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-5 tracking-wide">
            Flow Diagram Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design • Visualize • Test
          </p>
        </div>

        {/* Top Action Bar */}
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
        
        <div className="mt-8 bg-background rounded-xl border shadow-sm">
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