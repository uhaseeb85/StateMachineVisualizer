/**
 * SimulationModal Component
 * A modal dialog that provides interactive simulation functionality for a flow diagram.
 * Features include:
 * - Step-by-step flow simulation with success/failure paths
 * - Visual representation of the simulation path
 * - Undo/Reset capabilities
 * - Export simulation as image
 * - Support for main steps and sub-steps
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  X,
  Camera,
  PanelLeftClose,
  PanelBottomClose,
  Undo2
} from 'lucide-react';

/**
 * @typedef {Object} Step
 * @property {string} id - Unique identifier for the step
 * @property {string} name - Display name of the step
 * @property {string} [description] - Optional description of the step
 * @property {string} [parentId] - ID of parent step if this is a sub-step
 */

/**
 * @typedef {Object} Connection
 * @property {string} fromStepId - ID of the source step
 * @property {string} toStepId - ID of the target step
 * @property {string} type - Type of connection ('success' or 'failure')
 */

/**
 * @typedef {Object} PathItem
 * @property {Step} step - The step object
 * @property {'current' | 'success' | 'failure' | 'end'} status - Current status of the step in the simulation
 */

/**
 * SimulationModal Component
 * @param {Object} props
 * @param {Step[]} props.steps - Array of steps in the flow diagram
 * @param {Connection[]} props.connections - Array of connections between steps
 * @param {Function} props.onClose - Callback function when modal is closed
 */
const SimulationModal = ({ steps, connections, onClose }) => {
  // Modal state
  const [isOpen, setIsOpen] = useState(true);
  
  // Simulation state
  const [currentStep, setCurrentStep] = useState(null);
  const [simulationPath, setSimulationPath] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  /**
   * Initialize simulation with the starting step
   * Starting step is identified as the one with no incoming connections
   */
  useEffect(() => {
    const startStep = steps.find((step) =>
      !connections.some((conn) => conn.toStepId === step.id)
    );
    if (startStep) {
      setCurrentStep(startStep);
      setSimulationPath([{ step: startStep, status: 'current' }]);
    }
  }, [steps, connections]);

  /**
   * Handles modal close and triggers parent callback
   */
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  /**
   * Handles user choice in simulation (success/failure)
   * Updates the simulation path and moves to the next step
   * @param {'success' | 'failure'} type - Type of choice made
   */
  const handleChoice = (type) => {
    const nextConnection = connections.find(
      (conn) => conn.fromStepId === currentStep.id && conn.type === type
    );

    // Update current step in path to show success/failure
    setSimulationPath((prev) =>
      prev.map((item) =>
        item.step.id === currentStep.id
          ? { ...item, status: type }
          : item
      )
    );

    if (nextConnection) {
      const nextStep = steps.find((s) => s.id === nextConnection.toStepId);
      setCurrentStep(nextStep);
      setSimulationPath((prev) => [
        ...prev,
        { step: nextStep, status: 'current' }
      ]);

      // Check if the next step has any outgoing connections
      const hasOutgoingConnections = connections.some(
        conn => conn.fromStepId === nextStep.id
      );

      // If no outgoing connections, mark as complete and add END element
      if (!hasOutgoingConnections) {
        setCurrentStep(null);
        setIsComplete(true);
        setSimulationPath(prev => [
          ...prev,
          { 
            step: { 
              id: 'end', 
              name: 'END',
              description: 'Simulation complete'
            }, 
            status: 'end' 
          }
        ]);
      }
    } else {
      setCurrentStep(null);
      setIsComplete(true);
      setSimulationPath(prev => [
        ...prev,
        { 
          step: { 
            id: 'end', 
            name: 'END',
            description: 'Simulation complete'
          }, 
          status: 'end' 
        }
      ]);
    }
  };

  /**
   * Resets the simulation to its initial state
   * Returns to the starting step and clears the path
   */
  const handleReset = () => {
    const startStep = steps.find((step) =>
      !connections.some((conn) => conn.toStepId === step.id)
    );
    if (startStep) {
      setCurrentStep(startStep);
      setSimulationPath([{ step: startStep, status: 'current' }]);
      setIsComplete(false);
    }
  };

  /**
   * Undoes the last step in the simulation
   * Removes the last step from the path and updates the current step
   */
  const handleUndo = () => {
    if (simulationPath.length <= 1) return;
    
    const newPath = simulationPath.slice(0, -1);
    const lastItem = newPath[newPath.length - 1];
    
    // Update the last item's status to 'current'
    newPath[newPath.length - 1] = { ...lastItem, status: 'current' };
    
    setCurrentStep(lastItem.step);
    setSimulationPath(newPath);
    setIsComplete(false);
  };

  /**
   * Exports the current simulation state as a PNG image
   * Temporarily modifies styling for better export quality
   * Prompts for filename and downloads the image
   */
  const handleExportImage = async () => {
    try {
      const element = document.querySelector('.simulation-content');
      if (!element) return;

      const defaultName = `flow-diagram-simulation-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter file name:', defaultName);
      
      if (!fileName) return;
      
      const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

      // Store original styles and scroll position
      const originalClasses = element.className;
      const originalBg = element.style.background;
      const originalHeight = element.style.height;
      const originalOverflow = element.style.overflow;
      const originalPosition = element.scrollTop;

      // Temporarily modify for export
      element.className = `${originalClasses} !bg-white`;
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      
      // Remove dark mode classes
      document.querySelectorAll('.simulation-content [class*="dark:"]').forEach(el => {
        el.className = el.className.split(' ').filter(c => !c.startsWith('dark:')).join(' ');
      });

      // Set light mode colors for export
      const cards = element.querySelectorAll('.Card');
      cards.forEach(card => {
        if (card.textContent.includes('END')) {
          card.style.backgroundColor = '#f9fafb'; // gray-50
        } else if (card.classList.contains('border-dashed')) {
          card.style.backgroundColor = '#f0fdf4'; // green-50
        } else {
          card.style.backgroundColor = '#eff6ff'; // blue-50
        }
      });

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: window.devicePixelRatio,
        useCORS: true,
        logging: false,
        allowTaint: true,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight
      });

      // Restore original styling
      element.className = originalClasses;
      element.style.background = originalBg;
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;
      element.scrollTop = originalPosition;
      cards.forEach(card => {
        card.style.backgroundColor = '';
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = finalFileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting simulation:', error);
      alert('Failed to export simulation image');
    }
  };

  /**
   * Returns the appropriate icon component based on step status
   * @param {'current' | 'success' | 'failure' | 'end'} status - Status of the step
   * @returns {JSX.Element} Icon component
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500/70" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500/70" />;
      case 'current':
        return <ArrowRight className="h-4 w-4 text-blue-500/70" />;
      case 'end':
        return <X className="h-4 w-4 text-gray-500/70" />;
      default:
        return null;
    }
  };

  /**
   * Generates CSS classes for step cards based on their status and type
   * @param {'current' | 'success' | 'failure' | 'end'} status - Status of the step
   * @param {boolean} isSubStep - Whether the step is a sub-step
   * @returns {string} CSS classes string
   */
  const getStepCardClasses = (status, isSubStep) => {
    let baseClasses = "p-3 min-w-[200px] rounded-lg border ";
    
    // Status-based styling
    const statusClasses = status === 'current' ? 'ring-1 ring-blue-300 bg-blue-50 dark:bg-blue-900/30' : 
                         status === 'success' ? 'bg-green-50 dark:bg-green-900/30' :
                         status === 'failure' ? 'bg-red-50 dark:bg-red-900/30' :
                         status === 'end' ? 'bg-gray-50 dark:bg-gray-800' :
                         'bg-gray-50 dark:bg-gray-800';

    // Different styling for main steps and sub-steps
    const stepTypeClasses = isSubStep ? 
      'border-dashed bg-opacity-60 dark:bg-opacity-60' : 
      'border-solid shadow-sm';

    return `${baseClasses} ${statusClasses} ${stepTypeClasses}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Flow Simulation</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                title="Export as image"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={simulationPath.length <= 1}
                title="Undo last step"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={simulationPath.length <= 1}
                title="Reset simulation"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Simulation Content */}
          <div className="simulation-content h-[calc(90vh-8rem)] border rounded-lg p-6 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
            <div className="flex flex-col gap-6">
              {simulationPath.map(({ step, status }, index) => {
                // Find any sub-steps that follow this step
                const subSteps = simulationPath.slice(index + 1).filter(item => 
                  item.step.parentId === step.id
                );
                
                // Check if this is a sub-step
                const isSubStep = step.parentId;
                
                // Calculate the offset based on depth
                const mainStepOffset = index * 24; // Reduced from 32px to 24px
                const subStepOffset = isSubStep ? 40 : 0; // Reduced from 48px to 40px
                const totalOffset = mainStepOffset + subStepOffset;
                
                // Only render if this is a main step or if its parent was already rendered
                if (!isSubStep || simulationPath.some(item => item.step.id === step.parentId)) {
                  return (
                    <div key={`${step.id}-${index}`} 
                         className="relative flex flex-col"
                         style={{ marginLeft: `${totalOffset}px` }}>
                      <div className="relative flex flex-col items-start gap-2">
                        <div className="relative flex items-center">
                          {/* Vertical line from parent */}
                          {isSubStep && (
                            <div className="absolute -left-6 -top-3 h-6 border-l-2 border-gray-200 dark:border-gray-700" />
                          )}
                          
                          {/* Horizontal line to sub-step */}
                          {isSubStep && (
                            <div className="absolute -left-6 top-1/2 w-6 border-t-2 border-gray-200 dark:border-gray-700" />
                          )}

                          <Card className={`w-[240px] ${getStepCardClasses(status, isSubStep)}`}>
                            <div className="flex items-center gap-2 justify-center">
                              {getStatusIcon(status)}
                              <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                                {step.name}
                              </span>
                            </div>
                            {step.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                                {step.description}
                              </p>
                            )}
                          </Card>

                          {/* Straight line to next step */}
                          {index < simulationPath.length - 1 && !isSubStep && !simulationPath[index + 1].step.parentId && (
                            <div className="absolute -right-8 top-1/2 w-8 border-t-2 border-gray-200 dark:border-gray-700" />
                          )}
                        </div>

                        {/* Path Selection Buttons */}
                        {status === 'current' && !isComplete && (
                          <div className="flex gap-2 ml-8">
                            <Button
                              size="sm"
                              onClick={() => handleChoice('success')}
                              className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200 text-xs h-6 px-2"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleChoice('failure')}
                              className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 text-xs h-6 px-2"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Failure
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Simulation Complete */}
          {isComplete && (
            <Card className="mt-4 p-4 bg-white border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700">Simulation Complete</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    The flow has reached an end point.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="hover:bg-gray-100"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

SimulationModal.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    parentId: PropTypes.string
  })).isRequired,
  connections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })).isRequired,
  onClose: PropTypes.func.isRequired
};

export default SimulationModal; 