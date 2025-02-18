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
  ChevronUp,
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
  console.log('Steps received:', steps); // Debug log
  const [newStepName, setNewStepName] = useState('');
  const [selectedStep, setSelectedStep] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [addingSubStepFor, setAddingSubStepFor] = useState(null);

  const handleAddStep = (parentStepId = null) => {
    if (newStepName.trim()) {
      const stepId = onAddStep({
        name: newStepName.trim(),
        description: '',
        expectedResponse: '',
        parentId: parentStepId
      });
      setNewStepName('');
      setAddingSubStepFor(null);
      setExpandedSteps(prev => ({
        ...prev,
        [stepId]: true
      }));
      toast.success('Step added successfully');
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
    onRemoveStep(stepId);
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
    toast.success('Step removed');
  };

  const renderStepHierarchy = (steps, parentId = null, level = 0) => {
    console.log('Rendering hierarchy for parentId:', parentId, 'Level:', level); // Debug log
    // For imported steps that don't have parentId, treat them as root level steps
    const filteredSteps = steps.filter(step => 
      parentId === null ? !step.parentId : step.parentId === parentId
    );
    console.log('Filtered steps:', filteredSteps); // Debug log
    
    return filteredSteps.map(step => (
      <div key={step.id} className="mb-1">
        <div
          className={`
            group flex items-center gap-2 p-2 rounded-md cursor-pointer
            ${selectedStep?.id === step.id ? 'bg-primary text-white' : 'hover:bg-muted'}
            ${connectionType && selectedStep?.id !== step.id ? 'hover:ring-2 hover:ring-blue-500' : ''}
            ${connectionType && selectedStep?.id === step.id ? 'opacity-50' : ''}
            border border-gray-200 dark:border-gray-700
          `}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => handleStepClick(step)}
        >
          <div className="flex-1 flex items-center gap-2">
            <Grip className="h-4 w-4 text-muted-foreground cursor-move" />
            <span className="font-medium">{step.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                setAddingSubStepFor(step.id);
              }}
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStep(step.id);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {addingSubStepFor === step.id && (
          <div className="flex gap-2 mt-2" style={{ marginLeft: `${(level + 1) * 20}px` }}>
            <Input
              placeholder="Enter sub-step name..."
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep(step.id)}
              className="h-8"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => handleAddStep(step.id)}
              disabled={!newStepName.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingSubStepFor(null);
                setNewStepName('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}
        {renderStepHierarchy(steps, step.id, level + 1)}
      </div>
    ));
  };

  return (
    <div className="flex h-[calc(100vh-24rem)] gap-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {/* Left Panel - Steps List */}
      <div className="w-1/3 border rounded-xl p-6 bg-background overflow-y-auto">
        <div className="space-y-4">
          <div className="flex gap-4 sticky top-0 bg-background pb-4 border-b">
            <Input
              placeholder="Enter step name..."
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
              className="h-10"
            />
            <Button
              onClick={() => handleAddStep()}
              disabled={!newStepName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
          <div className="space-y-1 mt-4">
            {steps.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No steps added yet. Add your first step above.
              </div>
            ) : (
              renderStepHierarchy(steps)
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
                  placeholder="Step description..."
                  value={selectedStep.description || ''}
                  onChange={(e) => onUpdateStep(selectedStep.id, { description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Expected Response</label>
                <Input
                  placeholder="e.g., 200 OK, Success message..."
                  value={selectedStep.expectedResponse || ''}
                  onChange={(e) => onUpdateStep(selectedStep.id, { expectedResponse: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connections</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleConnectionStart(selectedStep, 'success')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Add Success Path
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleConnectionStart(selectedStep, 'failure')}
                >
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  Add Failure Path
                </Button>
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