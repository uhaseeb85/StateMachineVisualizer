/**
 * Modals Container Component
 * Manages rendering of all modals in one place
 * 
 * SOLID Principle: Single Responsibility - Only renders modals
 */
import PropTypes from 'prop-types';
import { useFlowDiagramContext } from '../context/FlowDiagramContext';
import SimulationModal from '../SimulationModal';
import PathFinderModal from '../PathFinderModal';
import UnconnectedStepsModal from '../UnconnectedStepsModal';
import AllAssumptionsQuestionsModal from '../AllAssumptionsQuestionsModal';
import ActionHistoryModal from '../ActionHistoryModal';
import FlowDiagramComparer from '../FlowDiagramComparer';
import StepDictionaryModal from '../StepDictionaryModal';

/**
 * Container for all modal dialogs
 * @param {Object} props
 * @param {Object} props.modals - Modal manager object from useModalManager
 * @param {Object} props.exportDialog - Export dialog state and handlers
 */
const ModalsContainer = ({ modals, exportDialog }) => {
  const context = useFlowDiagramContext();

  return (
    <>
      {/* Simulation Modal */}
      {modals.isOpen('simulation') && (
        <SimulationModal
          steps={context.steps}
          connections={context.connections}
          onClose={() => modals.closeModal('simulation')}
          onAddStep={context.addStep}
          onUpdateStep={context.updateStep}
          onRemoveStep={context.removeStep}
          onAddConnection={context.addConnection}
          onRemoveConnection={context.removeConnection}
          dictionaryHook={context.dictionaryHook}
        />
      )}

      {/* Path Finder Modal */}
      {modals.isOpen('pathFinder') && (
        <PathFinderModal
          steps={context.steps}
          connections={context.connections}
          onClose={() => modals.closeModal('pathFinder')}
        />
      )}

      {/* Unconnected Steps Modal */}
      {modals.isOpen('unconnectedSteps') && (
        <UnconnectedStepsModal
          isOpen={modals.isOpen('unconnectedSteps')}
          onClose={() => modals.closeModal('unconnectedSteps')}
          steps={context.steps}
          connections={context.connections}
        />
      )}

      {/* All Assumptions & Questions Modal */}
      {modals.isOpen('assumptionsQuestions') && (
        <AllAssumptionsQuestionsModal
          isOpen={modals.isOpen('assumptionsQuestions')}
          onClose={() => modals.closeModal('assumptionsQuestions')}
          steps={context.steps}
        />
      )}

      {/* Action History Modal */}
      {modals.isOpen('actionHistory') && (
        <ActionHistoryModal
          isOpen={modals.isOpen('actionHistory')}
          onClose={() => modals.closeModal('actionHistory')}
          history={context.actionHistory}
          onExportToExcel={context.exportHistoryToExcel}
          onClearHistory={context.clearActionHistory}
        />
      )}

      {/* Flow Diagram Comparer Modal */}
      {modals.isOpen('comparer') && (
        <FlowDiagramComparer
          isOpen={modals.isOpen('comparer')}
          onClose={() => modals.closeModal('comparer')}
          steps={context.steps}
          connections={context.connections}
        />
      )}

      {/* Step Dictionary Modal */}
      {modals.isOpen('stepDictionary') && (
        <StepDictionaryModal
          isOpen={modals.isOpen('stepDictionary')}
          onClose={() => modals.closeModal('stepDictionary')}
          dictionaryHook={context.dictionaryHook}
          steps={context.steps}
          onUpdateStep={context.updateStep}
        />
      )}

      {/* Export Dialog */}
      {exportDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Export Flow Diagram
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter a name for the exported file:
            </p>
            <input
              type="text"
              value={exportDialog.fileName}
              onChange={(e) => exportDialog.setFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  exportDialog.confirm();
                } else if (e.key === 'Escape') {
                  exportDialog.close();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                       rounded-md bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-gray-100 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       mb-4"
              placeholder="flow_diagram"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={exportDialog.close}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 
                         hover:bg-gray-100 dark:hover:bg-gray-700 
                         rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={exportDialog.confirm}
                disabled={!exportDialog.fileName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md 
                         hover:bg-green-700 disabled:bg-gray-400 
                         disabled:cursor-not-allowed transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ModalsContainer.propTypes = {
  modals: PropTypes.object.isRequired,
  exportDialog: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    fileName: PropTypes.string.isRequired,
    setFileName: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
  }).isRequired,
};

export default ModalsContainer;
