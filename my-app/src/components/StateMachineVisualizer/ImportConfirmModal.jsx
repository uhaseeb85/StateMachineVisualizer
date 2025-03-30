/**
 * ImportConfirmModal.jsx
 * 
 * A modal dialog that appears when importing a CSV/Excel file while an existing graph is present
 * or when importing a file with the same name as a previously imported file.
 * Asks the user if they want to replace the current graph or display them side by side.
 */

import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { X, Replace, Layers, AlertTriangle } from 'lucide-react';

const ImportConfirmModal = ({ 
  isOpen, 
  onClose, 
  onReplace, 
  onDisplayAlongside, 
  importFileName,
  isDuplicateName = false
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isDuplicateName ? 'Duplicate File Name' : 'Import Options'}
          </h2>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Modal Content */}
        <div className="px-6 py-6">
          {isDuplicateName ? (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
                You're importing a file named <span className="font-semibold">{importFileName}</span> which 
                has the same name as a previously imported file. What would you like to do?
              </p>
            </>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
              You already have a graph loaded. What would you like to do with 
              <span className="font-semibold"> {importFileName}</span>?
            </p>
          )}
          
          <div className="grid grid-cols-2 gap-6">
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3 border-2 hover:border-red-500 dark:hover:border-red-400"
              onClick={onReplace}
            >
              <Replace className="h-12 w-12 mb-2 text-red-500" />
              <span className="font-medium text-center">Replace Current Graph</span>
            </Button>
            
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3 border-2 hover:border-blue-500 dark:hover:border-blue-400"
              onClick={onDisplayAlongside}
            >
              <Layers className="h-12 w-12 mb-2 text-blue-500" />
              <span className="font-medium text-center">Display Side by Side</span>
            </Button>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button 
            variant="ghost"
            onClick={onClose}
            className="min-w-[80px]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

ImportConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onReplace: PropTypes.func.isRequired,
  onDisplayAlongside: PropTypes.func.isRequired,
  importFileName: PropTypes.string,
  isDuplicateName: PropTypes.bool
};

export default ImportConfirmModal; 