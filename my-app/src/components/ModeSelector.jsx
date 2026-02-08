import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ModeSelector = ({ onSelect, currentMode }) => {
  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Select Visualization Mode</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect('stateMachine')}>
          <h2 className="text-2xl font-semibold mb-4">State Machine Visualizer</h2>
          <p className="text-muted-foreground mb-4">
            Create and visualize state machines with states, rules, and transitions.
            Perfect for modeling complex state-based systems.
          </p>
          <Button 
            variant={currentMode === 'stateMachine' ? 'default' : 'outline'}
            className="w-full"
          >
            Select State Machine Mode
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect('flowDiagram')}>
          <h2 className="text-2xl font-semibold mb-4">API Flow Diagram</h2>
          <p className="text-muted-foreground mb-4">
            Design API flow diagrams with success and failure paths.
            Ideal for documenting API workflows and processes.
          </p>
          <Button 
            variant={currentMode === 'flowDiagram' ? 'default' : 'outline'}
            className="w-full"
          >
            Select Flow Diagram Mode
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect('htmlReports')}>
          <h2 className="text-2xl font-semibold mb-4">HTML Reports</h2>
          <p className="text-muted-foreground mb-4">
            View stored HTML metrics dashboards and application reports.
            Drop files into the reports folder to publish them.
          </p>
          <Button 
            variant={currentMode === 'htmlReports' ? 'default' : 'outline'}
            className="w-full"
          >
            Select HTML Reports Mode
          </Button>
        </Card>
      </div>
    </div>
  );
};

ModeSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  currentMode: PropTypes.string
};

export default ModeSelector; 