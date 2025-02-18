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
  Settings
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

  return (
    <div className="flex h-full">
      <div className="w-full max-w-4xl mx-auto p-6">
        {connectionType && (
          <div className="sticky top-0 z-50 mb-4">
            <Card className="p-4 bg-blue-500/10 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500 text-white p-2 rounded-full">
                    {connectionType === 'success' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      Select {connectionType === 'success' ? 'Success' : 'Failure'} Target
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      From: {selectedStep?.name}
                    </p>
                  </div>
                </div>
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
            </Card>
          </div>
        )}

        {/* Add New Step Section */}
        <Card className="mb-8 p-6 bg-muted/50">
          <h2 className="text-lg font-semibold mb-4">Add New Step</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter step name..."
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                className="h-10"
              />
            </div>
            <Button
              onClick={handleAddStep}
              disabled={!newStepName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        </Card>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <Card
              key={step.id}
              className={`
                p-4 hover:shadow-md transition-all duration-200
                ${selectedStep?.id === step.id ? 'ring-2 ring-primary' : ''}
                ${connectionType && selectedStep?.id !== step.id ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''}
                ${connectionType && selectedStep?.id === step.id ? 'opacity-50' : ''}
              `}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 cursor-move">
                  <Grip className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{step.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepExpansion(step.id);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStep(step.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description Preview */}
                  {step.description && !expandedSteps[step.id] && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {step.description}
                    </p>
                  )}

                  {/* Expanded Content */}
                  {expandedSteps[step.id] && (
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Textarea
                          placeholder="Step description..."
                          value={step.description || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateStep(step.id, { description: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Expected Response</label>
                        <Input
                          placeholder="e.g., 200 OK, Success message..."
                          value={step.expectedResponse || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateStep(step.id, { expectedResponse: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Connections */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectionStart(step, 'success');
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Add Success Path
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectionStart(step, 'failure');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Add Failure Path
                      </Button>
                    </div>

                    {/* Existing Connections */}
                    {connections
                      .filter((conn) => conn.fromStepId === step.id)
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
              </div>
            </Card>
          ))}
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