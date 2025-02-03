import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowRight, Upload, ChevronUp, ChevronDown, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import ChangeLog from './ChangeLog';

export default function RulesPanel({ states, selectedState, onStateSelect, setStates, onRuleDictionaryImport, loadedDictionary, setLoadedDictionary, addToChangeLog }) {
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleNextState, setNewRuleNextState] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editingRuleCondition, setEditingRuleCondition] = useState("");
  const currentState = states.find(state => state.id === selectedState);
  const [isDictionaryExpanded, setIsDictionaryExpanded] = useState(false);

  // Initialize loadedDictionary from localStorage
  useEffect(() => {
    const savedDictionary = localStorage.getItem('ruleDictionary');
    if (savedDictionary) {
      setLoadedDictionary(JSON.parse(savedDictionary));
    }
  }, [setLoadedDictionary]);

  const handleDictionaryImport = async (event) => {
    try {
      const result = await onRuleDictionaryImport(event);
      if (result?.dictionary) {
        const dictionary = result.dictionary;
        console.log('Setting dictionary:', dictionary, 'with length:', Object.keys(dictionary).length);
        setLoadedDictionary(dictionary);
        localStorage.setItem('ruleDictionary', JSON.stringify(dictionary));
      }
    } catch (error) {
      console.error('Error importing dictionary:', error);
    }
  };

  const addRule = () => {
    if (!newRuleCondition.trim() || !newRuleNextState) return;

    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        const existingRuleIndex = state.rules.findIndex(
          rule => rule.condition.toLowerCase() === newRuleCondition.trim().toLowerCase()
        );

        if (existingRuleIndex !== -1) {
          // Update existing rule's target state
          const updatedRules = [...state.rules];
          updatedRules[existingRuleIndex] = {
            ...updatedRules[existingRuleIndex],
            nextState: newRuleNextState
          };
          
          addToChangeLog(`Updated rule in state "${state.name}": ${newRuleCondition.trim()} → ${states.find(s => s.id === newRuleNextState)?.name}`);
          
          return {
            ...state,
            rules: updatedRules
          };
        } else {
          addToChangeLog(`Added new rule to state "${state.name}": ${newRuleCondition.trim()} → ${states.find(s => s.id === newRuleNextState)?.name}`);
          
          return {
            ...state,
            rules: [...state.rules, {
              id: Date.now(),
              condition: newRuleCondition.trim(),
              nextState: newRuleNextState,
            }],
          };
        }
      }
      return state;
    });

    setStates(updatedStates);
    setNewRuleCondition("");
    setNewRuleNextState("");
  };

  const deleteRule = (ruleId) => {
    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        const ruleToDelete = state.rules.find(rule => rule.id === ruleId);
        
        addToChangeLog(`Deleted rule from state "${state.name}": ${ruleToDelete.condition}`);
        
        return {
          ...state,
          rules: state.rules.filter(rule => rule.id !== ruleId)
        };
      }
      return state;
    });
    setStates(updatedStates);
  };

  const handleTargetStateClick = (stateId, e) => {
    e.preventDefault();  // Prevent default behavior
    e.stopPropagation(); // Stop event propagation
    onStateSelect(stateId, false); // Pass false to indicate no scrolling needed
  };

  const handleRuleClick = (ruleId, condition) => {
    if (selectedRuleId === ruleId) {
      setSelectedRuleId(null);
    } else {
      setSelectedRuleId(ruleId);
    }
  };

  const handleEditRule = (ruleId) => {
    const currentState = states.find(state => state.id === selectedState);
    const rule = currentState.rules.find(r => r.id === ruleId);
    setEditingRuleId(ruleId);
    setEditingRuleCondition(rule.condition);
    setNewRuleNextState(rule.nextState);
  };

  const saveEditedRule = () => {
    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        const updatedRules = state.rules.map(rule => {
          if (rule.id === editingRuleId) {
            const oldRule = { ...rule };
            const newRule = {
              ...rule,
              condition: editingRuleCondition.trim(),
              nextState: newRuleNextState
            };

            addToChangeLog(`Edited rule in state "${state.name}": 
              "${oldRule.condition} → ${states.find(s => s.id === oldRule.nextState)?.name}" 
              changed to 
              "${newRule.condition} → ${states.find(s => s.id === newRuleNextState)?.name}"`);

            return newRule;
          }
          return rule;
        });
        return { ...state, rules: updatedRules };
      }
      return state;
    });

    setStates(updatedStates);
    setEditingRuleId(null);
    setEditingRuleCondition("");
    setNewRuleNextState("");
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setEditingRuleCondition("");
  };

  const getRuleDescriptions = (condition) => {
    if (!condition) return [];
    
    // Split the condition by '+' and trim each part
    const individualRules = condition.split('+').map(rule => rule.trim());
    
    // Get descriptions for each rule, removing '!' prefix if present
    return individualRules.map(rule => ({
      rule: rule,  // Keep original rule with ! for display
      description: loadedDictionary?.[rule.replace(/^!/, '')] // Remove ! prefix when searching dictionary
    })).filter(item => item.description); // Only include rules that have descriptions
  };

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
                         bg-gray-900 hover:bg-blue-600 text-white
                         dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                         rounded-md transform transition-all duration-200 hover:scale-110"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load Rule Dictionary
                {loadedDictionary && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-500 dark:bg-blue-600 text-white rounded-full text-xs">
                    {Object.keys(loadedDictionary).length}
                  </span>
                )}
                {/* For debugging */}
                <span className="hidden">
                  {console.log('Dictionary:', loadedDictionary)}
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-2 mb-4 border-b border-gray-200 dark:border-gray-700" />
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newRuleCondition}
            onChange={(e) => setNewRuleCondition(e.target.value)}
            placeholder="Enter rule condition"
            className="flex-1"
          />
          <select
            value={newRuleNextState}
            onChange={(e) => setNewRuleNextState(e.target.value)}
            className="px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select target state</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          <Button
            onClick={addRule}
            disabled={!newRuleCondition.trim() || !newRuleNextState}
          >
            Add Rule
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {currentState?.rules.map(rule => {
          const targetState = states.find(s => s.id === rule.nextState);
          const ruleDescriptions = getRuleDescriptions(rule.condition);
          const isSelected = selectedRuleId === rule.id;
          const isEditing = editingRuleId === rule.id;

          return (
            <div key={rule.id} className="flex flex-col gap-1">
              <div className="grid grid-cols-[1fr,auto,1fr,auto] gap-4 items-center 
                           bg-white dark:bg-gray-700 p-1 rounded-lg
                           hover:bg-gray-50 dark:hover:bg-gray-600
                           transform transition-all duration-200 hover:scale-[1.02]
                           hover:shadow-sm cursor-pointer group
                           border border-transparent hover:border-gray-200 dark:hover:border-gray-500
                           relative">
                {/* Rule Column */}
                <div 
                  onClick={() => !isEditing && handleRuleClick(rule.id, rule.condition)}
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

                {/* Divider */}
                <div className="h-2 w-[1px] bg-gray-300 dark:bg-gray-500" />

                {/* State Column */}
                <div className="bg-gray-50 dark:bg-gray-600/50 px-2 py-0.5 rounded-md">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={(e) => handleTargetStateClick(rule.nextState, e)}
                      className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 
                               rounded hover:bg-gray-200 dark:hover:bg-gray-600
                               text-blue-500 dark:text-white"
                    >
                      {targetState?.name}
                    </button>
                  </div>
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
}
