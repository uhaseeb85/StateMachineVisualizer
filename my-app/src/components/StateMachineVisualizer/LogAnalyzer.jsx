import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Upload, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function LogAnalyzer({ onClose }) {
  const [sessionId, setSessionId] = useState('');
  const [logDictionary, setLogDictionary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logFile, setLogFile] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('splunk'); // 'splunk' or 'file'

  const handleDictionaryUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      setLogDictionary(jsonData);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleLogFileUpload = (event) => {
    const file = event.target.files[0];
    setLogFile(file);
  };

  const analyzeLogs = async () => {
    if (!logDictionary) {
      alert('Please upload a log dictionary first');
      return;
    }

    if (analysisMode === 'splunk') {
      if (!sessionId) {
        alert('Please enter a session ID');
        return;
      }
      await analyzeSplunkLogs();
    } else {
      if (!logFile) {
        alert('Please upload a log file');
        return;
      }
      await analyzeLogFile();
    }
  };

  const analyzeSplunkLogs = async () => {
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('splunkConfig'));
      
      // Fetch logs from Splunk
      const response = await fetch('/api/splunk/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          sessionId,
          searchQuery: `index=${config.index} sessionId=${sessionId}`
        })
      });

      const logs = await response.json();
      processLogs(logs);
    } catch (error) {
      console.error('Error analyzing Splunk logs:', error);
      alert('Error analyzing Splunk logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeLogFile = async () => {
    setLoading(true);
    try {
      const text = await logFile.text();
      const logs = text.split('\n')
        .filter(line => line.trim())
        .map(line => ({ message: line.trim() }));
      processLogs(logs);
    } catch (error) {
      console.error('Error analyzing log file:', error);
      alert('Error analyzing log file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processLogs = (logs) => {
    // Compare logs with dictionary patterns
    const matches = logs.map(log => {
      const matchingPatterns = logDictionary.map(pattern => ({
        pattern: pattern['log pattern'],
        cause: pattern['potential cause'],
        similarity: calculateSimilarity(log.message, pattern['log pattern'])
      }))
      .filter(match => match.similarity > 0.7) // Filter matches above 70% similarity
      .sort((a, b) => b.similarity - a.similarity);

      return {
        log: log.message,
        matches: matchingPatterns
      };
    });

    setResults(matches);
  };

  // Simple similarity calculation (you might want to use a more sophisticated algorithm)
  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Log Analysis
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Token Information Alert */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              About Splunk Authentication
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              To use Splunk integration, you need an authentication token. Here's how to get one:
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>Log into your Splunk instance</li>
              <li>Go to Settings > User Settings > Account Settings</li>
              <li>Look for "Tokens" or "Authentication Tokens"</li>
              <li>Click "New Token" and follow the prompts</li>
            </ol>
            <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
              If you don't see these options or can't generate a token, please contact your Splunk administrator.
              Alternatively, you can analyze logs from a file using the file upload option below.
            </p>
          </div>

          {/* Analysis Mode Selection */}
          <div className="flex gap-4 mb-4">
            <Button
              onClick={() => setAnalysisMode('splunk')}
              variant={analysisMode === 'splunk' ? 'default' : 'outline'}
              className={analysisMode === 'splunk' ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              Splunk Analysis
            </Button>
            <Button
              onClick={() => setAnalysisMode('file')}
              variant={analysisMode === 'file' ? 'default' : 'outline'}
              className={analysisMode === 'file' ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              File Analysis
            </Button>
          </div>
          
          <div className="space-y-4">
            {analysisMode === 'splunk' && (
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
            )}

            {analysisMode === 'file' && (
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
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Log Dictionary
              </label>
              <Input
                type="file"
                onChange={handleDictionaryUpload}
                accept=".xlsx,.xls"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload an Excel file containing log patterns and their potential causes
              </p>
            </div>

            <Button 
              onClick={analyzeLogs} 
              disabled={!logDictionary || loading || (analysisMode === 'splunk' && !sessionId) || (analysisMode === 'file' && !logFile)}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Analyze Logs'}
            </Button>

            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <p className="font-medium">Log:</p>
                      <p className="text-sm mb-2">{result.log}</p>
                      <p className="font-medium">Potential Causes:</p>
                      <ul className="list-disc list-inside">
                        {result.matches.map((match, i) => (
                          <li key={i} className="text-sm">
                            {match.cause} (Similarity: {(match.similarity * 100).toFixed(1)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 