/**
 * storageKeys.js
 * 
 * Centralized storage key constants.
 * Prevents typos and makes it easy to track all storage keys in one place.
 */

/**
 * Storage keys for State Machine Visualizer
 */
export const STORAGE_KEYS = {
  // Core state data
  IVR_FLOW: 'ivrFlow',
  
  // File metadata
  CURRENT_FILE_NAME: 'stateMachineCurrentFileName',
  LAST_IMPORTED_CSV: 'lastImportedCSV',
  
  // Change tracking
  CHANGE_LOG: 'changeLog',
  
  // Theme
  DARK_MODE: 'darkMode',
  
  // Undo/Redo
  UNDO_STACK: 'stateMachine_undoStack',
  REDO_STACK: 'stateMachine_redoStack',
  
  // Dictionaries
  RULE_DICTIONARY: 'ruleDictionary',
  STATE_DICTIONARY: 'stateDictionary',
  
  // Imported CSV cache (dynamic key with prefix)
  IMPORTED_CSV_PREFIX: 'importedCSV_'
};

/**
 * Get imported CSV key for a specific file
 * @param {string} sourceFile - Source filename
 * @returns {string} Storage key
 */
export const getImportedCSVKey = (sourceFile) => {
  return `${STORAGE_KEYS.IMPORTED_CSV_PREFIX}${sourceFile}`;
};

/**
 * Check if a key is an imported CSV key
 * @param {string} key - Storage key
 * @returns {boolean} True if key is imported CSV key
 */
export const isImportedCSVKey = (key) => {
  return key.startsWith(STORAGE_KEYS.IMPORTED_CSV_PREFIX);
};
