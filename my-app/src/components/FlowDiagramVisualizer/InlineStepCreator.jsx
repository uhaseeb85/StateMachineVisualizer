/**
 * InlineStepCreator Component
 * Inline step creation within simulation view
 * Allows creating new steps without leaving the simulation context
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * InlineStepCreator Component
 * @param {Object} props
 * @param {string} props.position - 'between' | 'end' - Where the creator appears
 * @param {Object} props.currentStep - Current step for auto-connect context
 * @param {Array} props.allSteps - All available steps
 * @param {Function} props.onCreate - Callback when step is created
 * @param {Function} props.onCancel - Callback when creation is cancelled
 * @param {Function} props.onAddConnection - Callback to add connection
 */
const InlineStepCreator = ({ 
  position = 'end',
  currentStep = null,
  allSteps = [],
  onCreate,
  onCancel,
  onAddConnection
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: currentStep?.id || '', // Auto-set to current step if available
    autoConnect: !!currentStep,
    connectionType: 'success'
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Step name is required');
      return;
    }

    // Create the step data
    const stepData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      parentId: formData.parentId || null,
      assumptions: [],
      questions: [],
      imageUrls: [],
      imageCaptions: []
    };

    // Call onCreate and get the new step ID
    const newStepId = onCreate(stepData);

    // Auto-connect if requested
    if (formData.autoConnect && currentStep && newStepId && onAddConnection) {
      onAddConnection(currentStep.id, newStepId, formData.connectionType);
      toast.success(`Created "${formData.name}" and connected from "${currentStep.name}"!`);
    } else if (newStepId) {
      toast.success(`Created "${formData.name}"!`);
    }

    // Reset form
    setFormData({
      name: '',
      description: '',
      parentId: '',
      autoConnect: !!currentStep,
      connectionType: 'success'
    });
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      autoConnect: !!currentStep,
      connectionType: 'success'
    });
    onCancel();
  };

  return (
    <Card className="inline-step-creator p-4 border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 my-4 animate-in slide-in-from-top-4 duration-300">
      <div className="creator-header mb-3">
        <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
          ➕ Create New Step
        </h4>
      </div>

      <div className="creator-form space-y-3">
        {/* Step Name */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Step Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Enter step name..."
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleCreate();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            className="w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Description <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <Textarea
            placeholder="Enter description..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
            className="w-full"
          />
        </div>

        {/* Parent Step Selection */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Parent Step <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({...formData, parentId: e.target.value})}
            className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-3 text-sm"
          >
            <option value="">None (Root step)</option>
            
            {/* Group 1: Root-level steps (no parentId) */}
            <optgroup label="Root Steps">
              {allSteps
                .filter(s => !s.parentId)
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </optgroup>
            
            {/* Group 2: Sub-steps (with parentId) - only show if there are any */}
            {allSteps.some(s => s.parentId) && (
              <optgroup label="Sub Steps">
                {allSteps
                  .filter(s => s.parentId)
                  .map(s => {
                    // Find the parent step to add its name for context
                    const parentStep = allSteps.find(ps => ps.id === s.parentId);
                    const parentName = parentStep ? parentStep.name : 'Unknown parent';
                    
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} (under {parentName})
                      </option>
                    );
                  })}
              </optgroup>
            )}
          </select>
        </div>

        {/* Auto-connect Section */}
        {currentStep && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={formData.autoConnect}
                onChange={(e) => setFormData({...formData, autoConnect: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">
                Auto-connect from "{currentStep.name}"
              </span>
            </label>

            {formData.autoConnect && (
              <div className="mt-2 ml-6">
                <label className="text-xs font-medium mb-1 block">Connection Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`
                      flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium
                      transition-all duration-200
                      ${formData.connectionType === 'success' 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                      }
                    `}
                    onClick={() => setFormData({...formData, connectionType: 'success'})}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Success</span>
                  </button>
                  <button
                    type="button"
                    className={`
                      flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium
                      transition-all duration-200
                      ${formData.connectionType === 'failure' 
                        ? 'bg-red-600 text-white shadow-md' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                      }
                    `}
                    onClick={() => setFormData({...formData, connectionType: 'failure'})}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Failure</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleCreate} 
            disabled={!formData.name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Create Step
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Keyboard Hints */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
          Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Enter</kbd> to create, 
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-1">Esc</kbd> to cancel
        </div>
      </div>
    </Card>
  );
};

InlineStepCreator.propTypes = {
  position: PropTypes.oneOf(['between', 'end']),
  currentStep: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })),
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onAddConnection: PropTypes.func
};

export default InlineStepCreator;
