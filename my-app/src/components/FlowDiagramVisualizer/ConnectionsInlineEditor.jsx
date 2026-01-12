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
 */
const ConnectionsInlineEditor = ({ 
  currentStep, 
  allSteps, 
  connections,
  stagedChanges = null, // If provided, we're in staging mode
  onAddConnection,
  onRemoveConnection,
  onAddStep = null // Optional - enables create & connect feature
}) => {
  const [addingConnection, setAddingConnection] = useState(false);
  const [connectionMode, setConnectionMode] = useState('existing'); // 'existing' or 'new'
  const [newConnectionType, setNewConnectionType] = useState('success');
  const [newConnectionTarget, setNewConnectionTarget] = useState('');
  
  // New step creation form data
  const [newStepName, setNewStepName] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [parentStepId, setParentStepId] = useState(currentStep?.id || '');

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
    if (!newStepName.trim()) {
      toast.error('Step name is required');
      return;
    }

    if (!onAddStep) {
      toast.error('Step creation not available');
      return;
    }

    // Create the new step
    const stepData = {
      name: newStepName.trim(),
      description: newStepDescription.trim(),
      parentId: parentStepId || null,
      assumptions: [],
      questions: [],
      imageUrls: [],
      imageCaptions: []
    };

    const newStepId = onAddStep(stepData);

    if (newStepId) {
      // Connect to the newly created step
      onAddConnection(currentStep.id, newStepId, newConnectionType);
      
      // Only show toast if not in staging mode
      if (!stagedChanges) {
        toast.success(`Created "${newStepName}" and connected!`);
      }

      // Reset form
      setNewStepName('');
      setNewStepDescription('');
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
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-300 dark:border-purple-600 space-y-3">
          {/* Mode Toggle - only show if onAddStep is available */}
          {onAddStep && (
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant={connectionMode === 'existing' ? 'default' : 'outline'}
                className={`flex-1 h-9 ${
                  connectionMode === 'existing'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
                onClick={() => setConnectionMode('existing')}
              >
                <Link className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Existing Step</span>
              </Button>
              <Button
                size="sm"
                variant={connectionMode === 'new' ? 'default' : 'outline'}
                className={`flex-1 h-9 ${
                  connectionMode === 'new'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                }`}
                onClick={() => setConnectionMode('new')}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">New Step</span>
              </Button>
            </div>
          )}

          {/* Connection Type Selection */}
          <div>
            <label className="text-xs font-medium mb-2 block">Connection Type:</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={newConnectionType === 'success' ? 'default' : 'outline'}
                className={`h-9 flex items-center justify-center gap-1 ${
                  newConnectionType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
                onClick={() => setNewConnectionType('success')}
              >
                <CheckCircle2 className={`h-4 w-4 ${
                  newConnectionType === 'success' ? 'text-white' : 'text-green-600'
                }`} />
                <span className={`text-xs ${
                  newConnectionType === 'success' ? 'text-white' : 'text-green-700 dark:text-green-400'
                }`}>
                  Success
                </span>
              </Button>
              
              <Button
                size="sm"
                variant={newConnectionType === 'failure' ? 'default' : 'outline'}
                className={`h-9 flex items-center justify-center gap-1 ${
                  newConnectionType === 'failure' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                onClick={() => setNewConnectionType('failure')}
              >
                <XCircle className={`h-4 w-4 ${
                  newConnectionType === 'failure' ? 'text-white' : 'text-red-600'
                }`} />
                <span className={`text-xs ${
                  newConnectionType === 'failure' ? 'text-white' : 'text-red-700 dark:text-red-400'
                }`}>
                  Failure
                </span>
              </Button>
            </div>
          </div>

          {/* Existing Step Mode */}
          {connectionMode === 'existing' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1 block">Target Step:</label>
                <select
                  value={newConnectionTarget}
                  onChange={(e) => setNewConnectionTarget(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 px-2 text-sm"
                >
                  <option value="">Select a step...</option>
                  
                  {/* Root Steps */}
                  <optgroup label="Root Steps">
                    {allSteps
                      .filter(s => !s.parentId && s.id !== currentStep.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </optgroup>
                  
                  {/* Sub Steps */}
                  {allSteps.some(s => s.parentId) && (
                    <optgroup label="Sub Steps">
                      {allSteps
                        .filter(s => s.parentId && s.id !== currentStep.id)
                        .map(s => {
                          const parent = allSteps.find(p => p.id === s.parentId);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} (in {parent?.name || 'Unknown'})
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddConnection}
                  disabled={!newConnectionTarget}
                  className="flex-1"
                >
                  Add Connection
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddingConnection(false);
                    setNewConnectionTarget('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {/* New Step Mode */}
          {connectionMode === 'new' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  New Step Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="Enter step name..."
                  className="w-full h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newStepName.trim()) {
                      handleCreateAndConnect();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">
                  Description <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <Textarea
                  value={newStepDescription}
                  onChange={(e) => setNewStepDescription(e.target.value)}
                  placeholder="Enter description..."
                  rows={2}
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">
                  Parent Step <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <select
                  value={parentStepId}
                  onChange={(e) => setParentStepId(e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 px-2 text-sm"
                >
                  <option value="">None (Root step)</option>
                  
                  {/* Root Steps */}
                  <optgroup label="Root Steps">
                    {allSteps
                      .filter(s => !s.parentId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </optgroup>
                  
                  {/* Sub Steps */}
                  {allSteps.some(s => s.parentId) && (
                    <optgroup label="Sub Steps">
                      {allSteps
                        .filter(s => s.parentId)
                        .map(s => {
                          const parent = allSteps.find(p => p.id === s.parentId);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} (under {parent?.name || 'Unknown'})
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateAndConnect}
                  disabled={!newStepName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Create & Connect
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAddingConnection(false);
                    setNewStepName('');
                    setNewStepDescription('');
                    setParentStepId(currentStep?.id || '');
                    setConnectionMode('existing');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
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
  onAddStep: PropTypes.func // Optional - enables create & connect feature
};

export default ConnectionsInlineEditor;
