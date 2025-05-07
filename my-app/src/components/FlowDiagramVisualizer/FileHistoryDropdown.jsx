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
 * @returns {JSX.Element} - Rendered component
 */
const FileHistoryDropdown = ({
  currentFileName,
  fileHistory,
  onSelectFile,
  onFileExists,
  onRemoveFile
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

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Current file display and dropdown trigger */}
      <div 
        className="flex items-center p-2 border border-blue-600 rounded-md bg-blue-600 
                   shadow-sm cursor-pointer hover:bg-blue-700
                   transition duration-150 min-w-[200px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 overflow-hidden truncate mr-2 text-white">
          <span className="text-blue-100 text-sm mr-1">File:</span>
          <span className="font-medium">{currentFileName}</span>
        </div>
        <svg 
          className="w-4 h-4 text-white"
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
        <div className="absolute left-0 mt-1 w-64 origin-top-left rounded-md bg-blue-600
                        shadow-lg ring-1 ring-blue-700 z-50">
          <div className="py-1 max-h-60 overflow-auto" role="menu">
            <div className="px-3 py-2 text-xs font-semibold text-white border-b border-blue-500">
              Recent Files
            </div>
            
            {fileHistory.length === 0 ? (
              <div className="px-4 py-2 text-sm text-blue-100 italic">
                No recent files
              </div>
            ) : (
              fileHistory.map((fileName) => (
                <button
                  key={fileName}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between
                            hover:bg-blue-700 text-white
                            ${fileName === currentFileName ? 'bg-blue-800 text-white' : ''}`}
                  onClick={() => handleSelect(fileName)}
                  role="menuitem"
                >
                  <span className="truncate">{fileName}</span>
                  {fileName === currentFileName && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
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
  onRemoveFile: PropTypes.func.isRequired
};

export default FileHistoryDropdown; 