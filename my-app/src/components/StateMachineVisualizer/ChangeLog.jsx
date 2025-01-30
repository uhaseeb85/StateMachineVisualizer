import React from 'react';
import { X } from 'lucide-react';

export default function ChangeLog({ changeLog, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Local History</h2>
        
        {changeLog && changeLog.length > 0 ? (
          <ul className="space-y-2">
            {changeLog.map((log, index) => (
              <li 
                key={index}
                className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md"
              >
                {log}
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