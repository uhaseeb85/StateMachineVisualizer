/**
 * TopActionBar Component
 * 
 * A navigation and action bar component that provides quick access to core functionality
 * of the State Machine Visualizer. It includes controls for:
 * - Theme toggling (dark/light mode)
 * - Getting started tour
 * - Save/Export/Import operations
 * - Tool access (Pathfinder, Simulation)
 * - Clear data functionality
 * 
 * The component is designed to be responsive and provides visual feedback
 * through hover states and transitions.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Save, FileSpreadsheet, Play, Moon, Sun, HelpCircle, Route, Search, SwitchCamera, Trash2, Scissors, Settings } from 'lucide-react';
import GraphToolsModal from './GraphToolsModal';

const TopActionBar = ({ 
  isDarkMode, 
  toggleTheme, 
  onSave, 
  onExcelImport,
  onSimulate,
  onFindPaths,
  startTour,
  onExportCSV,
  onChangeMode,
  onClearData,
  onSplitGraph
}) => {

  // State for controlling the confirmation dialog
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  // State for controlling the Graph Tools modal
  const [showGraphToolsModal, setShowGraphToolsModal] = useState(false);

  // Handle clear data button click
  const handleClearDataClick = () => {
    setShowClearConfirmation(true);
  };

  // Handle confirmation dialog
  const handleConfirmClear = () => {
    onClearData();
    setShowClearConfirmation(false);
  };

  // Handle opening the Graph Tools modal
  const handleOpenGraphTools = () => {
    setShowGraphToolsModal(true);
  };

  // Handle closing the Graph Tools modal
  const handleCloseGraphTools = () => {
    setShowGraphToolsModal(false);
  };

  return (
    <div className="mb-8 p-6 
                    bg-gray-100 dark:bg-gray-900
                    border-b border-gray-200 dark:border-gray-700
                    shadow-lg">
      <div className="flex flex-wrap items-center justify-between">
        {/* Left Section: Theme, Tour, and Core Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <Button
            onClick={toggleTheme}
            title="Toggle between light and dark mode"
            variant="ghost"
            className="theme-toggle w-10 h-10 p-0 text-gray-900 
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Getting Started Button - Initiates the guided tour */}
          <Button
            onClick={startTour}
            title="Get a guided tour of all features and how to use them"
            className="getting-started-button bg-gray-900 text-white text-sm
                     dark:bg-gray-800 dark:text-gray-100
                     hover:bg-blue-600 hover:scale-105
                     dark:hover:bg-blue-600
                     transform transition-all duration-200 ease-in-out
                     border border-gray-800 dark:border-gray-700
                     hover:border-blue-500 dark:hover:border-blue-500
                     flex items-center gap-2 px-3 py-1.5 rounded-md"
          >
            <HelpCircle className="w-4 h-4" />
            Getting Started
          </Button>

          {/* Visual Separator */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Core Actions Group */}
          <div className="flex flex-wrap gap-4">
            {/* Save Button */}
            <Button 
              onClick={onSave}
              title="Save your current state machine configuration"
              className="save-action-button bg-gray-900 text-white text-sm
                       dark:bg-gray-800 dark:text-gray-100
                       hover:bg-blue-600 hover:scale-105
                       dark:hover:bg-blue-600
                       transform transition-all duration-200 ease-in-out
                       border border-gray-800 dark:border-gray-700
                       hover:border-blue-500 dark:hover:border-blue-500
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>

            {/* Import/Export Section */}
            <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
              {/* Export CSV Button */}
              <Button 
                onClick={onExportCSV}
                title="Export your state machine as a CSV file"
                className="export-csv-button bg-gray-900 text-white text-sm
                         dark:bg-gray-800 dark:text-gray-100
                         hover:bg-blue-600 hover:scale-105
                         dark:hover:bg-blue-600
                         transform transition-all duration-200 ease-in-out
                         border border-gray-800 dark:border-gray-700
                         hover:border-blue-500 dark:hover:border-blue-500
                         flex items-center gap-2 px-3 py-1.5 rounded-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </Button>

              {/* Import CSV Button with Hidden File Input */}
              <div className="relative">
                <Button 
                  onClick={() => document.getElementById('excel-import').click()}
                  title="Import states and rules from a CSV file (Excel format)"
                  className="excel-import-button bg-gray-900 text-white text-sm
                           dark:bg-gray-800 dark:text-gray-100
                           hover:bg-blue-600 hover:scale-105
                           dark:hover:bg-blue-600
                           transform transition-all duration-200 ease-in-out
                           border border-gray-800 dark:border-gray-700
                           hover:border-blue-500 dark:hover:border-blue-500
                           flex items-center gap-2 px-3 py-1.5 rounded-md"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import CSV
                </Button>
                <input
                  type="file"
                  id="excel-import"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={onExcelImport}
                  onClick={(e) => e.target.value = null}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Tools and Analysis */}
        <div className="flex items-center gap-4">

             {/* Clear Data Button */}
             <Button 
              onClick={handleClearDataClick}
              title="Clear all states and rules"
              className="clear-data-button bg-gray-900 text-white text-sm
                       dark:bg-gray-800 dark:text-gray-100
                       hover:bg-red-600 hover:scale-105
                       dark:hover:bg-red-600
                       transform transition-all duration-200 ease-in-out
                       border border-gray-800 dark:border-gray-700
                       hover:border-red-500 dark:hover:border-red-500
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
              Clear Data
            </Button>

          {/* Visual Separator */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Tools Group */}
          <div className="flex gap-4">
            {/* NEW Graph Tools Button */}
            <Button
              onClick={handleOpenGraphTools}
              title="Access graph analysis and interaction tools"
              className="graph-tools-button bg-indigo-600 text-white text-sm
                       hover:bg-indigo-500 hover:scale-105
                       dark:bg-indigo-700 dark:hover:bg-indigo-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Settings className="w-4 h-4" />
              Graph Tools
            </Button>

            {/* Mode Switch Button */}
            <Button
              onClick={onChangeMode}
              title="Switch Visualization Mode"
              className="mode-switch-button bg-gray-900 text-white text-sm
                       hover:bg-gray-800 hover:scale-105
                       dark:bg-gray-800 dark:hover:bg-gray-700
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <SwitchCamera className="w-4 h-4" />
              Switch Mode
            </Button>

           
          </div>
        </div>
      </div>

      {/* Graph Tools Modal */}
      <GraphToolsModal
        isOpen={showGraphToolsModal}
        onClose={handleCloseGraphTools}
        onFindPaths={onFindPaths}
        onSimulate={onSimulate}
        onSplitGraph={onSplitGraph}
      />

      {/* Clear Data Confirmation Dialog */}
      {showClearConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Clear All Data
            </h2>
            
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to clear all states and rules? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowClearConfirmation(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClear}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 

TopActionBar.propTypes = {
  // Theme related props
  isDarkMode: PropTypes.bool.isRequired,
  toggleTheme: PropTypes.func.isRequired,
  
  // Core action props
  onSave: PropTypes.func.isRequired,
  onExcelImport: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onClearData: PropTypes.func.isRequired,
  
  // Tool action props
  onSimulate: PropTypes.func.isRequired,
  onFindPaths: PropTypes.func.isRequired,
  
  // Tour prop
  startTour: PropTypes.func.isRequired,

  // Mode switch prop
  onChangeMode: PropTypes.func.isRequired,

  // Graph splitter prop
  onSplitGraph: PropTypes.func.isRequired
};

export default TopActionBar;
