import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Trash2 } from 'lucide-react';

const RulesSection = ({ 
  selectedState, 
  states, 
  newRuleCondition, 
  setNewRuleCondition, 
  newRuleNextState, 
  setNewRuleNextState, 
  setStates, 
  setSelectedState 
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
        <Input
          value={newRuleCondition}
          onChange={(e) => setNewRuleCondition(e.target.value)}
          placeholder="New rule condition"
          className="text-sm h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <select
          value={newRuleNextState}
          onChange={(e) => setNewRuleNextState(e.target.value)}
          className="text-sm h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600 rounded"
        >
          <option value="">Select target state</option>
          {states.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (newRuleCondition.trim() && newRuleNextState) {
              const targetState = states.find(s => s.name === newRuleNextState);
              if (targetState) {
                const currentState = states.find(s => s.id === selectedState);
                
                const existingRule = currentState.rules.find(r => 
                  r.condition.toLowerCase() === newRuleCondition.trim().toLowerCase()
                );

                const updatedStates = states.map(s => {
                  if (s.id === selectedState) {
                    if (existingRule) {
                      return {
                        ...s,
                        rules: s.rules.map(r => 
                          r.condition.toLowerCase() === newRuleCondition.trim().toLowerCase()
                            ? { ...r, nextState: targetState.id }
                            : r
                        )
                      };
                    } else {
                      return {
                        ...s,
                        rules: [...s.rules, {
                          id: Date.now(),
                          condition: newRuleCondition.trim(),
                          nextState: targetState.id
                        }]
                      };
                    }
                  }
                  return s;
                });
                
                setStates(updatedStates);
                setNewRuleCondition("");
                setNewRuleNextState("");
              }
            }
          }}
          className="p-1 h-8 bg-gray-900 text-white
                    hover:bg-blue-600 hover:text-white
                    dark:bg-gray-900 dark:text-white
                    dark:hover:bg-blue-600 dark:hover:text-white
                    min-w-[32px] flex items-center justify-center gap-2
                    transform transition-all duration-200 hover:scale-110"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </Button>
      </div>

      {states
        .find(s => s.id === selectedState)
        ?.rules.map((rule) => (
          <div 
            key={rule.id} 
            className="py-1 px-3 rounded-lg border transition-colors duration-200 text-sm
                      border-gray-200 bg-gray-200 text-gray-900 hover:bg-gray-300 
                      dark:bg-gray-400 dark:text-white dark:hover:bg-gray-500
                      dark:border-gray-300"
          >
            <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
              <Input
                value={rule.condition}
                onChange={(e) => {
                  const updatedStates = states.map(s => {
                    if (s.id === selectedState) {
                      return {
                        ...s,
                        rules: s.rules.map(r => 
                          r.id === rule.id 
                            ? { ...r, condition: e.target.value }
                            : r
                        )
                      };
                    }
                    return s;
                  });
                  setStates(updatedStates);
                }}
                placeholder="Rule condition"
                className="text-sm h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <button
                onClick={() => {
                  const targetState = states.find(s => s.id === rule.nextState);
                  if (targetState) {
                    setSelectedState(targetState.id);
                  }
                }}
                className="text-blue-600 hover:text-blue-800 text-sm h-8 px-3
                         focus:outline-none bg-blue-50 dark:bg-blue-900/20 
                         rounded-md border border-blue-200 dark:border-blue-800
                         flex items-center justify-between
                         transition-all duration-200 cursor-pointer
                         hover:bg-blue-100 dark:hover:bg-blue-900/30
                         font-medium"
              >
                <span>{states.find(s => s.id === rule.nextState)?.name}</span>
                <span className="text-xs text-blue-500 dark:text-blue-400">
                  (click to view)
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const updatedStates = states.map(s => {
                    if (s.id === selectedState) {
                      return {
                        ...s,
                        rules: s.rules.filter(r => r.id !== rule.id)
                      };
                    }
                    return s;
                  });
                  setStates(updatedStates);
                }}
                className="p-1 h-8 text-red-500 hover:text-red-700 
                          dark:text-red-500 dark:hover:text-red-400 
                          hover:bg-gray-300 dark:hover:bg-gray-500
                          min-w-[32px] flex items-center justify-center"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
};

export default RulesSection; 