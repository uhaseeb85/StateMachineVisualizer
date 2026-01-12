/**
 * PathFinderModal Component
 * A modal dialog that provides path finding functionality in a flow diagram.
 * Features include:
 * - Finding paths between selected start and end steps
 * - Finding paths through intermediate steps
 * - Detecting loops in the flow
 * - Exporting results
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx-js-style';
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
  Download,
  FileSpreadsheet
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
   * searchMode can be: 'endSteps', 'specificStep', 'intermediateStep', or 'detectLoops'
   */
  const [selectedStartStep, setSelectedStartStep] = useState('');
  const [selectedEndStep, setSelectedEndStep] = useState('');
  const [selectedIntermediateStep, setSelectedIntermediateStep] = useState('');
  const [searchMode, setSearchMode] = useState('endSteps');
  const [selectedRootSteps, setSelectedRootSteps] = useState([]);

  // Search state management
  const [paths, setPaths] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const shouldContinueRef = useRef(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pathsPerPage = 250;

  // Calculate root steps (top-level steps without parent) - memoized for performance
  const rootSteps = useMemo(() => 
    steps.filter(step => !step.parentId),
    [steps]
  );

  /**
   * Cleanup effect - cancel ongoing searches when component unmounts
   */
  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
    };
  }, []);

  /**
   * Initialize selected root steps when switching to detectLoops mode
   */
  useEffect(() => {
    if (searchMode === 'detectLoops' && selectedRootSteps.length === 0 && rootSteps.length > 0) {
      // Select all root steps by default
      setSelectedRootSteps(rootSteps.map(s => s.id));
    }
  }, [searchMode, rootSteps, selectedRootSteps.length]);

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

      // Create step lookup map for O(1) access
      const stepMap = new Map(steps.map(s => [s.id, s]));

      let allPaths = [];
      let processedSteps = 0;
      const totalSteps = steps.length;
      const maxPathLength = totalSteps * 2; // Prevent infinite loops while allowing for revisits
      let lastUpdateTime = Date.now();

      setPaths([]);
      setIsSearching(true);
      setProgress(0);

      /**
       * Recursive DFS function to find all possible paths
       * @param {Step} currentStep - Current step being processed
       * @param {Array} currentPath - Current path being built
       * @param {Set} visitedInPath - Set of step IDs visited in current path
       * @param {Array} rulePath - Path of rules/connections taken
       * @param {number} depth - Current recursion depth
       */
      const dfs = async (currentStep, currentPath = [], visitedInPath = new Set(), rulePath = [], depth = 0) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        // Prevent infinite loops by limiting path length
        if (depth > maxPathLength) {
          return;
        }

        // Update progress periodically (batch updates for performance)
        processedSteps++;
        const now = Date.now();
        if (now - lastUpdateTime > 100) { // Update every 100ms instead of every step
          const progressValue = Math.min((processedSteps / (totalSteps * 2)) * 100, 99);
          setProgress(progressValue);
          lastUpdateTime = now;
          // Add small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        const newPath = [...currentPath, {
          id: currentStep.id,
          name: currentStep.name,
          isSubStep: !!currentStep.parentId
        }];
        const newVisitedInPath = new Set(visitedInPath).add(currentStep.id);

        // Check if we've reached our target based on search mode
        if (endStepId) {
          if (currentStep.id === endStepId) {
            if (!intermediateStepId || newPath.some(step => step.id === intermediateStepId)) {
              allPaths.push({
                steps: newPath,
                rules: [...rulePath]
              });
              // Batch state updates - only update every 10 paths
              if (allPaths.length % 10 === 0) {
                setPaths([...allPaths]);
              }
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
            // Batch state updates - only update every 10 paths
            if (allPaths.length % 10 === 0) {
              setPaths([...allPaths]);
            }
          }
        }

        // Get all possible next steps
        const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
        
        for (const connection of outgoingConnections) {
          try {
            const nextStep = stepMap.get(connection.toStepId);
            if (!nextStep) continue;

            // Check for cycles in the current path - prevent any revisits
            if (newVisitedInPath.has(nextStep.id)) continue;

            await dfs(
              nextStep,
              newPath,
              newVisitedInPath,
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
      
      // Final state update with all paths
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

      // Create step lookup map for O(1) access
      const stepMap = new Map(steps.map(s => [s.id, s]));

      const loops = [];
      const globalVisited = new Set();
      let lastUpdateTime = Date.now();

      /**
       * DFS implementation for loop detection
       * @param {Step} currentStep - Current step being processed
       * @param {Array} path - Current path being explored
       * @param {Array} pathSteps - Array of complete step objects in the path
       * @param {Set} stack - Set of step IDs in current recursion stack
       * @param {Array} rulePath - Path of rules/connections taken
       * @param {Array} failedRulesPath - Path of failed rules
       */
      const dfs = async (currentStep, path = [], pathSteps = [], stack = new Set(), rulePath = [], failedRulesPath = []) => {
        if (!shouldContinueRef.current) {
          throw new Error('Search cancelled');
        }

        if (stack.has(currentStep.id)) {
          const loopStartIndex = path.findIndex(p => p === currentStep.id);
          
          // Create proper step objects for the loop
          const loopSteps = [...pathSteps.slice(loopStartIndex), { 
            id: currentStep.id, 
            name: currentStep.name,
            isSubStep: !!currentStep.parentId 
          }];
          
          const loopRules = [...rulePath.slice(loopStartIndex)];
          const loopFailedRules = [...failedRulesPath.slice(loopStartIndex)];

          loops.push({
            steps: loopSteps,
            rules: loopRules,
            failedRules: loopFailedRules
          });
          
          // Batch state updates - only update every 5 loops
          if (loops.length % 5 === 0) {
            setPaths([...loops]);
          }
          return;
        }

        globalVisited.add(currentStep.id);
        const newStack = new Set(stack).add(currentStep.id);
        
        // Store both the ID and the full step object
        const newPath = [...path, currentStep.id];
        const newPathSteps = [...pathSteps, { 
          id: currentStep.id, 
          name: currentStep.name,
          isSubStep: !!currentStep.parentId 
        }];

        // Batch progress updates
        const now = Date.now();
        if (now - lastUpdateTime > 100) {
          await new Promise(resolve => setTimeout(resolve, 1));
          lastUpdateTime = now;
        }

        const outgoingConnections = connections.filter(conn => conn.fromStepId === currentStep.id);
        for (const connection of outgoingConnections) {
          const nextStep = stepMap.get(connection.toStepId);
          if (nextStep) {
            await dfs(
              nextStep,
              newPath,
              newPathSteps,
              newStack,
              [...rulePath, { type: connection.type }],
              [...failedRulesPath, []]
            );
          }
        }
      };

      // Only search from selected root steps
      const stepsToSearch = selectedRootSteps
        .map(id => stepMap.get(id))
        .filter(s => s !== undefined);
      
      if (stepsToSearch.length === 0) {
        toast.warning('Please select at least one root step to detect loops.');
        setIsSearching(false);
        return;
      }
      
      // Search from selected root steps only
      for (let i = 0; i < stepsToSearch.length; i++) {
        const step = stepsToSearch[i];
        if (!globalVisited.has(step.id)) {
          await dfs(step);
          setProgress((i + 1) / stepsToSearch.length * 100);
        }
      }

      // Final state update with all loops
      setPaths([...loops]);
      setProgress(100);

      if (loops.length === 0) {
        toast.info('No loops found in the flow diagram.');
      } else {
        toast.success(`Found ${loops.length} loop${loops.length === 1 ? '' : 's'} in the flow diagram.`);
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

  const handleModeSwitch = (newMode) => {
    setSearchMode(newMode);
    setSelectedEndStep('');
    setSelectedIntermediateStep('');
    setPaths([]);
    setIsSearching(false);
    setProgress(0);
    shouldContinueRef.current = true;
  };

  /**
   * Exports the found paths as an HTML file with proper formatting
   */
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
          }
          .path {
            background-color: #f9fafb;
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .path-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .path-number {
            font-weight: bold;
            color: #4b5563;
          }
          .path-length {
            color: #6b7280;
            font-size: 0.9em;
          }
          .step {
            display: inline-flex;
            align-items: center;
            margin: 4px 0;
          }
          .step-name {
            background-color: #fff;
            padding: 6px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin: 0 4px;
          }
          .step-name.sub-step {
            border-style: dashed;
            background-color: #f0fdf4;
          }
          .arrow {
            color: #9ca3af;
            margin: 0 8px;
          }
          .rule {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 0 4px;
            font-size: 0.9em;
          }
          .rule.success {
            background-color: #d1fae5;
            color: #047857;
          }
          .rule.failure {
            background-color: #fee2e2;
            color: #b91c1c;
          }
        </style>
      </head>
      <body>
        <h1>Flow Diagram Paths</h1>
        <p>Total paths found: ${paths.length}</p>
        ${paths.map((path, index) => `
          <div class="path">
            <div class="path-header">
              <span class="path-number">Path ${index + 1}</span>
              <span class="path-length">${path.steps.length} steps</span>
            </div>
            <div class="steps">
              ${path.steps.map((step, stepIndex) => `
                <div class="step">
                  <span class="step-name ${step.isSubStep ? 'sub-step' : ''}">${step.name}</span>
                  ${stepIndex < path.steps.length - 1 ? `
                    <span class="arrow">→</span>
                    <span class="rule ${path.rules[stepIndex].type}">
                      ${path.rules[stepIndex].type === 'success' ? '✓' : '❌'}
                      ${path.rules[stepIndex].type}
                    </span>
                    <span class="arrow">→</span>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <div style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
          Generated on: ${new Date().toLocaleString()}
        </div>
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
    
    toast.success('Paths exported successfully');
  };

  /**
   * Generates a meaningful description of a path for test documentation
   * @param {Object} path - The path object with steps and rules
   * @param {number} index - The path index
   * @returns {string} - A meaningful description of the path
   */
  const generatePathDescription = (path, index) => {
    if (!path.steps || path.steps.length === 0) {
      return `Path ${index + 1}: Empty path`;
    }

    const startStep = path.steps[0];
    const endStep = path.steps[path.steps.length - 1];
    const intermediateSteps = path.steps.slice(1, -1);
    
    let description = `Path ${index + 1}: Navigate from "${startStep.name}"`;
    
    if (path.steps.length > 2) {
      const intermediateNames = intermediateSteps.map(step => `"${step.name}"`).join(', ');
      description += ` through ${intermediateNames}`;
    }
    
    if (path.steps.length > 1) {
      description += ` to "${endStep.name}"`;
    }

    // Add rule information for better test documentation
    if (path.rules && path.rules.length > 0) {
      const successCount = path.rules.filter(rule => rule.type === 'success').length;
      const failureCount = path.rules.filter(rule => rule.type === 'failure').length;
      
      if (successCount > 0 && failureCount > 0) {
        description += ` (${successCount} success condition${successCount > 1 ? 's' : ''}, ${failureCount} failure condition${failureCount > 1 ? 's' : ''})`;
      } else if (successCount > 0) {
        description += ` (${successCount} success condition${successCount > 1 ? 's' : ''})`;
      } else if (failureCount > 0) {
        description += ` (${failureCount} failure condition${failureCount > 1 ? 's' : ''})`;
      }
    }

    return description;
  };

  /**
   * Generates detailed step-by-step instructions for a path, grouping steps and breaking on failures
   * @param {Object} path - The path object with steps and rules
   * @returns {string} - Detailed step instructions with line breaks on failures
   */
  const generateStepInstructions = (path) => {
    if (!path.steps || path.steps.length === 0) {
      return 'No steps available';
    }

    let instructionSections = [];
    let currentSection = [];
    let absoluteStepNum = 1;
    
    for (let i = 0; i < path.steps.length; i++) {
      const step = path.steps[i];
      
      if (i === 0) {
        currentSection.push(`${absoluteStepNum}. Start at "${step.name}"`);
        absoluteStepNum++;
      } else {
        const prevRule = path.rules[i - 1];
        let condition = '';
        
        if (prevRule) {
          condition = prevRule.type === 'success' ? ' (on success)' : ' (on failure)';
        }
        
        // If this is a failure transition, close current section first, then start new section
        if (prevRule && prevRule.type === 'failure') {
          // Close current section if it has content
          if (currentSection.length > 0) {
            instructionSections.push(currentSection.join('. '));
            currentSection = [];
          }
          // Add the failure step as its own section
          instructionSections.push(`${absoluteStepNum}. Navigate to "${step.name}"${condition}`);
        } else {
          // Add to current section for success transitions
          currentSection.push(`${absoluteStepNum}. Navigate to "${step.name}"${condition}`);
        }
        
        absoluteStepNum++;
      }
    }
    
    // Add any remaining steps in the current section
    if (currentSection.length > 0) {
      instructionSections.push(currentSection.join('. '));
    }
    
    return instructionSections.join('\n\n');
  };

    /**
   * Exports the found paths as an Excel file with meaningful descriptions for test documentation
   */
  const exportToExcel = () => {
    try {
      // Prepare data for Excel export - create separate rows for each section
      const excelData = [];
      
      paths.forEach((path, pathIndex) => {
        const pathId = `Path ${pathIndex + 1}`;
        const instructionSections = generateStepInstructions(path).split('\n\n');
        const generatedOn = new Date().toLocaleString();
        
        instructionSections.forEach((section, sectionIndex) => {
          // Extract the last step mentioned in this section for the expected result
          const stepMatches = section.match(/Navigate to "([^"]+)"[^.]*(\(on failure\)|\(on success\))?/g);
          let expectedResult = 'Path completion';
          
          if (stepMatches && stepMatches.length > 0) {
            // Get the last step mentioned in this section
            const lastStepMatch = stepMatches[stepMatches.length - 1];
            const stepNameMatch = lastStepMatch.match(/Navigate to "([^"]+)"/);
            const isFailureStep = lastStepMatch.includes('(on failure)');
            
            if (stepNameMatch) {
              const stepName = stepNameMatch[1];
              if (isFailureStep) {
                expectedResult = `Failed Step "${stepName}"`;
              } else {
                expectedResult = `Successfully executed "${stepName}"`;
              }
            }
          } else if (section.includes('Start at "')) {
            // If this section only has a start step, use that
            const startMatch = section.match(/Start at "([^"]+)"/);
            if (startMatch) {
              expectedResult = `Successfully executed "${startMatch[1]}"`;
            }
          }
          
          excelData.push({
            'Path ID': pathId, // Keep the same Path ID for all sections
            'Step-by-Step Instructions': section,
            'Expected Result': expectedResult, // Show expected result for each section
            'Generated On': sectionIndex === 0 ? generatedOn : '' // Only show timestamp in first row
          });
        });
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

             // Set column widths for better readability
       const columnWidths = [
         { wch: 10 },  // Path ID
         { wch: 80 },  // Step-by-Step Instructions
         { wch: 40 },  // Expected Result
         { wch: 20 }   // Generated On
       ];
      ws['!cols'] = columnWidths;

      // Add some basic styling to the header row
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E3F2FD' } },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        }
      }

      // Add borders to all cells
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[cellAddress]) {
            if (!ws[cellAddress].s) ws[cellAddress].s = {};
            ws[cellAddress].s.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Flow Diagram Paths');

      // Generate filename
      const defaultName = `flow-diagram-test-paths-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter Excel file name:', defaultName);
      
      if (!fileName) {
        return;
      }
      
      const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
      
      // Save the file
      XLSX.writeFile(wb, finalFileName);
      
      toast.success(`Excel file "${finalFileName}" exported successfully`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
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
            ${typeof step === 'object' && step.isSubStep 
              ? 'bg-green-50 dark:bg-green-900/30 border-dashed' 
              : 'bg-blue-50 dark:bg-blue-900/30 border-solid'}`}>
            {typeof step === 'object' ? step.name : step}
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
                disabled={currentPaths.length === 0}
                title="Export as HTML file"
                className="h-9"
              >
                <Download className="h-4 w-4 mr-2" />
                HTML
              </Button>
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={currentPaths.length === 0}
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
                    onClick={() => handleModeSwitch('endSteps')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'endSteps'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Route className={`h-5 w-5 flex-shrink-0 ${searchMode === 'endSteps' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'endSteps' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Paths to End Steps
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find all paths from a start step to any end
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSwitch('specificStep')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'specificStep'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRight className={`h-5 w-5 flex-shrink-0 ${searchMode === 'specificStep' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'specificStep' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Paths Between Steps
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find paths from start to a specific target
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSwitch('intermediateStep')}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      searchMode === 'intermediateStep'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Search className={`h-5 w-5 flex-shrink-0 ${searchMode === 'intermediateStep' ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className={`font-medium text-sm ${searchMode === 'intermediateStep' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          Paths Through Step
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Find paths that pass through a specific step
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleModeSwitch('detectLoops')}
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
                          Identify circular paths in the diagram
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step Selection */}
              {searchMode === 'detectLoops' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Root Steps to Analyze <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Select which root steps (top-level, non-substeps) to start loop detection from.
                    </p>
                    {rootSteps.length === 0 ? (
                      <div className="p-4 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          No root steps found. All steps are sub-steps.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRootSteps.length === rootSteps.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRootSteps(rootSteps.map(s => s.id));
                              } else {
                                setSelectedRootSteps([]);
                              }
                            }}
                            className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Select All ({rootSteps.length})
                          </span>
                        </label>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
                        {rootSteps.map(step => (
                          <label key={step.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedRootSteps.includes(step.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRootSteps([...selectedRootSteps, step.id]);
                                } else {
                                  setSelectedRootSteps(selectedRootSteps.filter(id => id !== step.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {step.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Starting Step <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedStartStep}
                      onChange={(e) => setSelectedStartStep(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                               text-sm dark:bg-gray-700 dark:text-white px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select starting step...</option>
                      
                      <optgroup label="Root Steps">
                        {steps
                          .filter(s => !s.parentId)
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </optgroup>
                      
                      {steps.some(s => s.parentId) && (
                        <optgroup label="Sub Steps">
                          {steps
                            .filter(s => s.parentId)
                            .map(s => {
                              const parent = steps.find(p => p.id === s.parentId);
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.name} (in {parent?.name || 'Unknown'})
                                </option>
                              );
                            })}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {(searchMode === 'specificStep' || searchMode === 'intermediateStep') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Target Step <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedEndStep}
                        onChange={(e) => setSelectedEndStep(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                                 text-sm dark:bg-gray-700 dark:text-white px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select target step...</option>
                        
                        <optgroup label="Root Steps">
                          {steps
                            .filter(s => !s.parentId)
                            .map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </optgroup>
                        
                        {steps.some(s => s.parentId) && (
                          <optgroup label="Sub Steps">
                            {steps
                              .filter(s => s.parentId)
                              .map(s => {
                                const parent = steps.find(p => p.id === s.parentId);
                                return (
                                  <option key={s.id} value={s.id}>
                                    {s.name} (in {parent?.name || 'Unknown'})
                                  </option>
                                );
                              })}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}

                  {searchMode === 'intermediateStep' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Intermediate Step <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedIntermediateStep}
                        onChange={(e) => setSelectedIntermediateStep(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 
                                 text-sm dark:bg-gray-700 dark:text-white px-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select intermediate step...</option>
                        
                        <optgroup label="Root Steps">
                          {steps
                            .filter(s => !s.parentId)
                            .map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </optgroup>
                        
                        {steps.some(s => s.parentId) && (
                          <optgroup label="Sub Steps">
                            {steps
                              .filter(s => s.parentId)
                              .map(s => {
                                const parent = steps.find(p => p.id === s.parentId);
                                return (
                                  <option key={s.id} value={s.id}>
                                    {s.name} (in {parent?.name || 'Unknown'})
                                  </option>
                                );
                              })}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                {!isSearching ? (
                  <Button
                    onClick={searchMode === 'detectLoops' ? handleDetectLoops : handleFindPaths}
                    disabled={
                      (searchMode === 'detectLoops' ? selectedRootSteps.length === 0 : !selectedStartStep) ||
                      (searchMode === 'specificStep' && !selectedEndStep) ||
                      (searchMode === 'intermediateStep' && (!selectedEndStep || !selectedIntermediateStep))
                    }
                    className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium text-base"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    {searchMode === 'detectLoops' ? 'Detect Loops' : 'Find Paths'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCancel}
                    variant="destructive"
                    className="w-full h-11 font-medium text-base"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel Search
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isSearching && (
                <div className="space-y-2">
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
                    Searching... {Math.round(progress)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {paths.length === 0 && !isSearching ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Route className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Results Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                  {searchMode === 'detectLoops' 
                    ? 'Click "Detect Loops" to scan for circular paths in your flow diagram.'
                    : 'Configure your search parameters and click "Find Paths" to see results.'}
                </p>
              </div>
            ) : paths.length > 0 ? (
              <div className="space-y-4">
                {/* Results Header */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {paths.length} Path{paths.length !== 1 ? 's' : ''} Found
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Showing {indexOfFirstPath + 1}-{Math.min(indexOfFirstPath + pathsPerPage, paths.length)} of {paths.length}
                    </p>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results List */}
                <div className="space-y-3">
                  {currentPaths.map((path, index) => {
                    const pathNumber = indexOfFirstPath + index + 1;
                    return (
                      <Card
                        key={index}
                        className="p-5 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">
                              {pathNumber}
                            </span>
                            Path {pathNumber}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {path.steps.length} steps
                            </span>
                            <span className="flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              {path.rules.length} transitions
                            </span>
                          </div>
                        </div>
                        {renderPath(path)}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}
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
