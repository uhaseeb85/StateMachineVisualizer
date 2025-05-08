import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * FileHistoryDropdown - A dropdown component for displaying and selecting from file history
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentFileName - Currently active file name
 * @param {Array<string>} props.fileHistory - List of recently loaded files
 * @param {Function} props.onSelectFile - Function called when a file is selected from history
 * @param {Function} props.onFileExists - Function to check if a file exists
 * @param {Function} props.onRemoveFile - Function to remove a file from history
 * @param {Function} props.onClearHistory - Function to clear all file history
 * @returns {JSX.Element} - Rendered component
 */
const FileHistoryDropdown = ({
  currentFileName,
  fileHistory,
  onSelectFile,
  onFileExists,
  onRemoveFile,
  onClearHistory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Only add the event listener if the dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Handles selection of a file from the dropdown
   * @param {string} fileName - Name of the selected file
   */
  const handleSelect = (fileName) => {
    // Close the dropdown first
    setIsOpen(false);
    
    // Check if the file exists before loading
    if (!onFileExists(fileName)) {
      onRemoveFile(fileName);
      return;
    }
    
    // Load the selected file
    onSelectFile(fileName);
  };

  /**
   * Handles clearing the file history
   */
  const handleClearHistory = () => {
    // Confirm before clearing
    if (window.confirm('Are you sure you want to clear all file history?')) {
      onClearHistory();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Current file display and dropdown trigger */}
      <div 
        className="flex items-center p-2 border border-gray-800 rounded-md bg-gray-900 
                   dark:bg-gray-800 dark:border-gray-700
                   shadow-sm cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-700
                   transition duration-150 min-w-[200px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 overflow-hidden truncate mr-2 text-white dark:text-gray-100">
          <span className="text-gray-300 dark:text-gray-400 text-sm mr-1">File:</span>
          <span className="font-medium">{currentFileName}</span>
        </div>
        <svg 
          className="w-4 h-4 text-white dark:text-gray-300"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 origin-top-left rounded-md bg-gray-900 dark:bg-gray-800
                        shadow-lg ring-1 ring-gray-700 dark:ring-gray-600 z-50">
          <div className="py-1 max-h-60 overflow-auto" role="menu">
            <div className="px-3 py-2 text-xs font-semibold text-white dark:text-gray-200 border-b border-gray-700 dark:border-gray-600">
              Recent Files
            </div>
            
            {fileHistory.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-300 dark:text-gray-400 italic">
                No recent files
              </div>
            ) : (
              fileHistory.map((fileName) => (
                <button
                  key={fileName}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between
                            hover:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100
                            ${fileName === currentFileName ? 'bg-gray-700 dark:bg-gray-600 text-white dark:text-gray-200' : ''}`}
                  onClick={() => handleSelect(fileName)}
                  role="menuitem"
                >
                  <span className="truncate">{fileName}</span>
                  {fileName === currentFileName && (
                    <svg className="w-4 h-4 text-white dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
            
            {/* Clear history button */}
            <div className="border-t border-gray-700 dark:border-gray-600 mt-1">
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 dark:hover:bg-gray-700 hover:text-red-300 flex items-center"
                onClick={handleClearHistory}
                role="menuitem"
              >
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear File History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

FileHistoryDropdown.propTypes = {
  currentFileName: PropTypes.string.isRequired,
  fileHistory: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectFile: PropTypes.func.isRequired,
  onFileExists: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired
};

export default FileHistoryDropdown; 