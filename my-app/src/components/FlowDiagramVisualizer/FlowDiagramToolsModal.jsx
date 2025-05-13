/**
 * FlowDiagramToolsModal.jsx
 * 
 * This modal provides access to analysis tools for the flow diagram,
 * such as Pathfinding and Generate Flow Diagram.
 */
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Route, GitBranch, X } from 'lucide-react'; // Updated icons
import { useState, useEffect } from 'react';

// Root Element Selection Modal Component
const RootElementSelectionModal = ({ 
  isOpen, 
  onClose, 
  rootElements, 
  selectedRootElement, 
  setSelectedRootElement, 
  onGenerateFlowDiagram 
}) => {
  const handleGenerateFlow = () => {
    if (selectedRootElement) {
      onGenerateFlowDiagram();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Generate Flow Diagram</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
            Select a root element to start your flow diagram.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Select Root Element</h4>
          
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            {rootElements && rootElements.length > 0 ? (
              <div className="p-1">
                {rootElements.map(element => (
                  <div 
                    key={element.id} 
                    className={`p-2 cursor-pointer rounded-md transition-colors ${
                      selectedRootElement?.id === element.id 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => setSelectedRootElement(element)}
                  >
                    {element.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                No root elements found. Add a root step first.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button
            onClick={handleGenerateFlow}
            disabled={!selectedRootElement}
            className="text-sm py-1.5 bg-purple-600 hover:bg-purple-500 text-white"
          >
            Generate Diagram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

RootElementSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rootElements: PropTypes.array,
  selectedRootElement: PropTypes.object,
  setSelectedRootElement: PropTypes.func.isRequired,
  onGenerateFlowDiagram: PropTypes.func.isRequired
};

// Main Analysis Tools Modal Component
const FlowDiagramToolsModal = ({ 
  isOpen, 
  onClose, 
  onFindPath,
  // Props for Generate Flow Diagram
  rootElements,
  selectedRootElement,
  setSelectedRootElement,
  onGenerateFlowDiagram
}) => {
  // State to track if the root element selection modal is open
  const [showRootElementModal, setShowRootElementModal] = useState(false);
  // State to track if we should open the generate modal
  const [shouldOpenGenerateModal, setShouldOpenGenerateModal] = useState(false);
  
  // Effect to handle opening the generate modal after the analysis modal closes
  useEffect(() => {
    if (!isOpen && shouldOpenGenerateModal) {
      // Open the generate modal on the next tick after this modal is fully closed
      setTimeout(() => {
        setShowRootElementModal(true);
        setShouldOpenGenerateModal(false);
      }, 100);
    }
  }, [isOpen, shouldOpenGenerateModal]);
  
  // Handler functions to call the respective tool function and close the modal
  const handleSelectTool = (toolFunction) => {
    if (toolFunction) {
      toolFunction(); // Execute the passed function (e.g., onFindPath)
    }
    onClose();      // Close this modal
  };

  // Handler for opening the Generate Flow Diagram modal
  const handleOpenGenerateModal = () => {
    setShouldOpenGenerateModal(true);
    onClose(); // Close the current modal first
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analysis Tools</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
              Select a tool to analyze or interact with the flow diagram.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
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

            {/* Generate Flow Diagram Tool Option */}
            <div 
              className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 flex items-start gap-4"
              onClick={handleOpenGenerateModal}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenGenerateModal(); }}
            >
              <GitBranch className="w-8 h-8 text-purple-600 dark:text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Generate Flow Diagram</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Automatically generate a flow diagram from a selected root element.
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

      {/* Separate Modal for Root Element Selection */}
      <RootElementSelectionModal 
        isOpen={showRootElementModal}
        onClose={() => setShowRootElementModal(false)}
        rootElements={rootElements}
        selectedRootElement={selectedRootElement}
        setSelectedRootElement={setSelectedRootElement}
        onGenerateFlowDiagram={onGenerateFlowDiagram}
      />
    </>
  );
};

// PropTypes for type checking
FlowDiagramToolsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFindPath: PropTypes.func.isRequired,
  // Props for Generate Flow Diagram
  rootElements: PropTypes.array,
  selectedRootElement: PropTypes.object,
  setSelectedRootElement: PropTypes.func.isRequired,
  onGenerateFlowDiagram: PropTypes.func.isRequired
};

export default FlowDiagramToolsModal; 