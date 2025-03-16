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
    const isExpanded = expandedSteps[step.id] !== false; // Default to expanded
    const childSteps = getChildSteps(step.id);
    const hasChildren = childSteps.length > 0;
    const isSelected = selectedStep?.id === step.id;
    const isConnectionSource = connectionSourceId === step.id;
    const isAddingSubStep = addingSubStepFor === step.id;
    
    // Check if this step is a target for the current connection
    const isConnectionTarget = connectionSourceId && 
                              connectionSourceId !== step.id && 
                              !connections.some(c => 
                                c.fromStepId === connectionSourceId && 
                                c.toStepId === step.id && 
                                c.type === connectionType);
    
    return (
      <div key={step.id} className="mb-2">
        <div 
          className={`
            relative flex items-center rounded-lg p-2 cursor-pointer
            ${isSelected 
              ? 'bg-blue-600 text-white' 
              : isConnectionSource
                ? connectionType === 'success'
                  ? 'bg-green-600/20 border border-green-500 text-green-300'
                  : 'bg-red-600/20 border border-red-500 text-red-300'
                : isConnectionTarget
                  ? connectionType === 'success'
                    ? 'bg-gray-700 hover:bg-green-600/30 border border-green-500/50 text-gray-200'
                    : 'bg-gray-700 hover:bg-red-600/30 border border-red-500/50 text-gray-200'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }
            transition-colors duration-200
          `}
          style={{ marginLeft: `${level * 1.5}rem` }}
          onClick={() => handleStepClick(step)}
        >
          <div className="flex-1 flex items-center min-w-0">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 mr-1 text-gray-400 hover:bg-gray-600 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSteps(prev => ({
                    ...prev,
                    [step.id]: !isExpanded
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
            
            <span className="truncate font-medium">{step.name}</span>
            
            {/* Connection indicators */}
            <div className="flex ml-auto gap-1">
              {connections.some(c => c.fromStepId === step.id && c.type === 'success') && (
                <div className="h-2 w-2 rounded-full bg-green-500" title="Has success path" />
              )}
              {connections.some(c => c.fromStepId === step.id && c.type === 'failure') && (
                <div className="h-2 w-2 rounded-full bg-red-500" title="Has failure path" />
              )}
            </div>
          </div>
          
          <div className="flex items-center ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubStepFor(step.id);
                setSubStepName('');
              }}
              title="Add sub-step"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStep(step.id);
              }}
              title="Remove step"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {/* Sub-step form */}
        {isAddingSubStep && (
          <div 
            className="flex gap-2 mt-1 p-2 bg-gray-700/50 rounded-lg border border-gray-600"
            style={{ marginLeft: `${level * 1.5 + 1.5}rem` }}
          >
            <Input
              type="text"
              value={subStepName}
              onChange={(e) => setSubStepName(e.target.value)}
              placeholder="Sub-step name"
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              autoFocus
            />
            <Button
              onClick={() => handleAddSubStep(step.id)}
              disabled={!subStepName.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Add
            </Button>
            <Button
              variant="ghost"
              className="text-gray-300 hover:bg-gray-600"
              onClick={() => setAddingSubStepFor(null)}
            >
              Cancel
            </Button>
          </div>
        )}
        
        {/* Child steps */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {childSteps.map(childStep => renderStep(childStep, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get root-level steps (steps with no parent)
  const rootSteps = steps.filter(step => !step.parentId);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Steps List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Flow Steps</h2>
          
          {/* Add Step Form */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Input
                type="text"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                placeholder="Enter step name"
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button
                onClick={handleAddRootStep}
                disabled={!newStepName.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </div>
          
          {/* Steps List */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {steps.filter(step => !step.parentId).map(step => (
              renderStep(step)
            ))}
            
            {steps.filter(step => !step.parentId).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No steps defined yet.</p>
                <p className="text-sm mt-2">Add a step to get started.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel - Step Details */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Step Details</h2>
          
          {selectedStep ? (
            <div className="space-y-6">
              {/* Step Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Step Name
                </label>
                <Input
                  value={selectedStep.name}
                  onChange={(e) => handleUpdateStep(selectedStep.id, { name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              {/* Step Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={selectedStep.description || ''}
                  onChange={(e) => handleUpdateStep(selectedStep.id, { description: e.target.value })}
                  placeholder="Describe what this step does..."
                  className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
              
              {/* Expected Response */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Response
                </label>
                <Textarea
                  value={selectedStep.expectedResponse || ''}
                  onChange={(e) => handleUpdateStep(selectedStep.id, { expectedResponse: e.target.value })}
                  placeholder="What response do you expect from this step?"
                  className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
              
              {/* Connections */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Connections</h3>
                
                {/* Success Connection */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-300">Success Path</span>
                  </div>
                  
                  {connections.find(c => c.fromStepId === selectedStep.id && c.type === 'success') ? (
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="text-white">
                          {steps.find(s => s.id === connections.find(c => c.fromStepId === selectedStep.id && c.type === 'success').toStepId)?.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveConnection(
                          selectedStep.id,
                          connections.find(c => c.fromStepId === selectedStep.id && c.type === 'success').toStepId,
                          'success'
                        )}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleConnectionStart(selectedStep, 'success')}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {connectionSourceId === selectedStep.id && connectionType === 'success'
                        ? 'Click on target step...'
                        : 'Connect to a step'}
                    </Button>
                  )}
                </div>
                
                {/* Failure Connection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-300">Failure Path</span>
                  </div>
                  
                  {connections.find(c => c.fromStepId === selectedStep.id && c.type === 'failure') ? (
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="text-white">
                          {steps.find(s => s.id === connections.find(c => c.fromStepId === selectedStep.id && c.type === 'failure').toStepId)?.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveConnection(
                          selectedStep.id,
                          connections.find(c => c.fromStepId === selectedStep.id && c.type === 'failure').toStepId,
                          'failure'
                        )}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleConnectionStart(selectedStep, 'failure')}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {connectionSourceId === selectedStep.id && connectionType === 'failure'
                        ? 'Click on target step...'
                        : 'Connect to a step'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Delete Step Button */}
              <div className="pt-4 border-t border-gray-700">
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveStep(selectedStep.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Step
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Settings className="h-12 w-12 mb-4 text-gray-500" />
              <p>Select a step to view and edit its details</p>
            </div>
          )}
        </div>
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