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

const PathFinderModal = ({ steps, connections, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // State Selection
  const [selectedStartStep, setSelectedStartStep] = useState('');
  const [selectedEndStep, setSelectedEndStep] = useState('');
  const [selectedIntermediateStep, setSelectedIntermediateStep] = useState('');
  const [searchMode, setSearchMode] = useState('endSteps');

  // Search State
  const [paths, setPaths] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const shouldContinueRef = useRef(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pathsPerPage = 250;

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const findPaths = useCallback(async (startStepId, endStepId = null, intermediateStepId = null) => {
    const startStep = steps.find(s => s.id === startStepId);
    if (!startStep) {
      toast.error('Start step not found');
        return;
    }

    let allPaths = [];
    let visited = new Set();
    let totalSteps = steps.length;
    let processedSteps = 0;

    const dfs = async (currentStep, currentPath = [], rulePath = [], failedRulesPath = [], foundIntermediate = false) => {
      if (!shouldContinueRef.current) {
        throw new Error('Search cancelled');
      }

      currentPath.push(currentStep.name);
      visited.add(currentStep.id);
      
      processedSteps++;
      setProgress(Math.min((processedSteps / (totalSteps * 2)) * 100, 99));

      // Add delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if current path is valid based on search mode
      if (intermediateStepId) {
        if (currentStep.id === endStepId && foundIntermediate) {
          allPaths.push({
            steps: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          });
          setPaths([...allPaths]);
        }
      } else if (endStepId) {
        if (currentStep.id === endStepId) {
          allPaths.push({
            steps: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          });
          setPaths([...allPaths]);
        }
      } else {
        // Check if it's an end step (no outgoing connections)
        const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
        if (outgoingConnections.length === 0) {
          allPaths.push({
            steps: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          });
          setPaths([...allPaths]);
        }
      }

      // Explore next steps
      const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
      for (let i = 0; i < outgoingConnections.length; i++) {
        const connection = outgoingConnections[i];
        const nextStep = steps.find(s => s.id === connection.toStepId);
        if (nextStep && !currentPath.includes(nextStep.name)) {
          const hasFoundIntermediate = foundIntermediate || nextStep.id === intermediateStepId;
          await dfs(
            nextStep,
            [...currentPath],
            [...rulePath, connection.type],
            [...failedRulesPath, outgoingConnections.slice(0, i).map(c => c.type)],
            hasFoundIntermediate
          );
        }
      }

      visited.delete(currentStep.id);
    };

    try {
      setPaths([]);
      setIsSearching(true);
      await dfs(startStep);
      setProgress(100);
    } catch (error) {
      if (error.message === 'Search cancelled') {
        console.log('Search was cancelled');
      } else {
        console.error('Error during search:', error);
        toast.error('An error occurred during path finding');
      }
    } finally {
      setIsSearching(false);
    }
  }, [steps, connections]);

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

  const handleCancel = () => {
    shouldContinueRef.current = false;
    setIsSearching(false);
  };

  const handleDetectLoops = async () => {
    try {
      setIsSearching(true);
      setPaths([]);
      shouldContinueRef.current = true;
      setProgress(0);

      const loops = [];
      const visited = new Set();
      const stack = new Set();

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
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Close
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
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {path.steps.map((step, stepIndex) => (
                        <React.Fragment key={stepIndex}>
                          <span className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-md
                                       border border-gray-200 dark:border-gray-600">
                            {step}
                          </span>
                          {stepIndex < path.steps.length - 1 && (
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <div className="space-y-1">
                                {path.failedRules[stepIndex]?.length > 0 && (
                                  <div className="space-y-1">
                                    {path.failedRules[stepIndex].map((rule, ruleIndex) => (
                                      <span key={ruleIndex} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 
                                                       text-red-700 dark:text-red-300 rounded block">
                                        ❌ {rule}
                                      </span>
                ))}
              </div>
                                )}
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 
                                              text-green-700 dark:text-green-300 rounded block">
                                  ✓ {path.rules[stepIndex]}
                                </span>
            </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
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
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      expectedResponse: PropTypes.string,
    })
  ).isRequired,
  connections: PropTypes.arrayOf(
    PropTypes.shape({
      fromStepId: PropTypes.string.isRequired,
      toStepId: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'failure']).isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PathFinderModal; 