/**
 * DataValidationService.js
 * 
 * Service for validating state machine data (SRP).
 * Centralizes validation logic from utils.js and useStateMachine.js.
 */

/**
 * Data validation service
 */
export class DataValidationService {
  /**
   * Validate Excel/CSV data structure
   * @param {Array} rows - Data rows (can be array of objects or array of arrays)
   * @returns {Object} Validation result with column indices
   * @throws {Error} If validation fails
   */
  validateExcelData(rows) {
    if (!rows || rows.length === 0) {
      throw new Error('No data rows found');
    }

    // Handle array of objects (PapaParse output)
    if (typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
      const headers = Object.keys(rows[0]);
      if (headers.length === 0) {
        throw new Error('No columns found in data');
      }

      // Find required columns (case-insensitive)
      const sourceNodeIndex = headers.findIndex(h =>
        h.toLowerCase().includes('source') && h.toLowerCase().includes('node')
      );
      const destNodeIndex = headers.findIndex(h =>
        h.toLowerCase().includes('destination') && h.toLowerCase().includes('node')
      );
      const ruleListIndex = headers.findIndex(h =>
        h.toLowerCase().includes('rule')
      );

      if (sourceNodeIndex === -1) {
        throw new Error('Missing required column: "Source Node"');
      }
      if (destNodeIndex === -1) {
        throw new Error('Missing required column: "Destination Node"');
      }
      if (ruleListIndex === -1) {
        throw new Error('Missing required column: "Rule List"');
      }

      return {
        sourceNodeIndex,
        destNodeIndex,
        ruleListIndex,
        headers
      };
    }

    // Handle array of arrays (Excel output)
    if (rows.length < 2) {
      throw new Error('File contains no data rows');
    }

    const headers = rows[0].map(h => h?.toString().trim().toLowerCase());
    
    const sourceNodeIndex = headers.findIndex(h => 
      h === 'source node' || h === 'source node '
    );
    const destNodeIndex = headers.findIndex(h => 
      h === 'destination node' || h === 'destination node '
    );
    const ruleListIndex = headers.findIndex(h => 
      h === 'rule list' || h === 'rule list '
    );

    if (sourceNodeIndex === -1 || destNodeIndex === -1 || ruleListIndex === -1) {
      throw new Error(
        'Missing required columns. Please ensure your file has: "Source Node", "Destination Node", and "Rule List"\n' +
        'Found columns: ' + headers.join(', ')
      );
    }

    return {
      sourceNodeIndex,
      destNodeIndex,
      ruleListIndex,
      headers: rows[0] // Return original headers for array-of-arrays format
    };
  }

  /**
   * Validate state object structure
   * @param {Object} state - State object to validate
   * @returns {boolean} True if valid
   */
  isValidState(state) {
    if (!state || typeof state !== 'object') {
      return false;
    }

    // Required fields
    if (!state.id || typeof state.id !== 'string') {
      return false;
    }
    if (!state.name || typeof state.name !== 'string') {
      return false;
    }
    if (!Array.isArray(state.rules)) {
      return false;
    }

    // Validate rules
    return state.rules.every(rule => this.isValidRule(rule));
  }

  /**
   * Validate rule object structure
   * @param {Object} rule - Rule object to validate
   * @returns {boolean} True if valid
   */
  isValidRule(rule) {
    if (!rule || typeof rule !== 'object') {
      return false;
    }

    // Required fields
    if (!rule.id || typeof rule.id !== 'string') {
      return false;
    }
    if (!rule.condition || typeof rule.condition !== 'string') {
      return false;
    }
    // nextState can be null for invalid references
    if (rule.nextState !== null && rule.nextState !== undefined && typeof rule.nextState !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Validate states array
   * @param {Array} states - States array to validate
   * @returns {Object} Validation result {valid, errors}
   */
  validateStates(states) {
    const errors = [];

    if (!Array.isArray(states)) {
      return { valid: false, errors: ['States must be an array'] };
    }

    states.forEach((state, index) => {
      if (!this.isValidState(state)) {
        errors.push(`Invalid state at index ${index}: ${state?.name || 'unknown'}`);
      }
    });

    // Check for duplicate IDs
    const ids = new Set();
    states.forEach(state => {
      if (ids.has(state.id)) {
        errors.push(`Duplicate state ID: ${state.id}`);
      }
      ids.add(state.id);
    });

    // Check for invalid rule references
    const stateIds = new Set(states.map(s => s.id));
    states.forEach(state => {
      state.rules.forEach(rule => {
        if (rule.nextState && !stateIds.has(rule.nextState)) {
          errors.push(`State "${state.name}" has rule pointing to non-existent state: ${rule.nextState}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if state can be deleted (no references)
   * @param {string} stateId - State ID to check
   * @param {Array} states - All states
   * @returns {Object} Result {canDelete, referencingStates}
   */
  canDeleteState(stateId, states) {
    const referencingStates = states.filter(state =>
      state.id !== stateId &&
      state.rules.some(rule => rule.nextState === stateId)
    );

    return {
      canDelete: referencingStates.length === 0,
      referencingStates
    };
  }

  /**
   * Sanitize state name
   * @param {string} name - State name
   * @returns {string} Sanitized name
   */
  sanitizeStateName(name) {
    if (!name || typeof name !== 'string') {
      return '';
    }
    return name.trim();
  }

  /**
   * Sanitize rule condition
   * @param {string} condition - Rule condition
   * @returns {string} Sanitized condition
   */
  sanitizeRuleCondition(condition) {
    if (!condition || typeof condition !== 'string') {
      return '';
    }
    return condition.trim();
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get singleton instance of DataValidationService
 * @returns {DataValidationService} Service instance
 */
export const getDataValidationService = () => {
  if (!serviceInstance) {
    serviceInstance = new DataValidationService();
  }
  return serviceInstance;
};
