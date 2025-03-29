import { useState, useRef, useEffect } from 'react';
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
  FolderPlus,
  Edit,
  Save,
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  Undo2,
  Image,
  Upload,
  ImagePlus,
  Pencil,
  Check,
  Download,
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
  // Add state for undo history
  const [moveHistory, setMoveHistory] = useState([]);
  // Add state for parent selection mode
  const [selectingParentFor, setSelectingParentFor] = useState(null);
  const fileInputRef = useRef(null);
  // Add state for editing captions
  const [editingCaptionIndex, setEditingCaptionIndex] = useState(null);
  const [editedCaption, setEditedCaption] = useState('');
  const captionInputRef = useRef(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedImageCaption, setZoomedImageCaption] = useState('');
  const [downloadCount, setDownloadCount] = useState(0);
  
  // Add a step move to history
  const addToMoveHistory = (stepId, oldParentId, newParentId) => {
    setMoveHistory(prev => [...prev, { stepId, oldParentId, newParentId, timestamp: Date.now() }]);
  };
  
  // Undo the last step move
  const undoLastMove = () => {
    if (moveHistory.length === 0) {
      toast.info('Nothing to undo');
      return;
    }
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const { stepId, oldParentId } = lastMove;
    
    // Restore the step to its previous parent
    handleUpdateStep(stepId, { parentId: oldParentId });
    
    // Remove the last move from history
    setMoveHistory(prev => prev.slice(0, prev.length - 1));
    
    toast.success('Move undone');
  };
  
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
    
    // Check if the step or any descendant has screenshots
    const stepToRemove = steps.find(s => s.id === stepId);
    const hasScreenshots = stepToRemove && stepToRemove.imageUrls && stepToRemove.imageUrls.length > 0;
    
    // Check if any descendant has screenshots
    const descendantSteps = descendantIds.map(id => steps.find(s => s.id === id));
    const hasDescendantScreenshots = descendantSteps.some(step => 
      step && step.imageUrls && step.imageUrls.length > 0
    );
    
    // If there are screenshots, show a specific warning
    if (hasScreenshots || hasDescendantScreenshots) {
      const warningMessage = hasDescendantScreenshots
        ? 'This step or its sub-steps contain screenshots that will be permanently deleted. Continue?'
        : 'This step contains screenshots that will be permanently deleted. Continue?';
        
      if (!window.confirm(warningMessage)) {
        return;
      }
    } else {
      // Generic confirmation for steps without screenshots
      if (!window.confirm('Are you sure you want to remove this step and all its sub-steps?')) {
        return;
      }
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

  // Start parent selection mode
  const startSelectingParent = (stepId) => {
    setSelectingParentFor(stepId);
    toast.info("Click on a step to set as parent, or click 'Move to Root' to make it a top-level step", {
      duration: 4000,
    });
    // Close the actions menu
    setOpenActionsMenuId(null);
  };
  
  // Cancel parent selection mode
  const cancelSelectingParent = () => {
    setSelectingParentFor(null);
  };
  
  // Handle parent selection
  const handleParentSelection = (newParentId) => {
    if (!selectingParentFor) return;
    
    const stepId = selectingParentFor;
    
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
    
    // Get original parent for history
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    const originalParentId = step.parentId;
    
    // Only update if the parent is actually changing
    if (originalParentId !== newParentId) {
      // Move the step by updating its parentId
      handleUpdateStep(stepId, { parentId: newParentId });
      
      // Add to move history for undo
      addToMoveHistory(stepId, originalParentId, newParentId);
      
      // Auto-expand the new parent if one was specified
      if (newParentId) {
        setExpandedSteps(prev => ({
          ...prev,
          [newParentId]: true
        }));
      }
      
      toast.success(newParentId 
        ? `Parent changed to "${steps.find(s => s.id === newParentId)?.name}"` 
        : 'Moved to root level');
    }
    
    // Exit parent selection mode
    setSelectingParentFor(null);
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

  // Add caption edit functions
  const startEditingCaption = (index, initialCaption) => {
    setEditingCaptionIndex(index);
    setEditedCaption(initialCaption || '');
    
    // Focus the input after a short delay to allow rendering
    setTimeout(() => {
      if (captionInputRef.current) {
        captionInputRef.current.focus();
      }
    }, 50);
  };

  const saveCaption = (index) => {
    if (!selectedStep || !selectedStep.imageUrls) return;
    
    // Create or update imageCaptions array
    const currentCaptions = selectedStep.imageCaptions || Array(selectedStep.imageUrls.length).fill('');
    const updatedCaptions = [...currentCaptions];
    
    // Ensure the captions array is the same length as images array
    while (updatedCaptions.length < selectedStep.imageUrls.length) {
      updatedCaptions.push('');
    }
    
    // Update the specific caption
    updatedCaptions[index] = editedCaption;
    
    // Update the step
    handleUpdateStep(selectedStep.id, { imageCaptions: updatedCaptions });
    
    // Exit edit mode
    setEditingCaptionIndex(null);
    toast.success('Caption updated');
  };

  // Modify the handleImageUpload function to initialize captions
  const handleImageUpload = (e) => {
    if (!selectedStep) return;
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Get current captions
    const currentCaptions = selectedStep.imageCaptions || [];
    let newCaptions = [...currentCaptions];
    
    // Process each file
    Array.from(files).forEach(file => {
      // Validate file is an image
      if (!file.type.match('image.*')) {
        toast.error(`File "${file.name}" is not an image (PNG, JPG, JPEG, GIF)`);
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Image "${file.name}" is larger than 2MB`);
        return;
      }
      
      // Read the file as a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        
        // Add to existing imageUrls array or create new array
        const currentImageUrls = selectedStep.imageUrls || [];
        const updatedImageUrls = [...currentImageUrls, imageUrl];
        
        // Add empty caption for the new image
        newCaptions.push('');
        
        handleUpdateStep(selectedStep.id, { 
          imageUrls: updatedImageUrls,
          // Keep backward compatibility
          imageUrl: updatedImageUrls[0],
          // Update captions
          imageCaptions: newCaptions
        });
        
        toast.success(`Screenshot added successfully (${updatedImageUrls.length} total)`);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Modify the handleRemoveImage function to add confirmation
  const handleRemoveImage = (index) => {
    if (!selectedStep || !selectedStep.imageUrls) return;
    
    // Add confirmation dialog
    if (!window.confirm(`Are you sure you want to remove this screenshot? This action cannot be undone.`)) {
      return;
    }
    
    const updatedImages = [...selectedStep.imageUrls];
    
    // Revoke the blob URL before removing
    const imageUrl = updatedImages[index];
    if (imageUrl && imageUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(imageUrl);
        console.log('Revoked blob URL:', imageUrl);
      } catch (error) {
        console.error('Error revoking blob URL:', error);
      }
    }
    
    updatedImages.splice(index, 1);
    
    // Also remove the caption at the same index
    const updatedCaptions = selectedStep.imageCaptions 
      ? [...selectedStep.imageCaptions] 
      : Array(selectedStep.imageUrls.length).fill('');
    
    updatedCaptions.splice(index, 1);
    
    handleUpdateStep(selectedStep.id, { 
      imageUrls: updatedImages.length > 0 ? updatedImages : null,
      // Keep backward compatibility
      imageUrl: updatedImages.length > 0 ? updatedImages[0] : null,
      // Update captions
      imageCaptions: updatedCaptions.length > 0 ? updatedCaptions : null
    });
    
    toast.success('Screenshot removed');
  };
  
  // Update the handleRemoveAllImages function to also add confirmation
  const handleRemoveAllImages = () => {
    if (!selectedStep || !selectedStep.imageUrls) return;
    
    // Add confirmation dialog
    if (!window.confirm(`Are you sure you want to remove all screenshots? This action cannot be undone.`)) {
      return;
    }
    
    // Revoke all blob URLs before removing
    selectedStep.imageUrls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
          console.log('Revoked blob URL:', url);
        } catch (error) {
          console.error('Error revoking blob URL:', error);
        }
      }
    });
    
    handleUpdateStep(selectedStep.id, { 
      imageUrls: null,
      imageUrl: null,
      imageCaptions: null
    });
    
    toast.success('All screenshots removed');
  };

  // Function to open the zoom modal
  const openZoomModal = (imageUrl, caption) => {
    setZoomedImage(imageUrl);
    setZoomedImageCaption(caption || '');
  };

  // Function to close the zoom modal
  const closeZoomModal = () => {
    setZoomedImage(null);
    setZoomedImageCaption('');
  };

  // Function to download the image
  const downloadImage = (imageUrl, caption, stepName, index) => {
    if (!imageUrl) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = imageUrl;
    
    // Create a filename from caption or default name
    const fileName = caption ? 
      `${caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png` : 
      `${stepName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_screenshot_${index + 1}.png`;
    
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Increment download count
    setDownloadCount(prevCount => {
      const newCount = prevCount + 1;
      
      // After 3 downloads, show a helpful suggestion
      if (newCount === 3) {
        setTimeout(() => {
          toast.info("Tip: If you need multiple screenshots, consider exporting the entire diagram instead.", {
            duration: 5000,
            action: {
              label: "OK",
              onClick: () => {}
            }
          });
        }, 500);
      }
      
      return newCount;
    });
  };

  const renderStep = (step, level = 0) => {
    const childSteps = getChildSteps(step.id);
    const hasChildren = childSteps.length > 0;
    const isExpanded = expandedSteps[step.id];
    
    // Check if we're in connection creation mode and this isn't the source step
    const isConnectionMode = connectionType && connectionSourceId;
    const isConnectionSource = connectionSourceId === step.id;
    const isSelectableTarget = isConnectionMode && !isConnectionSource;
    
    // Check if we're in parent selection mode
    const isParentSelectionMode = selectingParentFor !== null;
    const isParentSelectionSource = selectingParentFor === step.id;
    const isSelectableParent = isParentSelectionMode && !isParentSelectionSource && !isDescendant(step.id, selectingParentFor);
    
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
    
    // Classes for steps in parent selection mode
    let parentSelectionClasses = '';
    if (isParentSelectionMode) {
      if (isParentSelectionSource) {
        // Source step styling
        parentSelectionClasses = 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20';
      } else if (isSelectableParent) {
        // Potential parent styling
        parentSelectionClasses = 'hover:ring-2 hover:ring-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer';
      } else {
        // Unselectable parent (descendant)
        parentSelectionClasses = 'opacity-50';
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

    // Handle step click based on current mode
    const handleStepContainerClick = (e) => {
      e.stopPropagation();
      
      if (isParentSelectionMode) {
        if (!isParentSelectionSource && isSelectableParent) {
          handleParentSelection(step.id);
        }
      } else if (isConnectionMode) {
        handleStepClick(step);
      } else {
        handleStepClick(step);
      }
    };

    return (
      <div className="step-container">
        <div
          className={`
            group flex items-center gap-2 p-2 rounded-md transition-all
            ${selectedStep?.id === step.id && !isConnectionMode && !isParentSelectionMode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
            ${connectionModeClasses}
            ${parentSelectionClasses}
            border border-gray-200 dark:border-gray-700 mb-1
          `}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={handleStepContainerClick}
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
            <Grip className="h-4 w-4 text-muted-foreground" />
            
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
                title="Edit step"
              >
                <Edit className="h-4 w-4" />
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
                  
                  {/* Change Parent Option */}
                  <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 my-1"></div>
                  <button
                    className="flex w-full items-center px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      startSelectingParent(step.id);
                    }}
                  >
                    <MoveDown className="h-4 w-4 mr-2" />
                    Change Parent
                  </button>
                  
                  {/* Move to Root Option */}
                  {step.parentId && (
                    <>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 my-1"></div>
                      <button
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleParentSelection(null);
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
        {isExpanded && (
          <div className="space-y-1 mt-1">
            {childSteps.map((childStep, index) => (
              <div key={childStep.id} className="step-container">
                {renderStep(childStep, level + 1)}
              </div>
            ))}
          </div>
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
          <div className="flex gap-2 sticky top-0 bg-background pb-4 border-b">
            <Input
              placeholder="Enter step name..."
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRootStep()}
              className="h-10 flex-1"
            />
            <Button
              onClick={handleAddRootStep}
              disabled={!newStepName.trim()}
              className="h-10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
            <Button
              onClick={undoLastMove}
              disabled={moveHistory.length === 0}
              variant="outline"
              className="h-10"
              title="Undo last move"
            >
              <Undo2 className="h-4 w-4" />
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

          {/* Parent Selection Indicator */}
          {selectingParentFor && (
            <div className="p-4 rounded-md mb-3 bg-blue-100 border-2 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600">
              <div className="flex items-center gap-2 mb-2">
                <MoveDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">
                  Changing parent
                </span>
              </div>
              <div className="mb-2">
                <span className="text-sm">
                  Step: <span className="font-semibold">{steps.find(s => s.id === selectingParentFor)?.name}</span>
                </span>
              </div>
              <div className="text-sm flex justify-between items-center">
                <span>Click on a new parent step</span>
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-7 border-blue-400 hover:bg-blue-200 text-blue-800"
                  onClick={cancelSelectingParent}
                >
                  Cancel
                </Button>
              </div>
              {steps.find(s => s.id === selectingParentFor)?.parentId && (
                <div className="mt-3 pt-3 border-t border-blue-200 text-sm">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 border-blue-400 hover:bg-blue-200 text-blue-800"
                    onClick={() => handleParentSelection(null)}
                  >
                    <ArrowUpToLine className="h-4 w-4 mr-2" />
                    Move to Root Level
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Steps list */}
          <div className="space-y-1 mt-4">
            {rootSteps.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No steps added yet. Add your first step above.
              </div>
            ) : (
              <div className="space-y-2">
                {rootSteps.map((step, index) => (
                  <div key={step.id} className="step-container">
                    {renderStep(step, 0)}
                  </div>
                ))}
              </div>
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
              
              {/* Screenshot Section */}
              <div>
                <label className="text-sm font-medium mb-1 block">Screenshots</label>
                
                {selectedStep.imageUrls && selectedStep.imageUrls.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveAllImages}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        <span>Remove All</span>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {selectedStep.imageUrls.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className="relative border rounded-md p-1 bg-gray-50 dark:bg-gray-800 overflow-hidden"
                        >
                          <img 
                            src={imageUrl} 
                            alt={selectedStep.imageCaptions?.[index] || `${selectedStep.name} - Screenshot ${index + 1}`} 
                            className="w-full h-32 object-cover cursor-pointer"
                            onClick={() => openZoomModal(
                              imageUrl, 
                              selectedStep.imageCaptions?.[index] || ''
                            )}
                          />
                          
                          {/* Caption editing */}
                          <div className="mt-1">
                            {editingCaptionIndex === index ? (
                              <div className="flex items-center gap-1 p-1">
                                <Input
                                  ref={captionInputRef}
                                  value={editedCaption}
                                  onChange={(e) => setEditedCaption(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveCaption(index)}
                                  className="h-6 text-xs p-1"
                                  placeholder="Enter caption..."
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => saveCaption(index)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center justify-between px-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                onClick={() => startEditingCaption(index, selectedStep.imageCaptions?.[index] || '')}
                              >
                                <p className="text-xs truncate py-1">
                                  {selectedStep.imageCaptions?.[index] || 'Add caption...'}
                                </p>
                                <Pencil className="h-3 w-3 opacity-50" />
                              </div>
                            )}
                          </div>
                          
                          <div className="absolute top-1 right-1 flex gap-1">
                            <Button
                              variant="default"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-blue-500 hover:bg-blue-600"
                              onClick={() => downloadImage(
                                imageUrl,
                                selectedStep.imageCaptions?.[index] || '',
                                selectedStep.name,
                                index
                              )}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-2 border-dashed rounded-md flex items-center justify-center h-32">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                        <Button
                          variant="ghost"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center h-full w-full"
                        >
                          <ImagePlus className="h-6 w-6 mb-2 text-gray-400" />
                          <span className="text-sm text-gray-500">Add More</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 border-dashed border-2 h-24"
                    >
                      <Image className="h-5 w-5" />
                      <span>Add Screenshots</span>
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">Upload screenshots that illustrate this step (Max: 2MB each)</p>
                  </div>
                )}
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
          <div className="text-center text-muted-foreground py-4">
            No step selected. Select a step from the left panel to view details.
          </div>
        )}
      </div>
      
      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={closeZoomModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-2 max-w-[90%] max-h-[90%] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
              onClick={closeZoomModal}
            >
              <X className="h-4 w-4" />
            </button>
            
            <button 
              className="absolute top-2 left-2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
              onClick={() => downloadImage(
                zoomedImage,
                zoomedImageCaption,
                selectedStep?.name || 'Screenshot',
                0
              )}
            >
              <Download className="h-4 w-4" />
            </button>
            
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center">
              <img 
                src={zoomedImage} 
                alt={zoomedImageCaption || "Screenshot"} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            
            {zoomedImageCaption && (
              <div className="py-2 px-3 text-sm text-center">
                {zoomedImageCaption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

StepPanel.propTypes = {
  steps: PropTypes.array.isRequired,
  connections: PropTypes.array.isRequired,
  onAddStep: PropTypes.func.isRequired,
  onUpdateStep: PropTypes.func.isRequired,
  onRemoveStep: PropTypes.func.isRequired,
  onAddConnection: PropTypes.func.isRequired,
  onRemoveConnection: PropTypes.func.isRequired,
};

export default StepPanel;