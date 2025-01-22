import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function RulesPanel({ states, selectedState, onStateSelect, setStates }) {
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleNextState, setNewRuleNextState] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState(null);

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
    if (!confirm("Are you sure you want to delete this rule?")) {
      return;
    }

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
    toast.success("Rule deleted successfully");
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Rules for {currentState?.name}
        </h2>
        <div className="mt-2 mb-4 border-b border-gray-200 dark:border-gray-700" />
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
          <Input
            value={newRuleCondition}
            onChange={(e) => setNewRuleCondition(e.target.value)}
            placeholder="Rule Name"
            className="text-sm h-7 dark:bg-gray-700 dark:text-white"
          />
          <select
            value={newRuleNextState}
            onChange={(e) => setNewRuleNextState(e.target.value)}
            className="h-7 rounded-md border border-gray-300 dark:border-gray-600 
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
            className="h-7 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {currentState?.rules.map(rule => {
          const targetState = states.find(s => s.id === rule.nextState);
          return (
            <div 
              key={rule.id}
              className="h-7 grid grid-cols-[1fr,auto,1fr,auto] gap-2 items-center 
                       bg-white dark:bg-gray-700 px-2 rounded-lg
                       hover:bg-gray-50 dark:hover:bg-gray-600
                       transform transition-all duration-200 hover:scale-[1.02]
                       hover:shadow-sm cursor-pointer group
                       border border-transparent hover:border-gray-200 dark:hover:border-gray-500
                       relative"
              title="Rule selected"
            >
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                {rule.condition}
              </span>
              
              <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-500" />
              
              <button
                onClick={() => handleTargetStateClick(rule.nextState)}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 
                         dark:hover:text-blue-300 flex items-center gap-1 transition-colors truncate
                         group"
              >
                <ArrowRight className="w-3 h-3 flex-shrink-0 transform transition-transform 
                                   group-hover:translate-x-1" />
                {targetState?.name || 'Unknown State'}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRule(rule.id);
                }}
                className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 
                         dark:hover:bg-red-900/20 opacity-100 hover:opacity-100
                         transition-opacity flex items-center justify-center
                         group"
                title="Delete Rule"
              >
                <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
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