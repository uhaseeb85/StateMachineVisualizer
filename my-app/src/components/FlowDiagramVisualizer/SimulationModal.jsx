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
  X,
  Camera,
  PanelLeftClose,
  PanelBottomClose
} from 'lucide-react';

const SimulationModal = ({ steps, connections, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [simulationPath, setSimulationPath] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);

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

  const handleExportImage = async () => {
    try {
      const element = document.querySelector('.simulation-content');
      if (!element) return;

      const defaultName = `flow-diagram-simulation-${new Date().toISOString().slice(0, 10)}`;
      const fileName = window.prompt('Enter file name:', defaultName);
      
      if (!fileName) return;
      
      const finalFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      
      // Create a canvas with the element's dimensions
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const scale = window.devicePixelRatio;
      
      canvas.width = element.offsetWidth * scale;
      canvas.height = element.offsetHeight * scale;
      
      // Scale the context to ensure proper resolution
      context.scale(scale, scale);
      
      // Draw the element onto the canvas
      const elementHTML = element.outerHTML;
      const blob = new Blob([elementHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        context.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = finalFileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Error exporting simulation:', error);
      alert('Failed to export simulation image');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Flow Simulation</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVerticalLayout(!isVerticalLayout)}
                title={`Switch to ${isVerticalLayout ? 'horizontal' : 'vertical'} layout`}
              >
                {isVerticalLayout ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelBottomClose className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportImage}
                title="Export as image"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={simulationPath.length <= 1}
                title="Reset simulation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                title="Close simulation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Simulation Content */}
          <div className="simulation-content min-h-[400px] border rounded-lg p-6 bg-background">
            <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row flex-wrap'} 
                          gap-6 items-center ${isVerticalLayout ? 'justify-start' : 'justify-start'}`}>
              {simulationPath.map(({ step, status }, index) => (
                <div key={`${step.id}-${index}`} 
                     className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} items-center`}>
                  <Card className={`p-4 min-w-[200px] ${
                    status === 'current' ? 'ring-2 ring-blue-500' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(status)}
                      <span className="font-medium">{step.name}</span>
                    </div>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {step.description}
                      </p>
                    )}
                    {step.expectedResponse && (
                      <p className="text-sm text-muted-foreground">
                        Expected: {step.expectedResponse}
                      </p>
                    )}
                  </Card>
                  {index < simulationPath.length - 1 && (
                    <div className={`
                      ${isVerticalLayout ? 'h-8 w-px my-2' : 'w-8 h-px mx-2'}
                      bg-border
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Actions */}
          {currentStep && !isComplete && (
            <Card className="mt-6 p-4">
              <h3 className="font-medium mb-4">Select Path:</h3>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleChoice('success')}
                  className="flex-1"
                  variant="outline"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Success Path
                </Button>
                <Button
                  onClick={() => handleChoice('failure')}
                  className="flex-1"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Failure Path
                </Button>
              </div>
            </Card>
          )}

          {/* Simulation Complete */}
          {isComplete && (
            <Card className="mt-6 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Simulation Complete</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    The flow has reached an end point.
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </Card>
          )}
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