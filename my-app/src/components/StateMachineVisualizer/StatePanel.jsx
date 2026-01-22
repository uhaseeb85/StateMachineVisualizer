/**
 * StatePanel Component
 * 
 * A panel component that manages the states of the state machine.
 * Features include:
 * - Adding new states
 * - Deleting existing states
 * - Selecting states for editing
 * - Editing state names
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
import { Trash2, Upload, Edit2, Check, X, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import storage from '@/utils/storageWrapper';

const StatePanel = ({ 
  states, 
  selectedState, 
  onStateSelect, 
  onStateAdd, 
  onStateDelete,
  onStateEdit,
  loadedStateDictionary,
  setLoadedStateDictionary,
  onOpenDictionaryModal
}) => {
  // Local state management
  const [newStateName, setNewStateName] = useState('');
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [editingStateId, setEditingStateId] = useState(null);
  const [editingStateName, setEditingStateName] = useState('');

  // Get unique graph sources for coloring
  const graphSources = [...new Set(states.filter(s => s.graphSource).map(s => s.graphSource))];
  
  // Generate a color for each graph source (without displaying the name)
  const getGraphColor = (graphSource) => {
    if (!graphSource) return null;
    
    const colorOptions = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'
    ];
    
    const sourceIndex = graphSources.indexOf(graphSource);
    return colorOptions[sourceIndex % colorOptions.length];
  };
  
  // Get the border class for a specific graph source
  const getBorderClass = (graphSource) => {
    if (!graphSource) return '';
    
    const borderOptions = [
      'border-l-blue-500', 'border-l-green-500', 'border-l-purple-500', 
      'border-l-orange-500', 'border-l-pink-500', 'border-l-cyan-500'
    ];
    
    const sourceIndex = graphSources.indexOf(graphSource);
    return borderOptions[sourceIndex % borderOptions.length];
  };

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
   * Handles starting the state edit mode
   * @param {Event} e - Click event 
   * @param {string} stateId - ID of the state to edit
   * @param {string} stateName - Current name of the state
   */
  const handleEditStart = (e, stateId, stateName) => {
    e.stopPropagation();
    setEditingStateId(stateId);
    setEditingStateName(stateName);
  };

  /**
   * Handles saving the edited state name
   * Validates for uniqueness and non-empty values
   */
  const handleEditSave = () => {
    const trimmedName = editingStateName.trim();
    
    if (!trimmedName) {
      toast.error('State name cannot be empty');
      return;
    }

    // Check if the new state name already exists (case-insensitive) among other states
    const stateExists = states.some(
      state => state.id !== editingStateId && 
              state.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (stateExists) {
      toast.error(`State "${trimmedName}" already exists!`);
      return;
    }

    // Call the parent component's handler to update the state
    onStateEdit(editingStateId, trimmedName);
    
    // Reset editing state
    setEditingStateId(null);
    setEditingStateName('');
    
    // Show success message
    toast.success(`State renamed to "${trimmedName}"`);
  };

  /**
   * Cancels the current edit operation
   */
  const handleEditCancel = (e) => {
    if (e) e.stopPropagation();
    setEditingStateId(null);
    setEditingStateName('');
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
      reader.onload = async (e) => {
        try {
          // Parse Excel file
          const buffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const firstSheet = workbook.worksheets[0];
          const jsonData = [];
          const headers = [];
          
          firstSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              row.eachCell((cell) => {
                headers.push(cell.value);
              });
            } else {
              const rowData = {};
              row.eachCell((cell, colNumber) => {
                rowData[headers[colNumber - 1]] = cell.value;
              });
              jsonData.push(rowData);
            }
          });

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

          // Update state and persist to IndexedDB
          setLoadedStateDictionary(stateDictionary);
          await storage.setItem('stateDictionary', stateDictionary);
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
   * Cancels any ongoing edit operation
   * @param {string} stateId - ID of the selected state
   */
  const handleStateClick = (stateId) => {
    // Only select the state if we're not in edit mode for this state
    if (editingStateId !== stateId) {
      onStateSelect(stateId);
      setSelectedStateId(selectedStateId === stateId ? null : stateId);
      // Cancel any ongoing edits on other states
      if (editingStateId) {
        setEditingStateId(null);
        setEditingStateName('');
      }
    }
  };

  return (
    <div className="w-full lg:w-1/4 border border-gray-200/20 dark:border-gray-700/20 
                    rounded-xl p-6 bg-white/40 dark:bg-gray-800/40 shadow-xl">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">States</h2>
          <div className="flex items-center gap-6">
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

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDictionaryModal}
              className="bg-white hover:bg-blue-600 text-gray-900 hover:text-white
                       dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                       rounded-md transform transition-all duration-200 hover:scale-110
                       border border-gray-200 shadow-sm"
              title="Manage state dictionary (view, edit, delete, export)"
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
        </div>
        
        {/* Graph source legend - Restored */}
        {graphSources.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {graphSources.map((source, index) => (
              <div key={index} className="flex items-center text-xs">
                <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${getGraphColor(source)}`}></span>
                {source !== "External" && (
                  <span className="text-gray-600 dark:text-gray-300 truncate max-w-[150px]">{source}</span>
                )}
              </div>
            ))}
          </div>
        )}
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
            {/* State Item - Edit Mode or View Mode */}
            {editingStateId === state.id ? (
              // Edit Mode
              <div 
                className="h-9 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/30
                        text-sm flex items-center px-2 py-1 transform scale-105 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  type="text"
                  value={editingStateName}
                  onChange={(e) => setEditingStateName(e.target.value)}
                  className="flex-1 h-6 min-h-0 py-0 text-sm bg-white/70 dark:bg-gray-700/70"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave();
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                />
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={handleEditSave}
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
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
                  ${state.graphSource ? 'border-l-4' : ''}
                  ${state.graphSource ? getBorderClass(state.graphSource) : ''}
                `}
              >
                <div className="flex items-center">
                  {state.graphSource && (
                    <span 
                      className={`mr-1.5 inline-block w-2 h-2 rounded-full ${getGraphColor(state.graphSource)}`}
                    ></span>
                  )}
                  <span>{state.name}</span>
                </div>
                
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
                  
                  {/* Edit and Delete Buttons */}
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditStart(e, state.id, state.name)}
                      className="h-6 w-6 p-0 mr-1"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStateDelete(state.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* State Description (shown when state is selected and not editing) */}
            {selectedStateId === state.id && editingStateId !== state.id && loadedStateDictionary?.[state.name] && (
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
  onStateEdit: PropTypes.func.isRequired,
  // State dictionary for descriptions
  loadedStateDictionary: PropTypes.object,
  setLoadedStateDictionary: PropTypes.func.isRequired,
  onOpenDictionaryModal: PropTypes.func.isRequired
};

export default StatePanel;
