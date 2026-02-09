/**
 * RuleDescriptionParser.js
 * 
 * Service for parsing and formatting rule descriptions (SRP).
 * Extracted from RulesPanel.jsx to separate business logic from UI.
 */

/**
 * Rule description parser service
 * Handles parsing compound conditions and formatting rule descriptions
 */
export class RuleDescriptionParser {
  /**
   * Parse rule description to identify compound conditions
   * Detects operators like AND, OR, +, &, |
   * @param {string} description - Rule description to parse
   * @returns {Object} Parsed result {isCompound, parts, operator}
   */
  parseDescription(description) {
    if (!description || typeof description !== 'string') {
      return {
        isCompound: false,
        parts: [],
        operator: null
      };
    }

    const trimmed = description.trim();

    // Check for various compound condition patterns
    const patterns = [
      { regex: /\s+AND\s+/i, operator: 'AND' },
      { regex: /\s+OR\s+/i, operator: 'OR' },
      { regex: /\s*\+\s*/,operator: '+' },
      { regex: /\s+&\s+/, operator: '&' },
      { regex: /\s+\|\s+/, operator: '|' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(trimmed)) {
        const parts = trimmed.split(pattern.regex).map(p => p.trim()).filter(p => p);
        
        if (parts.length > 1) {
          return {
            isCompound: true,
            parts,
            operator: pattern.operator
          };
        }
      }
    }

    return {
      isCompound: false,
      parts: [trimmed],
      operator: null
    };
  }

  /**
   * Get descriptions for each part of a compound rule
   * @param {string} ruleDescription - Rule description
   * @param {Object} dictionary - Rule dictionary for lookups
   * @returns {Array} Array of part descriptions
   */
  getRuleDescriptions(ruleDescription, dictionary = {}) {
    const parsed = this.parseDescription(ruleDescription);
    
    if (!parsed.isCompound) {
      // Single condition - look up in dictionary
      const description = dictionary[ruleDescription] || ruleDescription;
      return [description];
    }

    // Compound condition - look up each part
    return parsed.parts.map(part => {
      const trimmedPart = part.trim();
      return dictionary[trimmedPart] || trimmedPart;
    });
  }

  /**
   * Format rule description with dictionary lookups
   * @param {string} ruleDescription - Rule description
   * @param {Object} dictionary - Rule dictionary for lookups
   * @param {Object} options - Formatting options
   * @param {boolean} options.expandCompound - Expand compound conditions
   * @param {string} options.separator - Separator for compound parts
   * @returns {string} Formatted description
   */
  formatDescription(ruleDescription, dictionary = {}, options = {}) {
    const {
      expandCompound = false,
      separator = ' '
    } = options;

    if (!ruleDescription) {
      return '';
    }

    const parsed = this.parseDescription(ruleDescription);

    if (!parsed.isCompound) {
      return dictionary[ruleDescription] || ruleDescription;
    }

    if (expandCompound) {
      // Show each part expanded
      const descriptions = this.getRuleDescriptions(ruleDescription, dictionary);
      return descriptions.join(` ${parsed.operator} `);
    }

    // Keep original format
    return ruleDescription;
  }

  /**
   * Extract all rule keys from a description
   * @param {string} ruleDescription - Rule description
   * @returns {Array} Array of rule keys
   */
  extractRuleKeys(ruleDescription) {
    const parsed = this.parseDescription(ruleDescription);
    return parsed.parts;
  }

  /**
   * Check if rule description is compound
   * @param {string} ruleDescription - Rule description
   * @returns {boolean} True if compound
   */
  isCompound(ruleDescription) {
    const parsed = this.parseDescription(ruleDescription);
    return parsed.isCompound;
  }

  /**
   * Validate rule description format
   * @param {string} ruleDescription - Rule description to validate
   * @returns {Object} Validation result {valid, errors}
   */
  validate(ruleDescription) {
    const errors = [];

    if (!ruleDescription || typeof ruleDescription !== 'string') {
      errors.push('Rule description is required');
      return { valid: false, errors };
    }

    const trimmed = ruleDescription.trim();
    if (trimmed.length === 0) {
      errors.push('Rule description cannot be empty');
      return { valid: false, errors };
    }

    // Check for unbalanced operators
    const parsed = this.parseDescription(trimmed);
    if (parsed.isCompound && parsed.parts.length < 2) {
      errors.push('Compound rule must have at least 2 conditions');
      return { valid: false, errors };
    }

    // Check for empty parts in compound rules
    if (parsed.isCompound) {
      const emptyParts = parsed.parts.filter(p => !p || p.trim().length === 0);
      if (emptyParts.length > 0) {
        errors.push('Compound rule contains empty conditions');
        return { valid: false, errors };
      }
    }

    return { valid: true, errors: [] };
  }

  /**
   * Normalize rule description (trim, standardize operators)
   * @param {string} ruleDescription - Rule description
   * @returns {string} Normalized description
   */
  normalize(ruleDescription) {
    if (!ruleDescription || typeof ruleDescription !== 'string') {
      return '';
    }

    let normalized = ruleDescription.trim();

    // Standardize operators
    normalized = normalized.replace(/\s+AND\s+/gi, ' AND ');
    normalized = normalized.replace(/\s+OR\s+/gi, ' OR ');
    normalized = normalized.replace(/\s*\+\s*/g, ' + ');
    normalized = normalized.replace(/\s+&\s+/g, ' & ');
    normalized = normalized.replace(/\s+\|\s+/g, ' | ');

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get singleton instance of RuleDescriptionParser
 * @returns {RuleDescriptionParser} Service instance
 */
export const getRuleDescriptionParser = () => {
  if (!serviceInstance) {
    serviceInstance = new RuleDescriptionParser();
  }
  return serviceInstance;
};
