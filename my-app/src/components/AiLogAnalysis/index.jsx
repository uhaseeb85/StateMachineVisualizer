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
import { AlertTriangle, X, FileText, Brain, ArrowLeft, Download, Info, CheckCircle2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import LlmAnalysis from '../LogAnalyzer/LlmAnalysis';
import * as XLSX from 'xlsx-js-style';

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
  
  // State for showing guide
  const [showGuide, setShowGuide] = useState(true);

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
      
      sessionStorage.removeItem('logDictionary');
      setLogDictionary(jsonData);
      event.target.value = '';
      toast.success(`Log dictionary loaded with ${jsonData.length} patterns`);
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
    sessionStorage.removeItem('logDictionary');
    toast.info('Log dictionary removed');
  };

  // Log file management
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

  // First-time user guide component
  const renderGuide = () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex">
          <Info className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Getting Started with AI Log Analysis
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 mr-2 text-xs">1</span>
                  Configure AI Connection
                </h4>
                <p>Click the blue "AI Settings" button to connect to your AI provider (LM Studio, Ollama, or custom endpoint).</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 mr-2 text-xs">2</span>
                  Upload Log Files
                </h4>
                <p>Upload your log files (up to 5) using the "Upload Log Files" section. Text (.txt) and log (.log) files are supported.</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 mr-2 text-xs">3</span>
                  Optional: Add a Log Dictionary
                </h4>
                <p>For enhanced analysis, upload a log dictionary with known patterns. You can download a sample dictionary to see the format.</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 mr-2 text-xs">4</span>
                  Ask Questions
                </h4>
                <p>Type your question in the chat box and press Enter or click Send. The AI will analyze your logs and provide insights.</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 mr-2 text-xs">5</span>
                  Control the AI
                </h4>
                <p>You can stop the AI's response at any time using the Stop button. Your chat history is preserved during your session.</p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => setShowGuide(false)} 
                variant="outline" 
                size="sm"
                className="text-blue-600 border-blue-300"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Got it
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGuide(false)}
          className="text-gray-500"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

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
              AI Log Analysis
            </h1>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 
                      w-[90%] max-w-[90%] lg:w-[85%] lg:max-w-[85%] xl:w-[80%] xl:max-w-[80%] min-h-[80vh] mx-auto">
          
          {/* First-time user guide */}
          {showGuide && renderGuide()}
          
          <div className="space-y-4">
            {/* Hidden persistent file input */}
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleLogFileUpload}
              accept=".txt,.log"
              className="hidden"
              multiple
            />

            {/* Dictionary and File upload sections side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dictionary section */}
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-purple-900 dark:text-purple-200">
                    Log Dictionary
                  </h3>
                </div>
                
                {!logDictionary ? (
                  <div>
                    <p className="text-sm text-purple-800 dark:text-purple-300 mb-4">
                      A log dictionary contains patterns to match in your logs. It enhances AI analysis by providing context about known issues.
                    </p>
                    <div className="flex flex-col space-y-3">
                      <div className="mt-1">
                        <Input
                          type="file"
                          onChange={handleDictionaryUpload}
                          accept=".csv"
                          key={Date.now()}
                        />
                        <p className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                          Upload a CSV file containing log patterns (see format in sample)
                        </p>
                      </div>
                      <Button
                        onClick={downloadSampleDictionary}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Sample Dictionary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-purple-800 dark:text-purple-300">
                        {logDictionary.length} patterns available for AI to reference
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        The AI will use these patterns to enhance log analysis
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
              </div>

              {/* Upload Log Files section */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-blue-900 dark:text-blue-200">
                    Upload Log Files <span className="text-sm font-normal">({logFiles.length}/5)</span>
                  </h3>
                  {logFiles.length > 0 && (
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={clearAllLogFiles}
                      className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All Files
                    </Button>
                  )}
                </div>
                
                {logFiles.length > 0 ? (
                  <div className="flex flex-col space-y-3">
                    {logFiles.map((file, index) => (
                      <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800 flex justify-between items-center">
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
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {logFiles.length === 1 
                        ? "Your log file is ready for AI analysis"
                        : `Your ${logFiles.length} log files are ready for AI analysis`}
                    </p>
                    {logFiles.length < 5 && (
                      <Button
                        onClick={() => fileInputRef.current.click()}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Add More Files
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-md bg-white dark:bg-gray-800">
                      <div className="space-y-1 text-center">
                        <FileText className="mx-auto h-12 w-12 text-blue-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
                            onClick={() => fileInputRef.current.click()}
                          >
                            <span>Upload log files</span>
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          TXT or LOG up to 10MB each (max 5 files)
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-blue-800 dark:text-blue-300">
                      Upload log files to start analyzing with AI
                    </p>
                  </div>
                )}
              </div>
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