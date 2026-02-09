/**
 * useStateMachineImportExport.js
 * 
 * Import/Export operations hook (SRP).
 * Handles file import/export using parsing and export services - separated from state management.
 */

import { useCallback } from 'react';
import { useNotification } from '../context/ServicesContext';
import { parseFile } from '../services/parsing/FileParserRegistry';
import { getExportService } from '../services/export/ExportService';
import { validateExcelData, sortRulesByPriority } from '../utils';

/**
 * Hook for import/export operations
 * Uses dependency-injected parsing and export services
 * @param {Array} states - Current states array
 * @param {Function} onStatesImported - Callback when states are imported (states, filename)
 * @returns {Object} Import/export methods
 */
export const useStateMachineImportExport = (states, onStatesImported) => {
  const notification = useNotification();
  const exportService = getExportService();

  /**
   * Import state machine from file (CSV or Excel)
   * @param {File} file - File to import
   * @param {object} options - Import options
   * @param {boolean} options.merge - Merge with existing states (default: false)
   * @param {object} options.ruleDictionary - Rule dictionary for lookups
   * @returns {Promise<Object>} Import result {success, states, message}
   */
  const importFile = useCallback(async (file, options = {}) => {
    const { merge = false, ruleDictionary = {} } = options;

    try {
      // Parse file using appropriate parser
      const rows = await parseFile(file);
      
      if (!rows || rows.length === 0) {
        throw new Error('No data found in file');
      }

      // Validate Excel data structure
      const { sourceNodeIndex, destNodeIndex, ruleListIndex, headers } = validateExcelData(rows);

      // Convert rows to state machine format
      const stateMap = new Map();
      
      rows.forEach(row => {
        const sourceNode = row[headers[sourceNodeIndex]]?.trim();
        const destNode = row[headers[destNodeIndex]]?.trim();
        const ruleList = row[headers[ruleListIndex]]?.trim() || '';

        if (!sourceNode) return;

        // Get or create source state
        if (!stateMap.has(sourceNode)) {
          stateMap.set(sourceNode, {
            id: `state-${Date.now()}-${Math.random()}`,
            name: sourceNode,
            rules: []
          });
        }

        const state = stateMap.get(sourceNode);

        // Add rule if destination exists
        if (destNode && ruleList) {
          // Look up rule in dictionary
          let ruleDescription = ruleList;
          for (const [key, description] of Object.entries(ruleDictionary)) {
            if (ruleList.includes(key)) {
              ruleDescription = description;
              break;
            }
          }

          state.rules.push({
            id: `rule-${Date.now()}-${Math.random()}`,
            condition: ruleDescription,
            nextState: null, // Will be resolved after all states are created
            _targetStateName: destNode // Temporary field
          });
        }
      });

      // Convert map to array
      let importedStates = Array.from(stateMap.values());

      // Resolve rule next state IDs
      importedStates = importedStates.map(state => ({
        ...state,
        rules: state.rules.map(rule => {
          const targetState = importedStates.find(s => s.name === rule._targetStateName);
          return {
            id: rule.id,
            condition: rule.condition,
            nextState: targetState ? targetState.id : null
          };
        }).filter(rule => rule.nextState !== null) // Remove rules with invalid targets
      }));

      // Sort rules by priority
      importedStates = importedStates.map(state => ({
        ...state,
        rules: sortRulesByPriority(state.rules)
      }));

      // Merge or replace
      let finalStates = importedStates;
      if (merge && states.length > 0) {
        // Merge logic: combine states by name
        const mergedMap = new Map();
        
        // Add existing states
        states.forEach(state => {
          mergedMap.set(state.name, state);
        });
        
        // Add/merge imported states
        importedStates.forEach(importedState => {
          if (mergedMap.has(importedState.name)) {
            // Merge rules
            const existing = mergedMap.get(importedState.name);
            mergedMap.set(importedState.name, {
              ...existing,
              rules: [...existing.rules, ...importedState.rules]
            });
          } else {
            mergedMap.set(importedState.name, importedState);
          }
        });
        
        finalStates = Array.from(mergedMap.values());
      }

      // Notify caller
      if (onStatesImported) {
        onStatesImported(finalStates, file.name);
      }

      notification.success(`Imported ${importedStates.length} states from ${file.name}`);
      
      return {
        success: true,
        states: finalStates,
        message: `Imported ${importedStates.length} states`
      };
    } catch (error) {
      console.error('Import error:', error);
      notification.error(`Failed to import file: ${error.message}`);
      
      return {
        success: false,
        states: null,
        message: error.message
      };
    }
  }, [states, notification, onStatesImported]);

  /**
   * Export states to CSV file
   * @param {string} filename - Output filename (without extension)
   * @param {object} options - Export options
   * @param {object} options.loadedDictionary - Rule dictionary for lookups
   * @param {string} options.format - Export format ('csv' or 'excel')
   * @returns {Promise<void>}
   */
  const exportStates = useCallback(async (filename, options = {}) => {
    const { loadedDictionary = {}, format = 'csv' } = options;

    try {
      // Convert states to export rows
      const rows = exportService.convertStatesToRows(states, { loadedDictionary });

      if (rows.length === 0) {
        notification.warning('No data to export');
        return;
      }

      // Export using service
      await exportService.export(rows, filename, format);
      notification.success(`Exported ${rows.length} rows to ${filename}.${format === 'excel' ? 'xlsx' : 'csv'}`);
    } catch (error) {
      console.error('Export error:', error);
      notification.error(`Failed to export: ${error.message}`);
      throw error;
    }
  }, [states, exportService, notification]);

  /**
   * Export as JSON
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<void>}
   */
  const exportJSON = useCallback(async (filename) => {
    try {
      const json = JSON.stringify({ states }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      URL.revokeObjectURL(url);
      
      notification.success(`Exported to ${filename}.json`);
    } catch (error) {
      console.error('JSON export error:', error);
      notification.error(`Failed to export JSON: ${error.message}`);
      throw error;
    }
  }, [states, notification]);

  /**
   * Import from JSON file
   * @param {File} file - JSON file to import
   * @returns {Promise<Object>} Import result
   */
  const importJSON = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.states || !Array.isArray(data.states)) {
        throw new Error('Invalid JSON format: missing states array');
      }

      if (onStatesImported) {
        onStatesImported(data.states, file.name);
      }

      notification.success(`Imported ${data.states.length} states from ${file.name}`);
      
      return {
        success: true,
        states: data.states,
        message: `Imported ${data.states.length} states`
      };
    } catch (error) {
      console.error('JSON import error:', error);
      notification.error(`Failed to import JSON: ${error.message}`);
      
      return {
        success: false,
        states: null,
        message: error.message
      };
    }
  }, [notification, onStatesImported]);

  return {
    importFile,
    exportStates,
    exportJSON,
    importJSON
  };
};
