import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from 'lucide-react';

export default function PathFinderModal({ states, onClose }) {
  const [selectedStartState, setSelectedStartState] = useState('');
  const [selectedEndState, setSelectedEndState] = useState('');
  const [searchMode, setSearchMode] = useState('endStates'); // 'endStates' or 'specificState'
  const [paths, setPaths] = useState([]);

  const findPaths = (startStateId, endStateId = null) => {
    const startState = states.find(s => s.id === startStateId);
    if (!startState) return [];

    let allPaths = [];

    const dfs = (currentState, currentPath = [], rulePath = []) => {
      currentPath.push(currentState.name);

      if (endStateId) {
        // Specific state target mode
        if (currentState.id === endStateId) {
          allPaths.push({
            states: [...currentPath],
            rules: [...rulePath]
          });
        }
      } else {
        // End states mode
        if (currentState.rules.length === 0) {
          allPaths.push({
            states: [...currentPath],
            rules: [...rulePath]
          });
        }
      }

      for (const rule of currentState.rules) {
        const nextState = states.find(s => s.id === rule.nextState);
        if (nextState && !currentPath.includes(nextState.name)) {
          dfs(nextState, [...currentPath], [...rulePath, rule.condition]);
        }
      }
    };

    dfs(startState);
    return allPaths;
  };

  const handleFindPaths = () => {
    if (searchMode === 'specificState') {
      if (!selectedStartState || !selectedEndState) {
        return;
      }
      const foundPaths = findPaths(selectedStartState, selectedEndState);
      setPaths(foundPaths);
    } else {
      if (!selectedStartState) {
        return;
      }
      const foundPaths = findPaths(selectedStartState);
      setPaths(foundPaths);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Find Paths
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
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setSearchMode('endStates');
                setSelectedEndState('');
                setPaths([]);
              }}
              variant={searchMode === 'endStates' ? 'default' : 'outline'}
              className={searchMode === 'endStates' ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              Find Paths to End States
            </Button>
            <Button
              onClick={() => {
                setSearchMode('specificState');
                setPaths([]);
              }}
              variant={searchMode === 'specificState' ? 'default' : 'outline'}
              className={searchMode === 'specificState' ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              Find Paths Between States
            </Button>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={selectedStartState}
              onChange={(e) => setSelectedStartState(e.target.value)}
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

            {searchMode === 'specificState' && (
              <select
                value={selectedEndState}
                onChange={(e) => setSelectedEndState(e.target.value)}
                className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                         text-sm dark:bg-gray-700 dark:text-white px-3"
              >
                <option value="">Select Target State</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            )}

            <Button
              onClick={handleFindPaths}
              disabled={!selectedStartState || (searchMode === 'specificState' && !selectedEndState)}
              className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
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

          {paths.length === 0 && (selectedStartState && (searchMode === 'endStates' || selectedEndState)) && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No paths found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 