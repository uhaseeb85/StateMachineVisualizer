import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Upload, Download, FileSpreadsheet, Play, Moon, Sun, HelpCircle, Route } from 'lucide-react';

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
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={startTour}
          className="getting-started-button bg-blue-500 hover:bg-blue-600 text-white text-sm
                   transform transition-all duration-200 hover:scale-110"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Getting Started
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

        <Button 
          onClick={onSimulate}
          className="simulate-button bg-green-500 hover:bg-green-600 text-white text-sm
                   dark:bg-green-500 dark:text-white dark:hover:bg-green-600
                   transform transition-all duration-200 hover:scale-110"
        >
          <Play className="w-4 h-4 mr-2" />
          Simulate
        </Button>

        <Button 
          onClick={onSave}
          className="save-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                   dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                   transform transition-all duration-200 hover:scale-110"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Flow
        </Button>

        <Button 
          onClick={onExport}
          className="export-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                   dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                   transform transition-all duration-200 hover:scale-110"
        >
          <Upload className="w-4 h-4 mr-2" />
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
            className="excel-import-button import-button bg-gray-900 hover:bg-blue-600 text-white text-sm
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transform transition-all duration-200 hover:scale-110"
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

        <Button
          onClick={onFindPaths}
          className="bg-gray-900 hover:bg-blue-600 text-white text-sm
                   dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                   transform transition-all duration-200 hover:scale-110"
        >
          <Route className="w-4 h-4 mr-2" />
          Find Paths
        </Button>
      </div>
    </div>
  );
} 