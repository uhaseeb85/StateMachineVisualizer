/**
 * SimulationStepCard Component (Enhanced with Inline Editing)
 * Expandable step card for simulation mode with full inline editing capabilities
 * Features:
 * - Collapsed view with hover actions
 * - Expanded view with all editing fields inline
 * - No separate modals - everything happens in place
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
  Edit,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// Import inline editor components
import ConnectionsInlineEditor from './ConnectionsInlineEditor';
import AssumptionsInlineEditor from './AssumptionsInlineEditor';
import QuestionsInlineEditor from './QuestionsInlineEditor';
import ScreenshotsInlineEditor from './ScreenshotsInlineEditor';

/**
 * Returns the appropriate icon component based on step status
 */
const getStatusIcon = (status) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failure':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'current':
      return <ArrowRight className="h-5 w-5 text-blue-500" />;
    case 'end':
      return <X className="h-5 w-5 text-gray-500" />;
    default:
      return null;
  }
};

/**
 * Generates CSS classes for step cards based on their status and type
 */
const getStepCardClasses = (status, isSubStep, isExpanded) => {
  let baseClasses = "p-4 rounded-lg border transition-all duration-300 ";
  
  // Status-based styling
  const statusClasses = status === 'current' ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : 
                       status === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200' :
                       status === 'failure' ? 'bg-red-50 dark:bg-red-900/30 border-red-200' :
                       status === 'end' ? 'bg-gray-50 dark:bg-gray-800 border-gray-200' :
                       'bg-gray-50 dark:bg-gray-800';

  // Different styling for main steps and sub-steps
  const stepTypeClasses = isSubStep ? 
    'border-dashed bg-opacity-70 dark:bg-opacity-70' : 
    'border-solid shadow-md';

  // Expanded state styling
  const expandedClasses = isExpanded ? 
    'shadow-2xl scale-[1.02] ring-2 ring-blue-500 dark:ring-blue-400' : 
    'hover:shadow-lg';

  return `${baseClasses} ${statusClasses} ${stepTypeClasses} ${expandedClasses}`;
};

/**
 * SimulationStepCard Component
 */
const SimulationStepCard = ({ 
  step, 
  status, 
  isSubStep = false,
  isExpanded = false,
  onToggleExpand,
  onSave,
  onDelete,
  allSteps = [],
  connections = [],
  onAddConnection,
  onRemoveConnection,
  onAddStep // Optional - enables create & connect in ConnectionsInlineEditor
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    name: step.name,
    description: step.description || '',
    assumptions: step.assumptions || [],
    questions: step.questions || [],
    imageUrls: step.imageUrls || [],
    imageCaptions: step.imageCaptions || []
  });

  // Staged connection changes (to prevent persisting on cancel)
  const [stagedConnectionChanges, setStagedConnectionChanges] = useState({
    added: [], // { toStepId, type }
    removed: [] // { toStepId, type }
  });

  // Sync formData and reset staged changes when step prop changes or card expands
  useEffect(() => {
    if (isExpanded) {
      setFormData({
        name: step.name,
        description: step.description || '',
        assumptions: step.assumptions || [],
        questions: step.questions || [],
        imageUrls: step.imageUrls || [],
        imageCaptions: step.imageCaptions || []
      });
      // Reset staged changes when expanding
      setStagedConnectionChanges({
        added: [],
        removed: []
      });
      // Reset "More Details" to collapsed state
      setShowMoreDetails(false);
    }
  }, [step, isExpanded]);

  // Local handlers for connection operations (staging mode)
  const handleAddConnectionStaged = (fromStepId, toStepId, type) => {
    // Check if this connection was previously removed
    const wasRemoved = stagedConnectionChanges.removed.some(
      conn => conn.toStepId === toStepId && conn.type === type
    );

    if (wasRemoved) {
      // If it was removed, just undo the removal
      setStagedConnectionChanges(prev => ({
        ...prev,
        removed: prev.removed.filter(
          conn => !(conn.toStepId === toStepId && conn.type === type)
        )
      }));
    } else {
      // Add to staged additions
      setStagedConnectionChanges(prev => ({
        ...prev,
        added: [...prev.added, { toStepId, type }]
      }));
    }
  };

  const handleRemoveConnectionStaged = (fromStepId, toStepId, type) => {
    // Check if this connection was just added
    const wasAdded = stagedConnectionChanges.added.some(
      conn => conn.toStepId === toStepId && conn.type === type
    );

    if (wasAdded) {
      // If it was just added, just undo the addition
      setStagedConnectionChanges(prev => ({
        ...prev,
        added: prev.added.filter(
          conn => !(conn.toStepId === toStepId && conn.type === type)
        )
      }));
    } else {
      // Add to staged removals
      setStagedConnectionChanges(prev => ({
        ...prev,
        removed: [...prev.removed, { toStepId, type }]
      }));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Step name cannot be empty');
      return;
    }

    // Apply all staged connection changes
    stagedConnectionChanges.removed.forEach(({ toStepId, type }) => {
      onRemoveConnection(step.id, toStepId, type);
    });
    
    stagedConnectionChanges.added.forEach(({ toStepId, type }) => {
      onAddConnection(step.id, toStepId, type);
    });

    // Save form data changes
    onSave(step.id, formData);
    
    // Reset staged changes
    setStagedConnectionChanges({
      added: [],
      removed: []
    });
    
    onToggleExpand(null); // Collapse
  };

  const handleCancel = () => {
    // Reset form data to original
    setFormData({
      name: step.name,
      description: step.description || '',
      assumptions: step.assumptions || [],
      questions: step.questions || [],
      imageUrls: step.imageUrls || [],
      imageCaptions: step.imageCaptions || []
    });
    
    // Discard all staged connection changes
    setStagedConnectionChanges({
      added: [],
      removed: []
    });
    
    onToggleExpand(null); // Collapse
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${step.name}"?`)) {
      onDelete(step.id);
      // Removed toast notification - the step removal is visually clear
    }
  };

  // Collapsed View
  if (!isExpanded) {
    return (
      <Card 
        className={`
          ${getStepCardClasses(status, isSubStep, false)}
          group relative
        `}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-center gap-3">
          <div className={`status-icon ${status} transition-all duration-300`}>
            {getStatusIcon(status)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200">
              {step.name}
            </h3>
            {step.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {step.description}
              </p>
            )}
          </div>
          
          {/* Action buttons - show on hover */}
          {showActions && status !== 'end' && (
            <div className="flex gap-1 items-center animate-in fade-in duration-200">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(step.id);
                }}
                title="Edit step"
              >
                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Edit</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 hover:bg-red-100 dark:hover:bg-red-900/50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                title="Delete step"
              >
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Expanded Edit View
  return (
    <Card 
      className={`
        ${getStepCardClasses(status, isSubStep, true)}
        animate-in zoom-in-95 duration-300
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Editing: {step.name}
          </h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8"
          title="Collapse"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Form */}
      <div className="space-y-4">
        {/* Step Name - Always visible */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            📝 Step Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter step name..."
            className="w-full"
          />
        </div>

        {/* Connections Section - Always visible */}
        {(onAddConnection && onRemoveConnection) && (
          <ConnectionsInlineEditor
            currentStep={step}
            allSteps={allSteps}
            connections={connections}
            stagedChanges={stagedConnectionChanges}
            onAddConnection={handleAddConnectionStaged}
            onRemoveConnection={handleRemoveConnectionStaged}
            onAddStep={onAddStep}
          />
        )}

        {/* More Details Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="w-full flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Info className="h-4 w-4" />
          <span>{showMoreDetails ? 'Hide' : 'Show'} More Details</span>
          {showMoreDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Additional Details - Only visible when expanded */}
        {showMoreDetails && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                📄 Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter step description..."
                className="w-full min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Assumptions Section */}
            <AssumptionsInlineEditor
              assumptions={formData.assumptions}
              onChange={(assumptions) => setFormData({ ...formData, assumptions })}
            />

            {/* Questions Section */}
            <QuestionsInlineEditor
              questions={formData.questions}
              onChange={(questions) => setFormData({ ...formData, questions })}
            />

            {/* Screenshots Section */}
            <ScreenshotsInlineEditor
              imageUrls={formData.imageUrls}
              imageCaptions={formData.imageCaptions}
              onChange={(imageUrls, imageCaptions) => 
                setFormData({ ...formData, imageUrls, imageCaptions })
              }
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Step
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

SimulationStepCard.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    parentId: PropTypes.string,
    assumptions: PropTypes.arrayOf(PropTypes.string),
    questions: PropTypes.arrayOf(PropTypes.string),
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    imageCaptions: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  status: PropTypes.oneOf(['current', 'success', 'failure', 'end']).isRequired,
  isSubStep: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onToggleExpand: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })),
  connections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })),
  onAddConnection: PropTypes.func,
  onRemoveConnection: PropTypes.func,
  onAddStep: PropTypes.func // Optional - enables create & connect feature
};

export default SimulationStepCard;
