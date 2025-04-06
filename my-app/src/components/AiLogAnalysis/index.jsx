/**
 * AI Log Analysis Component
 * 
 * A standalone log analysis tool powered by LLM that allows users to:
 * - Upload and analyze log files (up to 5 files at once)
 * - Connect to various LLM providers (LM Studio, Ollama, or custom endpoints)
 * - Get AI insights on log content
 * - Preserve chat history during the session
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, X, FileText, Brain, ArrowLeft } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import LlmAnalysis from '../LogAnalyzer/LlmAnalysis';

const AiLogAnalysis = ({ onChangeMode }) => {
  // State for files
  const [logFiles, setLogFiles] = useState([]);
  
  // Create a ref for the file input
  const fileInputRef = useRef(null);

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
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Experimental Feature
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                    <p>
                      The AI Log Analysis feature uses LLM APIs to analyze your logs. Configure your preferred provider in the settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden persistent file input */}
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleLogFileUpload}
              accept=".txt,.log"
              className="hidden"
              multiple
            />

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700 mb-6">
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

            <div className="mt-6">
              <LlmAnalysis logFiles={logFiles} />
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