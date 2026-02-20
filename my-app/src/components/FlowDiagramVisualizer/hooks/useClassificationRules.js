/**
 * Hook for managing step classification rules
 * Handles applying rules to determine step type and alias
 * 
 * SOLID Principle: Single Responsibility - Only handles classification logic
 */
import { useState, useCallback } from 'react';

/**
 * Check if a step name matches a classification rule
 * @param {string} stepName - Name of the step to check
 * @param {Object} rule - Classification rule to apply
 * @returns {boolean} True if rule matches
 */
const matchesRule = (stepName, rule) => {
  const { keyword, matchType, caseSensitive } = rule;
  const name = caseSensitive ? stepName : stepName.toLowerCase();
  const key = caseSensitive ? keyword : keyword.toLowerCase();

  switch (matchType) {
    case 'contains':
      return name.includes(key);
    case 'startsWith':
      return name.startsWith(key);
    case 'endsWith':
      return name.endsWith(key);
    case 'exact':
      return name === key;
    default:
      return false;
  }
};

/**
 * Generate an alias based on a rule's alias template
 * @param {string} stepName - Original step name
 * @param {string} aliasTemplate - Template for generating alias
 * @returns {string} Generated alias
 */
const generateAlias = (stepName, aliasTemplate) => {
  if (!aliasTemplate) return stepName;
  
  // Replace placeholders in template
  // Example: "{name}_modified" becomes "StepName_modified"
  return aliasTemplate.replace('{name}', stepName);
};

/**
 * Hook for managing classification rules
 * @param {Array|null} initialRules - Initial classification rules
 * @returns {Object} Classification methods and state
 */
export const useClassificationRules = (initialRules = null) => {
  const [rules, setRules] = useState(initialRules);

  /**
   * Update the classification rules
   * @param {Array} newRules - New array of classification rules
   */
  const updateRules = useCallback((newRules) => {
    setRules(newRules);
  }, []);

  /**
   * Apply classification rules to a step name
   * Returns type and alias based on first matching rule
   * @param {string} stepName - Name of the step to classify
   * @returns {Object} {type: string, alias: string}
   */
  const applyRulesToStep = useCallback((stepName) => {
    if (!rules || rules.length === 0) {
      return { 
        type: 'state', 
        alias: stepName 
      };
    }

    // Find first matching rule
    for (const rule of rules) {
      if (matchesRule(stepName, rule)) {
        return {
          type: rule.type || 'state',
          alias: rule.aliasTemplate ? generateAlias(stepName, rule.aliasTemplate) : stepName,
        };
      }
    }

    // No rule matched - return defaults
    return { 
      type: 'state', 
      alias: stepName 
    };
  }, [rules]);

  /**
   * Apply classification to multiple steps at once
   * @param {Array} steps - Array of step objects with name property
   * @returns {Array} Steps with type and alias applied
   */
  const applyRulesToSteps = useCallback((steps) => {
    return steps.map(step => {
      const { type, alias } = applyRulesToStep(step.name);
      return {
        ...step,
        type: step.type || type, // Don't override if already set
        alias: step.alias || alias, // Don't override if already set
      };
    });
  }, [applyRulesToStep]);

  /**
   * Add a new classification rule
   * @param {Object} rule - Rule to add
   */
  const addRule = useCallback((rule) => {
    setRules(prev => [...(prev || []), rule]);
  }, []);

  /**
   * Remove a classification rule by ID
   * @param {string} ruleId - ID of rule to remove
   */
  const removeRule = useCallback((ruleId) => {
    setRules(prev => (prev || []).filter(r => r.id !== ruleId));
  }, []);

  /**
   * Update an existing classification rule
   * @param {string} ruleId - ID of rule to update
   * @param {Object} updates - Fields to update
   */
  const updateRule = useCallback((ruleId, updates) => {
    setRules(prev => (prev || []).map(r => 
      r.id === ruleId ? { ...r, ...updates } : r
    ));
  }, []);

  /**
   * Clear all classification rules
   */
  const clearRules = useCallback(() => {
    setRules(null);
  }, []);

  return {
    // State
    rules,
    hasRules: rules && rules.length > 0,
    ruleCount: rules?.length || 0,
    
    // Actions
    updateRules,
    addRule,
    removeRule,
    updateRule,
    clearRules,
    
    // Utilities
    applyRulesToStep,
    applyRulesToSteps,
  };
};

export default useClassificationRules;
