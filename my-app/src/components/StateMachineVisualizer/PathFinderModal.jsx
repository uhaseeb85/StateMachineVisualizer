/**
 * PathFinderModal Component
 * 
 * A modal component that provides advanced path finding capabilities in the state machine.
 * Features include:
 * - Finding paths to end states
 * - Finding paths between specific states
 * - Finding paths through intermediate states
 * - Detecting loops in the state machine
 * - Exporting results to HTML
 * - Pagination for large result sets
 * 
 * The component uses depth-first search (DFS) with cycle detection for path finding
 * and provides visual feedback during the search process.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PathFinderModal = ({ states, onClose }) => {
  // State Selection
  const [selectedStartState, setSelectedStartState] = useState('');
  const [selectedEndState, setSelectedEndState] = useState('');
  const [selectedIntermediateState, setSelectedIntermediateState] = useState('');
  const [searchMode, setSearchMode] = useState('endStates');

  // Search State
  const [paths, setPaths] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const shouldContinueRef = useRef(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pathsPerPage = 250;

  /**
   * Core path finding algorithm using depth-first search
   * Supports finding paths to end states, between states, and through intermediate states
   */
  const findPaths = useCallback(async (startStateId, endStateId = null, intermediateStateId = null) => {
    const startState = states.find(s => s.id === startStateId);
    if (!startState) {
      toast.error('Start state not found');
      return;
    }

    let allPaths = [];
    let visited = new Set();
    let totalStates = states.length;
    let processedStates = 0;

    /**
     * Recursive DFS function for path finding
     * @param {Object} currentState - Current state in the traversal
     * @param {Array} currentPath - Current path being explored
     * @param {Array} rulePath - Rules used in the current path
     * @param {Array} failedRulesPath - Failed rules at each step
     * @param {boolean} foundIntermediate - Whether intermediate state was found (if required)
     */
    const dfs = async (currentState, currentPath = [], rulePath = [], failedRulesPath = [], foundIntermediate = false) => {
      if (!shouldContinueRef.current) {
        throw new Error('Search cancelled');
      }

      currentPath.push(currentState.name);
      visited.add(currentState.id);
      
      processedStates++;
      setProgress(Math.min((processedStates / (totalStates * 2)) * 100, 99));

      // Add delay to prevent UI freezing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if current path is valid based on search mode
      if (intermediateStateId) {
        if (currentState.id === endStateId && foundIntermediate) {
          const newPath = {
            states: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          };
          allPaths.push(newPath);
          setPaths([...allPaths]);
        }
      } else if (endStateId) {
        if (currentState.id === endStateId) {
          const newPath = {
            states: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          };
          allPaths.push(newPath);
          setPaths([...allPaths]);
        }
      } else {
        if (currentState.rules.length === 0) {
          const newPath = {
            states: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          };
          allPaths.push(newPath);
          setPaths([...allPaths]);
        }
      }

      // Explore next states
      for (let i = 0; i < currentState.rules.length; i++) {
        const rule = currentState.rules[i];
        const nextState = states.find(s => s.id === rule.nextState);
        if (nextState && !currentPath.includes(nextState.name)) {
          const hasFoundIntermediate = foundIntermediate || nextState.id === intermediateStateId;
          await dfs(
            nextState, 
            [...currentPath], 
            [...rulePath, rule.condition],
            [...failedRulesPath, currentState.rules.slice(0, i).map(r => r.condition)],
            hasFoundIntermediate
          );
        }
      }

      visited.delete(currentState.id);
    };

    try {
      setPaths([]);
      setIsSearching(true);
      await dfs(startState);
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
  }, [states]);

  /**
   * Initiates path finding based on current search parameters
   */
  const handleFindPaths = async () => {
    if (!selectedStartState) return;
    
    try {
      shouldContinueRef.current = true;
      if (searchMode === 'intermediateState') {
        await findPaths(selectedStartState, selectedEndState, selectedIntermediateState);
      } else {
        await findPaths(selectedStartState, selectedEndState);
      }
    } catch (error) {
      console.error('Path finding error:', error);
      toast.error('An error occurred while finding paths');
    }
  };

  /**
   * Cancels the current search operation
   */
  const handleCancel = () => {
    shouldContinueRef.current = false;
    setIsSearching(false);
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

  /**
   * Detects loops in the state machine using DFS with cycle detection
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
       * DFS function for loop detection
       */
      const dfs = async (currentState, path = [], rulePath = [], failedRulesPath = []) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        if (stack.has(currentState.id)) {
          const loopStartIndex = path.findIndex(p => p === currentState.name);
          
          // Create the complete loop cycle
          const loopStates = [...path.slice(loopStartIndex), currentState.name];
          const loopRules = [...rulePath.slice(loopStartIndex)];
          const loopFailedRules = [...failedRulesPath.slice(loopStartIndex)];

          // Find rules that complete the loop
          const lastState = states.find(s => s.name === path[path.length - 1]);
          if (lastState) {
            const rulesBackToStart = lastState.rules
              .filter(rule => rule.nextState === states.find(s => s.name === loopStates[0])?.id)
              .map(rule => rule.condition);
            
            if (rulesBackToStart.length > 0) {
              loopRules.push(rulesBackToStart[0]);
              loopFailedRules.push(lastState.rules
                .slice(0, lastState.rules.findIndex(r => rulesBackToStart.includes(r.condition)))
                .map(r => r.condition)
              );
            }
          }

          loops.push({
            states: loopStates,
            rules: loopRules,
            failedRules: loopFailedRules
          });
          
          setPaths([...loops]);
          return;
        }

        visited.add(currentState.id);
        stack.add(currentState.id);
        path.push(currentState.name);

        await new Promise(resolve => setTimeout(resolve, 50));

        for (const rule of currentState.rules) {
          const nextState = states.find(s => s.id === rule.nextState);
          if (nextState) {
            await dfs(
              nextState,
              [...path],
              [...rulePath, rule.condition],
              [...failedRulesPath, []]
            );
          }
        }

        stack.delete(currentState.id);
      };

      // Search for loops starting from each state
      for (const state of states) {
        visited.clear();
        stack.clear();
        await dfs(state);
        setProgress((states.indexOf(state) + 1) / states.length * 100);
      }

      if (loops.length === 0) {
        toast.info('No loops found in the state machine.');
      } else {
        toast.success(`Found ${loops.length} loop${loops.length === 1 ? '' : 's'} in the state machine.`);
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

  /**
   * Switches between different search modes
   */
  const handleModeSwitch = (newMode) => {
    setSearchMode(newMode);
    setSelectedEndState('');
    setSelectedIntermediateState('');
    setPaths([]);
    setIsSearching(false);
    setProgress(0);
    shouldContinueRef.current = true;
  };

  /**
   * Exports results to an HTML file with styling
   */
  const exportResults = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>State Machine Paths</title>
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
        <h1>State Machine Paths</h1>
        ${currentPaths.map((path, index) => `
          <div class="path">
            <div class="path-number">${index + 1}</div>
            ${path.states.map((state, stateIndex) => `
              <span class="state">${state}</span>
              ${stateIndex < path.states.length - 1 ? `
                <span class="arrow">→</span>
                <div class="rules-container">
                  ${path.failedRules[stateIndex]?.length > 0 ? 
                    path.failedRules[stateIndex].map(rule => 
                      `<span class="failed-rule">❌ ${rule.replace('LR', 'R')}</span>`
                    ).join('') : ''
                  }
                  <span class="success-rule">✓ ${path.rules[stateIndex]}</span>
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
    const defaultName = `state-machine-paths-${new Date().toISOString().slice(0, 10)}`;
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[1200px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Find Paths</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportResults}
                disabled={currentPaths.length === 0}
              >
                Export Results
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Experimental Feature: Find all possible paths between states.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
              <Button
                onClick={() => handleModeSwitch('endStates')}
                variant={searchMode === 'endStates' ? 'default' : 'outline'}
                className={searchMode === 'endStates' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Find Paths to End States
              </Button>
              <Button
                onClick={() => handleModeSwitch('specificState')}
                variant={searchMode === 'specificState' ? 'default' : 'outline'}
                className={searchMode === 'specificState' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Find Paths Between States
              </Button>
              <Button
                onClick={() => handleModeSwitch('intermediateState')}
                variant={searchMode === 'intermediateState' ? 'default' : 'outline'}
                className={searchMode === 'intermediateState' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Find Paths Through State
              </Button>
              <Button
                onClick={() => {
                  handleModeSwitch('detectLoops');
                  handleDetectLoops();
                }}
                variant={searchMode === 'detectLoops' ? 'default' : 'outline'}
                className={searchMode === 'detectLoops' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Detect Loops
              </Button>
            </div>

            {/* State Selection */}
            <div className="flex gap-4 items-center">
              <select
                value={selectedStartState}
                onChange={(e) => setSelectedStartState(e.target.value)}
                className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                         text-sm dark:bg-gray-700 dark:text-white px-3"
              >
                <option value="">Select Starting State</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>

              {(searchMode === 'specificState' || searchMode === 'intermediateState') && (
                <select
                  value={selectedEndState}
                  onChange={(e) => setSelectedEndState(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           text-sm dark:bg-gray-700 dark:text-white px-3"
                >
                  <option value="">Select Target State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              )}

              {searchMode === 'intermediateState' && (
                <select
                  value={selectedIntermediateState}
                  onChange={(e) => setSelectedIntermediateState(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           text-sm dark:bg-gray-700 dark:text-white px-3"
                >
                  <option value="">Select Intermediate State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              )}

              <Button
                onClick={handleFindPaths}
                disabled={!selectedStartState || (searchMode === 'specificState' && !selectedEndState) || isSearching}
                className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Find Paths
              </Button>

              {isSearching && (
                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  className="whitespace-nowrap"
                >
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
                  <div 
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {path.states.map((state, stateIndex) => (
                        <React.Fragment key={stateIndex}>
                          <span className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-md
                                       border border-gray-200 dark:border-gray-600">
                            {state}
                          </span>
                          {stateIndex < path.states.length - 1 && (
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <div className="space-y-1">
                                {path.failedRules[stateIndex]?.length > 0 && (
                                  <div className="space-y-1">
                                    {path.failedRules[stateIndex].map((rule, ruleIndex) => (
                                      <span key={ruleIndex} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 
                                                       text-red-700 dark:text-red-300 rounded block">
                                        ❌ {rule}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 
                                              text-green-700 dark:text-green-300 rounded block">
                                  ✓ {path.rules[stateIndex]}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Path length: {path.states.length} states, {path.rules.length} transitions
                    </div>
                  </div>
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
            {paths.length === 0 && (selectedStartState && (searchMode === 'endStates' || selectedEndState)) && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No paths found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PathFinderModal.propTypes = {
  // Array of state objects
  states: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rules: PropTypes.arrayOf(PropTypes.shape({
      nextState: PropTypes.string.isRequired,
      condition: PropTypes.string.isRequired
    })).isRequired
  })).isRequired,
  // Modal close handler
  onClose: PropTypes.func.isRequired
};

export default PathFinderModal;
