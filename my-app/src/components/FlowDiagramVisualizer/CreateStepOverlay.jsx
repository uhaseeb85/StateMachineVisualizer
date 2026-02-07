/**
 * CreateStepOverlay Component
 * Modal overlay for creating new steps during simulation
 * Includes option to auto-connect from current step
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
  Plus,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * CreateStepOverlay Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the overlay is open
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {Function} props.onCreate - Callback when step is created
 * @param {Array} props.allSteps - All available steps for parent selection
 * @param {Object} props.currentStep - Current step in simulation for auto-connect
 * @param {Function} props.onAddConnection - Callback to add connection if auto-connect is enabled
 */
const CreateStepOverlay = ({ 
  isOpen, 
  onClose, 
  onCreate,
  allSteps,
  currentStep,
  onAddConnection,
  dictionaryHook
}) => {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    description: '',
    parentId: null,
    type: 'state'
  });
  const [autoConnect, setAutoConnect] = useState(!!currentStep);
  const [connectionType, setConnectionType] = useState('success');

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Step name cannot be empty');
      return;
    }

    // Create the new step
    const newStepId = onCreate({
      name: formData.name.trim(),
      alias: formData.alias.trim() || undefined,
      description: formData.description.trim(),
      parentId: formData.parentId || null,
      type: formData.type
    });

    if (newStepId) {
      // Update dictionary
      if (dictionaryHook) {
        dictionaryHook.upsertEntry(
          formData.name.trim(),
          formData.type,
          formData.alias.trim()
        );
      }

      // If auto-connect is enabled and we have a current step, create the connection
      if (autoConnect && currentStep && onAddConnection) {
        const success = onAddConnection(currentStep.id, newStepId, connectionType);
        if (success) {
          toast.success(`Step created and connected via ${connectionType} path`);
        } else {
          toast.success('Step created (connection failed)');
        }
      } else {
        toast.success('Step created successfully');
      }

      // Reset form and close
      setFormData({ name: '', alias: '', description: '', parentId: null, type: 'state' });
      setAutoConnect(!!currentStep);
      setConnectionType('success');
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({ name: '', alias: '', description: '', parentId: null, type: 'state' });
    setAutoConnect(!!currentStep);
    setConnectionType('success');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Step</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step Name */}
          <div>
            <label htmlFor="create-step-name" className="text-sm font-medium mb-1 block">
              📝 Step Name *
            </label>
            <StepNameAutocomplete
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onSelect={(suggestion) => {
                setFormData({
                  ...formData,
                  name: suggestion.stepName,
                  type: suggestion.type,
                  alias: suggestion.alias || ''
                });
              }}
              dictionaryHook={dictionaryHook}
              placeholder="Enter step name..."
              className="w-full"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="create-step-description" className="text-sm font-medium mb-1 block">
              📄 Description
            </label>
            <Textarea
              id="create-step-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter step description..."
              className="w-full min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Alias */}
          <div>
            <label htmlFor="create-step-alias" className="text-sm font-medium mb-1 block">
              🏷️ Alias
            </label>
            <Input
              id="create-step-alias"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="Optional (e.g., LOGIN_PAGE)"
              className="w-full"
            />
          </div>

          {/* Type */}
          <div>
            <div className="text-sm font-medium mb-2 block">
              🧩 Type
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'state' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'state' })}
                className="h-8 px-3"
              >
                State
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'rule' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'rule' })}
                className="h-8 px-3"
              >
                Rule
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'behavior' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'behavior' })}
                className="h-8 px-3"
              >
                Behavior
              </Button>
            </div>
          </div>

          {/* Parent Step Selection */}
          <div>
            <label htmlFor="create-step-parent" className="text-sm font-medium mb-1 block">
              📂 Parent Step
            </label>
            <select
              id="create-step-parent"
              value={formData.parentId || ''}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 px-3 text-sm"
            >
              <option value="">None - Root Level</option>
              
              {/* Group root-level steps */}
              <optgroup label="Root Steps">
                {allSteps
                  .filter(step => !step.parentId)
                  .map(step => (
                    <option key={step.id} value={step.id}>
                      {step.name}
                    </option>
                  ))}
              </optgroup>
              
              {/* Group sub-steps if any exist */}
              {allSteps.some(step => step.parentId) && (
                <optgroup label="Sub Steps">
                  {allSteps
                    .filter(step => step.parentId)
                    .map(step => {
                      const parentStep = allSteps.find(s => s.id === step.parentId);
                      const parentName = parentStep ? parentStep.name : 'Unknown parent';
                      
                      return (
                        <option key={step.id} value={step.id}>
                          {step.name} (in {parentName})
                        </option>
                      );
                    })}
                </optgroup>
              )}
            </select>
          </div>

          {/* Auto-connect Option */}
          {currentStep && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-2 mb-2">
                <input
                  type="checkbox"
                  id="autoConnect"
                  checked={autoConnect}
                  onChange={(e) => setAutoConnect(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="autoConnect" className="text-sm font-medium cursor-pointer">
                    🔗 Auto-connect from current step
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Create a connection from "{currentStep.name}" to this new step
                  </p>
                </div>
              </div>

              {/* Connection Type Selection */}
              {autoConnect && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <div className="text-xs font-medium mb-2 block">
                    Connection Type:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={connectionType === 'success' ? 'default' : 'outline'}
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${
                        connectionType === 'success' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'border-green-200 hover:bg-green-50'
                      }`}
                      onClick={() => setConnectionType('success')}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${
                        connectionType === 'success' ? 'text-white' : 'text-green-600'
                      }`} />
                      <span className={`text-xs ${
                        connectionType === 'success' ? 'text-white' : 'text-green-700'
                      }`}>
                        Success
                      </span>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={connectionType === 'failure' ? 'default' : 'outline'}
                      className={`h-12 flex flex-col items-center justify-center gap-1 ${
                        connectionType === 'failure' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'border-red-200 hover:bg-red-50'
                      }`}
                      onClick={() => setConnectionType('failure')}
                    >
                      <XCircle className={`h-4 w-4 ${
                        connectionType === 'failure' ? 'text-white' : 'text-red-600'
                      }`} />
                      <span className={`text-xs ${
                        connectionType === 'failure' ? 'text-white' : 'text-red-700'
                      }`}>
                        Failure
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!formData.name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CreateStepOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })).isRequired,
  currentStep: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  onAddConnection: PropTypes.func,
  dictionaryHook: PropTypes.object
};

export default CreateStepOverlay;
