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
  DialogFooter,
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
  Play,
  Plus,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import SimulationStepCard from './SimulationStepCard';
import InlineStepCreator from './InlineStepCreator';
// Old modal overlays - keeping for now as fallback
// import EditStepOverlay from './EditStepOverlay';
// import CreateStepOverlay from './CreateStepOverlay';

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
 * @param {Function} props.onAddStep - Callback for adding a new step
 * @param {Function} props.onUpdateStep - Callback for updating a step
 * @param {Function} props.onRemoveStep - Callback for removing a step
 * @param {Function} props.onAddConnection - Callback for adding a connection
 * @param {Function} props.onRemoveConnection - Callback for removing a connection
 */
const SimulationModal = ({ 
  steps, 
  connections, 
  onClose,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onAddConnection,
  onRemoveConnection
}) => {
  // Modal state
  const [isOpen, setIsOpen] = useState(true);
  const [showStartSelector, setShowStartSelector] = useState(true);
  
  // Simulation state
  const [currentStep, setCurrentStep] = useState(null);
  const [simulationPath, setSimulationPath] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedStartStepId, setSelectedStartStepId] = useState('');
  
  // Preview next steps
  const [nextSteps, setNextSteps] = useState({ success: [], failure: [] });
  
  // View mode state
  const [stairView, setStairView] = useState(false);
  
  // Inline editing state
  const [expandedStepId, setExpandedStepId] = useState(null);
  const [creatorPosition, setCreatorPosition] = useState(null); // null | 'end' | 'before-{stepId}'
  
  // Ref for layout container (used for auto-scrolling)
  const simulationContainerRef = useRef(null);
  
  // Flag to control when auto-scroll should happen (only during simulation navigation, not editing)
  const shouldAutoScrollRef = useRef(false);

  /**
   * Find the default start step (one with no incoming connections)
   */
  useEffect(() => {
    const defaultStartStep = steps.find((step) =>
      !connections.some((conn) => conn.toStepId === step.id)
    );
    
    if (defaultStartStep) {
      setSelectedStartStepId(defaultStartStep.id);
    } else if (steps.length > 0) {
      // If there's no clear starting step, select the first one
      setSelectedStartStepId(steps[0].id);
    }
  }, [steps, connections]);
  
  /**
   * Updates the next possible steps based on the current step
   * This function supports multiple success and failure paths
   * @param {Object} step - The current step
   */
  const updateNextSteps = (step) => {
    if (!step) {
      setNextSteps({ success: [], failure: [] });
      return;
    }

    // Find all connections from the current step
    const successConnections = connections.filter(
      (conn) => conn.fromStepId === step.id && conn.type === 'success'
    );
    
    const failureConnections = connections.filter(
      (conn) => conn.fromStepId === step.id && conn.type === 'failure'
    );

    // Get the target steps for each connection
    const successSteps = successConnections.map(conn => {
      const targetStep = steps.find(s => s.id === conn.toStepId);
      if (targetStep) {
        return {
          ...targetStep,
          connectionId: conn.id // Store the connection ID for reference
        };
      }
      return null;
    }).filter(Boolean);
      
    const failureSteps = failureConnections.map(conn => {
      const targetStep = steps.find(s => s.id === conn.toStepId);
      if (targetStep) {
        return {
          ...targetStep,
          connectionId: conn.id // Store the connection ID for reference
        };
      }
      return null;
    }).filter(Boolean);

    setNextSteps({
      success: successSteps,
      failure: failureSteps
    });
  };
  
  /**
   * Start the simulation with the selected starting step
   */
  const startSimulation = () => {
    const startStep = steps.find(step => step.id === selectedStartStepId);
    if (startStep) {
      setCurrentStep(startStep);
      setSimulationPath([{ step: startStep, status: 'current' }]);
      updateNextSteps(startStep);
      setShowStartSelector(false);
    } else {
      toast.error('Please select a valid starting step');
    }
  };
  
  /**
   * Conditional auto-scroll - only when shouldAutoScrollRef is true
   * This prevents jarring scrolls during inline editing
   */
  useEffect(() => {
    if (shouldAutoScrollRef.current && simulationContainerRef.current && simulationPath.length > 0) {
      setTimeout(() => {
        simulationContainerRef.current.scrollTop = simulationContainerRef.current.scrollHeight;
      }, 100);
      // Reset the flag after scrolling
      shouldAutoScrollRef.current = false;
    }
  }, [simulationPath]);

  /**
   * Update next steps when steps or connections change (for real-time updates during editing)
   */
  useEffect(() => {
    if (currentStep) {
      updateNextSteps(currentStep);
    }
    
    // If simulation is complete but we've just added connections to the last real step,
    // we need to un-complete the simulation and remove the END marker
    if (isComplete && simulationPath.length > 0) {
      // Find the last real step (not the END marker)
      const lastRealStepIndex = simulationPath.findIndex(item => item.step.id === 'end') - 1;
      
      if (lastRealStepIndex >= 0) {
        const lastRealStep = simulationPath[lastRealStepIndex].step;
        
        // Check if this step now has outgoing connections
        const hasOutgoingConnections = connections.some(
          conn => conn.fromStepId === lastRealStep.id
        );
        
        if (hasOutgoingConnections) {
          // Remove the END marker and restore the simulation state
          const newPath = simulationPath.slice(0, -1); // Remove END marker
          const lastItem = newPath[newPath.length - 1];
          
          // Update the last item's status to 'current'
          newPath[newPath.length - 1] = { ...lastItem, status: 'current' };
          
          setSimulationPath(newPath);
          setCurrentStep(lastRealStep);
          setIsComplete(false);
          updateNextSteps(lastRealStep);
        }
      }
    }
  }, [steps, connections]);

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
   * Handles selection of a next step in the simulation
   * @param {'success' | 'failure'} type - Type of choice made
   * @param {string} targetStepId - ID of the target step to transition to
   */
  const handleChoice = (type, targetStepId) => {
    // Find the specific connection from current step to the target step
    const selectedConnection = connections.find(
      (conn) => conn.fromStepId === currentStep.id && 
                conn.type === type && 
                conn.toStepId === targetStepId
    );

    if (!selectedConnection) {
      toast.error('Connection not found');
      return;
    }

    // Update current step in path to show success/failure
    const updatedPath = [...simulationPath];
    const currentStepIndex = updatedPath.findIndex(item => item.step.id === currentStep.id);
    if (currentStepIndex !== -1) {
      updatedPath[currentStepIndex] = {
        ...updatedPath[currentStepIndex],
        status: type
      };
    }

    const nextStep = steps.find((s) => s.id === targetStepId);
    if (!nextStep) {
      toast.error('Target step not found');
      return;
    }
    
    // If the next step is a sub-step, ensure its parent is in the path
    if (nextStep.parentId) {
      const parentStep = steps.find(s => s.id === nextStep.parentId);
      const parentInPath = updatedPath.some(item => item.step.id === nextStep.parentId);
      
      // If parent exists but is not in the path, add it first
      if (parentStep && !parentInPath) {
        updatedPath.push({
          step: parentStep,
          status: 'success' // Parent is implicitly successful if we're navigating to its child
        });
      }
    }
    
    // Add the next step to the path
    updatedPath.push({ step: nextStep, status: 'current' });

    // Check if the next step has any outgoing connections
    const hasOutgoingConnections = connections.some(
      conn => conn.fromStepId === nextStep.id
    );

    // Enable auto-scroll for simulation navigation
    shouldAutoScrollRef.current = true;
    
    if (!hasOutgoingConnections) {
      // If no outgoing connections, mark as complete
      updatedPath.push({ 
        step: { 
          id: 'end', 
          name: 'END',
          description: 'Simulation complete'
        }, 
        status: 'end' 
      });
      
      setSimulationPath(updatedPath);
      setCurrentStep(null);
      setIsComplete(true);
      setNextSteps({ success: [], failure: [] });
    } else {
      // Normal path progression
      setSimulationPath(updatedPath);
      setCurrentStep(nextStep);
      
      // Update preview of next steps
      updateNextSteps(nextStep);
    }
  };

  /**
   * Resets the simulation to its initial state
   * Returns to the starting step and clears the path
   * @param {boolean} [selectNewStart=false] - Whether to show the start selector again
   */
  const handleReset = (selectNewStart = false) => {
    if (selectNewStart) {
      setShowStartSelector(true);
      setCurrentStep(null);
      setSimulationPath([]);
      setIsComplete(false);
      setNextSteps({ success: [], failure: [] });
      return;
    }
    
    const startStep = steps.find((step) => step.id === selectedStartStepId);
    if (startStep) {
      setCurrentStep(startStep);
      setSimulationPath([{ step: startStep, status: 'current' }]);
      setIsComplete(false);
      updateNextSteps(startStep);
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
    setIsComplete(false); // Ensure the simulation is marked as not complete
    
    // Update the next steps based on the new current step
    updateNextSteps(lastItem.step);
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

      // Create a clone of the element to avoid modifying the actual DOM
      const clone = element.cloneNode(true);
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.appendChild(clone);
      document.body.appendChild(container);

      // Prepare the clone for export
      clone.style.width = 'auto';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.maxWidth = 'none';
      clone.style.position = 'relative';
      clone.style.overflow = 'visible';
      clone.style.padding = '50px';
      clone.style.background = '#ffffff';
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';

      // If in stair view, ensure all content is visible
      if (stairView) {
        // Find the maximum step level to calculate required width
        let maxStepLevel = 0;
        simulationPath.forEach(({ step }, index) => {
          const level = getStepLevel(step, index);
          if (level > maxStepLevel) maxStepLevel = level;
        });
        
        // Set minimum width to accommodate the most indented step
        const minWidth = (maxStepLevel * 30) + 1000; // Increased base width for larger diagrams
        clone.style.minWidth = `${minWidth}px`;
        
        // Ensure all step cards are fully visible
        clone.querySelectorAll('.stair-step').forEach(stepEl => {
          const isSubStep = stepEl.classList.contains('sub-step-container');
          stepEl.style.width = isSubStep ? '37.5%' : '50%';
          stepEl.style.marginLeft = stepEl.style.getPropertyValue('--step-level') * 30 + 'px';
        });
        
        // Ensure all arrows are visible
        clone.querySelectorAll('.stair-arrow').forEach(arrowEl => {
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

      // Remove dark mode classes in clone
      clone.querySelectorAll('[class*="dark:"]').forEach(el => {
        el.className = el.className.split(' ').filter(c => !c.startsWith('dark:')).join(' ');
      });

      // Make all SVGs visible
      clone.querySelectorAll('svg').forEach(svg => {
        svg.style.overflow = 'visible';
        svg.style.visibility = 'visible';
      });

      // Make all step cards visible
      clone.querySelectorAll('.step-card').forEach(card => {
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.transform = 'none';
        card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      });

      // Set up html2canvas options with bigger canvas dimensions
      const options = {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: clone.scrollWidth + 100, // Add extra width padding
        height: clone.scrollHeight + 100, // Add extra height padding
        windowWidth: clone.scrollWidth + 100,
        windowHeight: clone.scrollHeight + 100,
      };

      // Create canvas and download
      const canvas = await html2canvas(clone, options);
      
      // Clean up the temporary DOM elements
      document.body.removeChild(container);
      document.head.removeChild(animationStyles);

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

  /**
   * Handlers for inline editing
   */
  const handleToggleExpand = (stepId) => {
    // Auto-collapse: if expanding a new step, collapse the current one
    setExpandedStepId(stepId);
  };

  const handleSaveStep = (stepId, updates) => {
    onUpdateStep(stepId, updates);
    
    // Update simulation path if this step is in it
    const updatedPath = simulationPath.map(item => {
      if (item.step.id === stepId) {
        return {
          ...item,
          step: { ...item.step, ...updates }
        };
      }
      return item;
    });
    setSimulationPath(updatedPath);
    
    // Update current step if it's the one being edited
    if (currentStep?.id === stepId) {
      setCurrentStep({ ...currentStep, ...updates });
    }
  };

  const handleDeleteStep = (stepId) => {
    if (onRemoveStep) {
      onRemoveStep(stepId);
      
      // Remove from simulation path if present
      const updatedPath = simulationPath.filter(item => item.step.id !== stepId);
      setSimulationPath(updatedPath);
      
      // If we deleted the current step, reset
      if (currentStep?.id === stepId && updatedPath.length > 0) {
        const lastItem = updatedPath[updatedPath.length - 1];
        setCurrentStep(lastItem.step);
        updateNextSteps(lastItem.step);
      }
    }
  };

  const handleCreateStepComplete = (stepData) => {
    const newStepId = onAddStep(stepData);
    setCreatorPosition(null);
    return newStepId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {showStartSelector ? (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Starting Step</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Choose which step to start the simulation from:
              </div>
              <select
                value={selectedStartStepId}
                onChange={(e) => setSelectedStartStepId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-800 px-3 text-sm"
              >
                <option value="">Select a step...</option>
                
                {/* Group 1: Root-level steps (no parentId) */}
                <optgroup label="Root Steps">
                  {steps
                    .filter(step => !step.parentId)
                    .map(step => (
                      <option key={step.id} value={step.id}>
                        {step.name}
                      </option>
                    ))}
                </optgroup>
                
                {/* Group 2: Sub-steps (with parentId) - only show if there are any */}
                {steps.some(step => step.parentId) && (
                  <optgroup label="Sub Steps">
                    {steps
                      .filter(step => step.parentId)
                      .map(step => {
                        // Find the parent step to add its name for context
                        const parentStep = steps.find(s => s.id === step.parentId);
                        const parentName = parentStep ? parentStep.name : 'Unknown parent';
                        
                        return (
                          <option key={step.id} value={step.id}>
                            {step.name} (in {parentName})
                          </option>
                        );
                      })}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={startSimulation} 
              disabled={!selectedStartStepId}
              className="w-full sm:w-auto"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="w-[90vw] h-[90vh] max-w-[95%] max-h-[95%] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex justify-between items-center">
              <DialogTitle>Flow Simulation</DialogTitle>
            </div>
            
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
                onClick={() => handleReset(false)}
                disabled={simulationPath.length <= 1}
                title="Reset simulation"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-grow overflow-hidden flex flex-col">
            {/* Simulation Content */}
            <div 
              ref={simulationContainerRef}
              className={`simulation-content flex-grow overflow-auto p-6 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50 ${stairView ? 'stair-container' : ''}`}
            >
              <div className={`flex flex-col gap-4 pb-12 ${stairView ? 'w-full' : 'max-w-4xl mx-auto'}`}>
                {/* Main simulation path */}
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
                    // Use enhanced step card if editing is enabled
                    if (onUpdateStep && onAddConnection && status !== 'end') {
                      return (
                        <div 
                          key={`${step.id}-${index}`} 
                          className={`step-item ${isSubStep ? "sub-step-container" : ""} ${stairView ? 'stair-step' : ''}`}
                          style={stairView ? {'--step-level': stepLevel} : {}}
                        >
                          <SimulationStepCard
                            step={step}
                            status={status}
                            isSubStep={isSubStep}
                            isExpanded={expandedStepId === step.id}
                            onToggleExpand={handleToggleExpand}
                            onSave={handleSaveStep}
                            onDelete={handleDeleteStep}
                            allSteps={steps}
                            connections={connections}
                            onAddConnection={onAddConnection}
                            onRemoveConnection={onRemoveConnection}
                            onAddStep={onAddStep}
                          />
                        </div>
                      );
                    }
                    
                    // Fallback to static card
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
                          <div className="flex items-center gap-3 p-4">
                            <div className={`status-icon ${status} transition-all duration-300`}>
                              {getStatusIcon(status)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200">
                                {step.name}
                              </h3>
                              {step.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Inline Step Creator at End */}
                {creatorPosition === 'end' && (
                  <InlineStepCreator
                    position="end"
                    currentStep={currentStep}
                    allSteps={steps}
                    onCreate={handleCreateStepComplete}
                    onCancel={() => setCreatorPosition(null)}
                    onAddConnection={onAddConnection}
                  />
                )}

                {/* Render next possible steps */}
                {!isComplete && currentStep && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Next Steps</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Success Paths Section */}
                      {nextSteps.success.length > 0 && (
                        <div className="next-steps-section">
                          <div className="flex items-center mb-3">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                              Success {nextSteps.success.length > 1 ? 'Paths' : 'Path'}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {nextSteps.success.map((successStep) => (
                              <Card 
                                key={successStep.id}
                                className="
                                  border-green-200 bg-green-50 dark:bg-green-900/30 
                                  hover:bg-green-100 dark:hover:bg-green-900/50
                                  cursor-pointer transform transition-all duration-200 hover:scale-[1.02]
                                "
                                onClick={() => handleChoice('success', successStep.id)}
                              >
                                <div className="flex items-center gap-3 p-4">
                                  <div className="status-icon preview">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                                      {successStep.name}
                                    </h3>
                                    {successStep.description && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {successStep.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Failure Paths Section */}
                      {nextSteps.failure.length > 0 && (
                        <div className="next-steps-section">
                          <div className="flex items-center mb-3">
                            <XCircle className="h-5 w-5 mr-2 text-red-500" />
                            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                              Failure {nextSteps.failure.length > 1 ? 'Paths' : 'Path'}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {nextSteps.failure.map((failureStep) => (
                              <Card 
                                key={failureStep.id}
                                className="
                                  border-red-200 bg-red-50 dark:bg-red-900/30
                                  hover:bg-red-100 dark:hover:bg-red-900/50
                                  cursor-pointer transform transition-all duration-200 hover:scale-[1.02]
                                "
                                onClick={() => handleChoice('failure', failureStep.id)}
                              >
                                <div className="flex items-center gap-3 p-4">
                                  <div className="status-icon preview">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                                      {failureStep.name}
                                    </h3>
                                    {failureStep.description && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {failureStep.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* No paths message */}
                      {!nextSteps.success.length && !nextSteps.failure.length && (
                        <div className="col-span-2 text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-gray-500 dark:text-gray-400 italic">
                            No next steps available from this point
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulation Complete */}
            {isComplete && (
              <Card className="mt-8 p-6 bg-white dark:bg-gray-800 border-green-200 dark:border-green-800 end-card max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4 bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200">Simulation Complete</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        The flow has reached an end point successfully.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleExportImage}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Export Image
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReset(false)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Floating Add Step Button */}
            {onAddStep && !isComplete && !creatorPosition && (
              <Button
                onClick={() => setCreatorPosition('end')}
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-10"
                title="Add new step"
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </div>
        </DialogContent>
      )}
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
  onClose: PropTypes.func.isRequired,
  onAddStep: PropTypes.func,
  onUpdateStep: PropTypes.func,
  onRemoveStep: PropTypes.func,
  onAddConnection: PropTypes.func,
  onRemoveConnection: PropTypes.func
};

export default SimulationModal;
