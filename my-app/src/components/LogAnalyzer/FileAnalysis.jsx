import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, X, Trash, Cpu, AlertTriangle } from 'lucide-react';
import { SCREENS } from './constants';
import DictionaryUpload from './DictionaryUpload';
import AnalyzeButton from './AnalyzeButton';
import ResultsDisplay from './ResultsDisplay';
import { Progress } from "@/components/ui/progress";

const FileAnalysis = ({
  logDictionary,
  handleDictionaryUpload,
  clearDictionary,
  setScreen,
  analyzeLogs,
  loading,
  progress,
  results,
  logFiles,
  setLogFiles,
  handleLogFileUpload,
  clearAllLogFiles,
  sessionId,
  isUsingWorkers
}) => {
  // Large dictionary warning modal
  const renderLargeDictionaryWarning = () => {
    if (!logDictionary || logDictionary.length <= 25) return null;
    
    return (
      <div className="p-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Large Log Dictionary Detected
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Your log dictionary contains {logDictionary.length} patterns. For optimal performance, we recommend:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>Keep patterns under 25 entries per dictionary</li>
              <li>Create separate dictionaries for different projects or teams</li>
              <li>Focus on the most critical patterns for your analysis</li>
            </ul>
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 italic">
              You can still proceed with the analysis, but performance may be affected.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          File Analysis
        </h2>
        <Button variant="outline" onClick={() => setScreen(SCREENS.SELECT)}>
          Back
        </Button>
      </div>

      {/* First-time user instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Getting Started with File Analysis
            </h3>
            <ol className="list-decimal pl-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Upload a log file</li>
              <li>Upload a log dictionary containing pattern definitions (or use our sample)</li>
              <li>Click "Analyze Logs" to search for patterns in your files</li>
              <li>View results organized by severity with line numbers and context</li>
            </ol>
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              The log dictionary contains regex patterns that will be matched against your log files to identify issues.
            </p>
          </div>
        </div>
      </div>

      {/* Large dictionary warning */}
      {renderLargeDictionaryWarning()}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Log Files
        </label>
        <div className="mt-1">
          <Input
            type="file"
            onChange={handleLogFileUpload}
            accept=".txt,.log"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a text file containing your logs (one log entry per line)
        </p>
        
        {/* Display uploaded files */}
        {logFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {logFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogFiles(logFiles.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllLogFiles}
                className="text-red-500 hover:text-red-700"
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear All Files
              </Button>
            </div>
          </div>
        )}
      </div>

      <DictionaryUpload 
        logDictionary={logDictionary} 
        handleDictionaryUpload={handleDictionaryUpload} 
        clearDictionary={clearDictionary} 
      />
      
      {/* Progress Bar */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Analyzing logs...
              </span>
              
              {/* Show processor indicator */}
              {progress > 0 && (
                <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-xs">
                  <Cpu className="h-3 w-3 mr-1 text-blue-500" />
                  <span className="text-blue-700 dark:text-blue-300">
                    {isUsingWorkers ? 'Parallel Processing' : 'Single Thread'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            {progress < 25 && "Reading log files..."}
            {progress >= 25 && progress < 50 && "Processing log entries..."}
            {progress >= 50 && progress < 90 && 
              (isUsingWorkers 
                ? "Matching patterns using parallel workers..." 
                : "Matching patterns...")
            }
            {progress >= 90 && "Finalizing results..."}
          </p>
        </div>
      )}
      
      <AnalyzeButton 
        analyzeLogs={analyzeLogs}
        loading={loading}
        logDictionary={logDictionary}
        screen={SCREENS.FILE}
        sessionId={sessionId}
        logFiles={logFiles}
      />
      
      <ResultsDisplay results={results} />
    </div>
  );
};

FileAnalysis.propTypes = {
  logDictionary: PropTypes.array,
  handleDictionaryUpload: PropTypes.func.isRequired,
  clearDictionary: PropTypes.func.isRequired,
  setScreen: PropTypes.func.isRequired,
  analyzeLogs: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  progress: PropTypes.number.isRequired,
  results: PropTypes.array,
  logFiles: PropTypes.array.isRequired,
  setLogFiles: PropTypes.func.isRequired,
  handleLogFileUpload: PropTypes.func.isRequired,
  clearAllLogFiles: PropTypes.func.isRequired,
  sessionId: PropTypes.string.isRequired,
  isUsingWorkers: PropTypes.bool
};

export default FileAnalysis;