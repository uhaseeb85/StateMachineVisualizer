/**
 * useFileOperations Hook
 * 
 * Provides file import/export operations for the State Machine Visualizer.
 * Implements Interface Segregation Principle by focusing only on file I/O.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles file operations
 * - Interface Segregation: Components use only file I/O, not full state management
 */

import { useCallback } from 'react';
import { getFileParserRegistry } from '../services/parsing/FileParserRegistry';
import { getExportService } from '../services/export/ExportService';
import { useNotification } from '../context/ServicesContext';

/**
 * Custom hook for file import/export operations
 * 
 * @param {Array} states - Current states array
 * @param {Function} setStates - State setter function
 * @param {Function} addToChangeLog - Change log callback
 * @returns {Object} File operation functions
 */
export const useFileOperations = (states, setStates, addToChangeLog = () => {}) => {
  const notification = useNotification();
  const parserRegistry = getFileParserRegistry();
  const exportService = getExportService();

  /**
   * Imports a file and parses it to states
   * 
   * @param {File} file - File to import
   * @param {Object} options - Import options { merge, replaceExisting }
   * @returns {Promise<boolean>} True if successful
   */
  const importFile = useCallback(async (file, options = {}) => {
    const { merge = false, replaceExisting = false } = options;

    try {
      // Parse file using registry
      const parsedStates = await parserRegistry.parseFile(file);

      if (!parsedStates || parsedStates.length === 0) {
        notification.error('No valid data found in file');
        return false;
      }

      // Merge or replace
      if (merge && !replaceExisting) {
        const mergedStates = exportService.mergeStates(states, parsedStates);
        setStates(mergedStates);
        addToChangeLog(`Merged ${parsedStates.length} states from ${file.name}`);
      } else {
        setStates(parsedStates);
        addToChangeLog(`Imported ${parsedStates.length} states from ${file.name}`);
      }

      notification.success(`Successfully imported ${file.name}`);
      return true;
    } catch (error) {
      console.error('Import error:', error);
      notification.error(`Import failed: ${error.message}`);
      return false;
    }
  }, [states, setStates, addToChangeLog, notification, parserRegistry, exportService]);

  /**
   * Exports states to a file
   * 
   * @param {string} filename - Export filename (without extension)
   * @param {string} format - Export format ('csv' or 'excel')
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} True if successful
   */
  const exportFile = useCallback(async (filename, format = 'csv', options = {}) => {
    try {
      if (states.length === 0) {
        notification.error('No data to export');
        return false;
      }

      await exportService.export(states, filename, format, options);
      addToChangeLog(`Exported state machine to ${filename}.${format}`);
      notification.success('Export successful');
      return true;
    } catch (error) {
      console.error('Export error:', error);
      notification.error(`Export failed: ${error.message}`);
      return false;
    }
  }, [states, addToChangeLog, notification, exportService]);

  /**
   * Exports to CSV format
   * 
   * @param {string} filename - Export filename
   * @returns {Promise<boolean>} True if successful
   */
  const exportToCSV = useCallback(async (filename) => {
    return exportFile(filename, 'csv');
  }, [exportFile]);

  /**
   * Exports to Excel format
   * 
   * @param {string} filename - Export filename
   * @returns {Promise<boolean>} True if successful
   */
  const exportToExcel = useCallback(async (filename) => {
    return exportFile(filename, 'excel');
  }, [exportFile]);

  /**
   * Gets supported import file extensions
   * 
   * @returns {string} Accept string for file input
   */
  const getSupportedImportExtensions = useCallback(() => {
    return parserRegistry.getAcceptString();
  }, [parserRegistry]);

  /**
   * Checks if a file can be imported
   * 
   * @param {File} file - File to check
   * @returns {boolean} True if file can be imported
   */
  const canImportFile = useCallback((file) => {
    return parserRegistry.canParse(file);
  }, [parserRegistry]);

  return {
    importFile,
    exportFile,
    exportToCSV,
    exportToExcel,
    getSupportedImportExtensions,
    canImportFile
  };
};

export default useFileOperations;
