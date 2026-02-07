/**
 * ConnectionsInlineEditor Component
 * Inline connection management within expanded step cards
 * Allows adding/removing connections without opening a separate modal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StepNameAutocomplete from './StepNameAutocomplete';
import { CheckCircle2, XCircle, X, Plus, Link, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ConnectionsInlineEditor Component
 * @param {Object} props
 * @param {Object} props.currentStep - The step being edited
 * @param {Array} props.allSteps - All available steps
 * @param {Array} props.connections - All connections
 * @param {Object} props.stagedChanges - Staged connection changes (optional)
 * @param {Function} props.onAddConnection - Callback to add a connection
 * @param {Function} props.onRemoveConnection - Callback to remove a connection
 * @param {Function} props.onAddStep - Callback to add a new step (optional)
 * @param {Object} props.dictionaryHook - Step dictionary hook for autocomplete
 */
const ConnectionsInlineEditor = ({ 
  currentStep, 
  allSteps, 
  connections,
  stagedChanges = null, // If provided, we're in staging mode
  onAddConnection,
  onRemoveConnection,
  onAddStep = null, // Optional - enables create & connect feature
  dictionaryHook
}) => {
  const [addingConnection, setAddingConnection] = useState(false);
  const [connectionMode, setConnectionMode] = useState('existing'); // 'existing' or 'new'
  const [newConnectionType, setNewConnectionType] = useState('success');
  const [newConnectionTarget, setNewConnectionTarget] = useState('');
  
  // New step creation form data
  const [newStepData, setNewStepData] = useState({
    name: '',
    alias: '',
    description: '',
    parentId: currentStep?.id || '',
    type: 'state'
  });

  // Calculate effective connections (accounting for staged changes)
  const existingConnections = connections.filter(c => c.fromStepId === currentStep.id);
  
  // If we have staged changes, apply them to the display
  let effectiveConnections = [...existingConnections];
  
  if (stagedChanges) {
    // Remove connections that are staged for removal
    effectiveConnections = effectiveConnections.filter(conn => 
      !stagedChanges.removed.some(
        staged => staged.toStepId === conn.toStepId && staged.type === conn.type
      )
    );
    
    // Add connections that are staged for addition
    stagedChanges.added.forEach(staged => {
      effectiveConnections.push({
        fromStepId: currentStep.id,
        toStepId: staged.toStepId,
        type: staged.type,
        isStaged: true // Mark as staged for visual indication
      });
    });
  }
  
  const successConnections = effectiveConnections.filter(c => c.type === 'success');
  const failureConnections = effectiveConnections.filter(c => c.type === 'failure');

  const handleAddConnection = () => {
    if (!newConnectionTarget) {
      toast.error('Please select a target step');
      return;
    }

    // Check for duplicate in effective connections
    const exists = effectiveConnections.some(
      c => c.toStepId === newConnectionTarget && c.type === newConnectionType
    );

    if (exists) {
      toast.error('This connection already exists');
      return;
    }

    onAddConnection(currentStep.id, newConnectionTarget, newConnectionType);
    
    const targetStep = allSteps.find(s => s.id === newConnectionTarget);
    
    // Only show toast if not in staging mode
    if (!stagedChanges) {
      toast.success(`Added ${newConnectionType} connection to ${targetStep?.name}`);
    }
    
    setNewConnectionTarget('');
    setAddingConnection(false);
  };

  const handleCreateAndConnect = () => {
    if (!newStepData.name.trim()) {
      toast.error('Step name is required');
      return;
    }

    if (!onAddStep) {
      toast.error('Step creation not available');
      return;
    }

    // Create the new step
    const stepData = {
      name: newStepData.name.trim(),
      alias: newStepData.alias.trim() || undefined,
      description: newStepData.description.trim(),
      parentId: newStepData.parentId || null,
      type: newStepData.type,
      assumptions: [],
      questions: [],
      imageUrls: [],
      imageCaptions: []
    };

    const newStepId = onAddStep(stepData);

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

      // Connect to the newly created step
      onAddConnection(currentStep.id, newStepId, newConnectionType);
      
      // Only show toast if not in staging mode
      if (!stagedChanges) {
        toast.success(`Created "${newStepData.name}" and connected!`);
      }

      // Reset form
      setNewStepData({
        name: '',
        alias: '',
        description: '',
        parentId: currentStep?.id || '',
        type: 'state'
      });
      setAddingConnection(false);
      setConnectionMode('existing');
    }
  };

  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        🔗 Connections from this step
      </h4>

      {/* Success Connections List */}
      {successConnections.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Success Paths:
          </div>
          <div className="space-y-1">
            {successConnections.map((conn) => {
              const targetStep = allSteps.find(s => s.id === conn.toStepId);
              if (!targetStep) return null;
              
              return (
                <div 
                  key={`success-${conn.toStepId}`}
                  className={`flex items-center justify-between px-2 py-1 rounded text-sm ${
                    conn.isStaged 
                      ? 'bg-green-200 dark:bg-green-700/60 border-2 border-green-400 dark:border-green-500'
                      : 'bg-green-100 dark:bg-green-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>{targetStep.name}</span>
                    {conn.isStaged && (
                      <span className="text-xs italic text-green-700 dark:text-green-300">(pending)</span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 hover:bg-green-200 dark:hover:bg-green-700"
                    onClick={() => {
                      onRemoveConnection(currentStep.id, targetStep.id, 'success');
                      if (!stagedChanges) {
                        toast.success('Connection removed');
                      }
                    }}
                    title="Remove connection"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failure Connections List */}
      {failureConnections.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failure Paths:
          </div>
          <div className="space-y-1">
            {failureConnections.map((conn) => {
              const targetStep = allSteps.find(s => s.id === conn.toStepId);
              if (!targetStep) return null;
              
              return (
                <div 
                  key={`failure-${conn.toStepId}`}
                  className={`flex items-center justify-between px-2 py-1 rounded text-sm ${
                    conn.isStaged 
                      ? 'bg-red-200 dark:bg-red-700/60 border-2 border-red-400 dark:border-red-500'
                      : 'bg-red-100 dark:bg-red-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-600" />
                    <span>{targetStep.name}</span>
                    {conn.isStaged && (
                      <span className="text-xs italic text-red-700 dark:text-red-300">(pending)</span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 hover:bg-red-200 dark:hover:bg-red-700"
                    onClick={() => {
                      onRemoveConnection(currentStep.id, targetStep.id, 'failure');
                      if (!stagedChanges) {
                        toast.success('Connection removed');
                      }
                    }}
                    title="Remove connection"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No connections message */}
      {effectiveConnections.length === 0 && !addingConnection && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-2 mb-3">
          No connections from this step
        </div>
      )}

      {/* Add New Connection Form */}
      {addingConnection ? (
        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-600 shadow-md space-y-4">
          {/* Header with Connection Type */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              ➕ Add Connection
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={newConnectionType === 'success' ? 'default' : 'ghost'}
                className={`h-8 ${
                  newConnectionType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'hover:bg-green-100 text-green-700'
                }`}
                onClick={() => setNewConnectionType('success')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Success
              </Button>
              <Button
                size="sm"
                variant={newConnectionType === 'failure' ? 'default' : 'ghost'}
                className={`h-8 ${
                  newConnectionType === 'failure' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'hover:bg-red-100 text-red-700'
                }`}
                onClick={() => setNewConnectionType('failure')}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Failure
              </Button>
            </div>
          </div>

          {/* Tab-style Mode Selector - only show if onAddStep is available */}
          {onAddStep && (
            <div className="flex gap-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setConnectionMode('existing');
                  setNewStepData({ name: '', alias: '', description: '', parentId: currentStep?.id || '', type: 'state' });
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
                  setConnectionMode('new');
                  setNewConnectionTarget('');
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  connectionMode === 'new'
                    ? 'bg-white dark:bg-gray-700 text-purple-900 dark:text-purple-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                ✨ Create New
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            {/* Existing Step Mode */}
            {connectionMode === 'existing' && (
              <div>
                <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                  Select target step:
                </label>
                <select
                  value={newConnectionTarget}
                  onChange={(e) => setNewConnectionTarget(e.target.value)}
                  className="w-full h-10 rounded-md border-2 border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 px-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                           transition-all"
                >
                  <option value="">Select a step...</option>
                  
                  {/* Root Steps */}
                  <optgroup label="📁 Root Steps">
                    {allSteps
                      .filter(s => !s.parentId && s.id !== currentStep.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </optgroup>
                  
                  {/* Sub Steps */}
                  {allSteps.some(s => s.parentId) && (
                    <optgroup label="📂 Sub Steps">
                      {allSteps
                        .filter(s => s.parentId && s.id !== currentStep.id)
                        .map(s => {
                          const parent = allSteps.find(p => p.id === s.parentId);
                          return (
                            <option key={s.id} value={s.id}>
                              ↳ {s.name} (in {parent?.name || 'Unknown'})
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                </select>
              </div>
            )}

            {/* New Step Mode */}
            {connectionMode === 'new' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newStepData.name.trim()) {
                        handleCreateAndConnect();
                      }
                    }}
                    dictionaryHook={dictionaryHook}
                    placeholder="Enter step name..."
                    className="w-full"
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                      Alias
                    </label>
                    <Input
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
                  <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <Textarea
                    value={newStepData.description}
                    onChange={(e) => setNewStepData({ ...newStepData, description: e.target.value })}
                    placeholder="Optional description..."
                    className="h-16 resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
                    Parent Step (optional)
                  </label>
                  <select
                    value={newStepData.parentId}
                    onChange={(e) => setNewStepData({ ...newStepData, parentId: e.target.value })}
                    className="w-full h-9 rounded-md border-2 border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 px-3 text-sm"
                  >
                    <option value="">None (Root Step)</option>
                    {allSteps
                      .filter(s => !s.parentId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {((connectionMode === 'existing' && newConnectionTarget) || (connectionMode === 'new' && newStepData.name)) && (
            <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Preview:</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{currentStep.name}</span>
                <span className={`text-lg ${newConnectionType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  →
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {connectionMode === 'existing'
                    ? allSteps.find(s => s.id === newConnectionTarget)?.name
                    : newStepData.name
                  }
                </span>
                {connectionMode === 'new' && (
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                    NEW
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={connectionMode === 'existing' ? handleAddConnection : handleCreateAndConnect}
              disabled={connectionMode === 'existing' ? !newConnectionTarget : !newStepData.name.trim()}
              className={`flex-1 ${
                newConnectionType === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Link className="h-4 w-4 mr-1.5" />
              {connectionMode === 'existing' ? 'Add Connection' : 'Create & Connect'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAddingConnection(false);
                setNewConnectionTarget('');
                setNewStepData({ name: '', alias: '', description: '', parentId: currentStep?.id || '', type: 'state' });
                setConnectionMode('existing');
              }}
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-purple-300 hover:bg-purple-100"
          onClick={() => setAddingConnection(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      )}
    </div>
  );
};

ConnectionsInlineEditor.propTypes = {
  currentStep: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })).isRequired,
  connections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })).isRequired,
  stagedChanges: PropTypes.shape({
    added: PropTypes.arrayOf(PropTypes.shape({
      toStepId: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'failure']).isRequired
    })),
    removed: PropTypes.arrayOf(PropTypes.shape({
      toStepId: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'failure']).isRequired
    }))
  }),
  onAddConnection: PropTypes.func.isRequired,
  onRemoveConnection: PropTypes.func.isRequired,
  onAddStep: PropTypes.func, // Optional - enables create & connect feature
  dictionaryHook: PropTypes.object
};

export default ConnectionsInlineEditor;
