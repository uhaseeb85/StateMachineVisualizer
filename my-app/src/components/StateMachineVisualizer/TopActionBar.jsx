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
  onRuleDictionaryImport,
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
          className="simulation-button bg-green-500 hover:bg-green-600 text-white text-sm
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

        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onRuleDictionaryImport}
            className="hidden"
            id="ruleDictionaryInput"
          />
          <label
            htmlFor="ruleDictionaryInput"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 
                     text-white rounded-md transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Load Rule Dictionary
          </label>
        </div>

        <Button
          onClick={onFindPaths}
          className="find-paths-button relative group overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 
                     transform hover:scale-105 transition-all duration-200 ease-out
                     animate-shimmer hover:animate-pulse"
        >
          <div className="absolute inset-0 bg-white/20 skew-x-12 group-hover:skew-x-0 
                            transition-transform duration-300 ease-out -translate-x-full group-hover:translate-x-full">
          </div>
          <div className="relative flex items-center gap-2">
            <Route className="w-4 h-4 animate-bounce" />
            PathFinder
          </div>
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