import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Upload, Download, FileSpreadsheet, Play, Moon, Sun, HelpCircle, Route, Share2, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';

export default function TopActionBar({ 
  isDarkMode, 
  toggleTheme, 
  onSave, 
  onExport, 
  onImport, 
  onExcelImport, 
  onSimulate,
  onFindPaths,
  startTour 
}) {
  return (
    <div className="mb-8 flex flex-wrap gap-2 justify-between items-center">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onSave}
          title="Save your current state machine configuration to browser storage"
          className="save-button bg-gray-900 hover:bg-blue-600 text-white text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Flow
        </Button>

        <Button
          onClick={onExport}
          title="Export your state machine as a JSON file that can be shared or imported later"
          className="export-button bg-gray-900 hover:bg-blue-600 text-white text-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Export
        </Button>

        <div className="relative">
          <Button
            onClick={() => document.getElementById('flow-import').click()}
            title="Import a previously exported JSON state machine configuration"
            className="import-button bg-gray-900 hover:bg-blue-600 text-white text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
          <input
            type="file"
            id="flow-import"
            className="hidden"
            accept=".json"
            onChange={onImport}
            onClick={(e) => e.target.value = null}
          />
        </div>

        <div className="relative">
          <Button
            onClick={() => document.getElementById('excel-import').click()}
            title="Import states and rules from an Excel/CSV file. File should have columns for Source State, Target State, and Rules"
            className="excel-import-button bg-gray-900 hover:bg-blue-600 text-white text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import Excel/CSV
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

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onSimulate}
          title="Test your state machine by simulating state transitions based on your rules"
          className="simulation-button bg-green-500 hover:bg-green-600 text-white text-sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Simulate
        </Button>

        <Button
          onClick={onFindPaths}
          title="Analyze all possible paths between states in your state machine"
          className="find-paths-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                     transition-all duration-300 ease-in-out
                     hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]
                     hover:scale-[1.02]"
        >
          <Route className="w-4 h-4 mr-2" />
          Path Finder
        </Button>

        <Button
          onClick={startTour}
          title="Take a guided tour of all features and functionality"
          className="help-button bg-blue-500 hover:bg-blue-600 text-white text-sm"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>

        <Button
          onClick={toggleTheme}
          title="Switch between light and dark mode"
          className="theme-toggle bg-gray-900 hover:bg-blue-600 text-white text-sm"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 mr-2" />
          ) : (
            <Moon className="w-4 h-4 mr-2" />
          )}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
    </div>
  );
} 

<style jsx global>{`
  @keyframes shimmer {
    0% {
      background-position: -200% center;
    }
    100% {
      background-position: 200% center;
    }
  }
  .animate-shimmer {
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
  }
`}</style> 