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
    <div className="mb-8 p-6 border border-gray-200/20 rounded-xl 
                    bg-white/40 dark:bg-gray-800/40 shadow-xl backdrop-blur-sm
                    hover:bg-white/50 dark:hover:bg-gray-800/50 
                    transition-all duration-300">
      <div className="flex flex-wrap gap-4 justify-between">
        {/* Core Actions Group */}
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={onSave}
            className="save-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button
            onClick={toggleTheme}
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

          <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
            <Button 
              onClick={onExport}
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

        {/* Tools Group */}
        <div className="flex gap-4">
          <Button
            onClick={startTour}
            variant="ghost"
            className="getting-started-button text-blue-500 hover:text-blue-600 text-sm
                     transform transition-all duration-200 hover:scale-110"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>

          <div className="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
            <Button
              onClick={onFindPaths}
              className="find-paths-button bg-green-500 hover:bg-green-600 text-white text-sm
                       dark:bg-green-500 dark:text-white dark:hover:bg-green-600
                       transform transition-all duration-200 hover:scale-110"
            >
              <Route className="w-4 h-4 mr-2" />
              Pathfinder
            </Button>

            <Button 
              onClick={onSimulate}
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