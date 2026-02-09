/**
 * Storage service for flow diagram persistence
 * Handles IndexedDB operations with clean interface
 * 
 * SOLID Principle: Single Responsibility - Only handles storage operations
 */
import storage from '@/utils/storageWrapper';

/**
 * FlowDiagramStorage class provides abstraction over IndexedDB storage
 * This follows Dependency Inversion Principle - components depend on this
 * abstraction rather than directly on storageWrapper
 */
export class FlowDiagramStorage {
  /**
   * @param {string} storageKey - Primary key for storing diagram data
   */
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  /**
   * Load diagram data and current filename from storage
   * @returns {Promise<{data: Object|null, fileName: string|null}>}
   */
  async load() {
    try {
      const data = await storage.getItem(this.storageKey);
      const fileName = await storage.getItem(`${this.storageKey}_currentFileName`);
      return { data, fileName };
    } catch (error) {
      console.error('[FlowDiagramStorage] Error loading data:', error);
      return { data: null, fileName: null };
    }
  }

  /**
   * Save diagram data to storage
   * @param {Object} data - Diagram data (steps, connections, rules)
   * @returns {Promise<void>}
   */
  async save(data) {
    try {
      await storage.setItem(this.storageKey, data);
    } catch (error) {
      console.error('[FlowDiagramStorage] Error saving data:', error);
      throw error;
    }
  }

  /**
   * Save current filename to storage
   * @param {string} fileName - Current filename
   * @returns {Promise<void>}
   */
  async saveFileName(fileName) {
    try {
      await storage.setItem(`${this.storageKey}_currentFileName`, fileName);
    } catch (error) {
      console.error('[FlowDiagramStorage] Error saving filename:', error);
      throw error;
    }
  }

  /**
   * Load undo/redo stacks from storage
   * @returns {Promise<{undoStack: Array, redoStack: Array}>}
   */
  async loadUndoRedoStacks() {
    try {
      const undoStack = await storage.getItem(`${this.storageKey}_undoStack`);
      const redoStack = await storage.getItem(`${this.storageKey}_redoStack`);
      return { 
        undoStack: undoStack || [], 
        redoStack: redoStack || [] 
      };
    } catch (error) {
      console.error('[FlowDiagramStorage] Error loading undo/redo stacks:', error);
      return { undoStack: [], redoStack: [] };
    }
  }

  /**
   * Save undo/redo stacks to storage
   * @param {Array} undoStack - Undo history stack
   * @param {Array} redoStack - Redo history stack
   * @returns {Promise<void>}
   */
  async saveUndoRedoStacks(undoStack, redoStack) {
    try {
      await storage.setItem(`${this.storageKey}_undoStack`, undoStack);
      await storage.setItem(`${this.storageKey}_redoStack`, redoStack);
    } catch (error) {
      console.error('[FlowDiagramStorage] Error saving undo/redo stacks:', error);
      throw error;
    }
  }

  /**
   * Clear all data for this diagram from storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await storage.removeItem(this.storageKey);
      await storage.removeItem(`${this.storageKey}_currentFileName`);
      await storage.removeItem(`${this.storageKey}_undoStack`);
      await storage.removeItem(`${this.storageKey}_redoStack`);
    } catch (error) {
      console.error('[FlowDiagramStorage] Error clearing data:', error);
      throw error;
    }
  }
}
