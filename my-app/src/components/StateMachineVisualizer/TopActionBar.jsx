import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Save, Upload, Download, FileSpreadsheet, Play, Moon, Sun, HelpCircle, Route, Share2, ArrowUpFromLine, ArrowDownToLine, History, Search } from 'lucide-react';
import LogAnalyzer from './LogAnalyzer';

export default function TopActionBar({ 
  isDarkMode, 
  toggleTheme, 
  onSave, 
  onExcelImport,
  onSimulate,
  onFindPaths,
  startTour,
  onExportCSV
}) {
  const [showLogAnalyzer, setShowLogAnalyzer] = useState(false);

  return (
    <div className="mb-8 p-6 
                    bg-gray-100 dark:bg-gray-900
                    border-b border-gray-200 dark:border-gray-700
                    shadow-lg">
      <div className="flex flex-wrap items-center justify-between">
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

          {/* Getting Started Button */}
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

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Core Actions Group */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={onSave}
              title="Save your current state machine configuration"
              className="save-button bg-gray-900 text-white text-sm
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

            <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
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

        {/* Right side buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowLogAnalyzer(true)}
            className="save-button bg-gray-900 text-white text-sm
                     dark:bg-gray-800 dark:text-gray-100
                     hover:bg-blue-600 hover:scale-105
                     dark:hover:bg-blue-600
                     transform transition-all duration-200 ease-in-out
                     border border-gray-800 dark:border-gray-700
                     hover:border-blue-500 dark:hover:border-blue-500
                     flex items-center gap-2 px-3 py-1.5 rounded-md"
          >
            <Search className="w-4 h-4 mr-2" />
            Analyze Logs
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Tools Group */}
          <div className="flex gap-4">
            <Button
              onClick={onFindPaths}
              title="Find all possible paths between any two states in your state machine"
              className="find-paths-button bg-blue-600 text-white text-sm
                       hover:bg-blue-500 hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Route className="w-4 h-4" />
              Pathfinder
            </Button>

            <Button 
              onClick={onSimulate}
              title="Run a simulation of your state machine to test its behavior"
              className="simulation-button bg-green-600 text-white text-sm
                       hover:bg-green-500 hover:scale-105
                       dark:bg-green-700 dark:hover:bg-green-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Play className="w-4 h-4" />
              Simulate
            </Button>
          </div>
        </div>
      </div>

      {showLogAnalyzer && (
        <LogAnalyzer
          onClose={() => setShowLogAnalyzer(false)}
        />
      )}
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
