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
  ChevronUp
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

  const toggleStepExpansion = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleAddStep = () => {
    if (newStepName.trim()) {
      const stepId = onAddStep({
        name: newStepName.trim(),
        description: '',
        expectedResponse: '',
      });
      setNewStepName('');
      setExpandedSteps(prev => ({
        ...prev,
        [stepId]: true
      }));
      toast.success('Step added successfully');
    }
  };

  const handleStepClick = (step) => {
    if (selectedStep && connectionType) {
      // Add connection if a different step is clicked
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
    toast.info(`Select a target step for ${type} path`);
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

  return (
    <div className="flex h-full">
      {/* Steps List */}
      <div className="w-80 border-r p-4 overflow-y-auto">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="New step name"
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddStep}
            disabled={!newStepName.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <Card
              key={step.id}
              className={`
                p-3 hover:shadow-md transition-all duration-200
                ${selectedStep?.id === step.id ? 'ring-2 ring-primary' : ''}
                ${connectionType ? 'cursor-pointer hover:bg-muted/50' : ''}
              `}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex items-start gap-2">
                <div className="mt-1 cursor-move">
                  <Grip className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium truncate">{step.name}</h3>
                      {step.description && !expandedSteps[step.id] && (
                        <p className="text-sm text-muted-foreground truncate">
                          {step.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepExpansion(step.id);
                        }}
                      >
                        {expandedSteps[step.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStep(step.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedSteps[step.id] && (
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Description"
                        value={step.description || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStep(step.id, { description: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm"
                      />
                      <Input
                        placeholder="Expected Response"
                        value={step.expectedResponse || ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStep(step.id, { expectedResponse: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionStart(step, 'success');
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Success
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionStart(step, 'failure');
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Failure
                    </Button>
                  </div>

                  {/* Show existing connections */}
                  {connections
                    .filter((conn) => conn.fromStepId === step.id)
                    .map((conn) => {
                      const targetStep = steps.find((s) => s.id === conn.toStepId);
                      return (
                        <div
                          key={`${conn.fromStepId}-${conn.toStepId}-${conn.type}`}
                          className="flex items-center gap-1 mt-1 text-sm text-muted-foreground"
                        >
                          <ArrowRight className="h-3 w-3" />
                          {conn.type === 'success' ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="truncate flex-1">{targetStep?.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveConnection(step.id, conn.toStepId, conn.type);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Connection Mode */}
      {connectionType && (
        <div className="flex-1 p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Select {connectionType === 'success' ? 'Success' : 'Failure'} Target
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStep(null);
                setConnectionType(null);
              }}
            >
              Cancel
            </Button>
          </div>
          <p className="text-muted-foreground mb-4">
            Click on a step to create a {connectionType} connection from "{selectedStep?.name}"
          </p>
        </div>
      )}
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