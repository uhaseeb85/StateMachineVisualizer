import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

/**
 * UnconnectedStepsModal
 * Modal to display steps with no incoming or outgoing connections.
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Array} props.steps - All steps in the flow
 * @param {Array} props.connections - All connections in the flow
 */
const UnconnectedStepsModal = ({ isOpen, onClose, steps, connections }) => {
  // For each step, check if it is missing outgoing success and/or failure connections
  const unconnectedSteps = steps
    .map(step => {
      const hasSuccess = connections.some(conn => conn.fromStepId === step.id && conn.type === 'success');
      const hasFailure = connections.some(conn => conn.fromStepId === step.id && conn.type === 'failure');
      let status = '';
      if (!hasSuccess && !hasFailure) {
        status = 'No Success or Failure outgoing connections';
      } else if (!hasSuccess) {
        status = 'No Success outgoing connection';
      } else if (!hasFailure) {
        status = 'No Failure outgoing connection';
      }
      return { ...step, status, show: !hasSuccess || !hasFailure };
    })
    .filter(step => step.show);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <X className="h-5 w-5 text-pink-600" />
            Unconnected Steps
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {unconnectedSteps.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center">All steps are connected.</div>
          ) : (
            <ul className="space-y-2">
              {unconnectedSteps.map(step => (
                <li key={step.id} className="border rounded p-2 bg-gray-50 dark:bg-gray-800">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {step.name ? step.name : step.id}
                  </div>
                  {step.status && (
                    <div className="text-xs text-gray-500 mt-1">{step.status}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-pink-600 hover:bg-pink-700 text-white">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

UnconnectedStepsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  steps: PropTypes.array.isRequired,
  connections: PropTypes.array.isRequired,
};

export default UnconnectedStepsModal; 