import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';

export default function StatePanel({ 
  states, 
  selectedState, 
  onStateSelect, 
  onStateAdd, 
  onStateDelete 
}) {
  const [newStateName, setNewStateName] = useState('');

  const handleAddState = () => {
    if (newStateName.trim()) {
      onStateAdd(newStateName);
      setNewStateName('');
    }
  };

  return (
    <div className="w-full lg:w-1/3 border border-gray-200/20 dark:border-gray-700/20 
                    rounded-xl p-6 
                    bg-white/40 dark:bg-gray-800/40 shadow-xl 
                    hover:bg-white/50 dark:hover:bg-gray-800/50
                    transition-all duration-300 backdrop-blur-sm">
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 add-state-section">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">States</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="Enter state name"
            className="flex-1 text-sm h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <Button 
            onClick={handleAddState}
            className="bg-gray-900 hover:bg-blue-600 text-white text-sm h-8
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-1 states-list">
        {states.map(state => (
          <div 
            key={state.id}
            data-state-id={state.id}
            className={`
              py-1 px-3 rounded-lg border transition-all duration-200 text-sm
              ${selectedState === state.id 
                ? 'border-blue-500 bg-blue-600 text-white dark:bg-blue-600 dark:text-white transform scale-105 shadow-lg'
                : 'border-gray-200 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 hover:scale-105 hover:shadow-md'
              }
              cursor-pointer flex justify-between items-center
              transform transition-all duration-200
            `}
            onClick={() => onStateSelect(state.id)}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`font-medium ${
                selectedState === state.id 
                  ? 'text-white dark:text-white'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {state.name}
                <span className="text-xs ml-2 opacity-75">
                  {state.rules.length} rule{state.rules.length !== 1 ? 's' : ''}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onStateDelete(state.id);
                }}
                className={`
                  p-1 h-6 hover:bg-red-500/10
                  text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                  transform transition-all duration-200 hover:scale-110
                `}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 