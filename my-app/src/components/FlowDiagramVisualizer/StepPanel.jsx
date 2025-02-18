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
  XCircle
} from 'lucide-react';

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

  const handleAddStep = () => {
    if (newStepName.trim()) {
      onAddStep({
        name: newStepName.trim(),
        description: '',
        expectedResponse: '',
      });
      setNewStepName('');
    }
  };

  const handleStepClick = (step) => {
    if (selectedStep && connectionType) {
      // Add connection if a different step is clicked
      if (selectedStep.id !== step.id) {
        onAddConnection(selectedStep.id, step.id, connectionType);
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
  };

  return (
    <div className="flex h-full">
      {/* Steps List */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="New step name"
            value={newStepName}
            onChange={(e) => setNewStepName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddStep}
            disabled={!newStepName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {steps.map((step) => (
            <Card
              key={step.id}
              className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                selectedStep?.id === step.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{step.name}</h3>
                  {step.description && (
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStep(step.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnectionStart(step, 'success');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Success
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
                  <XCircle className="h-4 w-4 mr-1" />
                  Failure
                </Button>
              </div>

              {/* Show existing connections */}
              <div className="mt-2 text-sm">
                {connections
                  .filter((conn) => conn.fromStepId === step.id)
                  .map((conn) => {
                    const targetStep = steps.find((s) => s.id === conn.toStepId);
                    return (
                      <div
                        key={`${conn.fromStepId}-${conn.toStepId}-${conn.type}`}
                        className="flex items-center gap-1 text-muted-foreground"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {conn.type === 'success' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        {targetStep?.name}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveConnection(step.id, conn.toStepId, conn.type);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Step Details */}
      {selectedStep && !connectionType && (
        <div className="flex-1 p-4">
          <h2 className="text-xl font-bold mb-4">Step Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={selectedStep.name}
                onChange={(e) =>
                  onUpdateStep(selectedStep.id, { name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={selectedStep.description}
                onChange={(e) =>
                  onUpdateStep(selectedStep.id, { description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Response</label>
              <Input
                value={selectedStep.expectedResponse}
                onChange={(e) =>
                  onUpdateStep(selectedStep.id, { expectedResponse: e.target.value })
                }
                placeholder="e.g., 200 OK, 404 Not Found"
              />
            </div>
          </div>
        </div>
      )}

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