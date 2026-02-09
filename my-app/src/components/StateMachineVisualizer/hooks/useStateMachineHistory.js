/**
 * useStateMachineHistory.js
 * 
 * Undo/Redo history management hook (SRP).
 * Handles undo/redo stack operations - separated from state management and persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../context/ServicesContext';
import { STORAGE_KEYS } from '../constants/storageKeys';

/** Maximum number of undo operations to keep */
const MAX_UNDO_STACK_SIZE = 50;

/**
 * Hook for undo/redo history management
 * @param {Array} states - Current states array
 * @param {string} selectedState - Current selected state ID
 * @param {Function} onRestore - Callback to restore state (states, selectedState)
 * @returns {Object} History methods and state
 */
export const useStateMachineHistory = (states, selectedState, onRestore) => {
  const storage = useStorage();
  
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  /**
   * Load undo/redo stacks from storage on initialization
   */
  useEffect(() => {
    const loadStacks = async () => {
      try {
        const savedUndoStack = await storage.getItem(STORAGE_KEYS.UNDO_STACK);
        if (savedUndoStack && Array.isArray(savedUndoStack)) {
          setUndoStack(savedUndoStack);
        }

        const savedRedoStack = await storage.getItem(STORAGE_KEYS.REDO_STACK);
        if (savedRedoStack && Array.isArray(savedRedoStack)) {
          setRedoStack(savedRedoStack);
        }
      } catch (error) {
        console.error('Error loading undo/redo stacks:', error);
      }
    };

    loadStacks();
  }, [storage]);

  /**
   * Save undo stack to storage
   * @param {Array} stack - Undo stack to save
   */
  const saveUndoStack = useCallback(async (stack) => {
    try {
      await storage.setItem(STORAGE_KEYS.UNDO_STACK, stack);
    } catch (error) {
      console.error('Error saving undo stack:', error);
      // Don't throw - undo history is not critical
    }
  }, [storage]);

  /**
   * Save redo stack to storage
   * @param {Array} stack - Redo stack to save
   */
  const saveRedoStack = useCallback(async (stack) => {
    try {
      await storage.setItem(STORAGE_KEYS.REDO_STACK, stack);
    } catch (error) {
      console.error('Error saving redo stack:', error);
      // Don't throw - redo history is not critical
    }
  }, [storage]);

  /**
   * Capture current state snapshot
   * @returns {Object} Snapshot object
   */
  const captureSnapshot = useCallback(() => {
    return {
      states: JSON.parse(JSON.stringify(states)),
      selectedState: selectedState
    };
  }, [states, selectedState]);

  /**
   * Push snapshot to undo stack
   * @param {Object} snapshot - Snapshot to push
   */
  const pushToUndoStack = useCallback((snapshot) => {
    setUndoStack(prev => {
      const newStack = [...prev, snapshot];
      
      // Trim if exceeded max size
      const trimmedStack = newStack.length > MAX_UNDO_STACK_SIZE
        ? newStack.slice(-MAX_UNDO_STACK_SIZE)
        : newStack;
      
      saveUndoStack(trimmedStack);
      return trimmedStack;
    });

    // Clear redo stack when new action is performed
    setRedoStack([]);
    saveRedoStack([]);
  }, [saveUndoStack, saveRedoStack]);

  /**
   * Undo last action
   * @returns {boolean} True if undo was performed
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) {
      return false;
    }

    // Push current state to redo stack
    setRedoStack(prev => {
      const newStack = [...prev, captureSnapshot()];
      saveRedoStack(newStack);
      return newStack;
    });

    // Pop from undo stack and restore
    const previousSnapshot = undoStack[undoStack.length - 1];
    setUndoStack(prev => {
      const newStack = prev.slice(0, -1);
      saveUndoStack(newStack);
      return newStack;
    });

    // Restore state via callback
    if (onRestore) {
      onRestore(previousSnapshot.states, previousSnapshot.selectedState);
    }

    return true;
  }, [undoStack, captureSnapshot, saveUndoStack, saveRedoStack, onRestore]);

  /**
   * Redo last undone action
   * @returns {boolean} True if redo was performed
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      return false;
    }

    // Push current state to undo stack
    setUndoStack(prev => {
      const newStack = [...prev, captureSnapshot()];
      saveUndoStack(newStack);
      return newStack;
    });

    // Pop from redo stack and restore
    const nextSnapshot = redoStack[redoStack.length - 1];
    setRedoStack(prev => {
      const newStack = prev.slice(0, -1);
      saveRedoStack(newStack);
      return newStack;
    });

    // Restore state via callback
    if (onRestore) {
      onRestore(nextSnapshot.states, nextSnapshot.selectedState);
    }

    return true;
  }, [redoStack, captureSnapshot, saveUndoStack, saveRedoStack, onRestore]);

  /**
   * Wrapper for operations that should be undoable
   * Captures snapshot before executing operation
   * @param {Function} operation - Operation to execute
   */
  const withUndoCapture = useCallback((operation) => {
    const snapshot = captureSnapshot();
    pushToUndoStack(snapshot);
    operation();
  }, [captureSnapshot, pushToUndoStack]);

  /**
   * Clear undo/redo history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    saveUndoStack([]);
    saveRedoStack([]);
  }, [saveUndoStack, saveRedoStack]);

  /**
   * Check if undo is available
   * @returns {boolean} True if can undo
   */
  const canUndo = undoStack.length > 0;

  /**
   * Check if redo is available
   * @returns {boolean} True if can redo
   */
  const canRedo = redoStack.length > 0;

  return {
    // Operations
    undo,
    redo,
    withUndoCapture,
    pushToUndoStack,
    captureSnapshot,
    clearHistory,
    
    // State
    canUndo,
    canRedo,
    undoStack,
    redoStack
  };
};
