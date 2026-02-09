/**
 * Generic undo/redo hook
 * Manages undo/redo state with a maximum stack size
 * 
 * SOLID Principle: Single Responsibility - Only manages undo/redo history
 * Open/Closed Principle: Works with any state structure
 */
import { useState, useCallback } from 'react';

/**
 * Hook for managing undo/redo functionality
 * @param {number} maxStackSize - Maximum number of states to keep in history
 * @returns {Object} Undo/redo methods and state
 */
export const useUndoRedo = (maxStackSize = 50) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  /**
   * Push a new state onto the undo stack
   * Clears redo stack when a new action is performed
   * @param {*} state - State snapshot to save
   */
  const pushState = useCallback((state) => {
    setUndoStack(prev => {
      const newStack = [...prev, state];
      // Limit stack size to prevent memory issues
      return newStack.slice(-maxStackSize);
    });
    // Clear redo stack when new action performed
    setRedoStack([]);
  }, [maxStackSize]);

  /**
   * Undo the last action
   * @param {*} currentState - Current state to save to redo stack
   * @returns {*} Previous state or null if undo stack is empty
   */
  const undo = useCallback((currentState) => {
    if (undoStack.length === 0) {
      return null;
    }
    
    const previousState = undoStack[undoStack.length - 1];
    
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentState]);
    
    return previousState;
  }, [undoStack]);

  /**
   * Redo the last undone action
   * @param {*} currentState - Current state to save to undo stack
   * @returns {*} Next state or null if redo stack is empty
   */
  const redo = useCallback((currentState) => {
    if (redoStack.length === 0) {
      return null;
    }
    
    const nextState = redoStack[redoStack.length - 1];
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentState]);
    
    return nextState;
  }, [redoStack]);

  /**
   * Clear all undo/redo history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /**
   * Load undo/redo stacks from saved state
   * Useful for restoring history from storage
   * @param {Array} undo - Undo stack to restore
   * @param {Array} redo - Redo stack to restore
   */
  const loadStacks = useCallback((undo, redo) => {
    setUndoStack(undo || []);
    setRedoStack(redo || []);
  }, []);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return {
    // Actions
    pushState,
    undo,
    redo,
    clearHistory,
    loadStacks,
    
    // State
    canUndo,
    canRedo,
    undoStack,
    redoStack,
    
    // Metadata
    undoCount: undoStack.length,
    redoCount: redoStack.length,
  };
};

export default useUndoRedo;
