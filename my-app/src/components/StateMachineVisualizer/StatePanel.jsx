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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg p-6 mb-8">
      {/* Panel Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">States</h2>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-300">
            {states.length} state{states.length !== 1 ? 's' : ''} defined
          </p>
          
          {/* State Dictionary Import */}
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
                className="cursor-pointer inline-flex items-center px-3 py-1.5 text-sm
                         bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white
                         rounded-md transform transition-all duration-200 hover:scale-110
                         border border-gray-600 shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Load Dictionary
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
      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="Enter state name"
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Button
            onClick={handleAddState}
            disabled={!newStateName.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Add State
          </Button>
        </div>
      </div>

      {/* States List Section */}
      <div className="states-list space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {states.map(state => (
          <div key={state.id} className="flex flex-col gap-1">
            {/* State Item */}
            <div 
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer
                        ${selectedState?.id === state.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }
                        transition-colors duration-200`}
              onClick={() => handleStateClick(state.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="font-medium truncate">{state.name}</span>
                  {state.rules && state.rules.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded-full text-xs">
                      {state.rules.length}
                    </span>
                  )}
                </div>
                
                {/* State Description (if available from dictionary) */}
                {loadedStateDictionary && loadedStateDictionary[state.name] && (
                  <p className="text-xs text-gray-300 mt-1 truncate">
                    {loadedStateDictionary[state.name].description}
                  </p>
                )}
              </div>
              
              {/* Delete Button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onStateDelete(state.id);
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-700/50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {states.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No states defined yet.</p>
            <p className="text-sm mt-2">Add a state to get started.</p>
          </div>
        )}
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
