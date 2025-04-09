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
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx-js-style';
import SplunkConfig from '../StateMachineVisualizer/SplunkConfig';
import { toast, Toaster } from 'sonner';
import { searchSplunk } from '@/api/splunk';

// Import subcomponents
import SelectScreen from './SelectScreen';
import SplunkAnalysis from './SplunkAnalysis';
import FileAnalysis from './FileAnalysis';

// Import constants and utilities
import { SCREENS } from './constants';
import { processLogs, processLogFiles } from './utils';

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
      const resultsArray = processLogs(logs, logDictionary);
      setResults(resultsArray);
      
      if (resultsArray.length === 0) {
        toast.info('No patterns matched in the logs');
      } else {
        toast.success(`Found ${resultsArray.length} pattern matches`);
      }
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
      const combinedLogs = await processLogFiles(logFiles);
      const resultsArray = processLogs(combinedLogs, logDictionary);
      setResults(resultsArray);
      
      if (resultsArray.length === 0) {
        toast.info('No patterns matched in the logs');
      } else {
        toast.success(`Found ${resultsArray.length} pattern matches`);
      }
    } catch (error) {
      console.error('Error analyzing log files:', error);
      toast.error('Error analyzing log files: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setScreen(mode === 'splunk' ? SCREENS.SPLUNK : 
              mode === 'file' ? SCREENS.FILE : SCREENS.SELECT);
  };

  // Render main component
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
          {screen === SCREENS.SELECT && (
            <SelectScreen 
              handleModeSelect={handleModeSelect} 
            />
          )}
          
          {screen === SCREENS.SPLUNK && (
            <SplunkAnalysis 
              sessionId={sessionId}
              setSessionId={setSessionId}
              logDictionary={logDictionary}
              handleDictionaryUpload={handleDictionaryUpload}
              clearDictionary={clearDictionary}
              setScreen={setScreen}
              setShowSplunkConfig={setShowSplunkConfig}
              analyzeLogs={analyzeLogs}
              loading={loading}
              results={results}
              logFiles={logFiles}
            />
          )}
          
          {screen === SCREENS.FILE && (
            <FileAnalysis 
              logDictionary={logDictionary}
              handleDictionaryUpload={handleDictionaryUpload}
              clearDictionary={clearDictionary}
              setScreen={setScreen}
              analyzeLogs={analyzeLogs}
              loading={loading}
              results={results}
              logFiles={logFiles}
              setLogFiles={setLogFiles}
              handleLogFileUpload={handleLogFileUpload}
              clearAllLogFiles={clearAllLogFiles}
              sessionId={sessionId}
            />
          )}
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