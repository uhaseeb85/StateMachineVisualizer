import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
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

      // Set background color before capture
      const originalBg = element.style.background;
      element.style.background = getComputedStyle(element).backgroundColor;

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: window.devicePixelRatio,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      // Restore original background
      element.style.background = originalBg;

      // Create download link
      const link = document.createElement('a');
      link.download = finalFileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
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

  const getStepCardClasses = (status, isSubStep) => {
    let baseClasses = "p-3 min-w-[200px] rounded-lg ";
    
    // Status-based styling
    const statusClasses = status === 'current' ? 'ring-1 ring-blue-300 bg-blue-50 dark:bg-blue-900/30' : 
                         status === 'success' ? 'bg-green-50 dark:bg-green-900/30' :
                         status === 'failure' ? 'bg-red-50 dark:bg-red-900/30' :
                         status === 'end' ? 'bg-gray-50 dark:bg-gray-800' :
                         'bg-gray-50 dark:bg-gray-800';

    // Different styling for main steps and sub-steps
    const stepTypeClasses = isSubStep ? 
      'border-dashed bg-opacity-60 dark:bg-opacity-60' : 
      'border-solid bg-white dark:bg-gray-800 shadow-sm';

    return `${baseClasses} ${statusClasses} ${stepTypeClasses}`;
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
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Simulation Content */}
          <div className="simulation-content h-[calc(90vh-8rem)] border rounded-lg p-6 bg-gray-50/50 dark:bg-gray-900/50 overflow-auto">
            <div className="flex flex-col gap-6">
              {simulationPath.map(({ step, status }, index) => {
                // Find any sub-steps that follow this step
                const subSteps = simulationPath.slice(index + 1).filter(item => 
                  item.step.parentId === step.id
                );
                
                // Check if this is a sub-step
                const isSubStep = step.parentId;
                
                // Calculate the offset based on depth
                const mainStepOffset = index * 24; // Reduced from 32px to 24px
                const subStepOffset = isSubStep ? 40 : 0; // Reduced from 48px to 40px
                const totalOffset = mainStepOffset + subStepOffset;
                
                // Only render if this is a main step or if its parent was already rendered
                if (!isSubStep || simulationPath.some(item => item.step.id === step.parentId)) {
                  return (
                    <div key={`${step.id}-${index}`} 
                         className="relative flex flex-col"
                         style={{ marginLeft: `${totalOffset}px` }}>
                      <div className="relative flex flex-col items-start gap-2">
                        <div className="relative flex items-center">
                          {/* Vertical line from parent */}
                          {isSubStep && (
                            <div className="absolute -left-6 -top-3 h-6 border-l-2 border-gray-200 dark:border-gray-700" />
                          )}
                          
                          {/* Horizontal line to sub-step */}
                          {isSubStep && (
                            <div className="absolute -left-6 top-1/2 w-6 border-t-2 border-gray-200 dark:border-gray-700" />
                          )}

                          <Card className={`w-[240px] ${getStepCardClasses(status, isSubStep)}`}>
                            <div className="flex items-center gap-2 justify-center">
                              {getStatusIcon(status)}
                              <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                                {isSubStep ? (
                                  <>
                                    <span className="text-gray-500 dark:text-gray-400">{steps.find(s => s.id === step.parentId)?.name} → </span>
                                    {step.name}
                                  </>
                                ) : step.name}
                              </span>
                            </div>
                            {step.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                                {step.description}
                              </p>
                            )}
                          </Card>

                          {/* Straight line to next step */}
                          {index < simulationPath.length - 1 && !isSubStep && !simulationPath[index + 1].step.parentId && (
                            <div className="absolute -right-8 top-1/2 w-8 border-t-2 border-gray-200 dark:border-gray-700" />
                          )}
                        </div>

                        {/* Path Selection Buttons */}
                        {status === 'current' && !isComplete && (
                          <div className="flex gap-2 ml-8">
                            <Button
                              size="sm"
                              onClick={() => handleChoice('success')}
                              className="bg-green-100 hover:bg-green-200 text-green-700 border-green-200 text-xs h-6 px-2"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleChoice('failure')}
                              className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200 text-xs h-6 px-2"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Failure
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
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