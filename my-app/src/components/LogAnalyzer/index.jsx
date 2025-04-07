/**
 * LogAnalyzer Component
 * 
 * A standalone log analysis tool that supports both local file analysis,
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
import { AlertTriangle, X, Download, Settings, FileText, Database, Search, ArrowLeft, ArrowRight, Trash } from 'lucide-react';
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
  const [logFiles, setLogFiles] = useState([]); // Changed from single file to array of files
  const [screen, setScreen] = useState(SCREENS.SELECT);
  const [showSplunkConfig, setShowSplunkConfig] = useState(false);
  const [splunkLogs, setSplunkLogs] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  
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
    const newFiles = Array.from(event.target.files);
    
    // Check if adding these files would exceed the 5 file limit
    if (logFiles.length + newFiles.length > 5) {
      toast.error('Maximum 5 log files allowed');
      return;
    }
    
    setLogFiles([...logFiles, ...newFiles]);
    event.target.value = ''; // Reset input to allow selecting the same file again
  };

  const clearAllLogFiles = () => {
    setLogFiles([]);
    toast.info('All log files cleared');
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
      if (logFiles.length === 0) {
        toast.error('Please upload at least one log file');
        return;
      }
      await analyzeLogFiles();
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

  const analyzeLogFiles = async () => {
    setLoading(true);
    try {
      const logs = await Promise.all(logFiles.map(async (file) => {
        const text = await file.text();
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
        
        return logs;
      }));
      
      const combinedLogs = logs.flat();
      processLogs(combinedLogs);
    } catch (error) {
      console.error('Error analyzing log files:', error);
      toast.error('Error analyzing log files: ' + error.message);
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

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setScreen(mode === 'splunk' ? SCREENS.SPLUNK : 
              mode === 'file' ? SCREENS.FILE : SCREENS.SELECT);
  };

  // Render Functions
  const renderSelectScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Log Analysis Tools
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Powerful pattern matching and analysis to help you identify critical issues in your logs
        </p>
      </div>
      
      {/* Features Overview */}
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mt-4">
        Choose Your Analysis Method
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Splunk Analysis Card */}
        <div 
          onClick={() => handleModeSelect('splunk')}
          className="cursor-pointer rounded-xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors overflow-hidden shadow-sm hover:shadow-md"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4">
                <Database className="w-14 h-14 text-blue-500" />
              </div>
            </div>
            <div className="text-center flex-grow space-y-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Splunk Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect to your Splunk instance to analyze logs remotely
              </p>
              <ul className="text-sm text-left ml-5 space-y-1 text-gray-600 dark:text-gray-400 list-disc">
                <li>Query logs directly from Splunk</li>
                <li>Use session IDs to focus analysis</li>
                <li>No need to download log files</li>
              </ul>
              <div className="pt-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Select Splunk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Analysis Card */}
        <div 
          onClick={() => handleModeSelect('file')}
          className="cursor-pointer rounded-xl border-2 border-green-200 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors overflow-hidden shadow-sm hover:shadow-md"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <FileText className="w-14 h-14 text-green-500" />
              </div>
            </div>
            <div className="text-center flex-grow space-y-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                File Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload and analyze your local log files
              </p>
              <ul className="text-sm text-left ml-5 space-y-1 text-gray-600 dark:text-gray-400 list-disc">
                <li>Analyze log files downloaded to your PC</li>
                <li>View results with line numbers</li>
                <li>See context around matched patterns</li>
              </ul>
              <div className="pt-4">
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Select File Analysis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full flex-shrink-0">
            <Download className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Log Dictionary
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              A log dictionary contains regex patterns to match in your logs. These patterns help identify common issues and provide context on their severity and potential solutions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={downloadSampleDictionary}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample Dictionary
              </Button>
              <Button
                onClick={() => handleModeSelect('file')}
                variant="ghost"
                className="text-gray-600 dark:text-gray-300"
              >
                Learn More About Log Dictionaries
              </Button>
            </div>
          </div>
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
              <li>Upload one or more log files (up to 5 files)</li>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Log Files
        </label>
        <div className="mt-1">
          <Input
            type="file"
            onChange={handleLogFileUpload}
            accept=".txt,.log"
            multiple
          />
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload text files containing your logs (one log entry per line)
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
      disabled={!logDictionary || loading || (screen === SCREENS.SPLUNK && !sessionId) || (screen === SCREENS.FILE && logFiles.length === 0)}
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