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
import ExcelJS from 'exceljs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Route,
  ArrowRight,
  Search,
  X,
  Loader2,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

const PathFinderModal = ({ states, onClose }) => {
  // Modal state
  const [isOpen, setIsOpen] = useState(true);
  
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
   * Cleanup effect - cancel ongoing searches when component unmounts
   */
  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
    };
  }, []);

  /**
   * Handles modal close and triggers parent callback
   */
  const handleClose = () => {
    shouldContinueRef.current = false;
    setIsOpen(false);
    onClose();
  };

  /**
   * Core path finding algorithm using depth-first search
   * Supports finding paths to end states, between states, and through intermediate states
   */
  const findPaths = useCallback(async (startStateId, endStateId = null, intermediateStateId = null) => {
    try {
      const startState = states.find(s => s.id === startStateId);
      if (!startState) {
        toast.error('Start state not found');
        return;
      }

      // Create state lookup map for O(1) access - PERFORMANCE FIX
      const stateMap = new Map(states.map(s => [s.id, s]));

      let allPaths = [];
      let processedStates = 0;
      const totalStates = states.length;
      const maxPathLength = totalStates * 2; // Prevent infinite loops - DEPTH PROTECTION
      let lastUpdateTime = Date.now();

      setPaths([]);
      setIsSearching(true);
      setProgress(0);

      /**
       * Recursive DFS function for path finding
       * @param {Object} currentState - Current state in the traversal
       * @param {Array} currentPath - Current path being explored
       * @param {Set} visitedInPath - Set of state IDs visited in current path (SCOPE FIX)
       * @param {Array} rulePath - Rules used in the current path
       * @param {Array} failedRulesPath - Failed rules at each step
       * @param {boolean} foundIntermediate - Whether intermediate state was found (if required)
       * @param {number} depth - Current recursion depth (DEPTH PROTECTION)
       */
      const dfs = async (currentState, currentPath = [], visitedInPath = new Set(), rulePath = [], failedRulesPath = [], foundIntermediate = false, depth = 0) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        // Prevent infinite loops by limiting path length - DEPTH PROTECTION
        if (depth > maxPathLength) {
          return;
        }

        // Update progress periodically (batch updates for performance) - PERFORMANCE FIX
        processedStates++;
        const now = Date.now();
        if (now - lastUpdateTime > 100) { // Update every 100ms instead of every 50ms
          const progressValue = Math.min((processedStates / (totalStates * 2)) * 100, 99);
          setProgress(progressValue);
          lastUpdateTime = now;
          // Add small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        const newPath = [...currentPath, currentState.name];
        const newVisitedInPath = new Set(visitedInPath).add(currentState.id);

        // Check if current path is valid based on search mode
        if (intermediateStateId) {
          if (currentState.id === endStateId && foundIntermediate) {
            const newPathObj = {
              states: [...newPath],
              rules: [...rulePath],
              failedRules: [...failedRulesPath]
            };
            allPaths.push(newPathObj);
            // Batch state updates - only update every 10 paths - PERFORMANCE FIX
            if (allPaths.length % 10 === 0) {
              setPaths([...allPaths]);
            }
          }
        } else if (endStateId) {
          if (currentState.id === endStateId) {
            const newPathObj = {
              states: [...newPath],
              rules: [...rulePath],
              failedRules: [...failedRulesPath]
            };
            allPaths.push(newPathObj);
            // Batch state updates - only update every 10 paths - PERFORMANCE FIX
            if (allPaths.length % 10 === 0) {
              setPaths([...allPaths]);
            }
          }
        } else {
          if (currentState.rules.length === 0) {
            const newPathObj = {
              states: [...newPath],
              rules: [...rulePath],
              failedRules: [...failedRulesPath]
            };
            allPaths.push(newPathObj);
            // Batch state updates - only update every 10 paths - PERFORMANCE FIX
            if (allPaths.length % 10 === 0) {
              setPaths([...allPaths]);
            }
          }
        }

        // Explore next states
        for (let i = 0; i < currentState.rules.length; i++) {
          const rule = currentState.rules[i];
          const nextState = stateMap.get(rule.nextState); // O(1) lookup - PERFORMANCE FIX
          
          // Check for cycles using Set.has() - O(1) lookup - ALGORITHM FIX
          if (nextState && !newVisitedInPath.has(nextState.id)) {
            const hasFoundIntermediate = foundIntermediate || nextState.id === intermediateStateId;
            await dfs(
              nextState,
              newPath,
              newVisitedInPath, // Pass per-path visited set - ALGORITHM FIX
              [...rulePath, rule.condition],
              [...failedRulesPath, currentState.rules.slice(0, i).map(r => r.condition)],
              hasFoundIntermediate,
              depth + 1 // Increment depth - DEPTH PROTECTION
            );
          }
        }
      };

      await dfs(startState);
      
      // Final state update with all paths - PERFORMANCE FIX
      setPaths([...allPaths]);
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
        console.error('Error during search:', error);
        toast.error(`An error occurred during path finding: ${error.message}`);
      }
    } finally {
      setIsSearching(false);
      setProgress(0);
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
  /**
   * Cancels the current search operation
   */
  const handleCancel = () => {
    shouldContinueRef.current = false;
    setIsSearching(false);
  };

  /**
   * Detects loops in the state machine using DFS with cycle detection
   */
  const handleDetectLoops = async () => {
    try {
      setIsSearching(true);
      setPaths([]);
      shouldContinueRef.current = true;
      setProgress(0);

      // Create state lookup map for O(1) access - PERFORMANCE FIX
      const stateMap = new Map(states.map(s => [s.id, s]));

      const loops = [];
      const globalVisited = new Set(); // Track globally visited states to avoid duplicates - ALGORITHM FIX
      let lastUpdateTime = Date.now();

      /**
       * DFS function for loop detection
       */
      const dfs = async (currentState, path = [], pathIds = [], stack = new Set(), rulePath = []) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        // Check if we've found a loop - ALGORITHM FIX
        if (stack.has(currentState.id)) {
          const loopStartIndex = pathIds.findIndex(id => id === currentState.id);
          
          // Create the complete loop cycle
          const loopStates = [...path.slice(loopStartIndex), currentState.name];
          const loopRules = [...rulePath.slice(loopStartIndex)];

          loops.push({
            states: loopStates,
            rules: loopRules,
            failedRules: [] // Simplified for loops
          });
          
          // Batch state updates - only update every 5 loops - PERFORMANCE FIX
          if (loops.length % 5 === 0) {
            setPaths([...loops]);
          }
          return;
        }

        globalVisited.add(currentState.id); // Mark as globally visited - ALGORITHM FIX
        const newStack = new Set(stack).add(currentState.id);
        const newPath = [...path, currentState.name];
        const newPathIds = [...pathIds, currentState.id];

        // Batch progress updates - PERFORMANCE FIX
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
          await new Promise(resolve => setTimeout(resolve, 1));
          lastUpdateTime = now;
        }

        for (const rule of currentState.rules) {
          const nextState = stateMap.get(rule.nextState); // O(1) lookup - PERFORMANCE FIX
          if (nextState) {
            await dfs(
              nextState,
              newPath,
              newPathIds,
              newStack,
              [...rulePath, rule.condition]
            );
          }
        }
      };

      // Search for loops starting from each state - ALGORITHM FIX: skip already visited
      for (let i = 0; i < states.length; i++) {
        const state = states[i];
        if (!globalVisited.has(state.id)) { // Skip if already visited - ALGORITHM FIX
          await dfs(state);
        }
        setProgress((i + 1) / states.length * 100);
      }

      // Final state update - PERFORMANCE FIX
      setPaths([...loops]);
      setProgress(100);

      if (loops.length === 0) {
        toast.info('No loops found in the state machine.');
      } else {
        toast.success(`Found ${loops.length} loop${loops.length === 1 ? '' : 's'} in the state machine.`);
      }

    } catch (error) {
      if (error.message === 'Search cancelled') {
        console.log('Search was cancelled');
        toast.info('Search cancelled');
      } else {
        console.error('Error during loop detection:', error);
        toast.error('An error occurred while detecting loops');
      }
    } finally {
      setIsSearching(false);
      setProgress(0);
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
  };

  /**
   * Exports results to an HTML file with styling - FIXED to export all paths
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
            border: 1px solid #e5e7eb;
          }
          .path-number {
            position: absolute;
            top: -10px;
            left: -10px;
            background-color: #3b82f6;
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.9em;
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
            color: #1f2937;
          }
          .metadata {
            color: #6b7280;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>State Machine Paths</h1>
        <div class="metadata">
          <p>Total paths found: ${paths.length}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        ${paths.map((path, index) => `
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
    
    toast.success('Paths exported successfully');
  };

  /**
   * Generates step-by-step instructions for a path
   */
  const generateStepInstructions = (path) => {
    if (!path.states || path.states.length === 0) {
      return 'No states available';
    }

    let instructions = [];
    
    for (let i = 0; i < path.states.length; i++) {
      const state = path.states[i];
      
      if (i === 0) {
        instructions.push(`${i + 1}. Start at "${state}"`);
      } else {
        instructions.push(`${i + 1}. Navigate to "${state}"`);
      }
    }
    
    return instructions.join('\n');
  };

  /**
   * Exports the found paths as an Excel file with test documentation format
   */
  const exportToExcel = async () => {
    try {
      // Prepare data for Excel export
      const excelData = paths.map((path, index) => ({
        'Path ID': `Path ${index + 1}`,
        'Step-by-Step Instructions': generateStepInstructions(path),
        'Expected Result': `Successfully navigate from "${path.states[0]}" to "${path.states[path.states.length - 1]}"`,
        'Generated On': new Date().toLocaleString()
      }));

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('State Machine Paths');

      // Define columns with widths
      worksheet.columns = [
        { header: 'Path ID', key: 'Path ID', width: 10 },
        { header: 'Step-by-Step Instructions', key: 'Step-by-Step Instructions', width: 80 },
        { header: 'Expected Result', key: 'Expected Result', width: 40 },
        { header: 'Generated On', key: 'Generated On', width: 20 }
      ];

      // Add data rows
      worksheet.addRows(excelData);

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Generate filename
      const defaultName = `state-machine-test-paths-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter Excel file name:', defaultName);
      
      if (!fileName) {
        return;
      }
      
      const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      
      // Save the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Excel file "${finalFileName}" exported successfully`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // Calculate pagination values
  const indexOfLastPath = currentPage * pathsPerPage;
  const indexOfFirstPath = indexOfLastPath - pathsPerPage;
  const paginatedPaths = paths.slice(indexOfFirstPath, indexOfLastPath);
  const totalPages = Math.ceil(paths.length / pathsPerPage);

  // Reset pagination when paths change
  useEffect(() => {
    setCurrentPage(1);
  }, [paths]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Route className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-semibold">Path Finder</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportResults}
                disabled={paths.length === 0}
                title="Export as HTML file"
                className="h-9"
              >
                <Download className="h-4 w-4 mr-2" />
                HTML
              </Button>
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={paths.length === 0}
                title="Export as Excel file for test documentation"
                className="h-9"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-[380px] border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Mode Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Search Mode
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleModeSwitch('endStates')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'endStates'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Route className={`h-5 w-5 flex-shrink-0 ${searchMode === 'endStates' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'endStates' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Paths to End States
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find all paths from a start state to any end
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSwitch('specificState')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'specificState'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRight className={`h-5 w-5 flex-shrink-0 ${searchMode === 'specificState' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'specificState' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Paths Between States
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find paths from start to a specific target
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSwitch('intermediateState')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'intermediateState'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Search className={`h-5 w-5 flex-shrink-0 ${searchMode === 'intermediateState' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'intermediateState' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Paths Through State
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find paths passing through a specific state
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleModeSwitch('detectLoops');
                      handleDetectLoops();
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'detectLoops'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Route className={`h-5 w-5 flex-shrink-0 ${searchMode === 'detectLoops' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'detectLoops' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Detect Loops
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find all loops in the state machine
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* State Selection */}
              {searchMode !== 'detectLoops' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Starting State <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedStartState}
                      onChange={(e) => setSelectedStartState(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                               text-sm dark:bg-gray-700 dark:text-white px-3 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Starting State</option>
                      {states.map(state => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(searchMode === 'specificState' || searchMode === 'intermediateState') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedEndState}
                        onChange={(e) => setSelectedEndState(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                                 text-sm dark:bg-gray-700 dark:text-white px-3 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Target State</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {searchMode === 'intermediateState' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Intermediate State
                      </label>
                      <select
                        value={selectedIntermediateState}
                        onChange={(e) => setSelectedIntermediateState(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                                 text-sm dark:bg-gray-700 dark:text-white px-3 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Intermediate State</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {searchMode !== 'detectLoops' && (
                <div className="space-y-2">
                  <Button
                    onClick={handleFindPaths}
                    disabled={!selectedStartState || (searchMode === 'specificState' && !selectedEndState) || isSearching}
                    className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Paths
                      </>
                    )}
                  </Button>

                  {isSearching && (
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="w-full h-11 font-semibold"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {isSearching && (
                <div className="space-y-2">
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium text-center text-gray-600 dark:text-gray-400">
                    {Math.round(progress)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {paths.length > 0 ? (
              <div className="space-y-4">
                {/* Results Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Found {paths.length} Path{paths.length !== 1 ? 's' : ''}
                    </h3>
                    {totalPages > 1 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Showing {indexOfFirstPath + 1}-{Math.min(indexOfLastPath, paths.length)} of {paths.length}
                      </p>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>

                {/* Path Cards */}
                {paginatedPaths.map((path, index) => (
                  <Card 
                    key={index}
                    className="p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 
                                       flex items-center justify-center text-sm font-bold">
                          {indexOfFirstPath + index + 1}
                        </span>
                        Path {indexOfFirstPath + index + 1}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {path.states.length} states
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {path.rules.length} transitions
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {path.states.map((state, stateIndex) => (
                        <React.Fragment key={stateIndex}>
                          <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md
                                       border border-blue-200 dark:border-blue-700">
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
                                                       text-red-700 dark:text-red-300 rounded text-xs block">
                                        ❌ {rule}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 
                                              text-green-700 dark:text-green-300 rounded text-xs block">
                                  ✓ {path.rules[stateIndex]}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </Card>
                ))}

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Route className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Paths Found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  {searchMode === 'detectLoops' 
                    ? 'No loops detected in the state machine.' 
                    : 'Select a search mode and configure the parameters to find paths between states.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
