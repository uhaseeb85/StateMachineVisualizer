/**
 * StateComparisonService
 * 
 * Provides state machine comparison and diff algorithms.
 * Compares two state machines and identifies structural and rule differences.
 * 
 * Features:
 * - Multi-criteria state matching (ID, name, normalized name)
 * - Multi-criteria rule matching (ID, condition, target state)
 * - Detailed change tracking (added, removed, modified)
 * - Summary statistics
 * - Normalized comparison (handles spacing/case differences)
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles state machine comparison logic
 * - Open/Closed: Can be extended with new comparison strategies
 */

/**
 * StateComparisonService class
 * Encapsulates state machine comparison algorithms
 */
export class StateComparisonService {
  /**
   * Compares two state machines and returns detailed diff
   * 
   * @param {Array} baseStates - Base state machine states
   * @param {Array} compareStates - State machine to compare against base
   * @returns {Object} Comparison results with state/rule diffs and summary
   */
  compareStateMachines(baseStates, compareStates) {
    const stateComparison = this.compareStates(baseStates, compareStates);
    const ruleComparison = this.compareRules(baseStates, compareStates);

    const summary = {
      addedStates: stateComparison.filter(s => s.status === 'added').length,
      removedStates: stateComparison.filter(s => s.status === 'removed').length,
      modifiedStates: stateComparison.filter(s => s.status === 'modified').length,
      addedRules: ruleComparison.filter(r => r.status === 'added').length,
      removedRules: ruleComparison.filter(r => r.status === 'removed').length,
      modifiedRules: ruleComparison.filter(r => r.status === 'modified').length
    };

    return {
      stateComparison,
      ruleComparison,
      summary,
      hasChanges: this.hasChanges(summary)
    };
  }

  /**
   * Compares states between two state machines
   * 
   * @param {Array} baseStates - Base state machine states
   * @param {Array} compareStates - States to compare
   * @returns {Array} Array of state comparison objects
   */
  compareStates(baseStates, compareStates) {
    const results = [];
    const comparedIds = new Set();

    // Find modified and unchanged states from base
    for (const baseState of baseStates) {
      const matchingState = compareStates.find(cs => 
        this.statesMatch(baseState, cs)
      );

      if (matchingState) {
        comparedIds.add(matchingState.id);

        // Check if state has modifications
        const hasModifications = this.stateHasModifications(
          baseState,
          matchingState,
          baseStates,
          compareStates
        );

        results.push({
          name: baseState.name,
          status: hasModifications ? 'modified' : 'unchanged',
          changes: hasModifications 
            ? this.getStateChanges(baseState, matchingState, baseStates, compareStates)
            : [],
          type: 'state'
        });
      } else {
        // State removed
        results.push({
          name: baseState.name,
          status: 'removed',
          changes: ['State removed from state machine'],
          type: 'state'
        });
      }
    }

    // Find added states (in compare but not in base)
    for (const compareState of compareStates) {
      if (!comparedIds.has(compareState.id)) {
        const existsInBase = baseStates.some(bs => 
          this.statesMatch(bs, compareState)
        );

        if (!existsInBase) {
          results.push({
            name: compareState.name,
            status: 'added',
            changes: ['New state added to state machine'],
            type: 'state'
          });
        }
      }
    }

    return results;
  }

  /**
   * Compares rules between two state machines
   * 
   * @param {Array} baseStates - Base state machine states
   * @param {Array} compareStates - States to compare
   * @returns {Array} Array of rule comparison objects
   */
  compareRules(baseStates, compareStates) {
    const results = [];
    const comparedRuleKeys = new Set();

    // Compare rules in base states
    for (const baseState of baseStates) {
      const matchingState = compareStates.find(cs => 
        this.statesMatch(baseState, cs)
      );

      if (!matchingState) {
        // State removed, so all its rules are removed
        for (const rule of baseState.rules) {
          const targetState = baseStates.find(s => s.id === rule.nextState);
          results.push({
            stateName: baseState.name,
            condition: rule.condition,
            targetState: targetState?.name || 'unknown',
            status: 'removed',
            changes: ['Rule removed (parent state removed)'],
            type: 'rule'
          });
        }
        continue;
      }

      // State exists in both, compare rules
      for (const baseRule of baseState.rules) {
        const matchingRule = matchingState.rules.find(cr => 
          this.rulesMatch(baseRule, baseStates, cr, compareStates)
        );

        if (matchingRule) {
          comparedRuleKeys.add(`${matchingState.name}:${matchingRule.condition}`);

          // Check for modifications
          const changes = this.compareRuleDetails(
            baseRule,
            baseStates,
            matchingRule,
            compareStates
          );

          const targetState = baseStates.find(s => s.id === baseRule.nextState);

          results.push({
            stateName: baseState.name,
            condition: baseRule.condition,
            targetState: targetState?.name || 'unknown',
            status: changes.length > 0 ? 'modified' : 'unchanged',
            changes,
            type: 'rule'
          });
        } else {
          // Rule removed
          const targetState = baseStates.find(s => s.id === baseRule.nextState);
          results.push({
            stateName: baseState.name,
            condition: baseRule.condition,
            targetState: targetState?.name || 'unknown',
            status: 'removed',
            changes: ['Rule removed from state'],
            type: 'rule'
          });
        }
      }
    }

    // Find added rules (in compare but not in base)
    for (const compareState of compareStates) {
      for (const compareRule of compareState.rules) {
        const ruleKey = `${compareState.name}:${compareRule.condition}`;

        if (!comparedRuleKeys.has(ruleKey)) {
          // Check if this rule actually exists in base
          const baseState = baseStates.find(bs => 
            this.statesMatch(bs, compareState)
          );

          if (!baseState) {
            // Parent state is new, rule is implicitly added
            const targetState = compareStates.find(s => s.id === compareRule.nextState);
            results.push({
              stateName: compareState.name,
              condition: compareRule.condition,
              targetState: targetState?.name || 'unknown',
              status: 'added',
              changes: ['Rule added (with new parent state)'],
              type: 'rule'
            });
          } else {
            // Parent state exists, but rule is new
            const ruleExists = baseState.rules.some(br => 
              this.rulesMatch(br, baseStates, compareRule, compareStates)
            );

            if (!ruleExists) {
              const targetState = compareStates.find(s => s.id === compareRule.nextState);
              results.push({
                stateName: compareState.name,
                condition: compareRule.condition,
                targetState: targetState?.name || 'unknown',
                status: 'added',
                changes: ['New rule added to existing state'],
                type: 'rule'
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Checks if two states match using multi-criteria approach
   * Priority: ID match > Name match > Normalized name match
   * 
   * @param {Object} state1 - First state
   * @param {Object} state2 - Second state
   * @returns {boolean} True if states match
   */
  statesMatch(state1, state2) {
    // Priority 1: Exact ID match
    if (state1.id === state2.id) {
      return true;
    }

    // Priority 2: Name match
    if (state1.name === state2.name) {
      return true;
    }

    // Priority 3: Normalized name match (handles spacing/case differences)
    const normalizedName1 = this.normalizeName(state1.name);
    const normalizedName2 = this.normalizeName(state2.name);
    if (normalizedName1 === normalizedName2) {
      return true;
    }

    return false;
  }

  /**
   * Checks if two rules match using comprehensive criteria
   * 
   * @param {Object} rule1 - First rule
   * @param {Array} states1 - States array for first rule
   * @param {Object} rule2 - Second rule
   * @param {Array} states2 - States array for second rule
   * @returns {boolean} True if rules match
   */
  rulesMatch(rule1, states1, rule2, states2) {
    // Priority 1: Exact ID match (if both have string IDs)
    if (typeof rule1.id === 'string' && typeof rule2.id === 'string' &&
        rule1.id === rule2.id && rule1.id.startsWith('id_')) {
      return true;
    }

    // Priority 2: Condition match (primary identifier)
    const condition1 = rule1.condition.trim().toLowerCase();
    const condition2 = rule2.condition.trim().toLowerCase();
    if (condition1 !== condition2) {
      return false;
    }

    // Priority 3: Check if target states match (by name, not ID)
    const targetState1 = states1.find(s => s.id === rule1.nextState);
    const targetState2 = states2.find(s => s.id === rule2.nextState);

    if (targetState1 && targetState2) {
      // Both target states exist - compare by name
      if (targetState1.name.toLowerCase() !== targetState2.name.toLowerCase()) {
        return false;
      }
    } else if (targetState1 || targetState2) {
      // One exists but not the other - different rules
      return false;
    }

    return true;
  }

  /**
   * Checks if a state has any modifications
   * 
   * @param {Object} state1 - Base state
   * @param {Object} state2 - Compare state
   * @param {Array} states1 - Base states array
   * @param {Array} states2 - Compare states array
   * @returns {boolean} True if state has modifications
   */
  stateHasModifications(state1, state2, states1, states2) {
    // Check if rule count changed
    if (state1.rules.length !== state2.rules.length) {
      return true;
    }

    // Check if any rule was modified
    for (const rule1 of state1.rules) {
      const matchingRule = state2.rules.find(r => 
        this.rulesMatch(rule1, states1, r, states2)
      );

      if (!matchingRule) {
        return true; // Rule removed or not found
      }

      const changes = this.compareRuleDetails(rule1, states1, matchingRule, states2);
      if (changes.length > 0) {
        return true; // Rule modified
      }
    }

    return false;
  }

  /**
   * Gets detailed changes for a state
   * 
   * @param {Object} state1 - Base state
   * @param {Object} state2 - Compare state
   * @param {Array} states1 - Base states array
   * @param {Array} states2 - Compare states array
   * @returns {Array} Array of change descriptions
   */
  getStateChanges(state1, state2, states1, states2) {
    const changes = [];

    // Check rule count
    if (state1.rules.length !== state2.rules.length) {
      changes.push(
        `Rule count changed: ${state1.rules.length} → ${state2.rules.length}`
      );
    }

    // Check for modified rules
    let modifiedCount = 0;
    for (const rule1 of state1.rules) {
      const matchingRule = state2.rules.find(r => 
        this.rulesMatch(rule1, states1, r, states2)
      );

      if (matchingRule) {
        const ruleChanges = this.compareRuleDetails(
          rule1,
          states1,
          matchingRule,
          states2
        );
        if (ruleChanges.length > 0) {
          modifiedCount++;
        }
      }
    }

    if (modifiedCount > 0) {
      changes.push(`${modifiedCount} rule(s) modified`);
    }

    return changes;
  }

  /**
   * Compares two rules and identifies what changed
   * 
   * @param {Object} rule1 - Base rule
   * @param {Array} states1 - Base states array
   * @param {Object} rule2 - Compare rule
   * @param {Array} states2 - Compare states array
   * @returns {Array} Array of change descriptions
   */
  compareRuleDetails(rule1, states1, rule2, states2) {
    const changes = [];

    // Compare next states
    const nextState1 = states1.find(s => s.id === rule1.nextState)?.name || 'unknown';
    const nextState2 = states2.find(s => s.id === rule2.nextState)?.name || 'unknown';
    if (nextState1 !== nextState2) {
      changes.push(`Next state: ${nextState1} → ${nextState2}`);
    }

    // Compare priorities
    const priority1 = rule1.priority !== undefined && rule1.priority !== null ? rule1.priority : 50;
    const priority2 = rule2.priority !== undefined && rule2.priority !== null ? rule2.priority : 50;
    if (priority1 !== priority2) {
      changes.push(`Priority: ${priority1} → ${priority2}`);
    }

    // Compare operations
    const op1 = rule1.operation || '';
    const op2 = rule2.operation || '';
    if (op1 !== op2) {
      changes.push(`Operation: "${op1}" → "${op2}"`);
    }

    return changes;
  }

  /**
   * Normalizes a name for comparison
   * 
   * @param {string} name - Name to normalize
   * @returns {string} Normalized name
   */
  normalizeName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Checks if comparison results have any changes
   * 
   * @param {Object} summary - Summary object from comparison
   * @returns {boolean} True if there are any changes
   */
  hasChanges(summary) {
    return (
      summary.addedStates > 0 ||
      summary.removedStates > 0 ||
      summary.modifiedStates > 0 ||
      summary.addedRules > 0 ||
      summary.removedRules > 0 ||
      summary.modifiedRules > 0
    );
  }

  /**
   * Filters comparison results based on criteria
   * 
   * @param {Array} results - Comparison results array
   * @param {Object} filters - Filter criteria
   * @param {string} filters.searchText - Text to search for
   * @param {string} filters.statusFilter - Status filter (ALL, added, removed, modified, unchanged)
   * @param {string} filters.typeFilter - Type filter (ALL, state, rule)
   * @returns {Array} Filtered results
   */
  filterResults(results, filters = {}) {
    const {
      searchText = '',
      statusFilter = 'ALL',
      typeFilter = 'ALL'
    } = filters;

    return results.filter(item => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const stateNameMatch = item.stateName?.toLowerCase().includes(searchLower);
        const conditionMatch = item.condition?.toLowerCase().includes(searchLower);
        const targetMatch = item.targetState?.toLowerCase().includes(searchLower);

        if (!nameMatch && !stateNameMatch && !conditionMatch && !targetMatch) {
          return false;
        }
      }

      return true;
    });
  }
}

// Singleton instance
let instance = null;

/**
 * Gets the singleton instance of StateComparisonService
 * @returns {StateComparisonService}
 */
export const getStateComparisonService = () => {
  if (!instance) {
    instance = new StateComparisonService();
  }
  return instance;
};

export default StateComparisonService;
