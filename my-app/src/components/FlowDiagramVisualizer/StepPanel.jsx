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

  const handleStepClick = (step) => {
    if (selectedStep && connectionType) {
      if (selectedStep.id !== step.id) {
        const success = onAddConnection(selectedStep.id, step.id, connectionType);
        if (success) {
          toast.success(`${connectionType} connection added`);
        }
      }
      setSelectedStep(null);
      setConnectionType(null);
    } else {
      console.log('Setting selected step:', step);
      setSelectedStep(step);
    }
  };

  const handleConnectionStart = (step, type) => {
    setSelectedStep(step);
    setConnectionType(type);
    toast.info(`Select a target step for ${type} path`, {
      duration: 2000,
    });
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

    return (
      <div key={step.id} className="step-container">
        <div
          className={`
            group flex items-center gap-2 p-2 rounded-md cursor-pointer
            ${selectedStep?.id === step.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
            ${connectionType && selectedStep?.id !== step.id ? 'hover:ring-2 hover:ring-blue-500' : ''}
            ${connectionType && selectedStep?.id === step.id ? 'opacity-50' : ''}
            border border-gray-200 dark:border-gray-700 mb-1
          `}
          style={{ marginLeft: `${level * 20}px` }}
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
            onClick={() => handleStepClick(step)}
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

  const addConnection = (fromStepId, toStepId, type) => {
    console.log('Adding connection:', { fromStepId, toStepId, type });
    // Check if connection already exists
    const exists = connections.some(
      (conn) =>
        conn.fromStepId === fromStepId &&
        conn.toStepId === toStepId &&
        conn.type === type
    );

    if (exists) {
      toast.error('Connection already exists');
      return false;
    }

    // Remove any existing connection of the same type
    onRemoveConnection(fromStepId, toStepId, type);
    return true;
  };

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
              <div className="flex gap-4">
                {/* Success Path Dropdown */}
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block text-green-600 dark:text-green-400">
                    Success Path
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 
                               text-sm dark:bg-gray-700 dark:text-white px-3 pr-8
                               focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={connections.find(conn => conn.fromStepId === selectedStep.id && conn.type === 'success')?.toStepId || ''}
                      onChange={(e) => {
                        const newTargetId = e.target.value;
                        // First remove any existing success connection
                        const existingConnections = connections.filter(conn => 
                          conn.fromStepId === selectedStep.id && conn.type === 'success'
                        );
                        
                        existingConnections.forEach(conn => {
                          onRemoveConnection(selectedStep.id, conn.toStepId, 'success');
                        });

                        // Then add the new connection if a target is selected
                        if (newTargetId) {
                          onAddConnection(selectedStep.id, newTargetId, 'success');
                          toast.success('Success path updated');
                        }
                      }}
                    >
                      <option value="">Select target step</option>
                      {steps
                        .filter(s => s.id !== selectedStep.id)
                        .map(step => {
                          // Find parent step name if this is a sub-step
                          const parentStep = step.parentId ? steps.find(s => s.id === step.parentId) : null;
                          const displayName = parentStep ? `${parentStep.name} → ${step.name}` : step.name;
                          
                          return (
                            <option key={step.id} value={step.id}>
                              {displayName}
                            </option>
                          );
                        })
                      }
                    </select>
                    <CheckCircle2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />
                  </div>
                </div>

                {/* Failure Path Dropdown */}
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block text-red-600 dark:text-red-400">
                    Failure Path
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 
                               text-sm dark:bg-gray-700 dark:text-white px-3 pr-8
                               focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={connections.find(conn => conn.fromStepId === selectedStep.id && conn.type === 'failure')?.toStepId || ''}
                      onChange={(e) => {
                        const newTargetId = e.target.value;
                        // First remove any existing failure connection
                        const existingConnections = connections.filter(conn => 
                          conn.fromStepId === selectedStep.id && conn.type === 'failure'
                        );
                        
                        existingConnections.forEach(conn => {
                          onRemoveConnection(selectedStep.id, conn.toStepId, 'failure');
                        });

                        // Then add the new connection if a target is selected
                        if (newTargetId) {
                          onAddConnection(selectedStep.id, newTargetId, 'failure');
                          toast.success('Failure path updated');
                        }
                      }}
                    >
                      <option value="">Select target step</option>
                      {steps
                        .filter(s => s.id !== selectedStep.id)
                        .map(step => {
                          // Find parent step name if this is a sub-step
                          const parentStep = step.parentId ? steps.find(s => s.id === step.parentId) : null;
                          const displayName = parentStep ? `${parentStep.name} → ${step.name}` : step.name;
                          
                          return (
                            <option key={step.id} value={step.id}>
                              {displayName}
                            </option>
                          );
                        })
                      }
                    </select>
                    <XCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {connections
                  .filter((conn) => conn.fromStepId === selectedStep.id)
                  .map((conn) => {
                    const targetStep = steps.find((s) => s.id === conn.toStepId);
                    return (
                      <div
                        key={`${conn.fromStepId}-${conn.toStepId}-${conn.type}`}
                        className="flex items-center gap-2 p-2 bg-muted rounded-md"
                      >
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        {conn.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm flex-1">{targetStep?.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:text-destructive"
                          onClick={() => handleRemoveConnection(selectedStep.id, conn.toStepId, conn.type)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
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