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
  PanelBottomClose,
  Undo2
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

      // Check if the next step has any outgoing connections
      const hasOutgoingConnections = connections.some(
        conn => conn.fromStepId === nextStep.id
      );

      // If no outgoing connections, mark as complete and add END element
      if (!hasOutgoingConnections) {
        setCurrentStep(null);
        setIsComplete(true);
        setSimulationPath(prev => [
          ...prev,
          { 
            step: { 
              id: 'end', 
              name: 'END',
              description: 'Simulation complete'
            }, 
            status: 'end' 
          }
        ]);
      }
    } else {
      setCurrentStep(null);
      setIsComplete(true);
      setSimulationPath(prev => [
        ...prev,
        { 
          step: { 
            id: 'end', 
            name: 'END',
            description: 'Simulation complete'
          }, 
          status: 'end' 
        }
      ]);
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

  const handleUndo = () => {
    if (simulationPath.length <= 1) return;
    
    const newPath = simulationPath.slice(0, -1);
    const lastItem = newPath[newPath.length - 1];
    
    // Update the last item's status to 'current'
    newPath[newPath.length - 1] = { ...lastItem, status: 'current' };
    
    setCurrentStep(lastItem.step);
    setSimulationPath(newPath);
    setIsComplete(false);
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
        return <CheckCircle2 className="h-4 w-4 text-green-500/70" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500/70" />;
      case 'current':
        return <ArrowRight className="h-4 w-4 text-blue-500/70" />;
      case 'end':
        return <X className="h-4 w-4 text-gray-500/70" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Flow Simulation</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVerticalLayout(!isVerticalLayout)}
                title={`Switch to ${isVerticalLayout ? 'horizontal' : 'vertical'} layout`}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
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
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={simulationPath.length <= 1}
                title="Undo last step"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={simulationPath.length <= 1}
                title="Reset simulation"
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                title="Close simulation"
                className="hover:bg-red-50 dark:hover:bg-red-900/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Simulation Content */}
          <div className="simulation-content h-[calc(90vh-8rem)] border rounded-lg p-6 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
            <div className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row flex-wrap'} 
                          gap-6 items-center ${isVerticalLayout ? 'justify-center' : 'justify-start'}`}>
              {simulationPath.map(({ step, status }, index) => (
                <div key={`${step.id}-${index}`} 
                     className={`flex ${isVerticalLayout ? 'flex-col' : 'flex-row'} items-center`}>
                  <div className="relative">
                    <Card className={`p-4 min-w-[200px] rounded-lg ${
                      status === 'current' ? 'ring-1 ring-blue-300 bg-blue-50 dark:bg-blue-900/30' : 
                      status === 'success' ? 'bg-green-50 dark:bg-green-900/30' :
                      status === 'failure' ? 'bg-red-50 dark:bg-red-900/30' :
                      status === 'end' ? 'bg-gray-50 dark:bg-gray-800' :
                      'bg-gray-50 dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center gap-2 justify-center">
                        {getStatusIcon(status)}
                        <span className="font-medium text-gray-700 dark:text-gray-200">{step.name}</span>
                      </div>
                      {step.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                          {step.description}
                        </p>
                      )}
                    </Card>

                    {/* Path Selection Buttons */}
                    {status === 'current' && !isComplete && (
                      <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleChoice('success')}
                          className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Success
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleChoice('failure')}
                          className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Failure
                        </Button>
                      </div>
                    )}
                  </div>

                  {index < simulationPath.length - 1 && (
                    <div className={`
                      ${isVerticalLayout ? 'h-16 w-px my-2' : 'w-8 h-px mx-2'}
                      bg-gray-200 dark:bg-gray-700
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Complete */}
          {isComplete && (
            <Card className="mt-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-200">Simulation Complete</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    The flow has reached an end point.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
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