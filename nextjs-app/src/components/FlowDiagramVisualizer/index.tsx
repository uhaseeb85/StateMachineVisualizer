import React from 'react';

interface FlowDiagramVisualizerProps {
  onChangeMode: () => void;
}

const FlowDiagramVisualizer: React.FC<FlowDiagramVisualizerProps> = ({ onChangeMode }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Flow Diagram Visualizer</h1>
        <button 
          onClick={onChangeMode}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Change Mode
        </button>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Flow Diagram Visualizer component is being migrated to Next.js and TypeScript.
        </p>
      </div>
    </div>
  );
};

export default FlowDiagramVisualizer;
