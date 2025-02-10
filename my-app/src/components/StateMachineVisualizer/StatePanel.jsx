/**
 * StatePanel Component
 * 
 * A panel component that manages the states of the state machine.
 * Features include:
 * - Adding new states
 * - Deleting existing states
 * - Selecting states for editing
 * - Importing state descriptions from Excel
 * - Displaying state metadata (rule count, descriptions)
 * 
 * The component maintains a list of states and their associated rules,
 * with support for state dictionary imports to provide additional context.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx-js-style';

const StatePanel = ({ 
  states, 
  selectedState, 
  onStateSelect, 
  onStateAdd, 
  onStateDelete,
  loadedStateDictionary,
  setLoadedStateDictionary
}) => {
  // Local state management
  const [newStateName, setNewStateName] = useState('');
  const [selectedStateId, setSelectedStateId] = useState(null);

  /**
   * Handles the addition of a new state
   * Validates state name uniqueness and formats
   */
  const handleAddState = () => {
    const trimmedName = newStateName.trim();
    if (trimmedName) {
      // Check if state name already exists (case-insensitive)
      const stateExists = states.some(
        state => state.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (stateExists) {
        toast.error(`State "${trimmedName}" already exists!`);
        return;
      }

      onStateAdd(trimmedName);
      setNewStateName('');
    }
  };

  /**
   * Handles the import of state descriptions from Excel file
   * Validates file format and content structure
   * @param {Event} event - File input change event
   */
  const handleStateDictionaryImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension)) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Parse Excel file
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          // Validate file content
          if (jsonData.length === 0) {
            toast.error('The Excel file is empty');
            return;
          }

          const firstRow = jsonData[0];
          if (!('state' in firstRow) || !('description' in firstRow)) {
            toast.error('Excel file must contain "state" and "description" columns');
            return;
          }

          // Process state descriptions
          const stateDictionary = {};
          let statesUpdated = 0;

          jsonData.forEach(row => {
            if (row.state && row.description) {
              stateDictionary[row.state] = row.description;
              statesUpdated++;
            }
          });

          if (statesUpdated === 0) {
            toast.error('No valid states found in the Excel file');
            return;
          }

          // Update state and persist to localStorage
          setLoadedStateDictionary(stateDictionary);
          localStorage.setItem('stateDictionary', JSON.stringify(stateDictionary));
          toast.success(`State dictionary imported successfully! Loaded ${statesUpdated} state descriptions.`);

        } catch (error) {
          toast.error('Error processing Excel file: ' + error.message);
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Error importing state dictionary:', error);
      toast.error(`Error importing state dictionary: ${error.message}`);
    }
  };

  /**
   * Handles state selection and description toggle
   * @param {string} stateId - ID of the selected state
   */
  const handleStateClick = (stateId) => {
    onStateSelect(stateId);
    setSelectedStateId(selectedStateId === stateId ? null : stateId);
  };

  return (
    <div className="w-full lg:w-1/4 border border-gray-200/20 dark:border-gray-700/20 
                    rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">States</h2>
          <div className="flex items-center">
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleStateDictionaryImport}
                className="hidden"
                id="stateDictionaryInput"
              />
              <label
                htmlFor="stateDictionaryInput"
                className="load-state-dictionary-button cursor-pointer inline-flex items-center px-3 py-1.5 text-sm
                         bg-white hover:bg-blue-600 text-gray-900 hover:text-white
                         dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                         rounded-md transform transition-all duration-200 hover:scale-110
                         border border-gray-200 shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load State Dictionary
                {loadedStateDictionary && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                    {Object.keys(loadedStateDictionary).length}
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Add State Section */}
      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="Enter state name"
            className="flex-1"
          />
          <Button
            onClick={handleAddState}
            disabled={!newStateName.trim()}
          >
            Add State
          </Button>
        </div>
      </div>

      {/* States List Section */}
      <div className="states-list space-y-1.5">
        {states.map(state => (
          <div key={state.id} className="flex flex-col gap-1">
            {/* State Item */}
            <div 
              data-state-id={state.id}
              onClick={() => handleStateClick(state.id)}
              className={`
                h-7 rounded-lg border transition-all duration-200 text-sm
                ${selectedState === state.id 
                  ? 'border-blue-500 bg-blue-600 text-white dark:bg-blue-600 dark:text-white transform scale-105 shadow-lg'
                  : 'border-gray-200 bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 hover:scale-105 hover:shadow-md'
                }
                cursor-pointer flex justify-between items-center px-2
                transform transition-all duration-200 group
              `}
            >
              <span>{state.name}</span>
              <div className="flex items-center gap-2">
                {/* Rule Count Badge */}
                <span className={`
                  text-xs px-1.5 rounded-full
                  ${selectedState === state.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }
                `}>
                  {state.rules?.length || 0}
                </span>
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStateDelete(state.id);
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* State Description (shown when state is selected) */}
            {selectedStateId === state.id && loadedStateDictionary?.[state.name] && (
              <div className="ml-2 p-1 bg-blue-50 dark:bg-blue-900/20 rounded-md
                            text-sm text-blue-700 dark:text-blue-200 animate-fadeIn
                            border border-blue-100 dark:border-blue-800/30
                            shadow-sm">
                {loadedStateDictionary[state.name]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

StatePanel.propTypes = {
  // Array of state objects with id, name, and rules
  states: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rules: PropTypes.array
  })).isRequired,
  // Currently selected state ID
  selectedState: PropTypes.string,
  // Callback functions for state operations
  onStateSelect: PropTypes.func.isRequired,
  onStateAdd: PropTypes.func.isRequired,
  onStateDelete: PropTypes.func.isRequired,
  // State dictionary for descriptions
  loadedStateDictionary: PropTypes.object,
  setLoadedStateDictionary: PropTypes.func.isRequired
};

export default StatePanel;
