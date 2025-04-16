import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Settings, Cpu } from 'lucide-react';
import { SCREENS } from './constants';
import DictionaryUpload from './DictionaryUpload';
import AnalyzeButton from './AnalyzeButton';
import ResultsDisplay from './ResultsDisplay';
import { Progress } from "@/components/ui/progress";

const SplunkAnalysis = ({
  sessionId,
  setSessionId,
  logDictionary,
  handleDictionaryUpload,
  clearDictionary,
  setScreen,
  setShowSplunkConfig,
  analyzeLogs,
  loading,
  progress,
  results,
  logFiles,
  isUsingWorkers
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Splunk Analysis
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
              Getting Started with Splunk Analysis
            </h3>
            <ol className="list-decimal pl-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>Configure your Splunk connection using the "Configure Splunk" button</li>
              <li>Enter a session ID to identify the logs you want to analyze</li>
              <li>Upload a log dictionary containing pattern definitions (or use our sample)</li>
              <li>Click "Analyze Logs" to search for patterns in your Splunk logs</li>
            </ol>
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              The analysis will match log entries against regex patterns in your dictionary and display matches by severity.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Splunk Configuration
          </label>
          <Button
            onClick={() => setShowSplunkConfig(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configure Splunk
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Session ID
          </label>
          <Input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter session ID"
          />
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
                  Analyzing Splunk logs...
                </span>
                
                {/* Show processor indicator */}
                {progress > 50 && (
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
              {progress < 30 && "Querying Splunk..."}
              {progress >= 30 && progress < 50 && "Processing log entries..."}
              {progress >= 50 && progress < 90 && 
                (isUsingWorkers 
                  ? "Matching patterns using parallel workers..." 
                  : "Matching patterns...")}
              {progress >= 90 && "Finalizing results..."}
            </p>
          </div>
        )}
        
        <AnalyzeButton 
          analyzeLogs={analyzeLogs}
          loading={loading}
          logDictionary={logDictionary}
          screen={SCREENS.SPLUNK}
          sessionId={sessionId}
          logFiles={logFiles}
        />
        
        <ResultsDisplay results={results} />
      </div>
    </div>
  );
};

SplunkAnalysis.propTypes = {
  sessionId: PropTypes.string.isRequired,
  setSessionId: PropTypes.func.isRequired,
  logDictionary: PropTypes.array,
  handleDictionaryUpload: PropTypes.func.isRequired,
  clearDictionary: PropTypes.func.isRequired,
  setScreen: PropTypes.func.isRequired,
  setShowSplunkConfig: PropTypes.func.isRequired,
  analyzeLogs: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  progress: PropTypes.number.isRequired,
  results: PropTypes.array,
  logFiles: PropTypes.array.isRequired,
  isUsingWorkers: PropTypes.bool
};

export default SplunkAnalysis; 