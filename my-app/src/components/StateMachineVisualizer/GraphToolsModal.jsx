/**
 * GraphToolsModal.jsx
 * 
 * This modal provides a central access point for various graph analysis and interaction tools
 * within the State Machine Visualizer. It presents options like Pathfinder, Simulation, and Graph Splitter.
 */
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Route, Play, Scissors, X, GitCompare } from 'lucide-react'; // Import GitCompare icon for the compare feature

const GraphToolsModal = ({ 
  isOpen, 
  onClose, 
  onFindPaths, 
  onSimulate, 
  onSplitGraph,
  onCompareStateMachines
}) => {
  
  // Handler functions to call the respective tool function and close the modal
  const handleSelectTool = (toolFunction) => {
    toolFunction(); // Execute the passed function (e.g., onFindPaths)
    onClose();      // Close this modal
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Graph Tools</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Select a tool to analyze or interact with your state machine graph.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          {/* Pathfinder Tool Option */}
          <div 
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 flex items-start gap-4"
            onClick={() => handleSelectTool(onFindPaths)}
            role="button" // Add role for accessibility
            tabIndex={0} // Make it focusable
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTool(onFindPaths); }} // Keyboard accessibility
          >
            <Route className="w-8 h-8 text-blue-600 dark:text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Pathfinder</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Find all possible paths between any two states in your state machine. Helps visualize sequences of transitions.
              </p>
            </div>
          </div>

          {/* Simulation Tool Option */}
          <div 
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 flex items-start gap-4"
            onClick={() => handleSelectTool(onSimulate)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTool(onSimulate); }}
          >
            <Play className="w-8 h-8 text-green-600 dark:text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Simulation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Interactively step through state transitions based on defined rules. Useful for testing and debugging logic.
              </p>
            </div>
          </div>

          {/* Graph Splitter Tool Option */}
          <div 
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 flex items-start gap-4"
            onClick={() => handleSelectTool(onSplitGraph)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTool(onSplitGraph); }}
          >
            <Scissors className="w-8 h-8 text-purple-600 dark:text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Graph Splitter</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Split large or complex graphs into smaller, more manageable subgraphs while preserving connectivity information.
              </p>
            </div>
          </div>
          
          {/* State Machine Comparison Tool Option */}
          <div 
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 flex items-start gap-4"
            onClick={() => handleSelectTool(onCompareStateMachines)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTool(onCompareStateMachines); }}
          >
            <GitCompare className="w-8 h-8 text-amber-600 dark:text-amber-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">State Machine Comparison</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Compare two state machines to identify differences in states, rules, and transitions. Helpful for reviewing changes.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// PropTypes for type checking
GraphToolsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFindPaths: PropTypes.func.isRequired,
  onSimulate: PropTypes.func.isRequired,
  onSplitGraph: PropTypes.func.isRequired,
  onCompareStateMachines: PropTypes.func.isRequired
};

export default GraphToolsModal; 