/**
 * PathFinderModal Component
 * A modal dialog that provides path finding functionality in a flow diagram.
 * Features include:
 * - Finding paths between selected start and end steps
 * - Finding paths through intermediate steps
 * - Detecting loops in the flow
 * - Exporting results
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
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
  Search,
  X,
  Loader2,
  Route,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * @typedef {Object} Step
 * @property {string} id - Unique identifier for the step
 * @property {string} name - Display name of the step
 * @property {string} [parentId] - ID of parent step if this is a sub-step
 */

/**
 * @typedef {Object} Connection
 * @property {string} fromStepId - ID of the source step
 * @property {string} toStepId - ID of the target step
 * @property {string} type - Type of connection ('success' or 'failure')
 */

/**
 * PathFinderModal Component
 * @param {Object} props
 * @param {Step[]} props.steps - Array of steps in the flow diagram
 * @param {Connection[]} props.connections - Array of connections between steps
 * @param {Function} props.onClose - Callback function when modal is closed
 */
const PathFinderModal = ({ steps, connections, onClose }) => {
  // Modal state
  const [isOpen, setIsOpen] = useState(true);
  
  /**
   * State for step selection and search mode
   * searchMode can be: 'endSteps', 'specificEnd', or 'intermediateStep'
   */
  const [selectedStartStep, setSelectedStartStep] = useState('');
  const [selectedEndStep, setSelectedEndStep] = useState('');
  const [selectedIntermediateStep, setSelectedIntermediateStep] = useState('');
  const [searchMode, setSearchMode] = useState('endSteps');

  // Search state management
  const [paths, setPaths] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const shouldContinueRef = useRef(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pathsPerPage = 250;

  /**
   * Handles modal close and triggers parent callback
   */
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  /**
   * Core path finding algorithm using depth-first search
   * @param {string} startStepId - ID of the starting step
   * @param {string} [endStepId] - Optional ID of target end step
   * @param {string} [intermediateStepId] - Optional ID of required intermediate step
   */
  const findPaths = useCallback(async (startStepId, endStepId = null, intermediateStepId = null) => {
    try {
      const startStep = steps.find(s => s.id === startStepId);
      if (!startStep) {
        toast.error('Start step not found');
        return;
      }

      let allPaths = [];
      let processedSteps = 0;
      const totalSteps = steps.length;
      const maxPathLength = totalSteps * 2; // Prevent infinite loops while allowing for revisits

      setPaths([]);
      setIsSearching(true);
      setProgress(0);

      /**
       * Recursive DFS function to find all possible paths
       * @param {Step} currentStep - Current step being processed
       * @param {Array} currentPath - Current path being built
       * @param {Array} rulePath - Path of rules/connections taken
       * @param {number} depth - Current recursion depth
       */
      const dfs = async (currentStep, currentPath = [], rulePath = [], depth = 0) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        // Prevent infinite loops by limiting path length
        if (depth > maxPathLength) {
          return;
        }

        // Update progress
        processedSteps++;
        const progressValue = Math.min((processedSteps / (totalSteps * 2)) * 100, 99);
        setProgress(progressValue);

        // Add delay to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 10));

        const newPath = [...currentPath, {
          id: currentStep.id,
          name: currentStep.name,
          isSubStep: !!currentStep.parentId
        }];

        // Check if we've reached our target based on search mode
        if (endStepId) {
          if (currentStep.id === endStepId) {
            if (!intermediateStepId || newPath.some(step => step.id === intermediateStepId)) {
              allPaths.push({
                steps: newPath,
                rules: [...rulePath]
              });
              setPaths([...allPaths]);
            }
          }
        } else {
          // For finding paths to end steps, check if this is an end step
          const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
          if (outgoingConnections.length === 0) {
            allPaths.push({
              steps: newPath,
              rules: [...rulePath]
            });
            setPaths([...allPaths]);
          }
        }

        // Get all possible next steps
        const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
        
        for (const connection of outgoingConnections) {
          try {
            const nextStep = steps.find(s => s.id === connection.toStepId);
            if (!nextStep) continue;

            // Check for cycles in the current path
            const cycleCount = newPath.filter(step => step.id === nextStep.id).length;
            if (cycleCount >= 2) continue; // Allow revisiting a step once but prevent infinite loops

            // If the next step is a sub-step, make sure we're coming from its parent
            if (nextStep.parentId && nextStep.parentId !== currentStep.id) {
              const parent = steps.find(s => s.id === nextStep.parentId);
              if (parent && !newPath.some(step => step.id === parent.id)) {
                continue; // Skip if we haven't visited the parent step
              }
            }

            await dfs(
              nextStep,
              newPath,
              [...rulePath, { type: connection.type, from: currentStep.name, to: nextStep.name }],
              depth + 1
            );
          } catch (error) {
            console.error('Error processing connection:', error);
            continue; // Continue with next connection if one fails
          }
        }
      };

      await dfs(startStep);
      setProgress(100);

      if (allPaths.length === 0) {
        toast.info('No paths found for the selected criteria.');
      } else {
        toast.success(`Found ${allPaths.length} possible path${allPaths.length === 1 ? '' : 's'}.`);
      }
    } catch (error) {
      if (error.message === 'Search cancelled') {
        console.log('Search was cancelled');
        toast.info('Search cancelled');
      } else {
        console.error('Error during path finding:', error);
        toast.error(`Error during path finding: ${error.message}`);
      }
    } finally {
      setIsSearching(false);
      setProgress(0);
    }
  }, [steps, connections]);

  /**
   * Initiates path finding based on current selection and mode
   */
  const handleFindPaths = async () => {
    if (!selectedStartStep) return;
    
    try {
      shouldContinueRef.current = true;
      if (searchMode === 'intermediateStep') {
        await findPaths(selectedStartStep, selectedEndStep, selectedIntermediateStep);
      } else {
        await findPaths(selectedStartStep, selectedEndStep);
      }
    } catch (error) {
      console.error('Path finding error:', error);
      toast.error('An error occurred while finding paths');
    }
  };

  /**
   * Cancels ongoing path finding operation
   */
  const handleCancel = () => {
    shouldContinueRef.current = false;
    setIsSearching(false);
  };

  /**
   * Detects loops in the flow diagram using DFS
   * A loop is detected when a step is revisited in the current path
   */
  const handleDetectLoops = async () => {
    try {
      setIsSearching(true);
      setPaths([]);
      shouldContinueRef.current = true;
      setProgress(0);

      const loops = [];
      const visited = new Set();
      const stack = new Set();

      /**
       * DFS implementation for loop detection
       * @param {Step} currentStep - Current step being processed
       * @param {Array} path - Current path being explored
       * @param {Array} rulePath - Path of rules/connections taken
       * @param {Array} failedRulesPath - Path of failed rules
       */
      const dfs = async (currentStep, path = [], rulePath = [], failedRulesPath = []) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        if (stack.has(currentStep.id)) {
          const loopStartIndex = path.findIndex(p => p === currentStep.name);
          const loopSteps = [...path.slice(loopStartIndex), currentStep.name];
          const loopRules = [...rulePath.slice(loopStartIndex)];
          const loopFailedRules = [...failedRulesPath.slice(loopStartIndex)];

          loops.push({
            steps: loopSteps,
            rules: loopRules,
            failedRules: loopFailedRules
          });
          
          setPaths([...loops]);
          return;
        }

        visited.add(currentStep.id);
        stack.add(currentStep.id);
        path.push(currentStep.name);

        await new Promise(resolve => setTimeout(resolve, 50));

        const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
        for (const connection of outgoingConnections) {
          const nextStep = steps.find(s => s.id === connection.toStepId);
          if (nextStep) {
            await dfs(
              nextStep,
              [...path],
              [...rulePath, connection.type],
              [...failedRulesPath, []]
            );
          }
        }

        stack.delete(currentStep.id);
      };

      for (const step of steps) {
        visited.clear();
        stack.clear();
        await dfs(step);
        setProgress((steps.indexOf(step) + 1) / steps.length * 100);
      }

      if (loops.length === 0) {
        toast.info('No loops found in the flow diagram.');
      } else {
        toast.success(`Found ${loops.length} loop${loops.length === 1 ? '' : 's'} in the flow diagram.`);
      }

    } catch (error) {
      if (error.message === 'Search cancelled') {
        console.log('Search was cancelled');
      } else {
        console.error('Error during loop detection:', error);
        toast.error('An error occurred while detecting loops');
      }
    } finally {
      setIsSearching(false);
      setProgress(100);
    }
  };

  const handleModeSwitch = (newMode) => {
    setSearchMode(newMode);
    setSelectedEndStep('');
    setSelectedIntermediateStep('');
    setPaths([]);
    setIsSearching(false);
    setProgress(0);
    shouldContinueRef.current = true;
  };

  const exportResults = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Flow Diagram Paths</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 95%;
            margin: 20px auto;
            padding: 20px;
            font-size: 75%;
          }
          .path {
            background-color: #f9fafb;
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 8px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            position: relative;
          }
          .path-number {
            position: absolute;
            top: -10px;
            left: -10px;
            background-color: #4b5563;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          }
          .state {
            background-color: white;
            padding: 6px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            display: inline-block;
            white-space: nowrap;
          }
          .arrow {
            color: #9ca3af;
            margin: 0 4px;
          }
          .rules-container {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 4px;
            align-items: center;
          }
          .success-rule {
            background-color: #d1fae5;
            color: #047857;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 2px 0;
            display: inline-block;
            white-space: nowrap;
          }
          .failed-rule {
            background-color: #fee2e2;
            color: #b91c1c;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 2px 0;
            display: inline-block;
            white-space: nowrap;
          }
          h1 {
            font-size: 1.5em;
          }
        </style>
      </head>
      <body>
        <h1>Flow Diagram Paths</h1>
        ${currentPaths.map((path, index) => `
          <div class="path">
            <div class="path-number">${index + 1}</div>
            ${path.steps.map((step, stepIndex) => `
              <span class="state">${step}</span>
              ${stepIndex < path.steps.length - 1 ? `
                <span class="arrow">→</span>
                <div class="rules-container">
                  ${path.failedRules[stepIndex]?.length > 0 ? 
                    path.failedRules[stepIndex].map(rule => 
                      `<span class="failed-rule">❌ ${rule}</span>`
                    ).join('') : ''
                  }
                  <span class="success-rule">✓ ${path.rules[stepIndex]}</span>
                </div>
                <span class="arrow">→</span>
              ` : ''}
            `).join('')}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const defaultName = `flow-diagram-paths-${new Date().toISOString().slice(0, 10)}`;
    const fileName = window.prompt('Enter file name:', defaultName);
    
    if (!fileName) {
      URL.revokeObjectURL(url);
      return;
    }
    
    const finalFileName = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    link.href = url;
    link.download = finalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate pagination values
  const indexOfLastPath = currentPage * pathsPerPage;
  const indexOfFirstPath = indexOfLastPath - pathsPerPage;
  const currentPaths = paths.slice(indexOfFirstPath, indexOfLastPath);
  const totalPages = Math.ceil(paths.length / pathsPerPage);

  // Reset pagination when paths change
  useEffect(() => {
    setCurrentPage(1);
  }, [paths]);

  // Update the path rendering in the return section
  const renderPath = (path) => (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {path.steps.map((step, stepIndex) => (
        <React.Fragment key={stepIndex}>
          <span className={`px-3 py-1.5 rounded-md border
            ${step.isSubStep 
              ? 'bg-green-50 dark:bg-green-900/30 border-dashed' 
              : 'bg-blue-50 dark:bg-blue-900/30 border-solid'}`}>
            {step.name}
          </span>
          {stepIndex < path.steps.length - 1 && (
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="space-y-1">
                <span className={`px-2 py-1 rounded block
                  ${path.rules[stepIndex].type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {path.rules[stepIndex].type === 'success' ? '✓' : '❌'} {path.rules[stepIndex].type}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1200px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Find Paths</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportResults}
                disabled={currentPaths.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
              <Button
                onClick={() => handleModeSwitch('endSteps')}
                variant={searchMode === 'endSteps' ? 'default' : 'outline'}
                className={searchMode === 'endSteps' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Route className="h-4 w-4 mr-2" />
                Find Paths to End Steps
              </Button>
              <Button
                onClick={() => handleModeSwitch('specificStep')}
                variant={searchMode === 'specificStep' ? 'default' : 'outline'}
                className={searchMode === 'specificStep' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Find Paths Between Steps
              </Button>
              <Button
                onClick={() => handleModeSwitch('intermediateStep')}
                variant={searchMode === 'intermediateStep' ? 'default' : 'outline'}
                className={searchMode === 'intermediateStep' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Search className="h-4 w-4 mr-2" />
                Find Paths Through Step
              </Button>
              <Button
                    onClick={() => {
                  handleModeSwitch('detectLoops');
                  handleDetectLoops();
                }}
                variant={searchMode === 'detectLoops' ? 'default' : 'outline'}
                className={searchMode === 'detectLoops' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Route className="h-4 w-4 mr-2" />
                Detect Loops
              </Button>
            </div>

            {/* Step Selection */}
            <div className="flex gap-4 items-center">
              <select
                value={selectedStartStep}
                onChange={(e) => setSelectedStartStep(e.target.value)}
                className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                         text-sm dark:bg-gray-700 dark:text-white px-3"
              >
                <option value="">Select Starting Step</option>
                {steps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>

              {(searchMode === 'specificStep' || searchMode === 'intermediateStep') && (
                <select
                  value={selectedEndStep}
                  onChange={(e) => setSelectedEndStep(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           text-sm dark:bg-gray-700 dark:text-white px-3"
                >
                  <option value="">Select Target Step</option>
                  {steps.map(step => (
                    <option key={step.id} value={step.id}>
                      {step.name}
                    </option>
                  ))}
                </select>
              )}

              {searchMode === 'intermediateStep' && (
                <select
                  value={selectedIntermediateStep}
                  onChange={(e) => setSelectedIntermediateStep(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           text-sm dark:bg-gray-700 dark:text-white px-3"
                >
                  <option value="">Select Intermediate Step</option>
                  {steps.map(step => (
                    <option key={step.id} value={step.id}>
                      {step.name}
                    </option>
                  ))}
                </select>
              )}

              <Button
                onClick={handleFindPaths}
                disabled={!selectedStartStep || (searchMode === 'specificStep' && !selectedEndStep) || isSearching}
                className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Find Paths
              </Button>

              {isSearching && (
                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  className="whitespace-nowrap"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {isSearching && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Searching... {Math.round(progress)}%
                </div>
              </div>
            )}

            {/* Results Section */}
            {paths.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Found {paths.length} possible path{paths.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {currentPaths.map((path, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50"
                  >
                    {renderPath(path)}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Path length: {path.steps.length} steps, {path.rules.length} transitions
                    </div>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-sm"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="text-sm"
                    >
                      Next
                    </Button>
              </div>
                )}
            </div>
          )}

            {/* No Results Message */}
            {paths.length === 0 && (selectedStartStep && (searchMode === 'endSteps' || selectedEndStep)) && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-muted-foreground">
                  No paths found.
              </p>
            </Card>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

PathFinderModal.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })).isRequired,
  connections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
  })).isRequired,
  onClose: PropTypes.func.isRequired
};

export default PathFinderModal; 