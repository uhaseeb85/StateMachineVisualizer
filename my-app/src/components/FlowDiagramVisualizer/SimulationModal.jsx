import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  X
} from 'lucide-react';

const SimulationModal = ({ steps, connections, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [simulationPath, setSimulationPath] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Find the first step (one that has no incoming connections)
    const startStep = steps.find((step) =>
      !connections.some((conn) => conn.toStepId === step.id)
    );
    if (startStep) {
      setCurrentStep(startStep);
      setSimulationPath([{ step: startStep, status: 'current' }]);
    }
  }, [steps, connections]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleChoice = (type) => {
    const nextConnection = connections.find(
      (conn) => conn.fromStepId === currentStep.id && conn.type === type
    );

    // Update current step in path to show success/failure
    setSimulationPath((prev) =>
      prev.map((item) =>
        item.step.id === currentStep.id
          ? { ...item, status: type }
          : item
      )
    );

    if (nextConnection) {
      const nextStep = steps.find((s) => s.id === nextConnection.toStepId);
      setCurrentStep(nextStep);
      setSimulationPath((prev) => [
        ...prev,
        { step: nextStep, status: 'current' }
      ]);
    } else {
      setCurrentStep(null);
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    const startStep = steps.find((step) =>
      !connections.some((conn) => conn.toStepId === step.id)
    );
    if (startStep) {
      setCurrentStep(startStep);
      setSimulationPath([{ step: startStep, status: 'current' }]);
      setIsComplete(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'current':
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Flow Simulation</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Simulation Path */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Simulation Path:</h3>
            <div className="space-y-2">
              {simulationPath.map(({ step, status }, index) => (
                <div key={`${step.id}-${index}`} className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="font-medium">{step.name}</span>
                  {step.expectedResponse && (
                    <span className="text-sm text-muted-foreground">
                      ({step.expectedResponse})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step */}
          {currentStep && !isComplete && (
            <Card className="p-4 mb-4">
              <h3 className="font-medium mb-2">Current Step: {currentStep.name}</h3>
              {currentStep.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {currentStep.description}
                </p>
              )}
              {currentStep.expectedResponse && (
                <p className="text-sm mb-4">
                  Expected Response: {currentStep.expectedResponse}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleChoice('success')}
                  className="flex-1"
                  variant="outline"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Success
                </Button>
                <Button
                  onClick={() => handleChoice('failure')}
                  className="flex-1"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Failure
                </Button>
              </div>
            </Card>
          )}

          {/* Simulation Complete */}
          {isComplete && (
            <Card className="p-4 mb-4 bg-muted">
              <h3 className="font-medium mb-2">Simulation Complete</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The flow has reached an end point.
              </p>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

SimulationModal.propTypes = {
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
  onClose: PropTypes.func.isRequired,
};

export default SimulationModal; 