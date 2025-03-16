/**
 * TopActionBar Component
 * 
 * A navigation and action bar component that provides quick access to core functionality
 * of the State Machine Visualizer. It includes controls for:
 * - Theme toggling (dark/light mode)
 * - Getting started tour
 * - Save/Export/Import operations
 * - Tool access (Pathfinder, Simulation, Log Analysis)
 * 
 * The component is designed to be responsive and provides visual feedback
 * through hover states and transitions.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Save, FileSpreadsheet, Play, Moon, Sun, HelpCircle, Route, Search, SwitchCamera } from 'lucide-react';
import LogAnalyzer from './LogAnalyzer';

const TopActionBar = ({ 
  isDarkMode, 
  toggleTheme, 
  onSave, 
  onExcelImport,
  onSimulate,
  onFindPaths,
  startTour,
  onExportCSV,
  onChangeMode
}) => {
  // State for controlling the LogAnalyzer modal visibility
  const [showLogAnalyzer, setShowLogAnalyzer] = useState(false);

  return (
    <div className="mb-8 p-6 
                    bg-gray-800/50 backdrop-blur-sm
                    border border-gray-700
                    rounded-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between">
        {/* Left Section: Theme, Tour, and Core Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <Button
            onClick={toggleTheme}
            title="Toggle between light and dark mode"
            variant="ghost"
            className="theme-toggle w-10 h-10 p-0 text-gray-300 
                     hover:bg-gray-700 hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Tour Button */}
          <Button
            onClick={startTour}
            title="Start guided tour"
            variant="ghost"
            className="w-10 h-10 p-0 text-gray-300 
                     hover:bg-gray-700 hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Save Button */}
          <Button
            onClick={onSave}
            title="Save flow to browser storage"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Save className="h-5 w-5 mr-2" />
            Save
          </Button>

          {/* Import Button */}
          <div className="relative">
            <input
              type="file"
              id="excel-import"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={onExcelImport}
              accept=".xlsx,.xls,.csv"
            />
            <Button
              title="Import from Excel/CSV"
              variant="ghost"
              className="text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Import
            </Button>
          </div>

          {/* Export Button */}
          <Button
            onClick={onExportCSV}
            title="Export to CSV"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Export
          </Button>
        </div>

        {/* Right Section: Tools and Mode Switch */}
        <div className="flex items-center gap-4">
          {/* Simulate Button */}
          <Button
            onClick={onSimulate}
            title="Simulate flow execution"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Play className="h-5 w-5 mr-2" />
            Simulate
          </Button>

          {/* Find Paths Button */}
          <Button
            onClick={onFindPaths}
            title="Find paths between states"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Route className="h-5 w-5 mr-2" />
            Find Paths
          </Button>

          {/* Log Analysis Button */}
          <Button
            onClick={() => setShowLogAnalyzer(true)}
            title="Analyze logs"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Search className="h-5 w-5 mr-2" />
            Analyze Logs
          </Button>

          {/* Change Mode Button */}
          <Button
            onClick={onChangeMode}
            title="Switch to Flow Diagram mode"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <SwitchCamera className="h-5 w-5 mr-2" />
            Change Mode
          </Button>
        </div>
      </div>

      {/* Log Analyzer Modal */}
      {showLogAnalyzer && (
        <LogAnalyzer
          onClose={() => setShowLogAnalyzer(false)}
        />
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
  
  // Tool action props
  onSimulate: PropTypes.func.isRequired,
  onFindPaths: PropTypes.func.isRequired,
  
  // Tour prop
  startTour: PropTypes.func.isRequired,

  // Mode switch prop
  onChangeMode: PropTypes.func.isRequired
};

export default TopActionBar;
