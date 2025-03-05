/**
 * SimulationModal Component
 * A modal dialog that provides interactive simulation functionality for a flow diagram.
 * Features include:
 * - Step-by-step flow simulation with success/failure paths
 * - Visual representation of the simulation path with animated arrows
 * - Undo/Reset capabilities
 * - Export simulation as image
 * - Support for main steps and sub-steps
 */

import { useState, useEffect, useRef } from 'react';
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
  Undo2,
  Columns,
  AlignRight,
} from 'lucide-react';
import { toast } from 'sonner';

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
  
  // View mode state
  const [stairView, setStairView] = useState(false);
  
  // Ref for layout container (used for auto-scrolling)
  const simulationContainerRef = useRef(null);

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
   * Auto-scroll to the latest step when simulation path changes
   */
  useEffect(() => {
    if (simulationContainerRef.current && simulationPath.length > 0) {
      simulationContainerRef.current.scrollTop = simulationContainerRef.current.scrollHeight;
    }
  }, [simulationPath]);

  // Add animation styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes arrowFlow {
        0% { stroke-dashoffset: 20; }
        100% { stroke-dashoffset: 0; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      .step-card {
        animation: fadeIn 0.4s ease-out;
        transition: all 0.3s ease;
      }

      .step-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      .arrow-path {
        stroke-dasharray: 5;
        animation: arrowFlow 1s linear infinite;
      }

      .success-arrow {
        stroke: #22c55e;
      }

      .failure-arrow {
        stroke: #ef4444;
      }

      .choice-buttons {
        animation: slideIn 0.4s ease-out;
      }

      .arrow-container {
        position: relative;
        margin: 16px 0;
        height: 40px;
        overflow: visible;
      }

      .arrow-svg {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .sub-step-container {
        position: relative;
        margin-left: 40px;
        padding-left: 20px;
        border-left: 2px dashed #e5e7eb;
        width: 75%;
        margin-bottom: 24px;
      }

      .sub-step-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 2px;
        background: #e5e7eb;
      }

      .end-card {
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      /* Add spacing between step items */
      .step-item {
        margin-bottom: 24px;
      }
      
      /* Stair view styles */
      .stair-container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      
      .stair-step {
        margin-left: calc(var(--step-level) * 30px);
        width: calc(50% - (var(--step-level) * 30px));
        transition: all 0.3s ease;
      }
      
      .stair-step.sub-step-container {
        width: calc(37.5% - (var(--step-level) * 30px));
      }
      
      .stair-arrow {
        margin-left: calc(var(--step-level) * 30px);
        width: calc(50% - (var(--step-level) * 30px));
      }
      
      /* View toggle button styles */
      .view-toggle {
        transition: all 0.2s ease;
      }
      
      .view-toggle.active {
        background-color: #f3f4f6;
        color: #1f2937;
      }
      
      .view-toggle:hover {
        transform: translateY(-1px);
      }
      
      /* Current step highlight in stair view */
      .stair-current {
        box-shadow: 0 0 0 2px #3b82f6, 0 8px 16px rgba(59, 130, 246, 0.2);
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
   * Ensures all elements are captured, including those outside the viewport
   */
  const handleExportImage = async () => {
    try {
      const element = document.querySelector('.simulation-content');
      if (!element) return;

      const defaultName = `flow-diagram-simulation-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter file name:', defaultName);
      
      if (!fileName) return;
      
      const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;

      // Show loading toast
      toast.loading('Preparing export...');

      // Store original styles
      const originalStyles = {
        height: element.style.height,
        width: element.style.width,
        position: element.style.position,
        overflow: element.style.overflow,
        maxHeight: element.style.maxHeight,
        maxWidth: element.style.maxWidth,
        padding: element.style.padding,
        background: element.style.background
      };

      // Temporarily modify the container for better capture
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      element.style.padding = '50px';
      element.style.background = '#ffffff';

      // If in stair view, adjust the container width to ensure all steps are visible
      if (stairView) {
        // Find the maximum step level to calculate required width
        let maxStepLevel = 0;
        simulationPath.forEach(({ step }, index) => {
          const level = getStepLevel(step, index);
          if (level > maxStepLevel) maxStepLevel = level;
        });
        
        // Set minimum width to accommodate the most indented step
        const minWidth = (maxStepLevel * 30) + 500; // 500px base width + indentation
        element.style.minWidth = `${minWidth}px`;
        
        // Ensure all step cards are fully visible
        element.querySelectorAll('.stair-step').forEach(stepEl => {
          const isSubStep = stepEl.classList.contains('sub-step-container');
          stepEl.style.width = isSubStep ? '37.5%' : '50%';
          stepEl.style.marginLeft = stepEl.style.getPropertyValue('--step-level') * 30 + 'px';
        });
        
        // Ensure all arrows are visible
        element.querySelectorAll('.stair-arrow').forEach(arrowEl => {
          arrowEl.style.width = '50%';
          arrowEl.style.marginLeft = arrowEl.style.getPropertyValue('--step-level') * 30 + 'px';
        });
      }

      // Pause animations temporarily
      const animationStyles = document.createElement('style');
      animationStyles.textContent = `
        .arrow-path, .step-card {
          animation: none !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(animationStyles);

      // Set up html2canvas options
      const options = {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth * 2,
        windowHeight: document.documentElement.offsetHeight * 2,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.simulation-content');
          
          // Remove dark mode classes in cloned element
          clonedElement.querySelectorAll('[class*="dark:"]').forEach(el => {
            el.className = el.className.split(' ').filter(c => !c.startsWith('dark:')).join(' ');
          });

          // Make all SVGs visible
          clonedElement.querySelectorAll('svg').forEach(svg => {
            svg.style.overflow = 'visible';
            svg.style.visibility = 'visible';
          });

          // Make all step cards visible
          clonedElement.querySelectorAll('.step-card').forEach(card => {
            card.style.opacity = '1';
            card.style.visibility = 'visible';
            card.style.transform = 'none';
            card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          });
        }
      };

      // Create canvas and download
      const canvas = await html2canvas(element, options);
      
      // Restore original styles
      Object.assign(element.style, originalStyles);
      
      // Remove temporary animation styles
      document.head.removeChild(animationStyles);
      
      // If in stair view, restore original styles for step elements
      if (stairView) {
        element.querySelectorAll('.stair-step, .stair-arrow').forEach(el => {
          el.style.width = '';
          el.style.marginLeft = '';
        });
      }

      // Create and trigger download
      const link = document.createElement('a');
      link.download = finalFileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.dismiss();
      toast.success('Diagram exported successfully');
    } catch (error) {
      console.error('Error exporting simulation:', error);
      toast.dismiss();
      toast.error('Failed to export simulation image');
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
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'current':
        return <ArrowRight className="h-5 w-5 text-blue-500" />;
      case 'end':
        return <X className="h-5 w-5 text-gray-500" />;
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
    let baseClasses = "p-4 rounded-lg border ";
    
    // Status-based styling
    const statusClasses = status === 'current' ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : 
                         status === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200' :
                         status === 'failure' ? 'bg-red-50 dark:bg-red-900/30 border-red-200' :
                         status === 'end' ? 'bg-gray-50 dark:bg-gray-800 border-gray-200' :
                         'bg-gray-50 dark:bg-gray-800';

    // Different styling for main steps and sub-steps
    const stepTypeClasses = isSubStep ? 
      'border-dashed bg-opacity-70 dark:bg-opacity-70' : 
      'border-solid shadow-md';

    return `${baseClasses} ${statusClasses} ${stepTypeClasses}`;
  };

  /**
   * Renders an arrow between steps with animation
   * @param {'success' | 'failure'} type - Type of connection
   * @param {number} index - Index of the arrow in the sequence
   * @param {number} level - Nesting level for stair view
   * @returns {JSX.Element} SVG arrow element
   */
  const renderArrow = (type, index, level = 0) => {
    const color = type === 'success' ? '#22c55e' : '#ef4444';
    const arrowId = `${type}-arrow-${Date.now()}-${index}`;
    
    return (
      <div className={`arrow-container ${stairView ? 'stair-arrow' : ''}`} style={stairView ? {'--step-level': level} : {}}>
        <svg 
          className="arrow-svg" 
          viewBox="0 0 100 40" 
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          </defs>
          <path
            className={`arrow-path ${type}-arrow`}
            d="M 10,20 L 90,20"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
            markerEnd={`url(#${arrowId})`}
          />
        </svg>
      </div>
    );
  };

  /**
   * Toggles between standard and stair view modes
   */
  const toggleViewMode = () => {
    setStairView(prev => !prev);
  };

  /**
   * Calculates the nesting level for a step in the stair view
   * @param {Object} step - The step object
   * @param {number} index - Index in the simulation path
   * @returns {number} Nesting level
   */
  const getStepLevel = (step, index) => {
    if (step.parentId) {
      // Find the parent step's index
      const parentIndex = simulationPath.findIndex(item => item.step.id === step.parentId);
      if (parentIndex >= 0) {
        // Parent level + 1
        return getStepLevel(simulationPath[parentIndex].step, parentIndex) + 1;
      }
    }
    // For main steps, use their position in the path
    return index;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Flow Simulation</DialogTitle>
            
            <div className="flex gap-2">
              <div className="flex mr-2 border rounded-md overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleViewMode}
                  title="Standard View"
                  className={`view-toggle rounded-none ${!stairView ? 'active' : ''}`}
                >
                  <Columns className="h-4 w-4 mr-2" />
                  Standard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleViewMode}
                  title="Stair View"
                  className={`view-toggle rounded-none ${stairView ? 'active' : ''}`}
                >
                  <AlignRight className="h-4 w-4 mr-2" />
                  Stair
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                title="Export as image"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Camera className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={simulationPath.length <= 1}
                title="Undo last step"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={simulationPath.length <= 1}
                title="Reset simulation"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Simulation Content */}
          <div 
            ref={simulationContainerRef}
            className={`simulation-content h-[calc(90vh-8rem)] border rounded-lg p-8 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto ${stairView ? 'stair-container' : ''}`}
          >
            <div className={`flex flex-col ${stairView ? 'w-full' : 'max-w-2xl mx-auto'}`}>
              {simulationPath.map(({ step, status }, index) => {
                // Find any sub-steps that follow this step
                const subSteps = simulationPath.slice(index + 1).filter(item => 
                  item.step.parentId === step.id
                );
                
                // Check if this is a sub-step
                const isSubStep = step.parentId;
                
                // Calculate step level for stair view
                const stepLevel = stairView ? getStepLevel(step, index) : 0;
                
                // Only render if this is a main step or if its parent was already rendered
                if (!isSubStep || simulationPath.some(item => item.step.id === step.parentId)) {
                  return (
                    <div 
                      key={`${step.id}-${index}`} 
                      className={`step-item ${isSubStep ? "sub-step-container" : ""} ${stairView ? 'stair-step' : ''}`}
                      style={stairView ? {'--step-level': stepLevel} : {}}
                    >
                      <Card 
                        className={`
                          step-card
                          ${getStepCardClasses(status, isSubStep)} 
                          ${stairView && status === 'current' ? 'stair-current' : ''}
                          w-full
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`status-icon ${status} transition-all duration-300`}>
                            {getStatusIcon(status)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200">
                              {step.name}
                            </h3>
                            {step.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {step.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Path Selection Buttons */}
                        {status === 'current' && !isComplete && (
                          <div className="choice-buttons flex gap-2 mt-4 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleChoice('success')}
                              className="
                                bg-green-100 hover:bg-green-200 text-green-700 
                                border-green-200 px-3 py-1
                                transform transition-all duration-200 hover:scale-105
                              "
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Success
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleChoice('failure')}
                              className="
                                bg-red-100 hover:bg-red-200 text-red-700 
                                border-red-200 px-3 py-1
                                transform transition-all duration-200 hover:scale-105
                              "
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Failure
                            </Button>
                          </div>
                        )}
                      </Card>

                      {/* Commented out the Animated Arrow to maintain consistency with step-to-substep transitions
                      {index < simulationPath.length - 1 && 
                       !isSubStep && 
                       !simulationPath[index + 1].step.parentId &&
                       simulationPath[index + 1].step.id !== 'end' && (
                        renderArrow(simulationPath[index].status, index, stepLevel)
                      )}
                      */}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Simulation Complete */}
          {isComplete && (
            <Card className="mt-4 p-4 bg-white border-gray-200 end-card">
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