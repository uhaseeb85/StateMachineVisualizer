/**
 * useStateMachineOrchestrator.js
 * 
 * Orchestrator hook that composes all focused hooks.
 * Provides unified interface while maintaining separation of concerns (SRP + ISP).
 * This is the main hook that components will use.
 */

import { useCallback } from 'react';
import { useStateMachineState } from './useStateMachineState';
import { useStateMachinePersistence } from './useStateMachinePersistence';
import { useStateMachineHistory } from './useStateMachineHistory';
import { useStateMachineImportExport } from './useStateMachineImportExport';
import { useChangeLog } from './useChangeLog';
import { useThemeManagement } from './useThemeManagement';

/**
 * Main state machine orchestrator hook
 * Composes focused hooks and provides unified interface
 * @returns {Object} Complete state machine management interface
 */
export const useStateMachineOrchestrator = () => {
  // Core state management
  const stateOps = useStateMachineState();
  const {
    states,
    selectedState,
    setStates,
    setSelectedState,
    addState: addStateCore,
    editState: editStateCore,
    deleteState: deleteStateCore,
    getState,
    getSelectedStateObject,
    clearStates,
    replaceStates
  } = stateOps;

  // Persistence
  const persistenceOps = useStateMachinePersistence(states, (loadedStates) => {
    replaceStates(loadedStates);
  });
  const {
    isLoading,
    currentFileName,
    showSaveNotification,
    setCurrentFileName,
    saveStates,
    saveFileName,
    clearPersistedData,
    saveImportedCSV,
    loadImportedCSV,
    hasStoredData
  } = persistenceOps;

  // History (undo/redo)
  const historyOps = useStateMachineHistory(
    states,
    selectedState,
    (restoredStates, restoredSelectedState) => {
      setStates(restoredStates);
      setSelectedState(restoredSelectedState);
    }
  );
  const {
    undo,
    redo,
    withUndoCapture,
    pushToUndoStack,
    captureSnapshot,
    clearHistory,
    canUndo,
    canRedo
  } = historyOps;

  // Import/Export
  const importExportOps = useStateMachineImportExport(states, (importedStates, filename) => {
    replaceStates(importedStates);
    setCurrentFileName(filename);
    saveFileName(filename);
  });
  const {
    importFile,
    exportStates,
    exportJSON,
    importJSON
  } = importExportOps;

  // Change log
  const changeLogOps = useChangeLog();
  const {
    changeLog,
    setChangeLog,
    addToChangeLog: addToChangeLogCore,
    clearChangeLog,
    exportChangeLog
  } = changeLogOps;

  // Theme
  const themeOps = useThemeManagement();
  const {
    isDarkMode,
    toggleTheme,
    setTheme
  } = themeOps;

  // Enhanced operations with change log and undo support
  
  /**
   * Add state with change log and undo support
   * @param {string} name - State name
   */
  const addState = useCallback((name) => {
    // Capture for undo
    pushToUndoStack(captureSnapshot());
    
    // Add state
    const newState = addStateCore(name);
    
    // Log change
    addToChangeLogCore(`Added state: ${name.trim()}`);
    
    return newState;
  }, [addStateCore, addToChangeLogCore, pushToUndoStack, captureSnapshot]);

  /**
   * Edit state with change log and undo support
   * @param {string} stateId - State ID
   * @param {string} newName - New name
   */
  const editState = useCallback((stateId, newName) => {
    const oldState = getState(stateId);
    if (!oldState) return null;

    // Capture for undo
    pushToUndoStack(captureSnapshot());
    
    // Edit state
    const updatedState = editStateCore(stateId, newName);
    
    // Log change
    addToChangeLogCore(`Renamed state: "${oldState.name}" → "${newName.trim()}"`);
    
    return updatedState;
  }, [editStateCore, getState, addToChangeLogCore, pushToUndoStack, captureSnapshot]);

  /**
   * Delete state with change log and undo support
   * @param {string} stateId - State ID
   * @returns {boolean} True if deleted
   */
  const deleteState = useCallback((stateId) => {
    const stateToDelete = getState(stateId);
    if (!stateToDelete) return false;

    // Capture for undo
    pushToUndoStack(captureSnapshot());
    
    // Attempt to delete
    const deleted = deleteStateCore(stateId);
    
    if (deleted) {
      // Log change
      addToChangeLogCore(`Deleted state: ${stateToDelete.name}`);
      return true;
    } else {
      // State has references, undo capture was unnecessary
      // Pop the snapshot we just added
      undo();
      return false;
    }
  }, [deleteStateCore, getState, addToChangeLogCore, pushToUndoStack, captureSnapshot, undo]);

  /**
   * Save flow with change log
   */
  const saveFlow = useCallback(async () => {
    const success = await saveStates();
    if (success) {
      addToChangeLogCore('Saved state machine configuration');
    }
    return success;
  }, [saveStates, addToChangeLogCore]);

  /**
   * Handle file import with change log
   * @param {File} file - File to import
   * @param {object} options - Import options
   */
  const handleImport = useCallback(async (file, options = {}) => {
    const result = await importFile(file, options);
    if (result.success) {
      addToChangeLogCore(`Imported ${file.name}`);
    }
    return result;
  }, [importFile, addToChangeLogCore]);

  /**
   * Handle Excel import (compatibility method)
   * @param {File} file - Excel file to import
   * @param {object} options - Import options
   */
  const handleExcelImport = useCallback(async (file, options = {}) => {
    return await handleImport(file, options);
  }, [handleImport]);

  /**
   * Handle rule dictionary import
   * @param {File} file - JSON file with rule dictionary
   * @returns {Promise<Object>} Import result
   */
  const handleRuleDictionaryImport = useCallback(async (file) => {
    try {
      const text = await file.text();
      const dictionary = JSON.parse(text);
      
      if (typeof dictionary !== 'object') {
        throw new Error('Invalid dictionary format');
      }

      addToChangeLogCore(`Imported rule dictionary from ${file.name}`);
      
      return {
        success: true,
        dictionary,
        message: `Imported dictionary with ${Object.keys(dictionary).length} entries`
      };
    } catch (error) {
      console.error('Dictionary import error:', error);
      return {
        success: false,
        dictionary: null,
        message: error.message
      };
    }
  }, [addToChangeLogCore]);

  /**
   * Export configuration (compatibility method)
   * @param {string} filename - Filename
   * @param {object} options - Export options
   */
  const exportConfiguration = useCallback(async (filename, options = {}) => {
    await exportStates(filename, options);
    addToChangeLogCore(`Exported to ${filename}`);
  }, [exportStates, addToChangeLogCore]);

  /**
   * Clear all data
   */
  const clearData = useCallback(async () => {
    clearStates();
    await clearPersistedData();
    clearHistory();
    addToChangeLogCore('Cleared all state machine data');
  }, [clearStates, clearPersistedData, clearHistory, addToChangeLogCore]);

  // Return complete interface
  return {
    // State
    states,
    selectedState,
    isLoading,
    currentFileName,
    isDarkMode,
    showSaveNotification,
    changeLog,
    canUndo,
    canRedo,
    
    // State setters (for external control if needed)
    setStates,
    setSelectedState,
    setCurrentFileName,
    setChangeLog,
    
    // State operations
    addState,
    editState,
    deleteState: (stateId) => {
      const stateToDelete = getState(stateId);
      if (!stateToDelete) return;

      const canDelete = deleteState(stateId);
      if (!canDelete) {
        // Return error info for caller to handle
        return { error: `Cannot delete state "${stateToDelete.name}" because it is used as a target state in other rules` };
      }
    },
    handleDeleteState: deleteState, // Alias for compatibility
    
    // Persistence operations
    saveFlow,
    clearData,
    hasStoredData,
    saveImportedCSV,
    loadImportedCSV,
    
    // Import/Export operations
    handleImport,
    handleExcelImport,
    exportConfiguration,
    exportStates,
    exportJSON,
    importJSON,
    handleRuleDictionaryImport,
    
    // History operations
    undo,
    redo,
    withUndoCapture,
    pushToUndoStack,
    captureSnapshot,
    
    // Change log operations
    addToChangeLog: addToChangeLogCore,
    clearChangeLog,
    exportChangeLog,
    
    // Theme operations
    toggleTheme,
    setTheme,
    
    // Query operations
    getState,
    getSelectedStateObject
  };
};

// Default export for backward compatibility
export default useStateMachineOrchestrator;
