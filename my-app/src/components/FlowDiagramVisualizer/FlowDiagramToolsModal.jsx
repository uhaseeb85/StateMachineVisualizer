/**
 * FlowDiagramToolsModal.jsx
 * 
 * This modal provides access to analysis tools for the flow diagram,
 * such as Simulation and Pathfinding.
 */
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Route, Play, X } from 'lucide-react'; // Import relevant icons

const FlowDiagramToolsModal = ({ 
  isOpen, 
  onClose, 
  onSimulate, 
  onFindPath 
}) => {
  
  // Handler functions to call the respective tool function and close the modal
  const handleSelectTool = (toolFunction) => {
    if (toolFunction) {
      toolFunction(); // Execute the passed function (e.g., onSimulate)
    }
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
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analysis Tools</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Select a tool to analyze or interact with the flow diagram.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
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
                Interactively step through the flow based on connections and conditions (if applicable).
              </p>
            </div>
          </div>

          {/* Pathfinder Tool Option */}
          <div 
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 flex items-start gap-4"
            onClick={() => handleSelectTool(onFindPath)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectTool(onFindPath); }}
          >
            <Route className="w-8 h-8 text-blue-600 dark:text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Pathfinder</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Find paths between selected steps in the flow diagram.
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
FlowDiagramToolsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSimulate: PropTypes.func.isRequired,
  onFindPath: PropTypes.func.isRequired,
};

export default FlowDiagramToolsModal; 