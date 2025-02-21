/**
 * Custom hook for managing state machine configuration
 * Provides functionality for:
 * - Creating and managing states and rules
 * - Importing/Exporting state machine configuration
 * - Theme management (dark/light mode)
 * - Change logging and persistence
 * - Excel/CSV data import with validation
 */

import { useState, useEffect } from 'react';
import { parseExcelFile, validateExcelData, generateId } from '../utils';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

/**
 * @typedef {Object} Rule
 * @property {string} id - Unique identifier for the rule
 * @property {string} condition - Rule condition/description
 * @property {string} nextState - ID of the target state if rule matches
 */

/**
 * @typedef {Object} State
 * @property {string} id - Unique identifier for the state
 * @property {string} name - Display name of the state
 * @property {Rule[]} rules - Array of rules for this state
 */

/**
 * @typedef {Object} ChangeLogEntry
 * @property {string} timestamp - Timestamp of the change
 * @property {string} message - Description of the change
 */

/**
 * Hook for managing state machine configuration and operations
 * @returns {Object} State machine management methods and state
 */
export default function useStateMachine() {
  // Core state management
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  
  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // UI state
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  // Change logging
  const [changeLog, setChangeLog] = useState(() => {
    // Initialize changeLog from localStorage
    const savedChangeLog = localStorage.getItem('changeLog');
    return savedChangeLog ? JSON.parse(savedChangeLog) : [];
  });

  /** Maximum number of entries to keep in change log */
  const MAX_HISTORY_ENTRIES = 2000;

  /**
   * Persist change log to localStorage on updates
   */
  useEffect(() => {
    localStorage.setItem('changeLog', JSON.stringify(changeLog));
  }, [changeLog]);

  /**
   * Load saved states and theme preference on initialization
   */
  useEffect(() => {
    const savedFlow = localStorage.getItem('ivrFlow');
    if (savedFlow) {
      setStates(JSON.parse(savedFlow));
    }

    const darkModePreference = localStorage.getItem('darkMode');
    setIsDarkMode(darkModePreference === null ? false : darkModePreference === 'true');
  }, []);

  /**
   * Update theme and persist preference
   */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  /**
   * Toggles between light and dark theme
   */
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  /**
   * Adds a new entry to the change log
   * @param {string} message - Description of the change
   */
  const addToChangeLog = (message) => {
    const timestamp = new Date().toLocaleString();
    setChangeLog(prev => {
      const newLog = [{ timestamp, message }, ...prev];
      const updatedLog = newLog.slice(0, MAX_HISTORY_ENTRIES);
      localStorage.setItem('changeLog', JSON.stringify(updatedLog));
      return updatedLog;
    });
  };

  /**
   * Saves current state machine configuration to localStorage
   * Shows a temporary success notification
   */
  const saveFlow = () => {
    localStorage.setItem('ivrFlow', JSON.stringify(states));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
    addToChangeLog('Saved state machine configuration');
  };

  /**
   * Adds a new state to the state machine
   * @param {string} name - Name of the new state
   */
  const addState = (name) => {
    if (name.trim()) {
      const newState = {
        id: generateId(),
        name: name.trim(),
        rules: [],
      };
      setStates(prevStates => [...prevStates, newState]);
      addToChangeLog(`Added state: ${name.trim()}`);
    }
  };

  /**
   * Deletes a state if it's not referenced by other states' rules
   * @param {string} stateId - ID of the state to delete
   */
  const handleDeleteState = (stateId) => {
    // Find the state we want to delete
    const stateToDelete = states.find(s => s.id === stateId);
    if (!stateToDelete) return;

    // Check if any other state has a rule pointing to this state
    const referencingStates = states.filter(state => 
      state.id !== stateId && // Don't check the state's own rules
      state.rules.some(rule => rule.nextState === stateId)
    );

    if (referencingStates.length > 0) {
      toast.error(`Cannot delete state "${stateToDelete.name}" because it is used as a target state in other rules`);
      return;
    }

    // If not referenced, proceed with deletion
    setStates(currentStates => currentStates.filter(state => state.id !== stateId));
    addToChangeLog(`Deleted state: ${stateToDelete.name}`);
  };

  /**
   * Imports state machine configuration from a JSON file
   * @param {Event} event - File input change event
   */
  const handleImport = async (event) => {
    try {
      const file = event.target.files[0];
      const text = await file.text();
      const importedStates = JSON.parse(text);
      setStates(importedStates);
      addToChangeLog(`Imported state machine configuration from file: ${file.name}`);
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing file: ' + error.message);
    }
  };

  /**
   * Imports state machine configuration from an Excel file
   * Processes Source Node, Destination Node, and Rule List columns
   * @param {Event} event - File input change event
   */
  const handleExcelImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const rows = await parseExcelFile(file);
      
      // Store complete original data
      const headers = rows[0];
      const jsonData = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
      localStorage.setItem('lastImportedCSV', JSON.stringify(jsonData));

      // Process data and create states
      const stateMap = new Map();
      
      // Find required column indices
      const sourceNodeIndex = headers.indexOf('Source Node');
      const destNodeIndex = headers.indexOf('Destination Node');
      const ruleListIndex = headers.indexOf('Rule List');

      if (sourceNodeIndex === -1 || destNodeIndex === -1 || ruleListIndex === -1) {
        throw new Error('Required columns not found: "Source Node", "Destination Node", "Rule List"');
      }

      // Process rows and build state machine
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.some(cell => cell)) continue;

        const sourceNode = row[sourceNodeIndex]?.toString().trim();
        const destNode = row[destNodeIndex]?.toString().trim();
        const ruleList = row[ruleListIndex]?.toString().trim();

        if (!sourceNode || !destNode || !ruleList) continue;

        // Create states if they don't exist
        if (!stateMap.has(sourceNode)) {
          stateMap.set(sourceNode, {
            id: generateId(),
            name: sourceNode,
            rules: []
          });
        }
        if (!stateMap.has(destNode)) {
          stateMap.set(destNode, {
            id: generateId(),
            name: destNode,
            rules: []
          });
        }

        // Add rule
        const sourceState = stateMap.get(sourceNode);
        const targetState = stateMap.get(destNode);
        sourceState.rules.push({
          id: generateId(),
          condition: ruleList,
          nextState: targetState.id
        });
      }

      const newStates = Array.from(stateMap.values());
      if (newStates.length === 0) {
        throw new Error('No valid states found in the file');
      }

      setStates(newStates);
      toast.success(`Import successful! Created ${newStates.length} states.`);
      addToChangeLog(`Imported Excel configuration: ${newStates.length} states created`);

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error importing file: ' + error.message);
    }
  };

  /**
   * Exports current state machine configuration to a JSON file
   */
  const exportConfiguration = () => {
    const content = JSON.stringify(states, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `state-machine-config-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToChangeLog(`Exported state machine configuration to: ${fileName}`);
  };

  /**
   * Imports rule dictionary from Excel/CSV file
   * Validates required columns and creates rule mappings
   * @param {Event} event - File input change event
   * @returns {Promise<void>}
   */
  const handleRuleDictionaryImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls) or CSV file (.csv)');
        return;
      }

      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Validate sheet structure
            if (jsonData.length === 0) {
              toast.error('The Excel file is empty');
              return;
            }

            // Check if required columns exist
            const firstRow = jsonData[0];
            if (!('rule name' in firstRow) || !('rule description' in firstRow)) {
              toast.error('Excel file must contain "rule name" and "rule description" columns');
              return;
            }

            // Create a dictionary from the Excel data
            const ruleDictionary = {};
            let hasValidData = false;

            jsonData.forEach(row => {
              if (row['rule name'] && row['rule description']) {
                ruleDictionary[row['rule name']] = row['rule description'];
                hasValidData = true;
              }
            });

            if (!hasValidData) {
              toast.error('No valid rules found in the Excel file');
              return;
            }

            const rulesCount = Object.keys(ruleDictionary).length;

            // Show success notification and return the result
            toast.success(`Rule dictionary imported successfully! Updated ${rulesCount} rules.`);
            resolve({
              dictionary: ruleDictionary,
              rulesCount: rulesCount
            });
          } catch (error) {
            toast.error('Error processing Excel file: ' + error.message);
            reject(error);
          }
        };

        reader.onerror = () => {
          toast.error('Error reading the file');
          reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error importing rule dictionary:', error);
      toast.error(`Error importing rule dictionary: ${error.message}`);
    }
  };

  return {
    states,
    setStates,
    selectedState,
    setSelectedState,
    isDarkMode,
    showSaveNotification,
    changeLog,
    setChangeLog,
    addToChangeLog,
    toggleTheme,
    saveFlow,
    addState,
    handleDeleteState,
    handleImport,
    handleExcelImport,
    exportConfiguration,
    handleRuleDictionaryImport
  };
}
