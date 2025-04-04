/**
 * RulesPanel Component
 * 
 * A panel component that manages transition rules between states in the state machine.
 * Features include:
 * - Adding new transition rules
 * - Editing existing rules
 * - Deleting rules
 * - Importing rule descriptions from Excel
 * - Displaying rule metadata and descriptions
 * - Managing rule conditions and target states
 * 
 * Rules can be complex conditions (using + for AND operations) and can include
 * negations (using ! prefix). Each rule defines a transition to a target state.
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ArrowRight, Upload, Edit2, Check, X, PlusCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { sortRulesByPriority } from "./utils";

const RulesPanel = ({
  states,
  selectedState,
  onStateSelect,
  setStates,
  onRuleDictionaryImport,
  loadedDictionary,
  setLoadedDictionary,
  addToChangeLog = () => {},
  loadedStateDictionary
}) => {
  // Rule editing states
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleNextState, setNewRuleNextState] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingRuleCondition, setEditingRuleCondition] = useState("");
  const [editingRulePriority, setEditingRulePriority] = useState(50);
  const [editingRuleOperation, setEditingRuleOperation] = useState("");
  const [insertingBeforeRuleId, setInsertingBeforeRuleId] = useState(null);
  const [newRulePriority, setNewRulePriority] = useState(50);
  const [newRuleOperation, setNewRuleOperation] = useState("");

  // Get current state details
  const currentState = states.find(state => state.id === selectedState);

  /**
   * Initialize rule dictionary from localStorage on component mount
   */
  useEffect(() => {
    const savedDictionary = localStorage.getItem('ruleDictionary');
    if (savedDictionary) {
      setLoadedDictionary(JSON.parse(savedDictionary));
    }
  }, [setLoadedDictionary]);

  /**
   * Handles the import of rule descriptions from Excel file
   * Updates both state and localStorage with the imported dictionary
   */
  const handleDictionaryImport = async (event) => {
    try {
      const result = await onRuleDictionaryImport(event);
      if (result?.dictionary) {
        const dictionary = result.dictionary;
        setLoadedDictionary(dictionary);
        localStorage.setItem('ruleDictionary', JSON.stringify(dictionary));
      }
    } catch (error) {
      console.error('Error importing dictionary:', error);
    }
  };

  /**
   * Handles the addition of a new rule
   */
  const addRule = () => {
    if (!newRuleCondition.trim() || !newRuleNextState) {
      toast.error('Please provide both a condition and target state');
      return;
    }

    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        // Check if rule with same condition already exists
        const existingRuleIndex = state.rules.findIndex(
          rule => rule.condition.trim().toLowerCase() === newRuleCondition.trim().toLowerCase()
        );
        
        if (existingRuleIndex !== -1) {
          // Rule with this name already exists
          toast.error(`Rule "${newRuleCondition.trim()}" already exists for this state. Please use a different name.`);
          return state; // Return unchanged state
        } else {
          // Add new rule
          addToChangeLog(`Added new rule to state "${state.name}": ${newRuleCondition.trim()} → ${states.find(s => s.id === newRuleNextState)?.name} (Priority: ${newRulePriority})`);
          
          const newRules = [...state.rules, {
            id: Date.now(),
            condition: newRuleCondition.trim(),
            nextState: newRuleNextState,
            priority: newRulePriority,
            operation: newRuleOperation
          }];
          
          return {
            ...state,
            rules: sortRulesByPriority(newRules)
          };
        }
      }
      return state;
    });

    // If the state was actually updated (no duplicates found)
    if (updatedStates !== states) {
      setStates(updatedStates);
      setNewRuleCondition("");
      setNewRuleNextState("");
      setNewRulePriority(50);
      setNewRuleOperation("");
    }
  };

  /**
   * Deletes a rule from the current state
   * @param {string} ruleId - ID of the rule to delete
   */
  const deleteRule = (ruleId) => {
    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        const ruleToDelete = state.rules.find(rule => rule.id === ruleId);
        const targetState = states.find(s => s.id === ruleToDelete.nextState);
        addToChangeLog(`Deleted rule from state "${state.name}": ${ruleToDelete.condition} → ${targetState?.name} (Priority: ${ruleToDelete.priority !== undefined && ruleToDelete.priority !== null ? ruleToDelete.priority : 50})`);
        
        return {
          ...state,
          rules: state.rules.filter(rule => rule.id !== ruleId)
        };
      }
      return state;
    });
    setStates(updatedStates);
  };

  /**
   * Handles clicking on a target state to navigate to it
   * @param {string} stateId - ID of the target state
   * @param {Event} e - Click event
   */
  const handleTargetStateClick = (stateId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // First, get the target state that this rule is pointing to
    const targetState = states.find(s => s.id === stateId);
    
    if (targetState && targetState.name) {
      // Find all states with the same name
      const sameNameStates = states.filter(s => 
        s.id !== targetState.id && 
        s.name.toLowerCase() === targetState.name.toLowerCase()
      );
      
      if (sameNameStates.length > 0) {
        // PRIORITY 1: Find states with the same name that have rules
        const statesWithRules = sameNameStates.filter(s => s.rules && s.rules.length > 0);
        
        if (statesWithRules.length > 0) {
          // If the current state has a graphSource (from a specific graph), 
          // try to find a state from a different source
          if (currentState && currentState.graphSource) {
            // Look for states from a different graph source first - these would be the newly imported ones
            const differentSourceStates = statesWithRules.filter(s => 
              s.graphSource && s.graphSource !== currentState.graphSource
            );
            
            if (differentSourceStates.length > 0) {
              // Select the first state from a different graph source
              onStateSelect(differentSourceStates[0].id, false);
              return;
            }
          }
          
          // If we can't find a state from a different graph source, just use any state with rules
          onStateSelect(statesWithRules[0].id, false);
          return;
        }
      }
    }
    
    // Fall back to original behavior
    onStateSelect(stateId, false);
  };

  /**
   * Toggles rule selection for viewing descriptions
   * @param {string} ruleId - ID of the rule
   */
  const handleRuleClick = (ruleId) => {
    setSelectedRuleId(selectedRuleId === ruleId ? null : ruleId);
  };

  /**
   * Handles rule editing mode
   * @param {string} ruleId - ID of the rule to edit
   */
  const handleEditRule = (ruleId) => {
    const rule = currentState.rules.find(r => r.id === ruleId);
    setEditingRuleId(ruleId);
    setEditingRuleCondition(rule.condition);
    setNewRuleNextState(rule.nextState);
    setEditingRulePriority(rule.priority || 50);
    setEditingRuleOperation(rule.operation || "");
  };

  /**
   * Copies a rule to create a new one
   * @param {string} ruleId - ID of the rule to copy
   * @param {Event} e - Click event
   */
  const handleCopyRule = (ruleId, e) => {
    e.stopPropagation();
    
    const ruleToCopy = currentState.rules.find(r => r.id === ruleId);
    if (!ruleToCopy) return;
    
    // Prefill the "Add Rule" form with copied values
    setNewRuleCondition(`Copy of ${ruleToCopy.condition}`);
    setNewRuleNextState(ruleToCopy.nextState);
    setNewRulePriority(ruleToCopy.priority || 50);
    setNewRuleOperation(ruleToCopy.operation || "");
    
    // Focus on the condition input after a short delay to allow rendering
    setTimeout(() => {
      const conditionInput = document.getElementById('new-rule-condition');
      if (conditionInput) {
        conditionInput.focus();
        // Select the "Copy of " prefix to make it easy to edit
        conditionInput.setSelectionRange(0, 8);
      }
    }, 100);
    
    toast.info('Edit the copied rule details and click "Add Rule" to save');
  };

  /**
   * Gets descriptions for individual parts of a compound rule
   * Handles negated conditions (with ! prefix)
   * @param {string} condition - Rule condition to get descriptions for
   * @returns {Array} Array of rule parts with their descriptions
   */
  const getRuleDescriptions = (condition) => {
    if (!condition) return [];
    
    // Split the condition by '+' and trim each part
    const individualRules = condition.split('+').map(rule => rule.trim());
    
    // Get descriptions for each rule, removing '!' prefix if present
    return individualRules.map(rule => ({
      rule: rule,  // Keep original rule with ! for display
      description: loadedDictionary?.[rule.replace(/^!/, '')] // Remove ! prefix when searching dictionary
    })).filter(item => item.description);
  };

  /**
   * Saves changes to an edited rule
   */
  const saveEditedRule = () => {
    if (!editingRuleCondition.trim() || !newRuleNextState) {
      toast.error('Please provide both a condition and target state');
      return;
    }

    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        // Check if another rule has the same condition name (excluding the rule being edited)
        const duplicateRule = state.rules.find(rule => 
          rule.id !== editingRuleId && 
          rule.condition.trim().toLowerCase() === editingRuleCondition.trim().toLowerCase()
        );
        
        if (duplicateRule) {
          toast.error(`Rule "${editingRuleCondition.trim()}" already exists for this state. Please use a different name.`);
          return state; // Return unchanged state
        }
        
        const updatedRules = state.rules.map(rule => {
          if (rule.id === editingRuleId) {
            const oldRule = { ...rule };
            const oldTargetState = states.find(s => s.id === oldRule.nextState)?.name || 'unknown';
            const newTargetState = states.find(s => s.id === newRuleNextState)?.name || 'unknown';
            
            const newRule = {
              ...rule,
              condition: editingRuleCondition.trim(),
              nextState: newRuleNextState,
              priority: editingRulePriority,
              operation: editingRuleOperation
            };

            // Create a clean, single-line message for the change log
            const changeMessage = `Edited rule in state "${state.name}": "${oldRule.condition} → ${oldTargetState}" changed to "${newRule.condition} → ${newTargetState}" (Priority: ${oldRule.priority !== undefined && oldRule.priority !== null ? oldRule.priority : 50} → ${editingRulePriority})`;
            
            addToChangeLog(changeMessage);

            return newRule;
          }
          return rule;
        });
        return { ...state, rules: sortRulesByPriority(updatedRules) };
      }
      return state;
    });

    // If the state was actually updated (no duplicates found)
    if (updatedStates !== states) {
      setStates(updatedStates);
      setEditingRuleId(null);
      setEditingRuleCondition("");
      setNewRuleNextState("");
      setEditingRulePriority(50);
      setEditingRuleOperation("");
    }
  };

  /**
   * Handles canceling rule editing mode
   */
  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditingRuleCondition("");
    setEditingRuleOperation("");
  };

  /**
   * Inserts a new rule before the specified rule
   */
  const insertRuleBefore = () => {
    if (!newRuleCondition.trim() || !newRuleNextState) {
      toast.error('Please provide both a condition and target state');
      return;
    }

    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        const ruleIndex = state.rules.findIndex(rule => rule.id === insertingBeforeRuleId);
        if (ruleIndex === -1) return state;

        const newRule = {
          id: Date.now(),
          condition: newRuleCondition.trim(),
          nextState: newRuleNextState,
          priority: newRulePriority,
          operation: newRuleOperation
        };

        const updatedRules = [...state.rules];
        updatedRules.splice(ruleIndex, 0, newRule);

        addToChangeLog(`Inserted new rule before rule #${ruleIndex + 1} in state "${state.name}": ${newRuleCondition.trim()} → ${states.find(s => s.id === newRuleNextState)?.name} (Priority: ${newRulePriority})`);

        return {
          ...state,
          rules: sortRulesByPriority(updatedRules)
        };
      }
      return state;
    });

    setStates(updatedStates);
    setNewRuleCondition("");
    setNewRuleNextState("");
    setNewRulePriority(50);
    setNewRuleOperation("");
    setInsertingBeforeRuleId(null);
  };

  /**
   * Begins the process of inserting a rule before another rule
   * @param {string} ruleId - ID of the rule to insert before
   */
  const handleInsertBefore = (ruleId) => {
    setInsertingBeforeRuleId(ruleId);
    setSelectedRuleId(null);
    setEditingRuleId(null);
    // Focus on the condition input
    setTimeout(() => {
      const input = document.getElementById('ruleConditionInput');
      if (input) input.focus();
    }, 0);
  };

  /**
   * Cancels rule insertion mode
   */
  const handleCancelInsert = () => {
    setInsertingBeforeRuleId(null);
    setNewRuleCondition("");
    setNewRuleNextState("");
    setNewRuleOperation("");
  };

  // Render placeholder when no state is selected
  if (!selectedState) {
    return (
      <div className="w-full lg:w-3/4 border border-gray-200/20 dark:border-gray-700/20 
                      rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Select a state to manage its rules
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-3/4 border border-gray-200/20 dark:border-gray-700/20 
                    rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl 
                    rules-section">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Rules for {currentState?.name}
          </h2>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleDictionaryImport}
                className="hidden"
                id="ruleDictionaryInput"
              />
              <label
                htmlFor="ruleDictionaryInput"
                title="Import an Excel file containing predefined rules and their descriptions to enhance rule documentation"
                className="load-rule-dictionary-button cursor-pointer inline-flex items-center px-3 py-1.5 text-sm
                         bg-white hover:bg-blue-600 text-gray-900 hover:text-white
                         dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                         rounded-md transform transition-all duration-200 hover:scale-110
                         border border-gray-200 shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load Rule Dictionary
                {loadedDictionary && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                    {Object.keys(loadedDictionary).length}
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
        <div className="mt-2 mb-4 border-b border-gray-200 dark:border-gray-700" />
      </div>

      {/* State Description Section */}
      {loadedStateDictionary && currentState && loadedStateDictionary[currentState.name] && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loadedStateDictionary[currentState.name]}
          </p>
        </div>
      )}

      {/* Add Rule Form */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {insertingBeforeRuleId ? 'Insert New Rule' : 'Add New Rule'}
          {insertingBeforeRuleId && (
            <span className="ml-2 text-xs text-blue-500">
              (Inserting before selected rule)
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr,auto,auto,auto] gap-4 items-end">
          {/* Condition Input */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Condition
            </label>
            <Input
              id="new-rule-condition"
              value={newRuleCondition}
              onChange={(e) => setNewRuleCondition(e.target.value)}
              placeholder="Enter rule condition"
              className="w-full"
            />
          </div>

          {/* Visual Separator */}
          <div className="hidden md:block">
            <div className="h-2 w-[1px] bg-gray-300 dark:bg-gray-500 mx-auto" />
          </div>

          {/* Target State Selector */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Target State
            </label>
            <select
              value={newRuleNextState}
              onChange={(e) => setNewRuleNextState(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              <option value="">Select target state</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Input */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Priority (-99 to +99)
            </label>
            <Input
              type="number"
              min="-99"
              max="99"
              value={newRulePriority}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setNewRulePriority(0);
                } else {
                  const parsed = parseInt(value, 10);
                  setNewRulePriority(isNaN(parsed) ? 50 : 
                    Math.max(-99, Math.min(99, parsed))); // Clamp values between -99 and 99
                }
              }}
              className="w-full"
            />
          </div>

          {/* Operation Input */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Operation
            </label>
            <Input
              value={newRuleOperation}
              onChange={(e) => setNewRuleOperation(e.target.value)}
              placeholder="Enter rule operation"
              className="w-full"
            />
          </div>

          {/* Add/Insert Button */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              &nbsp;
            </label>
            <div className="flex gap-2">
              <Button
                onClick={insertingBeforeRuleId ? insertRuleBefore : addRule}
                disabled={!newRuleCondition.trim() || !newRuleNextState}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {insertingBeforeRuleId ? 'Insert Rule' : 'Add Rule'}
              </Button>
              
              {insertingBeforeRuleId && (
                <Button
                  onClick={handleCancelInsert}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rules List Section */}
      <div className="space-y-2">
        {currentState?.rules.map((rule, index) => {
          const targetState = states.find(s => s.id === rule.nextState);
          const ruleDescriptions = getRuleDescriptions(rule.condition);
          const isSelected = selectedRuleId === rule.id;
          const isEditing = editingRuleId === rule.id;
          const isInsertingBefore = insertingBeforeRuleId === rule.id;

          return (
            <div key={rule.id} className="flex flex-col gap-1">
              {/* Rule Item */}
              <div className={`grid grid-cols-[1fr,auto,1fr,auto,auto,auto] gap-4 items-center 
                           bg-white dark:bg-gray-700 p-1 rounded-lg
                           hover:bg-gray-50 dark:hover:bg-gray-600
                           transform transition-all duration-200 hover:scale-[1.02]
                           hover:shadow-sm cursor-pointer group
                           border ${isInsertingBefore ? 'border-blue-300 dark:border-blue-600' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-500'}
                           relative`}>
                {/* Rule Condition */}
                <div 
                  onClick={() => !isEditing && handleRuleClick(rule.id)}
                  className="bg-gray-50 dark:bg-gray-600/50 px-2 py-0.5 rounded-md
                           hover:bg-gray-100 dark:hover:bg-gray-500/50 cursor-pointer
                           flex items-center justify-between"
                >
                  {isEditing ? (
                    <Input
                      value={editingRuleCondition}
                      onChange={(e) => setEditingRuleCondition(e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                      {rule.condition}
                    </span>
                  )}
                </div>

                {/* Visual Separator */}
                <div className="h-2 w-[1px] bg-gray-300 dark:bg-gray-500" />

                {/* Target State */}
                <div className="bg-gray-50 dark:bg-gray-600/50 px-2 py-0.5 rounded-md">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <select
                        value={newRuleNextState}
                        onChange={(e) => setNewRuleNextState(e.target.value)}
                        className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 
                                 rounded hover:bg-gray-200 dark:hover:bg-gray-600
                                 text-gray-700 dark:text-white border-none"
                      >
                        <option value="">Select target state</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={(e) => handleTargetStateClick(rule.nextState, e)}
                        className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 
                                 rounded hover:bg-gray-200 dark:hover:bg-gray-600
                                 text-blue-500 dark:text-white"
                      >
                        {targetState?.name}
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="bg-gray-50 dark:bg-gray-600/50 px-2 py-0.5 rounded-md">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="-99"
                      max="99"
                      value={editingRulePriority}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setEditingRulePriority(0);
                        } else {
                          const parsed = parseInt(value, 10);
                          setEditingRulePriority(isNaN(parsed) ? 50 : 
                            Math.max(-99, Math.min(99, parsed))); // Clamp values between -99 and 99
                        }
                      }}
                      className="w-16 text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Priority: {rule.priority !== undefined && rule.priority !== null ? rule.priority : 50}
                    </span>
                  )}
                </div>

                {/* Operation */}
                <div className="bg-gray-50 dark:bg-gray-600/50 px-2 py-0.5 rounded-md">
                  {isEditing ? (
                    <Input
                      value={editingRuleOperation}
                      onChange={(e) => setEditingRuleOperation(e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    rule.operation ? (
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        Operation: {rule.operation}
                      </span>
                    ) : null
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={saveEditedRule}
                        className="h-6 w-6 p-0 text-green-500 hover:text-green-700
                                hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700
                                hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Copy Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCopyRule(rule.id, e)}
                        className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700
                                hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 
                                group-hover:opacity-100 transition-opacity"
                        title="Copy this rule"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {/* Insert Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInsertBefore(rule.id)}
                        className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700
                                hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 
                                group-hover:opacity-100 transition-opacity"
                        title="Insert rule before this one"
                      >
                        <PlusCircle className="w-3 h-3" />
                      </Button>
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule.id)}
                        className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700
                                hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-0 
                                group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRule(rule.id);
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700
                                hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 
                                group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Insert Indicator */}
                {isInsertingBefore && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-between items-center">
                    <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full shadow-md flex items-center">
                      <span>Inserting new rule before this one</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelInsert}
                        className="ml-2 h-5 w-5 p-0 text-white hover:text-blue-100 hover:bg-blue-600"
                        title="Cancel insertion"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rule Description */}
              {isSelected && ruleDescriptions.length > 0 && (
                <div className="ml-2 space-y-1">
                  {ruleDescriptions.map((desc, index) => (
                    <div 
                      key={index}
                      className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md
                                text-sm text-blue-700 dark:text-blue-200 animate-fadeIn
                                border border-blue-100 dark:border-blue-800/30
                                shadow-sm"
                    >
                      <span className="font-medium">
                        {desc.rule}: {desc.rule.startsWith('!') && '<NOT>'} 
                      </span> 
                      {desc.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {currentState?.rules.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No rules defined yet
          </div>
        )}
      </div>
    </div>
  );
};

RulesPanel.propTypes = {
  // Array of state objects
  states: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rules: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      condition: PropTypes.string.isRequired,
      nextState: PropTypes.string.isRequired,
      priority: PropTypes.number,
      operation: PropTypes.string
    }))
  })).isRequired,
  // Currently selected state ID
  selectedState: PropTypes.string,
  // Callback functions
  onStateSelect: PropTypes.func.isRequired,
  setStates: PropTypes.func.isRequired,
  onRuleDictionaryImport: PropTypes.func.isRequired,
  addToChangeLog: PropTypes.func.isRequired,
  // Rule dictionary state
  loadedDictionary: PropTypes.object,
  setLoadedDictionary: PropTypes.func.isRequired,
  loadedStateDictionary: PropTypes.object
};

export default RulesPanel;
