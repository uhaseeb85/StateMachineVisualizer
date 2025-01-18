import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from 'lucide-react';

export default function PathFinderModal({ states, onClose }) {
  const [selectedState, setSelectedState] = useState('');
  const [paths, setPaths] = useState([]);

  const findAllPaths = (startStateId) => {
    const startState = states.find(s => s.id === startStateId);
    if (!startState) return [];

    const endStates = states.filter(s => s.rules.length === 0);
    let allPaths = [];

    const dfs = (currentState, currentPath = [], rulePath = []) => {
      currentPath.push(currentState.name);

      if (currentState.rules.length === 0) {
        allPaths.push({
          states: [...currentPath],
          rules: [...rulePath]
        });
      } else {
        for (const rule of currentState.rules) {
          const nextState = states.find(s => s.id === rule.nextState);
          if (nextState && !currentPath.includes(nextState.name)) {
            dfs(nextState, [...currentPath], [...rulePath, rule.condition]);
          }
        }
      }
    };

    dfs(startState);
    return allPaths;
  };

  const handleFindPaths = () => {
    const foundPaths = findAllPaths(selectedState);
    setPaths(foundPaths);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Find Paths to End States
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                       text-sm dark:bg-gray-700 dark:text-white px-3"
            >
              <option value="">Select Starting State</option>
              {states.map(state => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
            <Button
              onClick={handleFindPaths}
              disabled={!selectedState}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Find Paths
            </Button>
          </div>

          {paths.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Found {paths.length} path{paths.length !== 1 ? 's' : ''}:
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {paths.map((path, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {path.states.map((state, stateIndex) => (
                        <React.Fragment key={stateIndex}>
                          <span className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-md
                                       border border-gray-200 dark:border-gray-600">
                            {state}
                          </span>
                          {stateIndex < path.states.length - 1 && (
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 
                                           text-orange-700 dark:text-orange-300 rounded">
                                {path.rules[stateIndex]}
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Path length: {path.states.length} states, {path.rules.length} transitions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paths.length === 0 && selectedState && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No paths found to end states.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 