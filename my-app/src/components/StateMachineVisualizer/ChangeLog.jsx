import React from 'react';
import { X, Download, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ChangeLog({ changeLog, isOpen, onClose, setChangeLog }) {
  if (!isOpen) return null;

  const exportToFile = () => {
    // Create text content with timestamps
    const content = changeLog.map((log, index) => 
      `${index + 1}. ${log}`
    ).join('\n');

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `state-machine-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetHistory = () => {
    if (window.confirm('Are you sure you want to clear the local history? This cannot be undone.')) {
      setChangeLog([]);
      localStorage.removeItem('changeLog');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Local History</h2>
          <div className="flex gap-2 mr-[25px]">
            <Button
              onClick={exportToFile}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded-md flex items-center gap-2"
              disabled={!changeLog?.length}
              title="Export history to file"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={resetHistory}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-md flex items-center gap-2"
              disabled={!changeLog?.length}
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
        
        {changeLog && changeLog.length > 0 ? (
          <ul className="space-y-2">
            {changeLog.map((log, index) => (
              <li 
                key={index}
                className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md"
              >
                {index + 1}. {log}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No changes recorded yet.</p>
        )}
      </div>
    </div>
  );
} 