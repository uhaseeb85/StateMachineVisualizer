/**
 * AddConnectionOverlay Component
 * Modal overlay for adding connections between steps during simulation
 * Provides quick connection creation with visual preview
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
import { 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * AddConnectionOverlay Component
 * @param {Object} props
 * @param {Object} props.sourceStep - The source step for the connection
 * @param {Array} props.allSteps - All available steps
 * @param {Array} props.existingConnections - Existing connections to check for duplicates
 * @param {boolean} props.isOpen - Whether the overlay is open
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {Function} props.onAdd - Callback when connection is added
 */
const AddConnectionOverlay = ({ 
  sourceStep, 
  allSteps,
  existingConnections,
  isOpen, 
  onClose, 
  onAdd 
}) => {
  const [connectionType, setConnectionType] = useState('success');
  const [targetStepId, setTargetStepId] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);

  const handleAdd = () => {
    if (!targetStepId) {
      toast.error('Please select a target step');
      return;
    }

    if (targetStepId === sourceStep.id) {
      toast.error('Cannot create a connection to the same step');
      return;
    }

    // Check if connection already exists
    const connectionExists = existingConnections.some(
      conn => 
        conn.fromStepId === sourceStep.id &&
        conn.toStepId === targetStepId &&
        conn.type === connectionType
    );

    if (connectionExists) {
      toast.error('This connection already exists');
      return;
    }

    const success = onAdd(sourceStep.id, targetStepId, connectionType);
    
    if (success) {
      const targetStep = allSteps.find(s => s.id === targetStepId);
      toast.success(`Added ${connectionType} connection to ${targetStep?.name}`);
      onClose();
    }
  };

  // Get available target steps (exclude source step)
  const availableSteps = allSteps.filter(step => step.id !== sourceStep?.id);

  // Get target step for preview
  const targetStep = allSteps.find(s => s.id === targetStepId);

  if (!sourceStep) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Step Display */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From:</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {sourceStep.name}
            </div>
          </div>

          {/* Connection Type Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Connection Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={connectionType === 'success' ? 'default' : 'outline'}
                className={`h-20 flex flex-col items-center justify-center gap-2 ${
                  connectionType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 border-green-600' 
                    : 'border-green-200 hover:bg-green-50'
                }`}
                onClick={() => setConnectionType('success')}
              >
                <CheckCircle2 className={`h-6 w-6 ${
                  connectionType === 'success' ? 'text-white' : 'text-green-600'
                }`} />
                <span className={connectionType === 'success' ? 'text-white' : 'text-green-700'}>
                  Success Path
                </span>
              </Button>
              
              <Button
                variant={connectionType === 'failure' ? 'default' : 'outline'}
                className={`h-20 flex flex-col items-center justify-center gap-2 ${
                  connectionType === 'failure' 
                    ? 'bg-red-600 hover:bg-red-700 border-red-600' 
                    : 'border-red-200 hover:bg-red-50'
                }`}
                onClick={() => setConnectionType('failure')}
              >
                <XCircle className={`h-6 w-6 ${
                  connectionType === 'failure' ? 'text-white' : 'text-red-600'
                }`} />
                <span className={connectionType === 'failure' ? 'text-white' : 'text-red-700'}>
                  Failure Path
                </span>
              </Button>
            </div>
          </div>

          {/* Target Step Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Target Step
            </label>
            <select
              value={targetStepId}
              onChange={(e) => setTargetStepId(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 px-3 text-sm"
            >
              <option value="">Select a step...</option>
              
              {/* Group root-level steps */}
              <optgroup label="Root Steps">
                {availableSteps
                  .filter(step => !step.parentId)
                  .map(step => (
                    <option key={step.id} value={step.id}>
                      {step.name}
                    </option>
                  ))}
              </optgroup>
              
              {/* Group sub-steps if any exist */}
              {availableSteps.some(step => step.parentId) && (
                <optgroup label="Sub Steps">
                  {availableSteps
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

          {/* Connection Preview */}
          {targetStep && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {sourceStep.name}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`h-px flex-1 w-12 ${
                    connectionType === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <ArrowRight className={`h-4 w-4 ${
                    connectionType === 'success' ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {targetStep.name}
                </span>
              </div>
              <div className={`text-xs mt-1 ${
                connectionType === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionType === 'success' ? 'Success' : 'Failure'} path
              </div>
            </div>
          )}

          {/* TODO: Add "Create New Step" option in future enhancement */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={!targetStepId}
            className={
              connectionType === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddConnectionOverlay.propTypes = {
  sourceStep: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })).isRequired,
  existingConnections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired
};

export default AddConnectionOverlay;
