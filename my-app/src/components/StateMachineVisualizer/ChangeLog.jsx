import React from 'react';
import { X, ArrowUpFromLine, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ChangeLog({ changeLog, isOpen, onClose, setChangeLog }) {
  if (!isOpen) return null;

  const exportToFile = () => {
    const content = changeLog.map((entry, index) => 
      `${index + 1}. [${entry.timestamp}] ${entry.message}`
    ).join('\n');

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Local History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Stores up to 2000 most recent actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={exportToFile}
              className="flex items-center gap-2"
              variant="outline"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Export
            </Button>
            <Button
              onClick={resetHistory}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {changeLog && changeLog.length > 0 ? (
            <ul className="space-y-2">
              {changeLog.map((entry, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md"
                >
                  <span className="min-w-[180px] text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {entry.timestamp}
                  </span>
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
} 