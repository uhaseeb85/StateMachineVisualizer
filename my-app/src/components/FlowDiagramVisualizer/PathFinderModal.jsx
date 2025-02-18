import { useState } from 'react';
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
  Search,
  X
} from 'lucide-react';

const PathFinderModal = ({ steps, connections, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [fromStep, setFromStep] = useState(null);
  const [toStep, setToStep] = useState(null);
  const [paths, setPaths] = useState([]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const findPaths = () => {
    if (!fromStep || !toStep) return;

    const visited = new Set();
    const currentPath = [];
    const allPaths = [];

    const dfs = (currentStepId) => {
      if (visited.has(currentStepId)) return;
      if (currentStepId === toStep.id) {
        allPaths.push([...currentPath]);
        return;
      }

      visited.add(currentStepId);
      currentPath.push(currentStepId);

      const outgoingConnections = connections.filter(
        (conn) => conn.fromStepId === currentStepId
      );

      for (const conn of outgoingConnections) {
        dfs(conn.toStepId);
      }

      visited.delete(currentStepId);
      currentPath.pop();
    };

    dfs(fromStep.id);

    // Convert paths of IDs to paths of steps with connection types
    const detailedPaths = allPaths.map(path => {
      const detailedPath = [];
      for (let i = 0; i < path.length - 1; i++) {
        const currentStepId = path[i];
        const nextStepId = path[i + 1];
        const connection = connections.find(
          conn => conn.fromStepId === currentStepId && conn.toStepId === nextStepId
        );
        const step = steps.find(s => s.id === currentStepId);
        detailedPath.push({
          step,
          type: connection.type
        });
      }
      // Add the final step
      detailedPath.push({
        step: steps.find(s => s.id === path[path.length - 1]),
        type: 'end'
      });
      return detailedPath;
    });

    setPaths(detailedPaths);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Find Path Between Steps</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Step Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-2">From Step:</h3>
              <div className="space-y-2">
                {steps.map((step) => (
                  <Card
                    key={`from-${step.id}`}
                    className={`p-2 cursor-pointer hover:shadow-md transition-shadow ${
                      fromStep?.id === step.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setFromStep(step);
                      setPaths([]);
                    }}
                  >
                    {step.name}
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">To Step:</h3>
              <div className="space-y-2">
                {steps.map((step) => (
                  <Card
                    key={`to-${step.id}`}
                    className={`p-2 cursor-pointer hover:shadow-md transition-shadow ${
                      toStep?.id === step.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setToStep(step);
                      setPaths([]);
                    }}
                  >
                    {step.name}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Search Button */}
          <Button
            onClick={findPaths}
            className="w-full mb-4"
            disabled={!fromStep || !toStep}
          >
            <Search className="h-4 w-4 mr-2" />
            Find Paths
          </Button>

          {/* Results */}
          {paths.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Found Paths:</h3>
              <div className="space-y-4">
                {paths.map((path, pathIndex) => (
                  <Card key={pathIndex} className="p-4">
                    <div className="space-y-2">
                      {path.map(({ step, type }, stepIndex) => (
                        <div
                          key={`${pathIndex}-${step.id}`}
                          className="flex items-center gap-2"
                        >
                          {stepIndex > 0 && <ArrowRight className="h-4 w-4" />}
                          <span className="font-medium">{step.name}</span>
                          {type !== 'end' && getStatusIcon(type)}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {paths.length === 0 && fromStep && toStep && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-muted-foreground">
                No paths found between selected steps.
              </p>
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

PathFinderModal.propTypes = {
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

export default PathFinderModal; 