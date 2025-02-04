import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Upload, Download, FileSpreadsheet, Play, Moon, Sun, HelpCircle, Route, Share2, ArrowUpFromLine, ArrowDownToLine, History } from 'lucide-react';

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
            className="getting-started-button bg-transparent text-gray-900 text-sm
                       dark:text-white
                       hover:bg-blue-600 hover:text-white hover:border-blue-500
                       dark:hover:bg-blue-600 dark:hover:border-blue-500
                       transition-all duration-200 ease-in-out
                       border-2 border-black dark:border-white
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
              className="save-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                       dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                       transform transition-all duration-200 hover:scale-110"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
              <Button 
                onClick={onExport}
                title="Export your state machine as a JSON file"
                className="export-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                         dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                         transform transition-all duration-200 hover:scale-110"
              >
                <ArrowUpFromLine className="w-4 h-4 mr-2" />
                Export
              </Button>

              <div className="relative">
                <Button 
                  onClick={() => document.getElementById('flow-import').click()}
                  title="Import a previously exported JSON state machine file"
                  className="import-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                           dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                           transform transition-all duration-200 hover:scale-110"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import
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
            </div>

            <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Button 
                  onClick={() => document.getElementById('excel-import').click()}
                  title="Import states and rules from a CSV file (Excel format)"
                  className="excel-import-button import-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                           dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                           transform transition-all duration-200 hover:scale-110"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
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

        {/* Tools Group */}
        <div className="flex gap-4">
          <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
            <Button
              onClick={onFindPaths}
              title="Find all possible paths between any two states in your state machine"
              className="find-paths-button bg-blue-500 hover:bg-blue-600 text-white text-sm
                       dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600
                       transform transition-all duration-200 hover:scale-110"
            >
              <Route className="w-4 h-4 mr-2" />
              Pathfinder
            </Button>

            <Button 
              onClick={onSimulate}
              title="Run a simulation of your state machine to test its behavior"
              className="simulation-button bg-green-500 hover:bg-green-600 text-white text-sm
                       dark:bg-green-500 dark:text-white dark:hover:bg-green-600
                       transform transition-all duration-200 hover:scale-110"
            >
              <Play className="w-4 h-4 mr-2" />
              Simulate
            </Button>
          </div>
        </div>
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
