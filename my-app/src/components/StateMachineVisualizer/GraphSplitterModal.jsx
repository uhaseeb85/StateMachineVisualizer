/**
 * GraphSplitterModal.jsx
 * 
 * Modal component for splitting a large state machine graph into smaller, manageable subgraphs
 * while preserving their functionality and connections.
 * 
 * Features:
 * - Automatic detection of natural graph partitions
 * - Visual preview of suggested subgraphs
 * - Option to customize the partition
 * - Export individual subgraphs
 * - Export all subgraphs as separate files
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { X, Download, Scissors, CheckCircle, ArrowLeftRight, FileBox } from 'lucide-react';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import storage from '@/utils/storageWrapper';
import { toast } from 'sonner';

// Constants
const DEFAULT_PRIORITY = 50;
const CALCULATION_DELAY = 100;
const DEFAULT_TARGET_PARTITIONS = 3;

/**
 * Helper function to generate CSV data for a subgraph with external state handling
 * Consolidates common logic used by both single and bulk export operations
 * 
 * @param {Array} subgraphStates - States in the subgraph to export
 * @param {Array} allStates - All states from the original graph
 * @param {string} sourceFile - Optional source file identifier for storage lookup
 * @returns {Promise<Object>} Object containing csvData array and column definitions
 */
const generateSubgraphCSVData = async (subgraphStates, allStates, sourceFile = null) => {
  if (!subgraphStates || subgraphStates.length === 0) {
    throw new Error('No states provided for export');
  }
  
  // Get all external references (outgoing boundaries)
  const stateIdsInSubgraph = new Set(subgraphStates.map(s => s.id));
  const externalStates = new Set();
  
  // Find all rules that point to states outside this subgraph
  subgraphStates.forEach(state => {
    state.rules.forEach(rule => {
      if (rule.nextState && !stateIdsInSubgraph.has(rule.nextState)) {
        const externalState = allStates.find(s => s.id === rule.nextState);
        if (externalState && externalState.name) {
          externalStates.add(externalState.name);
        }
      }
    });
  });
  
  // Try to get the original imported data
  let baseData = [];
  if (sourceFile) {
    const fileSpecificData = await storage.getItem(`importedCSV_${sourceFile}`);
    if (fileSpecificData) {
      baseData = fileSpecificData;
    }
  }
  
  // Fall back to legacy storage if no file-specific data found
  if (baseData.length === 0) {
    const lastImportedData = await storage.getItem('lastImportedCSV');
    baseData = lastImportedData || [];
  }
  
  // Generate rules from states
  const currentData = subgraphStates.flatMap(sourceState => 
    sourceState.rules.map(rule => {
      const isIdFormat = rule.nextState && typeof rule.nextState === 'string' && rule.nextState.startsWith('id_');
      const destState = subgraphStates.find(s => s.id === rule.nextState);
      
      let destinationName = '';
      if (destState && destState.name) {
        destinationName = destState.name;
      } else if (rule.nextState) {
        const externalState = allStates.find(s => s.id === rule.nextState);
        destinationName = externalState && externalState.name
          ? externalState.name 
          : isIdFormat ? 'Unknown State' : rule.nextState;
      }
      
      return {
        'Source Node': sourceState.name,
        'Destination Node': destinationName,
        'Rule List': rule.condition || '',
        'Priority': rule.priority !== undefined && rule.priority !== null ? rule.priority : DEFAULT_PRIORITY,
        'Operation / Edge Effect': rule.operation || ''
      };
    })
  );
  
  // Add TRUE rules for external states
  const externalStateRules = Array.from(externalStates).map(externalStateName => ({
    'Source Node': externalStateName,
    'Destination Node': externalStateName,
    'Rule List': 'TRUE',
    'Priority': DEFAULT_PRIORITY,
    'Operation / Edge Effect': ''
  }));
  
  // Merge with existing data or use current data only
  const combinedRules = [...currentData, ...externalStateRules];
  let csvData;
  
  if (baseData.length > 0) {
    const allColumns = Object.keys(baseData[0]);
    
    csvData = combinedRules.map(currentRow => {
      const newRow = {};
      const matchingRow = baseData.find(
        baseRow => 
          baseRow['Source Node'] === currentRow['Source Node'] &&
          baseRow['Destination Node'] === currentRow['Destination Node']
      );

      allColumns.forEach(column => {
        if (column === 'Source Node' || column === 'Destination Node' || column === 'Rule List') {
          newRow[column] = currentRow[column];
        } else if (column === 'Priority') {
          newRow[column] = currentRow['Priority'];
        } else if (column === 'Operation / Edge Effect') {
          newRow[column] = currentRow['Operation / Edge Effect'];
        } else {
          newRow[column] = matchingRow ? matchingRow[column] : '';
        }
      });
      
      return newRow;
    });
  } else {
    csvData = combinedRules;
  }
  
  return { csvData, hasData: csvData.length > 0 };
};

/**
 * Helper function to create an ExcelJS workbook from CSV data
 * 
 * @param {Array} csvData - Array of row objects to write
 * @returns {ExcelJS.Workbook} Configured workbook ready for export
 */
const createWorkbookFromCSVData = (csvData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('State Machine');
  
  if (csvData.length > 0) {
    const columns = Object.keys(csvData[0]).map(key => ({
      header: key,
      key: key,
      width: key === 'Priority' ? 10 : key === 'Operation / Edge Effect' ? 40 : 20
    }));
    worksheet.columns = columns;
    
    csvData.forEach(row => {
      const rowData = {};
      Object.keys(row).forEach(key => {
        if (key === 'Priority') {
          const value = row[key];
          rowData[key] = value === 0 || value === '0' ? 0 : (typeof value === 'number' ? value : (parseInt(value) || DEFAULT_PRIORITY));
        } else {
          rowData[key] = row[key];
        }
      });
      worksheet.addRow(rowData);
    });
  }
  
  return workbook;
};

/**
 * Utility function to identify connected components in a graph
 * Uses breadth-first search to find groups of connected states
 * 
 * @param {Array} states - Array of state objects
 * @returns {Array} Array of connected component groups (arrays of state IDs)
 */
const findConnectedComponents = (states) => {
  const visited = new Set();
  const components = [];
  
  // For each state, if not visited, run BFS to find connected component
  for (const state of states) {
    if (visited.has(state.id)) continue;
    
    const component = [];
    const queue = [state.id];
    visited.add(state.id);
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      component.push(currentId);
      
      // Find the current state object
      const currentState = states.find(s => s.id === currentId);
      if (!currentState) continue;
      
      // Add all connected states to the queue
      const connectedStateIds = new Set();
      
      // Add states that are targets of this state's rules
      currentState.rules.forEach(rule => {
        if (rule.nextState && !visited.has(rule.nextState)) {
          connectedStateIds.add(rule.nextState);
        }
      });
      
      // Add states that have this state as a target in their rules
      states.forEach(s => {
        if (s.id !== currentId) {
          s.rules.forEach(rule => {
            if (rule.nextState === currentId && !visited.has(s.id)) {
              connectedStateIds.add(s.id);
            }
          });
        }
      });
      
      // Process all connected states
      for (const id of connectedStateIds) {
        if (!visited.has(id)) {
          visited.add(id);
          queue.push(id);
        }
      }
    }
    
    // Add this connected component to our result
    if (component.length > 0) {
      components.push(component);
    }
  }
  
  return components;
};

/**
 * Uses community detection algorithms to find natural partitions in a connected graph
 * Implements a basic version of the Girvan-Newman algorithm
 * 
 * @param {Array} states - Array of state objects
 * @param {number} targetPartitions - Target number of partitions to create
 * @returns {Array} Array of partition groups (arrays of state IDs)
 */
const findPartitions = (states, targetPartitions = DEFAULT_TARGET_PARTITIONS) => {
  // Validate inputs
  if (!states || states.length === 0) {
    return [];
  }
  
  // If target partitions exceeds number of states, adjust to maximum possible
  const validTargetPartitions = Math.min(targetPartitions, states.length);
  
  // If only one state, return it as a single partition
  if (states.length === 1) {
    return [[states[0].id]];
  }
  
  // Create an adjacency matrix representation of the graph
  const stateIdToIndex = new Map();
  states.forEach((state, index) => {
    stateIdToIndex.set(state.id, index);
  });
  
  // First check if the graph already has natural connected components
  const connectedComponents = findConnectedComponents(states);
  if (connectedComponents.length > 1) {
    return connectedComponents;
  }
  
  // For a simple approach, we'll use a state's connection count as a metric
  // States with more connections are more "central" and should be kept in different partitions
  const stateConnections = states.map(state => {
    // Count outgoing connections
    const outgoing = state.rules.length;
    
    // Count incoming connections
    const incoming = states.reduce((count, s) => {
      return count + s.rules.filter(rule => rule.nextState === state.id).length;
    }, 0);
    
    return {
      id: state.id,
      connections: outgoing + incoming,
      name: state.name
    };
  });
  
  // Sort states by connection count (descending)
  stateConnections.sort((a, b) => b.connections - a.connections);
  
  // Create partitions by distributing states across partitions, starting with the most connected
  const partitions = Array.from({ length: validTargetPartitions }, () => []);
  
  // Distribute the top N most connected states across partitions as "seeds"
  for (let i = 0; i < Math.min(validTargetPartitions, stateConnections.length); i++) {
    partitions[i].push(stateConnections[i].id);
  }
  
  // Distribute remaining states to the partition with the fewest connections to that state
  for (let i = validTargetPartitions; i < stateConnections.length; i++) {
    const stateId = stateConnections[i].id;
    
    // For each state, find which partition it has the most connections to
    const partitionConnections = partitions.map((partition, idx) => {
      let connectionCount = 0;
      
      // Get the state object
      const state = states.find(s => s.id === stateId);
      
      // Count outgoing connections to states in this partition
      connectionCount += state.rules.filter(rule => 
        partition.includes(rule.nextState)
      ).length;
      
      // Count incoming connections from states in this partition
      states.forEach(s => {
        if (partition.includes(s.id)) {
          connectionCount += s.rules.filter(rule => rule.nextState === stateId).length;
        }
      });
      
      return { partitionIndex: idx, connections: connectionCount };
    });
    
    // Sort partitions by connection count (descending)
    partitionConnections.sort((a, b) => b.connections - a.connections);
    
    // Add this state to the partition with the most connections
    partitions[partitionConnections[0].partitionIndex].push(stateId);
  }
  
  // Filter out any empty partitions
  return partitions.filter(partition => partition.length > 0);
};

/**
 * Creates a subgraph from the original graph containing only the specified states
 * Preserves all necessary state properties and rule connections
 * 
 * @param {Array} originalStates - Array of all state objects
 * @param {Array} stateIds - Array of state IDs to include in the subgraph
 * @returns {Object} Object containing the subgraph states and boundary states
 */
const createSubgraph = (originalStates, stateIds) => {
  const subgraphStates = [];
  const boundaryStates = new Set();
  
  // Create deep copies of the selected states
  stateIds.forEach(stateId => {
    const originalState = originalStates.find(s => s.id === stateId);
    if (originalState) {
      const stateCopy = {
        ...originalState,
        rules: [...originalState.rules] // shallow copy rules array
      };
      
      // Check for rules that point to states outside this subgraph
      stateCopy.rules.forEach(rule => {
        if (rule.nextState && !stateIds.includes(rule.nextState)) {
          // This rule points to a state outside our subgraph
          boundaryStates.add(rule.nextState);
        }
      });
      
      subgraphStates.push(stateCopy);
    }
  });
  
  // Find incoming boundary states (states outside the subgraph that point to states in the subgraph)
  const incomingBoundaryStates = new Set();
  originalStates.forEach(state => {
    if (!stateIds.includes(state.id)) {
      state.rules.forEach(rule => {
        if (rule.nextState && stateIds.includes(rule.nextState)) {
          incomingBoundaryStates.add(state.id);
        }
      });
    }
  });
  
  // Get the state objects for all boundary states
  const outgoingBoundaryStateObjects = Array.from(boundaryStates).map(id => {
    const state = originalStates.find(s => s.id === id);
    return state ? { id: state.id, name: state.name } : null;
  }).filter(Boolean);
  
  const incomingBoundaryStateObjects = Array.from(incomingBoundaryStates).map(id => {
    const state = originalStates.find(s => s.id === id);
    return state ? { id: state.id, name: state.name } : null;
  }).filter(Boolean);
  
  return {
    states: subgraphStates,
    outgoingBoundaries: outgoingBoundaryStateObjects,
    incomingBoundaries: incomingBoundaryStateObjects
  };
};

/**
 * Exports a subgraph to a CSV file
 * 
 * @param {Array} states - Array of state objects in the subgraph
 * @param {string} graphName - Name to use for the exported file
 * @param {Array} allStates - All states in the original graph (used to look up boundary state names)
 * @returns {Promise<void>}
 */
const exportSubgraphToCSV = async (states, graphName, allStates) => {
  try {
    if (!states || states.length === 0) {
      toast.error('No states to export');
      return;
    }
    
    if (!graphName) {
      toast.error('Graph name is required');
      return;
    }
    
    // Identify source file for storage lookup
    const sourceFile = states.length > 0 && states[0].graphSource ? states[0].graphSource : null;
    
    // Generate CSV data using helper function
    const { csvData, hasData } = await generateSubgraphCSVData(states, allStates, sourceFile);
    
    if (!hasData) {
      toast.error('No data to export');
      return;
    }
    
    // Create workbook
    const workbook = createWorkbookFromCSVData(csvData);
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const cleanName = graphName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${cleanName}_${timestamp}.csv`;
    
    // Export file
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: 'text/csv' });
    saveAs(blob, filename);
    
    toast.success(`Exported ${filename} successfully`);
  } catch (error) {
    console.error('Error exporting subgraph:', error);
    toast.error(`Failed to export: ${error.message}`);
  }
};

/**
 * Helper function to identify and extract rules that cross subgraph boundaries
 * 
 * @param {Object} subgraph - The subgraph to analyze
 * @param {Array} allStates - All states in the original graph
 * @returns {Array} Array of objects with source state, rule condition, and destination state
 */
const getBoundaryRules = (subgraph, allStates) => {
  if (!subgraph || !subgraph.states || !allStates) return [];
  
  // Get IDs of states in this subgraph
  const subgraphStateIds = new Set(subgraph.states.map(s => s.id));
  
  // Find all rules that point to states outside this subgraph
  const boundaryRules = [];
  
  subgraph.states.forEach(state => {
    state.rules.forEach(rule => {
      if (rule.nextState && !subgraphStateIds.has(rule.nextState)) {
        // This rule points to a state outside our subgraph
        const isIdFormat = typeof rule.nextState === 'string' && rule.nextState.startsWith('id_');
        const externalState = allStates.find(s => s.id === rule.nextState);
        
        boundaryRules.push({
          sourceState: state.name,
          sourceStateId: state.id,
          destStateId: rule.nextState,
          destState: externalState 
            ? externalState.name 
            : isIdFormat ? "Unknown State" : rule.nextState,
          condition: rule.condition || 'No condition'
        });
      }
    });
  });
  
  return boundaryRules;
};

/**
 * Main GraphSplitterModal component
 */
const GraphSplitterModal = ({ onClose, states }) => {
  const [partitions, setPartitions] = useState([]);
  const [subgraphs, setSubgraphs] = useState([]);
  const [selectedPartition, setSelectedPartition] = useState(null);
  const [numPartitions, setNumPartitions] = useState(DEFAULT_TARGET_PARTITIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  
  /**
   * Calculates partitions and updates both partitions and subgraphs state
   * Wrapped in useCallback to be reused by both useEffect and Recalculate button
   */
  const calculatePartitions = useCallback(() => {
    if (!states || states.length === 0) {
      toast.error('No states available to partition');
      return;
    }
    
    // Validate numPartitions
    const validatedNum = Math.max(2, Math.min(10, Math.floor(numPartitions)));
    if (validatedNum > states.length) {
      toast.error(`Cannot create ${validatedNum} partitions from ${states.length} states. Maximum partitions: ${states.length}`);
      return;
    }
    
    setIsProcessing(true);
    
    // Use timeout to prevent UI blocking
    const timeoutId = setTimeout(() => {
      try {
        const calculatedPartitions = findPartitions(states, validatedNum);
        setPartitions(calculatedPartitions);
        
        // Create subgraphs from the partitions
        const subgraphsData = calculatedPartitions.map((stateIds, index) => {
          const subgraph = createSubgraph(states, stateIds);
          return {
            ...subgraph,
            name: `Subgraph-${index + 1}`,
            id: index.toString()
          };
        });
        
        setSubgraphs(subgraphsData);
        if (subgraphsData.length > 0) {
          setSelectedPartition(subgraphsData[0].id);
        }
        
        toast.success(`Created ${subgraphsData.length} subgraphs`);
      } catch (error) {
        console.error('Error calculating partitions:', error);
        toast.error(`Failed to calculate partitions: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, CALCULATION_DELAY);
    
    // Return cleanup function
    return () => clearTimeout(timeoutId);
  }, [states, numPartitions]);
  
  // Calculate partitions when the modal opens or when states/numPartitions change
  useEffect(() => {
    if (states && states.length > 0) {
      const cleanup = calculatePartitions();
      return cleanup;
    }
  }, [states, calculatePartitions]);
  
  /**
   * Handles downloading a single subgraph as a CSV file
   * 
   * @param {string} subgraphId - ID of the subgraph to download
   */
  const handleDownloadSubgraph = useCallback(async (subgraphId) => {
    try {
      const subgraph = subgraphs.find(sg => sg.id === subgraphId);
      if (!subgraph) {
        toast.error('Subgraph not found');
        return;
      }
      if (!subgraph.states || subgraph.states.length === 0) {
        toast.error('Subgraph has no states to export');
        return;
      }
      await exportSubgraphToCSV(subgraph.states, subgraph.name, states);
    } catch (error) {
      console.error('Error downloading subgraph:', error);
      toast.error(`Failed to download subgraph: ${error.message}`);
    }
  }, [subgraphs, states]);
  
  /**
   * Handles downloading all subgraphs as a zip file containing individual CSV files
   */
  const handleDownloadAllSubgraphs = useCallback(async () => {
    try {
      if (!subgraphs || subgraphs.length === 0) {
        toast.error('No subgraphs to export');
        return;
      }
      
      const zip = new JSZip();
      
      // Add each subgraph as a separate file in the zip
      for (let i = 0; i < subgraphs.length; i++) {
        const subgraph = subgraphs[i];
        
        if (!subgraph.states || subgraph.states.length === 0) {
          console.warn(`Skipping empty subgraph: ${subgraph.name}`);
          continue;
        }
        
        // Identify source file
        const sourceFile = subgraph.states.length > 0 && subgraph.states[0].graphSource 
          ? subgraph.states[0].graphSource 
          : null;
        
        // Generate CSV data using helper function
        const { csvData } = await generateSubgraphCSVData(subgraph.states, states, sourceFile);
        
        // Create workbook
        const workbook = createWorkbookFromCSVData(csvData);
        
        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const cleanName = subgraph.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${cleanName}_${timestamp}.csv`;
        
        // Get CSV buffer and add to zip
        const csvBuffer = await workbook.csv.writeBuffer();
        zip.file(filename, csvBuffer);
      }
      
      // Add metadata JSON file
      const metadata = {
        originalGraphSize: states.length,
        partitions: subgraphs.map(sg => ({
          name: sg.name,
          size: sg.states ? sg.states.length : 0,
          stateIds: sg.states ? sg.states.map(s => s.id) : [],
          outgoingBoundaries: (sg.outgoingBoundaries || []).map(b => {
            const isIdFormat = typeof b.id === 'string' && b.id.startsWith('id_');
            const resolvedName = b.name || (isIdFormat ? 
              (states.find(s => s.id === b.id)?.name || 'Unknown State') : b.id);
            return { id: b.id, name: resolvedName };
          }),
          incomingBoundaries: (sg.incomingBoundaries || []).map(b => {
            const isIdFormat = typeof b.id === 'string' && b.id.startsWith('id_');
            const resolvedName = b.name || (isIdFormat ? 
              (states.find(s => s.id === b.id)?.name || 'Unknown State') : b.id);
            return { id: b.id, name: resolvedName };
          })
        }))
      };
      
      zip.file('partitioning-metadata.json', JSON.stringify(metadata, null, 2));
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'state-machine-subgraphs.zip');
      
      toast.success(`Exported ${subgraphs.length} subgraphs successfully`);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      toast.error(`Failed to create ZIP file: ${error.message}`);
    }
  }, [subgraphs, states]);
  
  // Memoize boundary rules calculation for the selected subgraph
  const boundaryRules = useMemo(() => {
    if (!selectedPartition) return [];
    const subgraph = subgraphs.find(sg => sg.id === selectedPartition);
    return getBoundaryRules(subgraph, states);
  }, [selectedPartition, subgraphs, states]);
  
  // Get the currently selected subgraph
  const selectedSubgraph = selectedPartition 
    ? subgraphs.find(sg => sg.id === selectedPartition) 
    : null;
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Handle number input changes with validation
  const handleNumPartitionsChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setNumPartitions(DEFAULT_TARGET_PARTITIONS);
      return;
    }
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      setNumPartitions(Math.max(2, Math.min(10, Math.floor(parsed))));
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-[85%] h-[85vh] max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Graph Splitter
          </h2>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={onClose}
            aria-label="Close graph splitter modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Explanation of Splitting Logic */}
          <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">How Splitting Works:</h4>
            <p className="text-gray-700 dark:text-gray-300">
              The splitter first looks for any parts of your graph that are already completely separate (disconnected components). 
              If the whole graph is connected, it uses an algorithm to find the most logical way to divide it. 
              This algorithm groups states that are closely linked together and tries to minimize the connections *between* different groups. 
              It aims for a default of 3 subgraphs, but the final number depends on the natural structure and connections within your state machine, resulting in the most sensible divisions.
            </p>
          </div>
          
          {/* Loading or Content */}
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Calculating partitions...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex">
              {/* Left Side - Partition List */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Partition Options</h3>
                  <div className="flex items-center gap-2">
                    <label htmlFor="num-partitions-input" className="text-sm text-gray-700 dark:text-gray-300">
                      Target Partitions:
                    </label>
                    <input 
                      id="num-partitions-input"
                      type="number" 
                      min={2} 
                      max={10} 
                      value={numPartitions} 
                      onChange={handleNumPartitionsChange}
                      aria-label="Number of target partitions"
                      className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 
                                dark:bg-gray-800 dark:text-gray-200"
                    />
                    <Button 
                      size="sm" 
                      onClick={calculatePartitions}
                      disabled={isProcessing}
                      className="ml-2 text-xs py-1"
                      aria-label="Recalculate partitions"
                    >
                      Recalculate
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Generated Subgraphs</h3>
                
                {subgraphs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No partitions could be generated. Try adjusting the target number of partitions.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {subgraphs.map((subgraph) => {
                      // Check if this subgraph has boundary connections
                      const hasBoundaryConnections = subgraph.outgoingBoundaries.length > 0 || subgraph.incomingBoundaries.length > 0;
                      
                      return (
                        <li key={subgraph.id}>
                          <button
                            onClick={() => setSelectedPartition(subgraph.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center
                                      ${selectedPartition === subgraph.id 
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{subgraph.name}</span>
                              <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
                                ({subgraph.states.length} states)
                              </span>
                              {hasBoundaryConnections && (
                                <span 
                                  className="ml-1 flex-shrink-0 inline-block w-2 h-2 rounded-full bg-orange-400" 
                                  title="Has external connections"
                                  aria-label="Has external connections"
                                >
                                </span>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadSubgraph(subgraph.id);
                              }}
                              title="Download this subgraph"
                              aria-label={`Download ${subgraph.name}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                
                {subgraphs.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4 text-sm"
                    onClick={handleDownloadAllSubgraphs}
                  >
                    <FileBox className="h-4 w-4 mr-2" />
                    Download All Subgraphs (ZIP)
                  </Button>
                )}
              </div>
              
              {/* Right Side - Selected Partition Details */}
              <div className="w-2/3 overflow-y-auto p-4">
                {selectedSubgraph ? (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {selectedSubgraph.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Contains {selectedSubgraph.states.length} states and {
                          selectedSubgraph.states.reduce((sum, state) => sum + state.rules.length, 0)
                        } rules
                      </p>
                    </div>
                    
                    {/* States list */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        States in this subgraph
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedSubgraph.states.map(state => (
                          <div 
                            key={state.id}
                            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm"
                          >
                            {state.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Boundary connections */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Outgoing boundaries */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                          <ArrowLeftRight className="h-4 w-4 mr-1 text-blue-500" />
                          Outgoing Connections ({selectedSubgraph.outgoingBoundaries.length})
                        </h4>
                        {selectedSubgraph.outgoingBoundaries.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No outgoing connections to other subgraphs
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {selectedSubgraph.outgoingBoundaries.map(boundary => (
                              <li 
                                key={boundary.id}
                                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 text-sm"
                              >
                                {boundary.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      {/* Incoming boundaries */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                          <ArrowLeftRight className="h-4 w-4 mr-1 text-purple-500" />
                          Incoming Connections ({selectedSubgraph.incomingBoundaries.length})
                        </h4>
                        {selectedSubgraph.incomingBoundaries.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No incoming connections from other subgraphs
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {selectedSubgraph.incomingBoundaries.map(boundary => (
                              <li 
                                key={boundary.id}
                                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800 text-sm"
                              >
                                {boundary.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    {/* Detailed boundary connections table */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <ArrowLeftRight className="h-4 w-4 mr-1 text-orange-500" />
                        Cross-Boundary Rules
                      </h4>
                      {boundaryRules.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No cross-boundary rules found
                        </p>
                      ) : (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" aria-label="Cross-boundary rules table">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Source State
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Rule
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Destination State
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                              {boundaryRules.map((rule, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    {rule.sourceState}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                                    {rule.condition}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-orange-600 dark:text-orange-400 font-medium">
                                    {rule.destState}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <Scissors className="h-16 w-16 mb-4 opacity-20" />
                    <p>Select a subgraph from the list to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Modal footer with explanatory text and legend */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col">
          {subgraphs.length > 0 && (
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <span className="inline-flex items-center mr-1">
                <span className="w-2 h-2 inline-block bg-orange-400 rounded-full mr-1.5"></span>
              </span>
              Indicates subgraphs with connections to states in other subgraphs
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {subgraphs.length > 0 
                ? `Created ${subgraphs.length} subgraphs from ${states.length} total states`
                : 'Use the Edit button to define subgraphs and split your state machine'
              }
            </div>
            <Button 
              onClick={onClose}
              variant="default"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

GraphSplitterModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  states: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rules: PropTypes.arrayOf(
        PropTypes.shape({
          nextState: PropTypes.string,
          condition: PropTypes.string,
          priority: PropTypes.number,
          operation: PropTypes.string
        })
      ).isRequired,
      graphSource: PropTypes.string
    })
  ).isRequired
};

export default GraphSplitterModal; 