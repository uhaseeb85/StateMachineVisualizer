/**
 * useChangeLog.js
 * 
 * Change log management hook (SRP).
 * Separated from core state management and persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../context/ServicesContext';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getChangeLogService } from '../services/changeLog/ChangeLogService';

/**
 * Hook for change log management
 * @returns {Object} Change log methods and state
 */
export const useChangeLog = () => {
  const storage = useStorage();
  const changeLogService = getChangeLogService();
  
  const [changeLog, setChangeLog] = useState([]);

  /**
   * Load change log from storage on initialization
   */
  useEffect(() => {
    const loadChangeLog = async () => {
      try {
        const savedChangeLog = await storage.getItem(STORAGE_KEYS.CHANGE_LOG);
        if (savedChangeLog && Array.isArray(savedChangeLog)) {
          // Sanitize to ensure valid entries
          const validLog = changeLogService.sanitize(savedChangeLog);
          setChangeLog(validLog);
        }
      } catch (error) {
        console.error('Error loading change log:', error);
      }
    };

    loadChangeLog();
  }, [storage, changeLogService]);

  /**
   * Persist change log to storage on updates
   */
  useEffect(() => {
    if (!Array.isArray(changeLog) || changeLog.length === 0) {
      return;
    }
    
    storage.setItem(STORAGE_KEYS.CHANGE_LOG, changeLog).catch(error => {
      console.error('Error saving change log:', error);
    });
  }, [changeLog, storage]);

  /**
   * Add entry to change log
   * @param {string} message - Change description
   */
  const addToChangeLog = useCallback((message) => {
    try {
      setChangeLog(prev => changeLogService.addEntry(prev, message));
    } catch (error) {
      console.error('Error adding to change log:', error);
    }
  }, [changeLogService]);

  /**
   * Clear change log
   */
  const clearChangeLog = useCallback(() => {
    setChangeLog(changeLogService.clear());
    storage.removeItem(STORAGE_KEYS.CHANGE_LOG).catch(error => {
      console.error('Error clearing change log from storage:', error);
    });
  }, [storage, changeLogService]);

  /**
   * Export change log to text
   * @returns {string} Formatted text
   */
  const exportChangeLog = useCallback(() => {
    return changeLogService.exportToText(changeLog);
  }, [changeLog, changeLogService]);

  return {
    changeLog,
    setChangeLog,
    addToChangeLog,
    clearChangeLog,
    exportChangeLog
  };
};
