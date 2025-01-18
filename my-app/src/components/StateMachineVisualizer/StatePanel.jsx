import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StatePanel({ 
  states, 
  selectedState, 
  onStateSelect, 
  onStateAdd, 
  onStateDelete 
}) {
  const [newStateName, setNewStateName] = useState('');

  const handleAddState = () => {
    if (!newStateName.trim()) return;

    // Check for duplicate state name (case-insensitive)
    const isDuplicate = states.some(
      state => state.name.toLowerCase() === newStateName.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error("A state with this name already exists");
      return;
    }

    onStateAdd(newStateName);
    setNewStateName('');
  };

  return (
    <div className="w-full lg:w-1/4 border border-gray-200/20 dark:border-gray-700/20 
                    rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">States</h2>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="Enter state name"
            className="state-input text-sm dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddState();
              }
            }}
          />
          <Button
            onClick={handleAddState}
            disabled={!newStateName.trim()}
            className="add-state-button bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="states-list space-y-1.5">
        {states.map(state => (
          <div 
            key={state.id}
            data-state-id={state.id}
            className={`
              h-7 py-0.5 px-3 rounded-lg border transition-all duration-200 text-sm
              ${selectedState === state.id 
                ? 'border-blue-500 bg-blue-600 text-white dark:bg-blue-600 dark:text-white transform scale-105 shadow-lg'
                : 'border-gray-200 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 hover:scale-105 hover:shadow-md'
              }
              cursor-pointer flex justify-between items-center
              transform transition-all duration-200
            `}
            onClick={() => onStateSelect(state.id)}
          >
            <span className="truncate">{state.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStateDelete(state.id);
              }}
              className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 
                       dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100
                       transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 