/**
 * ChangeLog Component
 * 
 * A modal component that displays a chronological history of changes made to the state machine.
 * Features include:
 * - Displaying timestamped change entries
 * - Exporting history to a text file
 * - Clearing history
 * - Responsive design with dark mode support
 * 
 * The component maintains a list of up to 2000 most recent actions,
 * providing users with a detailed audit trail of their modifications.
 */

import PropTypes from 'prop-types';
import { X, ArrowUpFromLine, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const ChangeLog = ({ changeLog, isOpen, onClose, setChangeLog }) => {
  // Early return if modal is not open
  if (!isOpen) return null;

  /**
   * Exports the change history to a text file
   * Creates a formatted text file with numbered entries and timestamps
   */
  const exportToFile = () => {
    // Format each log entry with number and timestamp
    const content = changeLog.map((entry, index) => 
      `${index + 1}. [${entry.timestamp}] ${entry.message}`
    ).join('\n');

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `state-machine-history-${new Date().toISOString().split('T')[0]}.txt`;
    
    // Programmatically click the link to start download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  /**
   * Resets the change history after user confirmation
   * Clears both state and localStorage
   */
  const resetHistory = () => {
    if (window.confirm('Are you sure you want to clear the local history? This cannot be undone.')) {
      localStorage.removeItem('changeLog');
      setChangeLog([]);
      toast.success('History cleared successfully');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Local History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Stores up to 2000 most recent actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <Button
              onClick={exportToFile}
              className="flex items-center gap-2"
              variant="outline"
              title="Export history to text file"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Export
            </Button>
            
            {/* Clear History Button */}
            <Button
              onClick={resetHistory}
              className="flex items-center gap-2"
              variant="outline"
              title="Clear all history"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
            
            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="h-8 w-8 p-0"
              title="Close history"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Change Log List */}
        <div className="flex-1 overflow-y-auto">
          {changeLog && changeLog.length > 0 ? (
            <ul className="space-y-2">
              {changeLog.map((entry, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md"
                >
                  {/* Timestamp */}
                  <span className="min-w-[180px] text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {entry.timestamp}
                  </span>
                  {/* Change Message */}
                  <span className="text-gray-900 dark:text-gray-100 flex-1">
                    {entry.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No changes recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

ChangeLog.propTypes = {
  // Array of change log entries
  changeLog: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired
  })).isRequired,
  // Modal visibility control
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // Change log state management
  setChangeLog: PropTypes.func.isRequired
};

export default ChangeLog;
