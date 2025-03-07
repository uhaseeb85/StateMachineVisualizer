import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Plus,
  X,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Grip,
  ChevronDown,
  ChevronRight,
  Settings,
  FolderPlus
} from 'lucide-react';
import { toast } from 'sonner';

const StepPanel = ({
  steps,
  connections,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onAddConnection,
  onRemoveConnection,
}) => {
  const [newStepName, setNewStepName] = useState('');
  const [selectedStep, setSelectedStep] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [connectionSourceId, setConnectionSourceId] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [addingSubStepFor, setAddingSubStepFor] = useState(null);
  const [subStepName, setSubStepName] = useState('');

  // Function to get child steps for a parent
  const getChildSteps = (parentId) => {
    return steps.filter(step => step.parentId === parentId);
  };

  // Function to handle adding a new root-level step
  const handleAddRootStep = () => {
    if (newStepName.trim()) {
      const stepId = onAddStep({
        name: newStepName.trim(),
        description: '',
        expectedResponse: '',
        parentId: null
      });
      setNewStepName('');
      toast.success('Step added successfully');
    }
  };

  // Function to handle adding a sub-step
  const handleAddSubStep = (parentId) => {
    if (subStepName.trim()) {
      const stepId = onAddStep({
        name: subStepName.trim(),
        description: '',
        expectedResponse: '',
        parentId: parentId
      });
      setSubStepName('');
      setAddingSubStepFor(null);
      setExpandedSteps(prev => ({
        ...prev,
        [parentId]: true // Auto-expand parent when adding sub-step
      }));
      toast.success('Sub-step added successfully');
    }
  };

  // Function to start the connection creation process
  const startConnectionCreation = (step, type) => {
    console.log("startConnectionCreation called with:", step.name, type);
    setConnectionType(type);
    setConnectionSourceId(step.id);
    
    // Keep the selected step in the details panel
    setSelectedStep(step);
    
    toast.info(`Select a target step for the ${type} path`, {
      duration: 3000,
    });
  };
  
  // Function to cancel connection creation
  const cancelConnectionCreation = () => {
    setConnectionType(null);
    setConnectionSourceId(null);
  };

  // Handle step selection
  const handleStepClick = (step) => {
    console.log("Step clicked:", step.name);
    
    if (connectionType && connectionSourceId) {
      console.log("In connection mode. Creating connection from", 
        steps.find(s => s.id === connectionSourceId)?.name, "to", step.name, "of type", connectionType);
      
      // We're in connection creation mode
      if (connectionSourceId !== step.id) {
        // Don't allow connecting to self
        
        // Check if connection already exists
        const connectionExists = connections.some(
          conn => 
            conn.fromStepId === connectionSourceId &&
            conn.toStepId === step.id &&
            conn.type === connectionType
        );
        
        if (connectionExists) {
          console.log("Connection already exists!");
          toast.error('This connection already exists');
          return;
        }
        
        console.log("Calling onAddConnection with params:", connectionSourceId, step.id, connectionType);
        const success = onAddConnection(connectionSourceId, step.id, connectionType);
        console.log("onAddConnection result:", success);
        
        if (success) {
          toast.success(`Added ${connectionType} connection to ${step.name}`);
          
          // Keep connection creation mode active, but clear the specific connection type
          // so user needs to select success or failure again
          setConnectionType(null);
          
          // Keep the original step selected in the details panel
          const sourceStep = steps.find(s => s.id === connectionSourceId);
          if (sourceStep) {
            setSelectedStep(sourceStep);
          }
        }
      } else {
        // Clicked on the source step, just exit connection mode
        console.log("Clicked on source step, cancelling connection mode");
        cancelConnectionCreation();
      }
    } else {
      // Normal step selection
      console.log("Normal step selection");
      setSelectedStep(step);
    }
  };

  const handleConnectionStart = (step, type) => {
    console.log("handleConnectionStart called with:", step.name, type);
    startConnectionCreation(step, type);
  };

  const handleRemoveConnection = (fromStepId, toStepId, type) => {
    onRemoveConnection(fromStepId, toStepId, type);
    toast.success('Connection removed');
  };

  const handleRemoveStep = (stepId) => {
    // Check if the step is referenced in any other step's connections
    const isReferenced = connections.some(
      conn => conn.toStepId === stepId
    );

    if (isReferenced) {
      toast.error('Cannot remove this step as it is referenced in other steps. Remove the connections first.');
      return;
    }

    // Get all descendant steps (sub-steps and their sub-steps)
    const getAllDescendants = (parentId) => {
      const children = steps.filter(s => s.parentId === parentId);
      let descendants = [...children];
      children.forEach(child => {
        descendants = [...descendants, ...getAllDescendants(child.id)];
      });
      return descendants;
    };

    const descendantIds = getAllDescendants(stepId).map(s => s.id);
    
    // Check if any descendant is referenced
    const isDescendantReferenced = descendantIds.some(id => 
      connections.some(conn => conn.toStepId === id)
    );

    if (isDescendantReferenced) {
      toast.error('Cannot remove this step as one of its sub-steps is referenced in other steps. Remove the connections first.');
      return;
    }
    
    // Remove all descendant steps first
    descendantIds.forEach(id => {
      onRemoveStep(id);
    });
    
    // Then remove the step itself
    onRemoveStep(stepId);
    
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
    toast.success('Step and all sub-steps removed');
  };

  const handleUpdateStep = (stepId, updates) => {
    console.log('handleUpdateStep called with:', { stepId, updates });
    if (!stepId || !updates) {
      console.error('Invalid stepId or updates:', { stepId, updates });
      return;
    }
    
    // Find the step in the steps array to verify it exists
    const stepToUpdate = steps.find(s => s.id === stepId);
    if (!stepToUpdate) {
      console.error('Step not found:', stepId);
      return;
    }
    
    // Create the updated step object
    const updatedStep = { ...stepToUpdate, ...updates };
    console.log('Updating step from:', stepToUpdate, 'to:', updatedStep);
    
    // Call the update function
    onUpdateStep(stepId, updates);
    
    // Update local state to reflect changes immediately
    setSelectedStep(updatedStep);
  };

  const renderStep = (step, level = 0) => {
    const childSteps = getChildSteps(step.id);
    const hasChildren = childSteps.length > 0;
    const isExpanded = expandedSteps[step.id];
    
    // Check if we're in connection creation mode and this isn't the source step
    const isConnectionMode = connectionType && connectionSourceId;
    const isConnectionSource = connectionSourceId === step.id;
    const isSelectableTarget = isConnectionMode && !isConnectionSource;
    
    // Classes for steps in connection mode
    let connectionModeClasses = '';
    if (isConnectionMode) {
      if (isConnectionSource) {
        // Source step styling
        connectionModeClasses = connectionType === 'success'
          ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
          : 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20';
      } else {
        // Potential target step styling
        connectionModeClasses = connectionType === 'success'
          ? 'hover:ring-2 hover:ring-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer'
          : 'hover:ring-2 hover:ring-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer';
      }
    }

    return (
      <div key={step.id} className="step-container">
        <div
          className={`
            group flex items-center gap-2 p-2 rounded-md transition-all
            ${selectedStep?.id === step.id && !isConnectionMode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
            ${connectionModeClasses}
            border border-gray-200 dark:border-gray-700 mb-1
          `}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={(e) => {
            // Prevent event bubbling
            e.stopPropagation();
            handleStepClick(step);
          }}
        >
          <div className="flex items-center gap-1 min-w-[24px]">
            {hasChildren && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSteps(prev => ({
                    ...prev,
                    [step.id]: !prev[step.id]
                  }));
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <div 
            className="flex-1 flex items-center gap-2"
          >
            <Grip className="h-4 w-4 text-muted-foreground cursor-move" />
            <span className="font-medium">{step.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              className="h-7 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubStepFor(step.id);
                setSubStepName('');
              }}
              title="Add sub-step"
            >
              <FolderPlus className="h-3 w-3" />
              Add Sub-step
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStep(step.id);
              }}
              title="Remove step and all sub-steps"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Sub-step input form */}
        {addingSubStepFor === step.id && (
          <div className="flex gap-2 mt-2" style={{ marginLeft: `${(level + 1) * 20}px` }}>
            <Input
              placeholder="Enter sub-step name..."
              value={subStepName}
              onChange={(e) => setSubStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubStep(step.id)}
              className="h-8"
              autoFocus
            />
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleAddSubStep(step.id)}
              disabled={!subStepName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingSubStepFor(null);
                setSubStepName('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Render child steps */}
        {isExpanded && childSteps.map(childStep => renderStep(childStep, level + 1))}
      </div>
    );
  };

  // Get root-level steps (steps with no parent)
  const rootSteps = steps.filter(step => !step.parentId);

  return (
    <div className="flex h-[calc(100vh-16rem)] gap-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {/* Left Panel - Steps List */}
      <div className="w-1/3 border rounded-xl p-6 bg-background overflow-y-auto">
        <div className="space-y-4">
          {/* Add root step input */}
          <div className="flex gap-4 sticky top-0 bg-background pb-4 border-b">
            <Input
              placeholder="Enter step name..."
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRootStep()}
              className="h-10"
            />
            <Button
              onClick={handleAddRootStep}
              disabled={!newStepName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {/* Connection Selection Indicator */}
          {connectionType && connectionSourceId && (
            <div className={`p-4 rounded-md mb-3 ${
              connectionType === 'success' 
                ? 'bg-green-100 border-2 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-600' 
                : 'bg-red-100 border-2 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-600'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {connectionType === 'success' 
                  ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> 
                  : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                }
                <span className="font-medium">
                  Creating {connectionType} path
                </span>
              </div>
              <div className="mb-2">
                <span className="text-sm">
                  From: <span className="font-semibold">{steps.find(s => s.id === connectionSourceId)?.name}</span>
                </span>
              </div>
              <div className="text-sm flex justify-between items-center">
                <span>Click on a target step</span>
                <Button 
                  size="sm"
                  variant="outline"
                  className={`h-7 ${
                    connectionType === 'success'
                      ? 'border-green-400 hover:bg-green-200 text-green-800'
                      : 'border-red-400 hover:bg-red-200 text-red-800'
                  }`}
                  onClick={cancelConnectionCreation}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Steps list */}
          <div className="space-y-1 mt-4">
            {rootSteps.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No steps added yet. Add your first step above.
              </div>
            ) : (
              rootSteps.map(step => renderStep(step))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Step Details */}
      <div className="w-2/3 border rounded-xl p-6 bg-background overflow-y-auto">
        {selectedStep ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold">{selectedStep.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStep(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  key={selectedStep.id}
                  placeholder="Step description..."
                  value={selectedStep.description || ''}
                  onChange={(e) => {
                    console.log('Textarea onChange event:', e.target.value);
                    handleUpdateStep(selectedStep.id, { description: e.target.value });
                  }}
                  className="min-h-[80px] w-full resize-y bg-background text-foreground"
                  rows={4}
                  disabled={false}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connections</h3>
              <div className="space-y-4">
                {/* Success Paths Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-green-600 dark:text-green-400">
                      Success Paths
                    </label>
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                      onClick={() => handleConnectionStart(selectedStep, 'success')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Path
                    </Button>
                  </div>
                  
                  {/* List of success connections */}
                  <div className="space-y-2">
                    {connections
                      .filter(conn => conn.fromStepId === selectedStep.id && conn.type === 'success')
                      .map(conn => {
                        const targetStep = steps.find(s => s.id === conn.toStepId);
                        if (!targetStep) return null;
                        
                        // Find parent step if this is a sub-step
                        const parentStep = targetStep.parentId 
                          ? steps.find(s => s.id === targetStep.parentId) 
                          : null;
                        const displayName = parentStep 
                          ? `${parentStep.name} → ${targetStep.name}` 
                          : targetStep.name;
                        
                        return (
                          <div key={`${conn.fromStepId}-${conn.toStepId}-${conn.type}`} 
                               className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100">
                            <div className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                              <span>{displayName}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-green-100"
                              onClick={() => handleRemoveConnection(selectedStep.id, conn.toStepId, 'success')}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      
                    {connections.filter(conn => conn.fromStepId === selectedStep.id && conn.type === 'success').length === 0 && (
                      <div className="text-sm text-gray-500 italic py-2 px-3 bg-gray-50 dark:bg-gray-900/20 rounded-md border border-gray-100">
                        No success paths defined
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Failure Paths Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-red-600 dark:text-red-400">
                      Failure Paths
                    </label>
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                      onClick={() => handleConnectionStart(selectedStep, 'failure')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Path
                    </Button>
                  </div>
                  
                  {/* List of failure connections */}
                  <div className="space-y-2">
                    {connections
                      .filter(conn => conn.fromStepId === selectedStep.id && conn.type === 'failure')
                      .map(conn => {
                        const targetStep = steps.find(s => s.id === conn.toStepId);
                        if (!targetStep) return null;
                        
                        // Find parent step if this is a sub-step
                        const parentStep = targetStep.parentId 
                          ? steps.find(s => s.id === targetStep.parentId) 
                          : null;
                        const displayName = parentStep 
                          ? `${parentStep.name} → ${targetStep.name}` 
                          : targetStep.name;
                        
                        return (
                          <div key={`${conn.fromStepId}-${conn.toStepId}-${conn.type}`} 
                               className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100">
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              <span>{displayName}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-red-100"
                              onClick={() => handleRemoveConnection(selectedStep.id, conn.toStepId, 'failure')}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      
                    {connections.filter(conn => conn.fromStepId === selectedStep.id && conn.type === 'failure').length === 0 && (
                      <div className="text-sm text-gray-500 italic py-2 px-3 bg-gray-50 dark:bg-gray-900/20 rounded-md border border-gray-100">
                        No failure paths defined
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Settings className="h-12 w-12 mb-4" />
            <p>Select a step to view and edit its details</p>
          </div>
        )}
      </div>
    </div>
  );
};

StepPanel.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      expectedResponse: PropTypes.string,
      parentId: PropTypes.string,
    })
  ).isRequired,
  connections: PropTypes.arrayOf(
    PropTypes.shape({
      fromStepId: PropTypes.string.isRequired,
      toStepId: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'failure']).isRequired,
    })
  ).isRequired,
  onAddStep: PropTypes.func.isRequired,
  onUpdateStep: PropTypes.func.isRequired,
  onRemoveStep: PropTypes.func.isRequired,
  onAddConnection: PropTypes.func.isRequired,
  onRemoveConnection: PropTypes.func.isRequired,
};

export default StepPanel; 