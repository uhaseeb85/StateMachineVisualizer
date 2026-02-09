/**
 * AI Log Analysis Component
 * 
 * A standalone log analysis tool powered by LLM that allows users to:
 * - Upload and analyze log files (up to 5 files at once)
 * - Connect to various LLM providers (LM Studio, Ollama, or custom endpoints)
 * - Get AI insights on log content
 * - Preserve chat history during the session
 * - Use log pattern dictionaries to enhance AI understanding
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, X, FileText, Brain, ArrowLeft, Download, Info, CheckCircle2, BookOpen, Upload, HelpCircle, Settings } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import LlmAnalysis from './LlmAnalysis';
import ExcelJS from 'exceljs';

// Sample patterns for the dictionary
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

const AiLogAnalysis = ({ onChangeMode }) => {
  // State for files
  const [logFiles, setLogFiles] = useState([]);
  
  // Create a ref for the file input
  const fileInputRef = useRef(null);

  // State for log dictionary
  const [logDictionary, setLogDictionary] = useState(() => {
    const savedDictionary = sessionStorage.getItem('logDictionary');
    return savedDictionary ? JSON.parse(savedDictionary) : null;
  });
  
  // State for showing guide - initialize to true for autoshow as modal
  const [showGuide, setShowGuide] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(true);
  
  // State for showing modals
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);

  // Persist dictionary to sessionStorage when it changes
  useEffect(() => {
    if (logDictionary) {
      sessionStorage.setItem('logDictionary', JSON.stringify(logDictionary));
    }
  }, [logDictionary]);

  // Dictionary Management Functions
  const handleDictionaryUpload = async (event) => {
    const file = event.target.files[0];
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      const firstSheet = workbook.worksheets[0];
      const jsonData = [];
      
      // Get headers from first row
      const headers = [];
      firstSheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value);
      });
      
      // Convert rows to JSON
      firstSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          jsonData.push(rowData);
        }
      });
      
      sessionStorage.removeItem('logDictionary');
      setLogDictionary(jsonData);
      event.target.value = '';
      toast.success(`Log dictionary loaded with ${jsonData.length} patterns`);
    } catch (error) {
      console.error('Error loading dictionary:', error);
      toast.error('Error loading dictionary file');
    }
  };

  const downloadSampleDictionary = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sample');
    
    // Set columns
    const columns = Object.keys(SAMPLE_PATTERNS[0]).map(key => ({
      header: key,
      key: key,
      width: 20
    }));
    worksheet.columns = columns;
    
    // Add rows
    SAMPLE_PATTERNS.forEach(pattern => {
      worksheet.addRow(pattern);
    });
    
    // Generate and download CSV
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: 'text/csv' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'log_dictionary_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearDictionary = () => {
    setLogDictionary(null);
    sessionStorage.removeItem('logDictionary');
    toast.info('Log dictionary removed');
  };

  // Log file management
  const handleLogFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    
    // Only take the first file
    if (newFiles.length > 0) {
      setLogFiles([newFiles[0]]);
    }
    
    event.target.value = ''; // Reset input to allow selecting the same file again
  };

  const clearAllLogFiles = () => {
    setLogFiles([]);
    toast.info('All log files cleared');
  };

  // Render Guide Modal
  const renderGuideModal = () => {
    // Only render if the modal is shown
    if (!showGuideModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-0 max-w-2xl w-full max-h-[85vh] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Brain className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">Getting Started</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGuideModal(false);
                }}
                className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="mt-2 text-blue-100 opacity-90">
              Learn how to analyze your logs with AI assistance
            </p>
          </div>
          
          <div className="p-6">
            <div className="text-sm space-y-5 mt-2">
              <div className="relative pl-16 group">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 group-hover:bg-blue-200 transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 text-base mb-1.5">
                    Configure AI Connection
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    Click the blue &quot;AI Settings&quot; button to connect to your AI provider (LM Studio, Ollama, or custom endpoint).
                  </p>
                </div>
              </div>
              
              <div className="relative pl-16 group">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 group-hover:bg-green-200 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 text-base mb-1.5">
                    Upload Log File
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    Upload your log file using the &quot;Upload Log Files&quot; button. Text (.txt) and log (.log) files are supported.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-16 group">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 group-hover:bg-green-200 transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 text-base mb-1.5">
                    Optional: Add a Log Dictionary
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    For enhanced analysis, upload a log dictionary with known patterns using the &quot;Add Log Dictionary&quot; button.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-16 group">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 group-hover:bg-purple-200 transition-colors">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-200 text-base mb-1.5">
                    Ask Questions
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    Type your question in the chat box and press Enter or click Send. The AI will analyze your logs and provide insights.
                  </p>
                </div>
              </div>
              
              <div className="relative pl-16 group">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 group-hover:bg-amber-200 transition-colors">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 text-base mb-1.5">
                    Control the AI
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    You can stop the AI&apos;s response at any time using the Stop button. Your chat history is preserved during your session.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                You can access this guide anytime using the &quot;Getting Started&quot; button.
              </p>
              <Button 
                onClick={() => {
                  setShowGuideModal(false);
                }} 
                variant="default" 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Dictionary Modal
  const renderDictionaryModal = () => {
    if (!showDictionaryModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">
              Log Dictionary
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDictionaryModal(false)}
              className="text-gray-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {!logDictionary ? (
            <div>
              <p className="text-sm text-green-800 dark:text-green-300 mb-4">
                A log dictionary contains patterns to match in your logs. It enhances AI analysis by providing context about known issues.
              </p>
              <div className="flex flex-col space-y-3">
                <div className="mt-1">
                  <Input
                    type="file"
                    onChange={(e) => {
                      handleDictionaryUpload(e);
                      setShowDictionaryModal(false);
                    }}
                    accept=".csv"
                    key={Date.now()}
                  />
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Upload a CSV file containing log patterns (see format in sample)
                  </p>
                </div>
                <Button
                  onClick={downloadSampleDictionary}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample Dictionary
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <div>
                <p className="text-sm text-green-800 dark:text-green-300">
                  {logDictionary.length} patterns available for AI to reference
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  The AI will use these patterns to enhance log analysis
                </p>
              </div>
              <Button
                onClick={() => {
                  clearDictionary();
                  setShowDictionaryModal(false);
                }}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Remove Dictionary
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render Files Modal
  const renderFilesModal = () => {
    if (!showFilesModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">
              Upload Log File
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilesModal(false)}
              className="text-gray-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {logFiles.length > 0 ? (
            <div className="flex flex-col space-y-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-800 flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{logFiles[0].name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(logFiles[0].size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setLogFiles([]);
                    setShowFilesModal(false);
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-green-800 dark:text-green-300">
                Your log file is ready for AI analysis
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    clearAllLogFiles();
                    setShowFilesModal(false);
                  }}
                  className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear File
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-green-300 dark:border-green-700 rounded-md bg-white dark:bg-gray-800">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-green-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      className="relative cursor-pointer rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 focus-within:outline-none"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <span>Upload a log file</span>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    TXT or LOG up to 10MB
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-green-800 dark:text-green-300">
                Upload a log file to start analyzing with AI
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Toast notifications */}
      <Toaster richColors />
      
      {/* Modals */}
      {renderDictionaryModal()}
      {renderFilesModal()}
      {renderGuideModal()}
      
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
              AI Log Analysis
            </h1>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 
                      w-[90%] max-w-[90%] lg:w-[85%] lg:max-w-[85%] xl:w-[80%] xl:max-w-[80%] min-h-[80vh] mx-auto">
          
          <div className="space-y-4">
            {/* Hidden persistent file input */}
            <Input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                handleLogFileUpload(e);
                setShowFilesModal(true);
              }}
              accept=".txt,.log"
              className="hidden"
            />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-4 justify-between">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setShowDictionaryModal(true)}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-300 dark:border-green-800"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {logDictionary ? `Log Dictionary (${logDictionary.length} patterns)` : 'Add Log Dictionary'}
                </Button>
                
                <Button
                  onClick={() => setShowFilesModal(true)}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-300 dark:border-green-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {logFiles.length > 0 ? `Log File (${logFiles.length})` : 'Upload Log File'}
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  setShowGuideModal(true);
                }}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Getting Started
              </Button>
            </div>

            {/* Status indicators */}
            <div className="flex flex-wrap gap-2 mb-4">
              {logDictionary && (
                <div className="py-1 px-3 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 text-xs flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {logDictionary.length} log patterns
                </div>
              )}
              
              {logFiles.length > 0 && (
                <div className="py-1 px-3 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 text-xs flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  {logFiles.length} log file{logFiles.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="mt-6">
              <LlmAnalysis logFiles={logFiles} logDictionary={logDictionary} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AiLogAnalysis.propTypes = {
  onChangeMode: PropTypes.func.isRequired
};

export default AiLogAnalysis;