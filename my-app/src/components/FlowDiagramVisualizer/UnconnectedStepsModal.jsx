import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * UnconnectedStepsModal
 * Modal to display steps missing outgoing success/failure connections, with export to Excel.
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
      // Find parent step
      let parentStep = null;
      if (step.parentId) {
        parentStep = steps.find(s => s.id === step.parentId);
      }
      return { ...step, status, show: !hasSuccess || !hasFailure, parentStep };
    })
    .filter(step => step.show);

  // Export to Excel handler using xlsx
  const handleExportExcel = () => {
    // Prepare data for xlsx
    const data = [
      ['Step Name', 'Description', 'Parent Step', 'Status'], // Header row
      ...unconnectedSteps.map(step => [
        step.name || step.id,
        step.description || '',
        step.parentStep ? (step.parentStep.name || step.parentStep.id) : '',
        step.status
      ])
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Missing Connections');
    
    // Generate and download file
    XLSX.writeFile(workbook, 'missing_connections.xlsx');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-[90vw] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <X className="h-5 w-5 text-pink-600" />
            Missing Connections
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {unconnectedSteps.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center">All steps have both outgoing connections.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left">Step Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Parent Step</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unconnectedSteps.map((step, idx) => (
                    <tr key={step.id} className={idx % 2 === 0 ? 'bg-gray-800/80' : 'bg-gray-700/80'}>
                      <td className="px-4 py-2 font-semibold text-white">{step.name ? step.name : step.id}</td>
                      <td className="px-4 py-2 text-gray-200">{step.description || '-'}</td>
                      <td className="px-4 py-2 text-blue-200">{step.parentStep ? (step.parentStep.name || step.parentStep.id) : '-'}</td>
                      <td className="px-4 py-2 text-yellow-200">{step.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="bg-pink-600 hover:bg-pink-700 text-white">Close</Button>
          {unconnectedSteps.length > 0 && (
            <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          )}
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
