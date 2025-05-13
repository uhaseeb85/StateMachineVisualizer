/**
 * SimulationModal Component
 * 
 * A modal component that provides interactive simulation of state machine flows.
 * Features include:
 * - Visual representation of state transitions
 * - Interactive rule evaluation
 * - Success/failure outcome selection
 * - Undo/reset capabilities
 * - Layout switching (vertical/horizontal)
 * - Image export functionality
 * 
 * The simulation follows a step-by-step process where users can:
 * 1. Click on states to initiate transitions
 * 2. Evaluate rules for state changes
 * 3. Determine success/failure outcomes
 * 4. Track the simulation path visually
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw } from 'lucide-react';
import { exportToImage } from './utils';

const SimulationModal = ({
  states,
  simulationState,
  onStateClick,
  onRuleClick,
  onOutcome,
  onReset,
  onClose,
  onUndo,
  canUndo
}) => {
  // Layout state
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);

  /**
   * Handles exporting the simulation view as an image
   * Prompts for filename and downloads the PNG
   */
  const handleExportImage = async () => {
    try {
      const element = document.querySelector('.simulation-content');
      if (!element) return;

      const defaultName = `state-machine-simulation-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter file name:', defaultName);
      
      if (!fileName) return;
      
      const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      const imageData = await exportToImage(element);
      
      const link = document.createElement('a');
      link.href = imageData;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting simulation:', error);
      alert('Failed to export simulation image');
    }
  };

  /**
   * Renders a simulation node (state or rule)
   * @param {Object} node - Node to render
   * @param {number} index - Node index in the path
   * @returns {JSX.Element} Rendered node
   */
  const renderSimulationNode = (node, index) => {
    // State node rendering
    if (node.type === 'state') {
      const state = node.id === 'end' ? { name: 'END' } : states.find(s => s.id === node.id);
      return (
        <div 
          key={index}
          className={`
            min-w-[5rem] min-h-[5rem] w-auto h-auto p-4
            rounded-full flex items-center justify-center text-white text-sm
            ${node.id === 'end' 
              ? 'bg-gray-500' 
              : simulationState.status === 'active' && node.id === simulationState.currentState
                ? 'bg-blue-600 cursor-pointer hover:bg-blue-700'
                : 'bg-blue-400 dark:bg-white dark:text-blue-600'
            }
            transition-colors
          `}
          onClick={() => {
            if (simulationState.status === 'active' && node.id === simulationState.currentState) {
              onStateClick(node.id);
            }
          }}
        >
          <span className="px-2 text-center break-words max-w-[150px]">
            {state?.name || 'Unknown'}
          </span>
        </div>
      );
    }

    // Rule node rendering
    if (node.type === 'rule') {
      // Find the associated state for this rule
      const ruleState = simulationState.path
        .slice(0, index)
        .reverse()
        .find(n => n.type === 'state');
      
      const stateWithRule = states.find(s => s.id === ruleState?.id);
      const rule = stateWithRule?.rules.find(r => r.id === node.id);

      // Determine rule outcome status
      const nextNode = simulationState.path[index + 1];
      const hasOutcome = nextNode && nextNode.type === 'state' && nextNode.id !== 'end';
      const isFailure = nextNode && nextNode.type === 'rule';

      return (
        <div className="flex flex-col items-center gap-2">
          <div 
            className={`
              min-w-[8rem] min-h-[3.5rem] w-auto h-auto p-4
              rounded-full flex items-center justify-center
              ${simulationState.status === 'evaluating' && node.id === simulationState.currentRule
                ? 'bg-white text-gray-900 cursor-pointer hover:bg-gray-100'
                : simulationState.status === 'deciding' && node.id === simulationState.currentRule
                  ? 'bg-white text-gray-900'
                  : hasOutcome
                    ? 'bg-green-500 text-white'
                    : isFailure
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-900'
              }
              transition-colors duration-300 border border-gray-200
            `}
            onClick={() => {
              if (simulationState.status === 'evaluating' && node.id === simulationState.currentRule) {
                onRuleClick(node.id);
              }
            }}
          >
            <span className="text-xs px-2 text-center break-words max-w-[150px]">
              {rule?.condition || 'Unknown'}
            </span>
          </div>
          
          {/* Outcome Selection Buttons */}
          {simulationState.status === 'deciding' && 
           simulationState.currentRule === node.id && (
            <div className="flex gap-4 -mt-1">
              <Button
                onClick={() => onOutcome('success')}
                className="min-w-[4rem] min-h-[2rem] w-auto h-auto p-2
                         rounded-full bg-green-500 hover:bg-green-600 
                         text-white text-xs"
              >
                True
              </Button>
              <Button
                onClick={() => onOutcome('failure')}
                className="min-w-[4rem] min-h-[2rem] w-auto h-auto p-2
                         rounded-full bg-red-500 hover:bg-red-600 
                         text-white text-xs"
              >
                False
              </Button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 
                    flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-4/5 h-4/5 overflow-auto">
        {/* Header Section */}
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Flow Simulation
          </h2>
          <div className="space-x-2">
            {/* Layout Toggle */}
            <Button
              onClick={() => setIsVerticalLayout(!isVerticalLayout)}
              className="bg-gray-900 hover:bg-blue-600 text-white"
            >
              {isVerticalLayout ? 'Horizontal' : 'Vertical'} Layout
            </Button>
            
            {/* Export Button */}
            <Button
              onClick={handleExportImage}
              className="bg-gray-900 hover:bg-blue-600 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Export Image
            </Button>
            
            {/* Undo Button */}
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              className="bg-gray-900 hover:bg-blue-600 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
            
            {/* Reset Button */}
            <Button
              onClick={onReset}
              disabled={simulationState.path.length <= 1}
              className="bg-gray-900 hover:bg-blue-600 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            
            {/* Close Button */}
            <Button
              onClick={onClose}
              className="bg-gray-900 hover:bg-red-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Simulation Content */}
        <div className="simulation-content min-h-[400px] border dark:border-gray-700 
                      rounded-lg p-4 relative bg-gray-50 dark:bg-gray-900">
          <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row flex-wrap'} 
                        gap-6 items-center ${isVerticalLayout ? 'justify-center' : 'justify-start'} 
                        p-4`}>
            {simulationState.path.map((node, index) => (
              <div key={index} className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} 
                                       items-center`}>
                {renderSimulationNode(node, index)}
                {/* Connector Line */}
                {index < simulationState.path.length - 1 && (
                  <div className={`bg-gray-400 ${isVerticalLayout ? 'h-6 w-0.5 my-2' : 'w-6 h-0.5 mx-2'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

SimulationModal.propTypes = {
  // Array of state objects
  states: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rules: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      condition: PropTypes.string.isRequired
    })).isRequired
  })).isRequired,
  // Current simulation state
  simulationState: PropTypes.shape({
    status: PropTypes.oneOf(['active', 'evaluating', 'deciding']).isRequired,
    currentState: PropTypes.string,
    currentRule: PropTypes.string,
    path: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.oneOf(['state', 'rule']).isRequired,
      id: PropTypes.string.isRequired
    })).isRequired
  }).isRequired,
  // Event handlers
  onStateClick: PropTypes.func.isRequired,
  onRuleClick: PropTypes.func.isRequired,
  onOutcome: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  // Undo state
  canUndo: PropTypes.bool.isRequired
};

export default SimulationModal;
