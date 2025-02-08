/**
 * LogAnalyzer Component
 * 
 * A comprehensive log analysis tool that supports both local file analysis
 * and Splunk integration. This component allows users to:
 * - Upload and analyze local log files
 * - Connect to Splunk for remote log analysis
 * - Import/manage log pattern dictionaries
 * - View analysis results with context
 * 
 * The component uses a pattern-matching approach with regular expressions
 * to identify known patterns in logs and provide relevant suggestions.
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, X, Download, Settings, FileText, Database } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import SplunkConfig from './SplunkConfig';
import { toast } from 'sonner';
import { searchSplunk } from '@/api/splunk';

const LogAnalyzer = ({ onClose }) => {
  // Core state management
  const [sessionId, setSessionId] = useState('');
  const [logDictionary, setLogDictionary] = useState(() => {
    const savedDictionary = sessionStorage.getItem('logDictionary');
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });
  const [results, setResults] = useState(null); // null indicates no analysis performed yet
  const [loading, setLoading] = useState(false);
  const [logFile, setLogFile] = useState(null);
  const [screen, setScreen] = useState('select'); // 'select', 'splunk', or 'file'
  const [showSplunkConfig, setShowSplunkConfig] = useState(false);

  // Persist dictionary to sessionStorage when it changes
  useEffect(() => {
    if (logDictionary) {
      sessionStorage.setItem('logDictionary', JSON.stringify(logDictionary));
    }
  }, [logDictionary]);

  /**
   * Handles dictionary file upload and processing
   * Supports CSV format with specific columns for pattern matching
   */
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

  /**
   * Handles log file selection for local file analysis
   */
  const handleLogFileUpload = (event) => {
    const file = event.target.files[0];
    setLogFile(file);
  };

  /**
   * Main analysis function that handles both local file and Splunk analysis
   * Validates required inputs before proceeding
   */
  const analyzeLogs = async () => {
    if (!logDictionary) {
      toast.error('Please upload a log dictionary first');
      return;
    }

    if (screen === 'splunk') {
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

  /**
   * Handles Splunk log analysis
   * Fetches logs from Splunk using the configured connection
   * and analyzes them using the loaded pattern dictionary
   */
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

  /**
   * Handles local file analysis
   * Reads and processes the uploaded log file using the loaded pattern dictionary
   * Groups log lines for context-aware pattern matching
   */
  const analyzeLogFile = async () => {
    setLoading(true);
    try {
      const text = await logFile.text();
      console.log('Analyzing log file with content length:', text.length);
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

  /**
   * Core log processing function
   * Applies pattern matching using the dictionary patterns
   * Groups and aggregates matches for display
   */
  const processLogs = (logs) => {
    console.log('Processing logs with dictionary patterns:', logDictionary.length);
    
    const matchGroups = new Map();

    logs.forEach(log => {
      logDictionary.forEach(pattern => {
        try {
          const regex = new RegExp(pattern.regex_pattern, 'gm');
          const isMatch = regex.test(log.message);
          
          if (isMatch) {
            const patternKey = pattern.regex_pattern;
            if (!matchGroups.has(patternKey)) {
              matchGroups.set(patternKey, {
                pattern: {
                  category: pattern.category,
                  cause: pattern.cause,
                  severity: pattern.severity,
                  suggestions: pattern.suggestions,
                  regex_pattern: pattern.regex_pattern
                },
                matches: [],
                count: 0
              });
            }
            
            const group = matchGroups.get(patternKey);
            group.count++;
            
            // Store only the first match details for each pattern
            if (group.matches.length === 0) {
              group.matches.push({
                log: log.message,
                matchedLines: log.matchedLines,
                context: log.context
              });
            }
          }
        } catch (error) {
          console.warn(`Invalid regex pattern: ${pattern.regex_pattern}`, error);
        }
      });
    });

    // Convert matches to array format for rendering
    const matches = Array.from(matchGroups.values())
      .filter(group => group.matches.length > 0)
      .map(group => ({
        pattern: group.pattern,
        firstMatch: group.matches[0],
        totalMatches: group.count
      }));

    setResults(matches);

    if (matches.length === 0) {
      toast.info('No known patterns or errors were found in the log file.');
    }
  };

  /**
   * Generates and downloads a sample dictionary file
   * Provides example patterns for common log scenarios
   */
  const downloadSampleDictionary = () => {
    const sampleData = [
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

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, 'log_dictionary_sample.csv');
  };

  /**
   * Clears the loaded dictionary and analysis results
   */
  const clearDictionary = () => {
    setLogDictionary(null);
    setResults(null);
    sessionStorage.removeItem('logDictionary');
  };

  // Render functions for different screens and sections
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
                The Log Analysis feature is experimental and may contain bugs. appreciate your feedback and patience.
              </p>
              <p>
                <strong>Privacy Information:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>File Analysis Mode:</strong> All analysis is performed locally in your browser. Log files and patterns are never transmitted outside or stored on any server.</li>
                <li><strong>Splunk Analysis Mode:</strong> Requires communication with your Splunk server using your configured credentials to fetch logs.All analysis is performed locally in your browser.Log files and patterns are never transmitted outside or stored on any server.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
        Select Analysis Mode
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Button
          onClick={() => setScreen('splunk')}
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
          onClick={() => setScreen('file')}
          variant="outline"
          className="p-6 h-auto flex flex-col items-center gap-4 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          <FileText className="w-12 h-12 text-green-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">File Analysis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analyze logs from a local text file
            </p>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderSplunkAnalysis = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Splunk Analysis
        </h2>
        <Button variant="outline" onClick={() => setScreen('select')}>
          Back
        </Button>
      </div>

      {/* Token Information Alert */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
          About Splunk Authentication
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          To use Splunk integration, you need an authentication token. Here&apos;s how to get one:
        </p>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>Log into your Splunk instance</li>
          <li>Go to Settings {String.fromCharCode(62)} User Settings {String.fromCharCode(62)} Account Settings</li>
          <li>Look for &quot;Tokens&quot; or &quot;Authentication Tokens&quot;</li>
          <li>Click &quot;New Token&quot; and follow the prompts</li>
        </ol>
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
        <Button variant="outline" onClick={() => setScreen('select')}>
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
          {/* Log Dictionary Information */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2">
              Log Dictionary Format
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300 mb-2">
              The log dictionary should be a CSV file with the following columns:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-300 ml-2">
              <li><span className="font-semibold">category:</span> Main category of the log pattern</li>
              <li><span className="font-semibold">regex_pattern:</span> Regular expression to match the log</li>
              <li><span className="font-semibold">cause:</span> Description of the probable cause</li>
              <li><span className="font-semibold">severity:</span> Impact level (e.g., High, Medium, Low)</li>
              <li><span className="font-semibold">suggestions:</span> Semicolon-separated list of recommended actions</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={downloadSampleDictionary}
                variant="outline"
                className="text-green-700 dark:text-green-300 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample Dictionary
              </Button>
            </div>
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
      disabled={!logDictionary || loading || (screen === 'splunk' && !sessionId) || (screen === 'file' && !logFile)}
      className="w-full"
    >
      {loading ? 'Analyzing...' : 'Analyze Logs'}
    </Button>
  );

  const renderResults = () => (
    <>
      {/* Show message when analysis is complete but no results found */}
      {!loading && results !== null && results.length === 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No known patterns or errors were found in the log file.
          </p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Found {results.reduce((sum, r) => sum + r.totalMatches, 0)} matches across {results.length} patterns
              </span>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[400px] p-4">
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">Pattern Match:</p>
                    <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {result.totalMatches} {result.totalMatches === 1 ? 'occurrence' : 'occurrences'}
                    </span>
                  </div>

                  <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4 whitespace-pre-wrap">
                    {/* Context lines before */}
                    {result.firstMatch.context?.before.map((line, i) => (
                      <div key={`before-${i}`} className="text-gray-500">
                        {line}
                      </div>
                    ))}
                    
                    {/* Matched lines */}
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 -mx-3 px-3 py-0.5 border-l-4 border-yellow-500">
                      {result.firstMatch.matchedLines.map((line, i) => (
                        <div key={`matched-${i}`}>
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Context lines after */}
                    {result.firstMatch.context?.after.map((line, i) => (
                      <div key={`after-${i}`} className="text-gray-500">
                        {line}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="font-medium text-blue-600 dark:text-blue-400">{result.pattern.category}</div>
                    <div>Cause: {result.pattern.cause}</div>
                    <div>Severity: <span className={
                      result.pattern.severity.toLowerCase() === 'high' ? 'text-red-500' :
                      result.pattern.severity.toLowerCase() === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }>{result.pattern.severity}</span></div>
                    <div>
                      <div className="font-medium">Suggestions:</div>
                      <ul className="list-disc list-inside ml-4">
                        {result.pattern.suggestions.split(';').map((suggestion, j) => (
                          <li key={j} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            {screen === 'select' ? (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Log Analysis
              </h2>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {screen === 'select' && renderSelectScreen()}
          {screen === 'splunk' && renderSplunkAnalysis()}
          {screen === 'file' && renderFileAnalysis()}
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
  onClose: PropTypes.func.isRequired
};

export default LogAnalyzer;
