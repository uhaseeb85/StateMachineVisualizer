/**
 * ChangeLogService.js
 * 
 * Service for managing change log operations (SRP).
 * Centralized change log management to avoid prop drilling.
 */

/** Maximum number of entries to keep in change log */
const MAX_HISTORY_ENTRIES = 20;

/**
 * Change log service
 */
export class ChangeLogService {
  /**
   * Create a change log entry
   * @param {string} message - Change description
   * @returns {Object} Change log entry {timestamp, message}
   */
  createEntry(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('Change message must be a non-empty string');
    }

    return {
      timestamp: new Date().toLocaleString(),
      message: message.trim()
    };
  }

  /**
   * Add entry to change log (immutable)
   * @param {Array} currentLog - Current change log array
   * @param {string} message - Change description
   * @returns {Array} New change log array
   */
  addEntry(currentLog, message) {
    if (!Array.isArray(currentLog)) {
      currentLog = [];
    }

    const newEntry = this.createEntry(message);
    const newLog = [newEntry, ...currentLog];
    
    // Trim to max entries
    return newLog.slice(0, MAX_HISTORY_ENTRIES);
  }

  /**
   * Validate change log structure
   * @param {Array} log - Change log array to validate
   * @returns {boolean} True if valid
   */
  isValid(log) {
    if (!Array.isArray(log)) {
      return false;
    }

    return log.every(entry => 
      entry &&
      typeof entry === 'object' &&
      typeof entry.timestamp === 'string' &&
      typeof entry.message === 'string'
    );
  }

  /**
   * Filter invalid entries from log
   * @param {Array} log - Change log array
   * @returns {Array} Filtered log with only valid entries
   */
  sanitize(log) {
    if (!Array.isArray(log)) {
      return [];
    }

    return log.filter(entry => 
      entry &&
      typeof entry === 'object' &&
      typeof entry.timestamp === 'string' &&
      typeof entry.message === 'string'
    );
  }

  /**
   * Clear change log
   * @returns {Array} Empty array
   */
  clear() {
    return [];
  }

  /**
   * Export change log to text
   * @param {Array} log - Change log array
   * @returns {string} Formatted text
   */
  exportToText(log) {
    if (!Array.isArray(log) || log.length === 0) {
      return 'No change log entries';
    }

    return log.map(entry => 
      `[${entry.timestamp}] ${entry.message}`
    ).join('\n');
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get singleton instance of ChangeLogService
 * @returns {ChangeLogService} Service instance
 */
export const getChangeLogService = () => {
  if (!serviceInstance) {
    serviceInstance = new ChangeLogService();
  }
  return serviceInstance;
};
