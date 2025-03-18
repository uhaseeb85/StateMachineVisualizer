import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
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
  FolderPlus,
  Edit,
  Save,
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  MoreVertical
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
  const [editingStepId, setEditingStepId] = useState(null);
  const [editedStepName, setEditedStepName] = useState('');
  const editInputRef = useRef(null);
  // Add state for the step actions menu
  const [openActionsMenuId, setOpenActionsMenuId] = useState(null);
  // Add state for panel resizing
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // as percentage
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const containerRef = useRef(null);
  
  // Handle mouse down on divider
  const handleDividerMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingDivider(true);
  };
  
  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingDivider || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      // Calculate new width as percentage (with min/max constraints)
      let newWidthPercentage = (mouseX / containerWidth) * 100;
      newWidthPercentage = Math.max(20, Math.min(newWidthPercentage, 80)); // Constrain between 20% and 80%
      
      setLeftPanelWidth(newWidthPercentage);
    };
    
    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };
    
    if (isDraggingDivider) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  // Helper function to check if a step is a descendant of another
  const isDescendant = (possibleDescendantId, ancestorId) => {
    if (!possibleDescendantId) return false;
    
    let current = steps.find(s => s.id === possibleDescendantId);
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true;
      current = steps.find(s => s.id === current.parentId);
    }
    return false;
  };

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
      // Close any open actions menu when selecting a step
      setOpenActionsMenuId(null);
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

  // Function to start editing a step name
  const startEditingStep = (stepId, initialName) => {
    setEditingStepId(stepId);
    setEditedStepName(initialName);
    // Close the actions menu when starting to edit
    setOpenActionsMenuId(null);
    // Focus the input after it renders
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 50);
  };

  // Function to save the edited step name
  const saveEditedStepName = (stepId) => {
    if (editedStepName.trim()) {
      handleUpdateStep(stepId, { name: editedStepName.trim() });
      setEditingStepId(null);
      toast.success('Step name updated successfully');
    } else {
      toast.error('Step name cannot be empty');
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingStepId(null);
  };

  // Function to move a step to a new parent
  const moveStepToParent = (stepId, newParentId) => {
    // Handle moving to root by passing null as newParentId
    console.log(`Moving step ${stepId} to parent ${newParentId || 'root'}`);
    
    // Don't allow a step to become its own parent
    if (stepId === newParentId) {
      toast.error("A step cannot be its own parent");
      return;
    }
    
    // Check if new parent is actually a descendant of this step
    if (isDescendant(newParentId, stepId)) {
      toast.error("Cannot move a step under its own descendant");
      return;
    }
    
    // Move the step by updating its parentId
    handleUpdateStep(stepId, { parentId: newParentId });
    
    // Auto-expand the new parent if one was specified
    if (newParentId) {
      setExpandedSteps(prev => ({
        ...prev,
        [newParentId]: true
      }));
    }
    
    toast.success(newParentId 
      ? `Step moved successfully to parent "${steps.find(s => s.id === newParentId)?.name}"` 
      : 'Step moved to root level');
    
    // Close the actions menu after moving the step
    setOpenActionsMenuId(null);
  };

  // Toggle the actions menu for a step
  const toggleActionsMenu = (e, stepId) => {
    e.stopPropagation();
    if (openActionsMenuId === stepId) {
      setOpenActionsMenuId(null);
    } else {
      setOpenActionsMenuId(stepId);
    }
  };

  // Handle drag end event
  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination or if item is dropped in the same place, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Handle root level steps reordering
    if (type === 'ROOT_STEPS') {
      const stepId = draggableId;
      const step = steps.find(s => s.id === stepId);
      
      if (!step) return;
      
      // Get the step at the destination index
      const rootSteps = steps.filter(s => !s.parentId);
      let destParentId = null;

      // Check if we're moving to a different parent
      if (destination.droppableId !== source.droppableId) {
        // Moving to a different parent
        destParentId = destination.droppableId === 'ROOT' ? null : destination.droppableId;
      }

      // Update the step's parent
      onUpdateStep(stepId, { parentId: destParentId });
      toast.success('Step moved successfully');
    }
    
    // Handle child steps reordering
    else if (type === 'CHILD_STEPS') {
      const stepId = draggableId;
      const step = steps.find(s => s.id === stepId);
      
      if (!step) return;
      
      // Moving to a different parent
      const newParentId = destination.droppableId;
      
      // Don't move to its own children
      if (isDescendant(newParentId, stepId)) {
        toast.error("Cannot move a step under its own descendant");
        return;
      }
      
      // If moving to a different parent
      if (step.parentId !== newParentId) {
        onUpdateStep(stepId, { parentId: newParentId });
        
        // Auto-expand the new parent
        setExpandedSteps(prev => ({
          ...prev,
          [newParentId]: true
        }));
        
        toast.success('Step moved to new parent');
      }
    }
  };

  const renderStep = (step, level = 0, dragHandleProps = null) => {
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

    // Check if this step is currently being edited
    const isEditing = editingStepId === step.id;

    // Check if actions menu is open for this step
    const isActionsMenuOpen = openActionsMenuId === step.id;

    // Generate potential parent options for the move menu
    // (all steps except this one and its descendants)
    const potentialParents = steps.filter(s => 
      s.id !== step.id && !isDescendant(s.id, step.id)
    );

    // Find parent step data for context display
    const parentStep = step.parentId 
      ? steps.find(s => s.id === step.parentId) 
      : null;
      
    // Get step context for display in hover or menu
    const getStepPathContext = (stepId) => {
      const step = steps.find(s => s.id === stepId);
      if (!step) return "";
      
      let path = [];
      let current = step;
      
      // Build ancestry path but limit to prevent infinite loops
      let iterations = 0; 
      const MAX_ITERATIONS = 10;
      
      while (current && current.parentId && iterations < MAX_ITERATIONS) {
        const parent = steps.find(s => s.id === current.parentId);
        if (parent) {
          path.unshift(parent.name);
          current = parent;
        } else {
          break;
        }
        iterations++;
      }
      
      return path.length > 0 ? path.join(" → ") : "";
    };

    return (
      <div className="step-container">
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
            <div {...(dragHandleProps || {})}>
              <Grip className="h-4 w-4 text-muted-foreground cursor-grab" />
            </div>
            
            {/* Editable Name Field */}
            {isEditing ? (
              <div className="flex-1 flex gap-1">
                <Input
                  ref={editInputRef}
                  value={editedStepName}
                  onChange={(e) => setEditedStepName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEditedStepName(step.id)}
                  className="h-7 py-1 min-w-0"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => saveEditedStepName(step.id)}
                  title="Save name"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => cancelEditing()}
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="min-w-0 overflow-hidden">
                <span className="font-medium">{step.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Actions Menu Button */}
            <div className="relative">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => toggleActionsMenu(e, step.id)}
                title="Step actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {/* Actions Menu */}
              {isActionsMenuOpen && (
                <div 
                  className="absolute right-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 py-1"
                  onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to parent
                >
                  {/* Current Step Context */}
                  {parentStep && (
                    <div className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border-l-4 border-blue-500 mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">Current path:</span>
                      <div className="text-gray-700 dark:text-gray-300 mt-1 break-words">
                        {getStepPathContext(step.id)} → <span className="font-semibold">{step.name}</span>
                      </div>
                    </div>
                  )}
                
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Step Actions
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 my-1"></div>
                  
                  {/* Edit Name Option */}
                  <button
                    className="flex w-full items-center px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingStep(step.id, step.name);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Name
                  </button>
                  
                  {/* Move to Root Option */}
                  {step.parentId && (
                    <>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 my-1"></div>
                      <button
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStepToParent(step.id, null);
                        }}
                      >
                        <ArrowUpToLine className="h-4 w-4 mr-2" />
                        Move to Root Level
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
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
        {isExpanded && hasChildren && (
          <Droppable droppableId={step.id} type="CHILD_STEPS">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1 mt-1"
              >
                {childSteps.map((childStep, index) => (
                  <Draggable key={childStep.id} draggableId={childStep.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`step-container ${snapshot.isDragging ? 'opacity-75 bg-blue-50 dark:bg-blue-900/20 rounded-md' : ''}`}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        {renderStep(childStep, level + 1, provided.dragHandleProps)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    );
  };

  // Get root-level steps (steps with no parent)
  const rootSteps = steps.filter(step => !step.parentId);

  return (
    <div 
      ref={containerRef}
      className="flex h-[calc(100vh-16rem)] p-6 bg-gray-50 dark:bg-gray-900 rounded-lg relative"
    >
      {/* Left Panel - Steps List */}
      <div className="border rounded-xl p-6 bg-background overflow-y-auto" style={{ width: `${leftPanelWidth}%` }}>
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
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="ROOT" type="ROOT_STEPS">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {rootSteps.map((step, index) => (
                        <Draggable key={step.id} draggableId={step.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`step-container ${snapshot.isDragging ? 'opacity-75 bg-blue-50 dark:bg-blue-900/20 rounded-md' : ''}`}
                              style={{
                                ...provided.draggableProps.style,
                              }}
                            >
                              {renderStep(step, 0, provided.dragHandleProps)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>
      
      {/* Resizable Divider */}
      <div 
        className={`w-2 cursor-col-resize mx-2 relative ${isDraggingDivider ? 'z-10' : ''}`}
        onMouseDown={handleDividerMouseDown}
      >
        <div className={`absolute inset-0 flex items-center justify-center ${isDraggingDivider ? 'opacity-100' : 'opacity-60'}`}>
          <div className={`h-24 w-1 ${isDraggingDivider ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'} rounded-full transition-colors`}></div>
        </div>
        {isDraggingDivider && (
          <div className="fixed inset-0 bg-transparent cursor-col-resize z-50" />
        )}
      </div>

      {/* Right Panel - Step Details */}
      <div className="border rounded-xl p-6 bg-background overflow-y-auto" style={{ width: `${100 - leftPanelWidth - 2}%` }}>
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