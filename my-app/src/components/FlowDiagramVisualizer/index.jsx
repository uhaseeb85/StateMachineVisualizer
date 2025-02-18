import { useState } from 'react';
import PropTypes from 'prop-types';
import TopActionBar from './TopActionBar';
import StepPanel from './StepPanel';
import SimulationModal from './SimulationModal';
import PathFinderModal from './PathFinderModal';
import { Toaster } from 'sonner';
import useFlowDiagram from './hooks/useFlowDiagram';

const STORAGE_KEY = 'flowDiagramData';

const FlowDiagramVisualizer = ({ onChangeMode }) => {
  const [showSimulation, setShowSimulation] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  
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
  } = useFlowDiagram(STORAGE_KEY);

  return (
    <div className="h-screen flex flex-col">
      <TopActionBar
        onChangeMode={onChangeMode}
        onSimulate={() => setShowSimulation(true)}
        onFindPath={() => setShowPathFinder(true)}
        onClear={clearAll}
        onImport={importData}
        onExport={exportData}
      />
      
      <div className="flex-1 flex">
        <StepPanel
          steps={steps}
          connections={connections}
          onAddStep={addStep}
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

      <Toaster />
    </div>
  );
};

FlowDiagramVisualizer.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
};

export default FlowDiagramVisualizer; 