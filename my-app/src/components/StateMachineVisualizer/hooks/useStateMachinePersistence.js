/**
 * useStateMachinePersistence.js
 * 
 * Persistence hook (SRP).
 * Handles loading/saving states to storage - separated from core state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStorage, useNotification } from '../context/ServicesContext';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Hook for state machine persistence operations
 * Manages loading and saving to storage using dependency-injected storage service
 * @param {Array} states - Current states array
 * @param {Function} onStatesLoaded - Callback when states are loaded
 * @returns {Object} Persistence methods and state
 */
export const useStateMachinePersistence = (states, onStatesLoaded) => {
  const storage = useStorage();
  const notification = useNotification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentFileName, setCurrentFileName] = useState(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  /**
   * Load states from storage on initialization
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load states
        const savedFlow = await storage.getItem(STORAGE_KEYS.IVR_FLOW);
        if (savedFlow) {
          const parsedFlow = Array.isArray(savedFlow) ? savedFlow : [];
          if (onStatesLoaded) {
            onStatesLoaded(parsedFlow);
          }
        }

        // Load filename
        const savedFileName = await storage.getItem(STORAGE_KEYS.CURRENT_FILE_NAME);
        if (savedFileName) {
          setCurrentFileName(savedFileName);
        }
      } catch (error) {
        console.error('Error loading state machine data:', error);
        notification.error('Failed to load state machine data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [storage, onStatesLoaded, notification]);

  /**
   * Save states to storage
   * @param {Array} statesToSave - States to save (optional, defaults to current states)
   * @returns {Promise<boolean>} True if successful
   */
  const saveStates = useCallback(async (statesToSave = states) => {
    try {
      await storage.setItem(STORAGE_KEYS.IVR_FLOW, statesToSave);
      
      // Show temporary notification
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
      
      return true;
    } catch (error) {
      console.error('Error saving states:', error);
      notification.error('Failed to save state machine');
      return false;
    }
  }, [states, storage, notification]);

  /**
   * Save current filename to storage
   * @param {string} filename - Filename to save
   * @returns {Promise<boolean>} True if successful
   */
  const saveFileName = useCallback(async (filename) => {
    try {
      await storage.setItem(STORAGE_KEYS.CURRENT_FILE_NAME, filename);
      setCurrentFileName(filename);
      return true;
    } catch (error) {
      console.error('Error saving filename:', error);
      return false;
    }
  }, [storage]);

  /**
   * Clear all persisted data
   * @returns {Promise<boolean>} True if successful
   */
  const clearPersistedData = useCallback(async () => {
    try {
      await storage.removeItem(STORAGE_KEYS.IVR_FLOW);
      await storage.removeItem(STORAGE_KEYS.CURRENT_FILE_NAME);
      setCurrentFileName(null);
      return true;
    } catch (error) {
      console.error('Error clearing persisted data:', error);
      return false;
    }
  }, [storage]);

  /**
   * Save imported CSV to storage for later merging
   * @param {string} sourceFile - Source filename
   * @param {Array} rows - CSV rows
   * @returns {Promise<boolean>} True if successful
   */
  const saveImportedCSV = useCallback(async (sourceFile, rows) => {
    try {
      const key = `${STORAGE_KEYS.IMPORTED_CSV_PREFIX}${sourceFile}`;
      await storage.setItem(key, rows);
      return true;
    } catch (error) {
      console.error('Error saving imported CSV:', error);
      return false;
    }
  }, [storage]);

  /**
   * Load imported CSV from storage
   * @param {string} sourceFile - Source filename
   * @returns {Promise<Array|null>} CSV rows or null
   */
  const loadImportedCSV = useCallback(async (sourceFile) => {
    try {
      const key = `${STORAGE_KEYS.IMPORTED_CSV_PREFIX}${sourceFile}`;
      const rows = await storage.getItem(key);
      return Array.isArray(rows) ? rows : null;
    } catch (error) {
      console.error('Error loading imported CSV:', error);
      return null;
    }
  }, [storage]);

  /**
   * Check if storage has data
   * @returns {Promise<boolean>} True if storage contains states
   */
  const hasStoredData = useCallback(async () => {
    try {
      const savedFlow = await storage.getItem(STORAGE_KEYS.IVR_FLOW);
      return savedFlow && Array.isArray(savedFlow) && savedFlow.length > 0;
    } catch (error) {
      console.error('Error checking stored data:', error);
      return false;
    }
  }, [storage]);

  return {
    // State
    isLoading,
    currentFileName,
    showSaveNotification,
    
    // Setters
    setCurrentFileName,
    
    // Operations
    saveStates,
    saveFileName,
    clearPersistedData,
    saveImportedCSV,
    loadImportedCSV,
    hasStoredData
  };
};
