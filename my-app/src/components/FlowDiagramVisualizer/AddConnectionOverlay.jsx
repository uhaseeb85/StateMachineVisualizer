/**
 * AddConnectionOverlay Component
 * Modal overlay for adding connections between steps during simulation
 * Provides quick connection creation with visual preview
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StepNameAutocomplete from './StepNameAutocomplete';
import { 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AddConnectionOverlay Component
 * @param {Object} props
 * @param {Object} props.sourceStep - The source step for the connection
 * @param {Array} props.allSteps - All available steps
 * @param {Array} props.existingConnections - Existing connections to check for duplicates
 * @param {boolean} props.isOpen - Whether the overlay is open
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {Function} props.onAdd - Callback when connection is added
 * @param {Function} props.onAddStep - Callback to create a new step
 * @param {Object} props.dictionaryHook - Step dictionary hook for autocomplete
 */
const AddConnectionOverlay = ({ 
  sourceStep, 
  allSteps,
  existingConnections,
  isOpen, 
  onClose, 
  onAdd,
  onAddStep,
  dictionaryHook
}) => {
  const [connectionType, setConnectionType] = useState('success');
  const connectionMode === 'existing') {
      // Existing step mode
      if (!targetStepId) {
        toast.error('Please select a target step');
        return;
      }

      if (targetStepId === sourceStep.id) {
        toast.error('Cannot create a connection to the same step');
        return;
      }

      // Check if connection already exists
      const connectionExists = existingConnections.some(
        conn => 
          conn.fromStepId === sourceStep.id &&
          conn.toStepId === targetStepId &&
          conn.type === connectionType
      );

      if (connectionExists) {
        toast.error('This connection already exists');
        return;
      }

      const success = onAdd(sourceStep.id, targetStepId, connectionType);
      
      if (success) {
        const targetStep = allSteps.find(s => s.id === targetStepId);
        toast.success(`Added ${connectionType} connection to ${targetStep?.name}`);
        setTargetStepId('');
        onClose();
      }
    } else {
      // Create new step mode
      if (!newStepData.name.trim()) {
        toast.error('Step name is required');
        return;
      }

      if (!onAddStep) {
        toast.error('Cannot create new step - function not available');
        return;
      }

      // Create the new step
      const newStepId = onAddStep({
        name: newStepData.name.trim(),
        alias: newStepData.alias.trim() || undefined,
        description: newStepData.description.trim(),
        parentId: newStepData.parentId || null,
        assumptions: [],
        questions: [],
        imageUrls: [],
        imageCaptions: [],
        type: newStepData.type
      });

      if (newStepId) {
        // Update dictionary
        if (dictionaryHook) {
          dictionaryHook.upsertEntry(
            newStepData.name.trim(),
            newStepData.type,
            newStepData.alias.trim(),
            newStepData.description.trim()
          );
        }

        // Create connection from source step to new step
        onAdd(sourceStep.id, newStepId, connectionType);
        toast.success(`Created "${newStepData.name}" and connected!`);
        
        // Reset form
        setNewStepData({ name: '', alias: '', description: '', parentId: '', type: 'state' });
        setTargetStepId('');
        onClose();
      }
    if (connectionExists) {
      toast.error('This connection already exists');
      return;
    }

    const success = onAdd(sourceStep.id, targetStepId, connectionType);
    
    if (success) {
      const targetStep = allSteps.find(s => s.id === targetStepId);
      toast.success(`Added ${connectionType} connection to ${targetStep?.name}`);
      onClose();
    }
  };

  // Get available target steps (exclude source step)
  const availableSteps = allSteps.filter(step => step.id !== sourceStep?.id);

  // Get target step for preview
  const targetStep = allSteps.find(s => s.id === targetStepId);

  if (!sourceStep) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add Connection from {sourceStep.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-600 shadow-md">
            <div className="space-y-4">
              {/* Header with Connection Type */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Connection Type
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={connectionType === 'success' ? 'default' : 'ghost'}
                    className={`h-8 ${
                      connectionType === 'success' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'hover:bg-green-100 text-green-700'
                    }`}
                    onClick={() => setConnectionType('success')}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Success
                  </Button>
                  <Button
                    size="sm"
                    variant={connectionType === 'failure' ? 'default' : 'ghost'}
                    className={`h-8 ${
                      connectionType === 'failure' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'hover:bg-red-100 text-red-700'
                    }`}
                    onClick={() => setConnectionType('failure')}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Failure
                  </Button>
                </div>
              </div>

              {/* Tab-style Mode Selector */}
              <div className="flex gap-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('existing');
                    setNewStepData({ name: '', alias: '', description: '', parentId: '', type: 'state' });
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    connectionMode === 'existing'
                      ? 'bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  🔗 Existing Step
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('create');
                    setTargetStepId('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    connectionMode === 'create'
                      ? 'bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  ✨ Create New
                </button>
              </div>

              {/* Content Area */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                {/* Existing Step Selector */}
                {connectionMode === 'existing' && (
                  <div>
                    <label htmlFor="add-connection-target" className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                      Select target step:
                    </label>
                    <select
                      id="add-connection-target"
                      value={targetStepId}
                      onChange={(e) => setTargetStepId(e.target.value)}
                      className="w-full h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 px-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                               transition-all"
                    >
                      <option value="">Select a step...</option>
                      
                      {/* Root Steps */}
                      <optgroup label="📁 Root Steps">
                        {availableSteps
                          .filter(step => !step.parentId)
                          .map(step => (
                            <option key={step.id} value={step.id}>
                              {step.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      {/* Sub Steps */}
                      {availableSteps.some(step => step.parentId) && (
                        <optgroup label="📂 Sub Steps">
                          {availableSteps
                            .filter(step => step.parentId)
                            .map(step => {
                              const parentStep = allSteps.find(s => s.id === step.parentId);
                              const parentName = parentStep ? parentStep.name : 'Unknown';
                              
                              return (
                                <option key={step.id} value={step.id}>
                                  ↳ {step.name} (in {parentName})
                                </option>
                              );
                            })}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Create New Step Form */}
                {connectionMode === 'create' && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="add-connection-create-name" className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                        Step Name <span className="text-red-500">*</span>
                      </label>
                      <StepNameAutocomplete
                        value={newStepData.name}
                        onChange={(e) => setNewStepData({ ...newStepData, name: e.target.value })}
                        onSelect={(suggestion) => {
                          setNewStepData({
                            ...newStepData,
                            name: suggestion.stepName,
                            type: suggestion.type,
                            alias: suggestion.alias || '',
                            description: suggestion.description || ''
                          });
                        }}
                        dictionaryHook={dictionaryHook}
                        placeholder="Enter step name..."
                        className="w-full"
                        autoFocus
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="add-connection-create-alias" className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                          Alias
                        </label>
                        <Input
                          id="add-connection-create-alias"
                          value={newStepData.alias}
                          onChange={(e) => setNewStepData({ ...newStepData, alias: e.target.value })}
                          placeholder="e.g., LOGIN_PAGE"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                          Type
                        </label>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={newStepData.type === 'state' ? 'default' : 'outline'}
                            onClick={() => setNewStepData({ ...newStepData, type: 'state' })}
                            className="h-9 px-2 text-xs flex-1"
                          >
                            State
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={newStepData.type === 'rule' ? 'default' : 'outline'}
                            onClick={() => setNewStepData({ ...newStepData, type: 'rule' })}
                            className="h-9 px-2 text-xs flex-1"
                          >
                            Rule
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={newStepData.type === 'behavior' ? 'default' : 'outline'}
                            onClick={() => setNewStepData({ ...newStepData, type: 'behavior' })}
                            className="h-9 px-2 text-xs flex-1"
                          >
                            Behavior
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="add-connection-create-description" className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <Textarea
                        id="add-connection-create-description"
                        value={newStepData.description}
                        onChange={(e) => setNewStepData({ ...newStepData, description: e.target.value })}
                        placeholder="Optional description..."
                        className="h-16 resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label htmlFor="add-connection-create-parent" className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                        Parent Step (optional)
                      </label>
                      <select
                        id="add-connection-create-parent"
                        value={newStepData.parentId}
                        onChange={(e) => setNewStepData({ ...newStepData, parentId: e.target.value })}
                        className="w-full h-9 rounded-md border-2 border-gray-300 dark:border-gray-600 
                                 bg-white dark:bg-gray-700 px-3 text-sm"
                      >
                        <option value="">None (Root Step)</option>
                        {allSteps
                          .filter(s => !s.parentId && s.id !== sourceStep.id)
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              {((connectionMode === 'existing' && targetStepId) || (connectionMode === 'create' && newStepData.name)) && (
                <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Preview:</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{sourceStep.name}</span>
                    <span className={`text-lg ${connectionType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      →
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {connectionMode === 'existing'
                        ? allSteps.find(s => s.id === targetStepId)?.name
                        : newStepData.name
                      }
                    </span>
                    {connectionMode === 'create' && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={connectionMode === 'existing' ? !targetStepId : !newStepData.name.trim()}
            className={`flex-1 ${
              connectionType === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <LinkIcon className="h-4 w-4 mr-1.5" />
            {connectionMode === 'existing' ? 'Add Connection' : 'Create & Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddConnectionOverlay.propTypes = {
  sourceStep: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })).isRequired,
  existingConnections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onAddStep: PropTypes.func,
  dictionaryHook: PropTypes.object
};

export default AddConnectionOverlay;
