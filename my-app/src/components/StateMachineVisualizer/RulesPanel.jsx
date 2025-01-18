import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export default function RulesPanel({ states, selectedState, onStateSelect, setStates }) {
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleNextState, setNewRuleNextState] = useState("");

  const currentState = states.find(s => s.id === selectedState);

  const addRule = () => {
    if (!newRuleCondition.trim() || !newRuleNextState) return;

    const updatedStates = states.map(state => {
      if (state.id === selectedState) {
        // Check if a rule with the same condition already exists
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
          return {
            ...state,
            rules: updatedRules
          };
        } else {
          // Add new rule
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
        return {
          ...state,
          rules: state.rules.filter(rule => rule.id !== ruleId),
        };
      }
      return state;
    });
    setStates(updatedStates);
  };

  const handleTargetStateClick = (stateId) => {
    onStateSelect(stateId);
    const stateElement = document.querySelector(`[data-state-id="${stateId}"]`);
    if (stateElement) {
      stateElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      stateElement.classList.add('highlight-pulse');
      setTimeout(() => {
        stateElement.classList.remove('highlight-pulse');
      }, 1500);
    }
  };

  if (!selectedState) {
    return (
      <div className="w-full lg:w-1/2 border border-gray-200/20 dark:border-gray-700/20 
                      rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Select a state to manage its rules
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/2 border border-gray-200/20 dark:border-gray-700/20 
                    rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl 
                    rules-section">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Rules for {currentState?.name}
        </h2>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
          <Input
            value={newRuleCondition}
            onChange={(e) => setNewRuleCondition(e.target.value)}
            placeholder="Rule Name"
            className="text-sm dark:bg-gray-700 dark:text-white"
          />
          <select
            value={newRuleNextState}
            onChange={(e) => setNewRuleNextState(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 
                     text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Target State</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          <Button
            onClick={addRule}
            disabled={!newRuleCondition.trim() || !newRuleNextState}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {currentState?.rules.map(rule => {
          const targetState = states.find(s => s.id === rule.nextState);
          return (
            <div 
              key={rule.id}
              className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center 
                       bg-white dark:bg-gray-700 p-2 rounded-lg"
            >
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {rule.condition}
              </span>
              <button
                onClick={() => handleTargetStateClick(rule.nextState)}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 
                         dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                {targetState?.name || 'Unknown State'}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteRule(rule.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 
                         dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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