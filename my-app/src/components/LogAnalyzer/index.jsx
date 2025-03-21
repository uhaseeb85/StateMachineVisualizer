/**
 * LogAnalyzer Component
 * 
 * A standalone log analysis tool that supports both local file analysis
 * and Splunk integration. This component allows users to:
 * - Upload and analyze local log files
 * - Connect to Splunk for remote log analysis
 * - Import/manage log pattern dictionaries
 * - View analysis results with context
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, X, Download, Settings, FileText, Database, Search, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import SplunkConfig from '../StateMachineVisualizer/SplunkConfig';
import { toast, Toaster } from 'sonner';
import { searchSplunk } from '@/api/splunk';

// Constants
const SCREENS = {
  SELECT: 'select',
  SPLUNK: 'splunk',
  FILE: 'file'
};

const SEVERITY_COLORS = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500'
};

const SAMPLE_PATTERNS = [
  {
    category: "Database Error",
    regex_pattern: ".*Error executing SQL query: (ORA-\\d+).*",
    cause: "Database connection or query execution failure",
    severity: "High",
    suggestions: "Check database connectivity;Verify SQL syntax;Review database logs"
  },
  {
    category: "Authentication",
    regex_pattern: ".*Failed login attempt for user &apos;(.+)&apos; from IP (\\d+\\.\\d+\\.\\d+\\.\\d+).*",
    cause: "Multiple failed login attempts detected",
    severity: "Medium",
    suggestions: "Verify user credentials;Check for suspicious IP activity;Review security logs"
  },
  {
    category: "System Resource",
    regex_pattern: ".*Memory usage exceeded (\\d+)%.*",
    cause: "High memory utilization",
    severity: "High",
    suggestions: "Review memory allocation;Check for memory leaks;Consider scaling resources"
  }
];

const LogAnalyzer = ({ onChangeMode }) => {
  // Core state management
  const [sessionId, setSessionId] = useState('');
  const [logDictionary, setLogDictionary] = useState(() => {
    const savedDictionary = sessionStorage.getItem('logDictionary');
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });
  const [results, setResults] = useState(null); // null indicates no analysis performed yet
  const [loading, setLoading] = useState(false);
  const [logFile, setLogFile] = useState(null);
  const [screen, setScreen] = useState(SCREENS.SELECT);
  const [showSplunkConfig, setShowSplunkConfig] = useState(false);

  // Persist dictionary to sessionStorage when it changes
  useEffect(() => {
    if (logDictionary) {
      sessionStorage.setItem('logDictionary', JSON.stringify(logDictionary));
    }
  }, [logDictionary]);

  // Dictionary Management Functions
  const handleDictionaryUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      
      setResults(null);
      sessionStorage.removeItem('logDictionary');
      setLogDictionary(jsonData);
      event.target.value = '';
    };
    
    reader.readAsArrayBuffer(file);
  };

  const downloadSampleDictionary = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(SAMPLE_PATTERNS);
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, 'log_dictionary_sample.csv');
  };

  const clearDictionary = () => {
    setLogDictionary(null);
    setResults(null);
    sessionStorage.removeItem('logDictionary');
  };

  // Log Analysis Functions
  const handleLogFileUpload = (event) => {
    const file = event.target.files[0];
    setLogFile(file);
  };

  const analyzeLogs = async () => {
    if (!logDictionary) {
      toast.error('Please upload a log dictionary first');
      return;
    }

    if (screen === SCREENS.SPLUNK) {
      if (!sessionId) {
        toast.error('Please enter a session ID');
        return;
      }
      await analyzeSplunkLogs();
    } else {
      if (!logFile) {
        toast.error('Please upload a log file');
        return;
      }
      await analyzeLogFile();
    }
  };

  const analyzeSplunkLogs = async () => {
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('splunkConfig'));
      if (!config) {
        throw new Error('Splunk configuration not found. Please configure Splunk first.');
      }

      const searchQuery = `index=${config.index} sessionId=${sessionId}`;
      const logs = await searchSplunk(config, searchQuery);
      processLogs(logs);
    } catch (error) {
      console.error('Error analyzing Splunk logs:', error);
      toast.error('Error analyzing Splunk logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeLogFile = async () => {
    setLoading(true);
    try {
      const text = await logFile.text();
      const allLines = text.split('\n').map(line => line.trim());
      
      // Create groups of three lines with overlap for better context
      const logs = [];
      for (let i = 0; i < allLines.length; i++) {
        const threeLines = allLines.slice(i, i + 3).join('\n');
        if (threeLines) {
          logs.push({
            message: threeLines,
            lineNumber: i + 1,
            context: {
              before: allLines.slice(Math.max(0, i - 2), i),
              after: allLines.slice(i + 3, Math.min(allLines.length, i + 6))
            },
            matchedLines: allLines.slice(i, i + 3)
          });
        }
      }
      
      processLogs(logs);
    } catch (error) {
      console.error('Error analyzing log file:', error);
      toast.error('Error analyzing log file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processLogs = (logs) => {
    const matchGroups = new Map();
    
    // Process each log entry against all patterns
    logs.forEach(log => {
      logDictionary.forEach(pattern => {
        try {
          const regex = new RegExp(pattern.regex_pattern, 'i');
          const match = regex.test(log.message);
          
          if (match) {
            // If this pattern already has matches, increment count
            if (matchGroups.has(pattern.category)) {
              const group = matchGroups.get(pattern.category);
              group.totalMatches++;
            } else {
              // First match for this pattern
              matchGroups.set(pattern.category, {
                pattern,
                firstMatch: log,
                totalMatches: 1
              });
            }
          }
        } catch (error) {
          console.error(`Invalid regex pattern: ${pattern.regex_pattern}`, error);
        }
      });
    });
    
    // Convert map to array and sort by severity
    const resultsArray = Array.from(matchGroups.values()).sort((a, b) => {
      const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      return severityOrder[a.pattern.severity] - severityOrder[b.pattern.severity];
    });
    
    setResults(resultsArray);
    
    if (resultsArray.length === 0) {
      toast.info('No patterns matched in the logs');
    } else {
      toast.success(`Found ${resultsArray.length} pattern matches`);
    }
  };

  // Render Functions
  const renderSelectScreen = () => (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Experimental Feature
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <p>
                The Log Analysis feature is experimental. All analysis is done in your browser locally.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
        Select Analysis Mode
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Button
          onClick={() => setScreen(SCREENS.SPLUNK)}
          variant="outline"
          className="p-6 h-auto flex flex-col items-center gap-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Database className="w-12 h-12 text-blue-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Splunk Analysis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analyze logs directly from your Splunk instance using session ID
            </p>
          </div>
        </Button>

        <Button
          onClick={() => setScreen(SCREENS.FILE)}
          variant="outline"
          className="p-6 h-auto flex flex-col items-center gap-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <FileText className="w-12 h-12 text-blue-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">File Analysis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload and analyze a local log file
            </p>
          </div>
        </Button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
          About Log Dictionary
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
          A log dictionary contains patterns to match in your logs. You can upload your own or use our sample.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={downloadSampleDictionary}
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample Dictionary
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSplunkAnalysis = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Splunk Analysis
        </h2>
        <Button variant="outline" onClick={() => setScreen(SCREENS.SELECT)}>
          Back
        </Button>
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

        {renderDictionaryUpload()}
        {renderAnalyzeButton()}
        {renderResults()}
      </div>
    </div>
  );

  const renderFileAnalysis = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          File Analysis
        </h2>
        <Button variant="outline" onClick={() => setScreen(SCREENS.SELECT)}>
          Back
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Log File
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
      </div>

      {renderDictionaryUpload()}
      {renderAnalyzeButton()}
      {renderResults()}
    </div>
  );

  const renderDictionaryUpload = () => (
    <>
      {!logDictionary ? (
        <>
          <div className="mt-6 mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Log Dictionary
            </h3>
            <Button
              onClick={downloadSampleDictionary}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Sample
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Log Dictionary
            </label>
            <Input
              type="file"
              onChange={handleDictionaryUpload}
              accept=".csv"
              key={Date.now()}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload a CSV file containing log patterns and analysis rules (see format above)
            </p>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div>
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-200">
              Log Dictionary Loaded
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300">
              {logDictionary.length} patterns available for analysis
            </p>
          </div>
          <Button
            onClick={clearDictionary}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Remove Dictionary
          </Button>
        </div>
      )}
    </>
  );

  const renderAnalyzeButton = () => (
    <Button 
      onClick={analyzeLogs} 
      disabled={!logDictionary || loading || (screen === SCREENS.SPLUNK && !sessionId) || (screen === SCREENS.FILE && !logFile)}
      className="w-full"
    >
      {loading ? 'Analyzing...' : 'Analyze Logs'}
    </Button>
  );

  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Analysis Results
        </h3>
        
        {results.length === 0 ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No patterns matched in the logs
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={index}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {result.pattern.category}
                  </h4>
                  <span className={`text-sm font-medium ${SEVERITY_COLORS[result.pattern.severity.toLowerCase()]}`}>
                    {result.pattern.severity} Severity
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {result.pattern.cause}
                </p>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Suggestions:
                  </h5>
                  <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {result.pattern.suggestions.split(';').map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Occurrence (Line {result.firstMatch.lineNumber}):
                  </h5>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs overflow-x-auto">
                    {result.firstMatch.context.before.map((line, i) => (
                      <div key={`before-${i}`} className="text-gray-500">{line}</div>
                    ))}
                    {result.firstMatch.matchedLines.map((line, i) => (
                      <div key={`match-${i}`} className="text-blue-600 dark:text-blue-400 font-semibold">{line}</div>
                    ))}
                    {result.firstMatch.context.after.map((line, i) => (
                      <div key={`after-${i}`} className="text-gray-500">{line}</div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Total occurrences: {result.totalMatches}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Toast notifications */}
      <Toaster richColors />
      
      {/* Header */}
      <div className="container mx-auto p-4 max-w-full min-h-screen 
                    bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50
                    dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        {/* Header section */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={onChangeMode}
              className="mr-4 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 tracking-wide">
              Log Analyzer
            </h1>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 max-w-4xl mx-auto">
          {screen === SCREENS.SELECT && renderSelectScreen()}
          {screen === SCREENS.SPLUNK && renderSplunkAnalysis()}
          {screen === SCREENS.FILE && renderFileAnalysis()}
        </div>
      </div>
      
      {/* Splunk Config Modal */}
      {showSplunkConfig && (
        <SplunkConfig
          onClose={() => setShowSplunkConfig(false)}
          onSave={() => {
            setShowSplunkConfig(false);
          }}
        />
      )}
    </div>
  );
};

LogAnalyzer.propTypes = {
  onChangeMode: PropTypes.func.isRequired
};

export default LogAnalyzer; 