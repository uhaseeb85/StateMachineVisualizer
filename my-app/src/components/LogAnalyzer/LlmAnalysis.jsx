/**
 * LLM Analysis Component
 * 
 * This component provides LLM-powered analysis of log files
 * using client-side ML models for RAG.
 */

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Settings, FileText, Brain, Send, X, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";
import embeddingService from '@/api/embeddings';
import workerService from '@/api/workerService';

// Model options
const MODEL_OPTIONS = [
  { id: 'TINYLLAMA', name: 'TinyLlama (1.1B)', description: 'Fastest, smallest model', size: '~500MB' },
  { id: 'PHI2', name: 'Phi-2 (2.7B)', description: 'More capable, larger model', size: '~1.2GB' }
];

// Download steps
const DOWNLOAD_STEPS = {
  NOT_STARTED: 'not_started',
  EMBEDDING_MODEL: 'embedding_model',
  MAIN_MODEL: 'main_model',
  COMPLETE: 'complete'
};

const LlmAnalysis = ({ logFile, sessionData }) => {
  // State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadState, setDownloadState] = useState(DOWNLOAD_STEPS.NOT_STARTED);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [statusLog, setStatusLog] = useState([]);
  const [response, setResponse] = useState(null);
  const [selectedModel, setSelectedModel] = useState('TINYLLAMA');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [embeddingsComputed, setEmbeddingsComputed] = useState(false);
  const [webGpuSupported, setWebGpuSupported] = useState(true);
  const [modelLoadAttempts, setModelLoadAttempts] = useState(0);

  // Check for WebGPU support on component mount
  useEffect(() => {
    const checkWebGpuSupport = async () => {
      try {
        if (!navigator.gpu) {
          setWebGpuSupported(false);
          addStatusLog('WebGPU not supported by this browser', true);
          return;
        }
        
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setWebGpuSupported(false);
          addStatusLog('WebGPU adapter not available', true);
          return;
        }
        
        setWebGpuSupported(true);
        addStatusLog('WebGPU support detected');
      } catch (error) {
        console.error('Error checking WebGPU support:', error);
        setWebGpuSupported(false);
        addStatusLog('Error checking WebGPU support: ' + error.message, true);
      }
    };
    
    checkWebGpuSupport();
  }, []);

  // Add a log message to the status log
  const addStatusLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLog(prev => [...prev, { timestamp, message, isError }]);
  };

  // Handle model selection
  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
  };

  // Download and initialize the embedding model
  const downloadEmbeddingModel = async () => {
    if (!webGpuSupported) {
      toast.error('WebGPU support is required for this feature');
      return;
    }

    try {
      setDownloadState(DOWNLOAD_STEPS.EMBEDDING_MODEL);
      setLoadingProgress(0);
      setLoadingText('Starting embedding model download...');
      addStatusLog('Starting embedding model download (approximately 120MB)');
      
      const success = await embeddingService.initialize((progress) => {
        // Scale progress to 0-40% range for embedding model
        const scaledProgress = progress.progress * 40;
        setLoadingProgress(scaledProgress);
        setLoadingText(progress.text || 'Downloading embedding model...');
      });
      
      if (success) {
        setLoadingProgress(40);
        setLoadingText('Embedding model downloaded successfully');
        addStatusLog('Embedding model downloaded and ready');
        
        // Process log data
        if (logFile) {
          await processLogFile();
        } else if (sessionData) {
          await processSessionData();
        } else {
          toast.error('Please upload a log file to analyze');
          setDownloadState(DOWNLOAD_STEPS.NOT_STARTED);
          return;
        }
      } else {
        toast.error('Failed to download embedding model');
        setDownloadState(DOWNLOAD_STEPS.NOT_STARTED);
        addStatusLog('Failed to download embedding model', true);
      }
    } catch (error) {
      console.error('Error downloading embedding model:', error);
      toast.error('Error downloading embedding model: ' + error.message);
      setDownloadState(DOWNLOAD_STEPS.NOT_STARTED);
      addStatusLog('Error downloading embedding model: ' + error.message, true);
    }
  };

  // Download and initialize the main LLM model
  const downloadMainModel = async () => {
    if (!embeddingsComputed) {
      toast.error('Please process log data first');
      return;
    }

    try {
      setDownloadState(DOWNLOAD_STEPS.MAIN_MODEL);
      setModelLoadAttempts(prev => prev + 1);
      
      const modelName = MODEL_OPTIONS.find(m => m.id === selectedModel)?.name || 'Selected model';
      const modelSize = MODEL_OPTIONS.find(m => m.id === selectedModel)?.size || '';
      
      addStatusLog(`Starting ${modelName} model download ${modelSize}`);
      
      // Use MLC.ai direct URLs to ensure reliable loading
      const useDirectUrl = true;
      
      const modelInitPromise = workerService.initializeLLMWorker(
        { 
          modelKey: selectedModel,
          directUrl: useDirectUrl,
          localModelPath: `/models/${selectedModel.toLowerCase()}/` // Point to locally hosted models
        },
        (progress) => {
          // Scale from 40-100% for LLM loading (after embedding model's 0-40%)
          const scaledProgress = 40 + (progress.progress * 60);
          setLoadingProgress(scaledProgress);
          setLoadingText(progress.text || `Loading ${modelName}: ${Math.round(progress.progress * 100)}%`);
          
          // Log significant milestones
          if (progress.progress % 0.25 < 0.01 && progress.progress > 0.01) {
            addStatusLog(`${modelName} download: ${Math.round(progress.progress * 100)}% complete`);
          }
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Model download timed out')), 180000); // 3 minutes timeout
      });
      
      await Promise.race([modelInitPromise, timeoutPromise]);
      
      setDownloadState(DOWNLOAD_STEPS.COMPLETE);
      setIsModelLoaded(true);
      setLoadingProgress(100);
      
      addStatusLog(`${modelName} model successfully loaded and ready`);
      toast.success(`${MODEL_OPTIONS.find(m => m.id === selectedModel)?.name} model loaded successfully`);
    } catch (error) {
      console.error('Error downloading LLM model:', error);
      
      // Handle download failure
      if (modelLoadAttempts < 2) {
        toast.error(`Error downloading model. Retrying... (${modelLoadAttempts + 1}/3)`);
        addStatusLog(`Error downloading model: ${error.message}. Retrying...`, true);
        setTimeout(() => downloadMainModel(), 2000);
      } else {
        toast.error('Failed to download model after multiple attempts. Please try again later.');
        addStatusLog('Failed to download model after multiple attempts', true);
        setDownloadState(DOWNLOAD_STEPS.NOT_STARTED);
      }
    }
  };

  // Process log file
  const processLogFile = async () => {
    try {
      addStatusLog('Processing log file...');
      setLoadingText('Processing log file...');
      setLoadingProgress(45);
      
      const text = await logFile.text();
      const documentId = `log_file_${Date.now()}`;
      
      // Process and store document for retrieval
      await embeddingService.processAndStoreDocument(documentId, text);
      
      setEmbeddingsComputed(true);
      setLoadingProgress(60);
      setLoadingText('Log file processed successfully');
      addStatusLog('Log file processed and ready for analysis');
      
      // Now ready to load the main model
      toast.success('Log file processed. Ready to download the LLM model.');
    } catch (error) {
      console.error('Error processing log file:', error);
      toast.error('Error processing log file: ' + error.message);
      addStatusLog('Error processing log file: ' + error.message, true);
      setDownloadState(DOWNLOAD_STEPS.NOT_STARTED);
    }
  };

  // Process session data
  const processSessionData = async () => {
    try {
      addStatusLog('Processing session data...');
      setLoadingText('Processing session data...');
      setLoadingProgress(45);
      
      const text = sessionData.map(item => item.message).join('\n\n');
      const documentId = `session_data_${Date.now()}`;
      
      // Process and store document for retrieval
      await embeddingService.processAndStoreDocument(documentId, text);
      
      setEmbeddingsComputed(true);
      setLoadingProgress(60);
      setLoadingText('Session data processed successfully');
      addStatusLog('Session data processed and ready for analysis');
      
      // Now ready to load the main model
      toast.success('Session data processed. Ready to download the LLM model.');
    } catch (error) {
      console.error('Error processing session data:', error);
      toast.error('Error processing session data: ' + error.message);
      addStatusLog('Error processing session data: ' + error.message, true);
      setDownloadState(DOWNLOAD_STEPS.NOT_STARTED);
    }
  };

  // Submit query to the model
  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      addStatusLog(`Submitting query: ${query}`);
      
      // Retrieve context from embedded documents
      const context = await embeddingService.semanticSearch(query, 5);
      const contextTexts = context.map(item => item.text);
      
      // Run inference
      const response = await workerService.runInference(query, contextTexts);
      
      setResponse(response);
      addStatusLog('Received response from the model');
      setLoading(false);
    } catch (error) {
      console.error('Error analyzing query:', error);
      toast.error('Error analyzing query: ' + error.message);
      addStatusLog('Error analyzing query: ' + error.message, true);
      setLoading(false);
    }
  };

  // Clear response
  const clearResponse = () => {
    setResponse(null);
    setQuery('');
    addStatusLog('Response cleared');
  };

  // Render the download UI
  const renderDownloadUI = () => (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Model Download Required
            </h3>
            <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              <p className="mb-2">
                This feature requires downloading AI models to your browser:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Embedding model (~120MB) - Required for understanding your logs</li>
                <li>Language model ({selectedModel === 'TINYLLAMA' ? '~500MB' : '~1.2GB'}) - Required for analysis</li>
              </ol>
              <p className="mt-2">
                All processing happens locally in your browser for privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Web GPU Warning */}
      {!webGpuSupported && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Browser Not Compatible
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p>
                  Your browser doesn't support WebGPU, which is required for this feature.
                  Please use Chrome (version 113+) or Edge (version 113+).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Progress */}
      {downloadState !== DOWNLOAD_STEPS.NOT_STARTED && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{loadingText}</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
          <Progress value={loadingProgress} className="h-2" />
        </div>
      )}

      {/* Status Log */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-md h-32 overflow-y-auto">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
          Download Progress Log
        </div>
        <div className="p-2 font-mono text-xs">
          {statusLog.map((log, i) => (
            <div key={i} className={`mb-1 ${log.isError ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Select LLM Model
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODEL_OPTIONS.map(model => (
            <div
              key={model.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors
                ${selectedModel === model.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
              onClick={() => downloadState === DOWNLOAD_STEPS.NOT_STARTED && handleModelSelect(model.id)}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {model.name}
                </h4>
                {selectedModel === model.id && (
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {model.description} - {model.size}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="space-y-3">
        {downloadState === DOWNLOAD_STEPS.NOT_STARTED && (
          <Button 
            onClick={downloadEmbeddingModel}
            disabled={!webGpuSupported || !logFile}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Step 1: Download Embedding Model & Process Logs
          </Button>
        )}
        
        {downloadState === DOWNLOAD_STEPS.EMBEDDING_MODEL && embeddingsComputed && (
          <Button 
            onClick={downloadMainModel}
            disabled={!embeddingsComputed}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Step 2: Download {MODEL_OPTIONS.find(m => m.id === selectedModel)?.name} Model
          </Button>
        )}
      </div>
    </div>
  );

  // Render the input and response UI
  const renderAnalysis = () => (
    <div className="space-y-6">
      {/* Query Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What would you like to know about your logs?
        </label>
        <div className="flex space-x-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What are the most common errors? Explain why authentication is failing."
            className="min-h-[100px]"
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <Button 
          onClick={handleQuerySubmit}
          disabled={loading || !query.trim() || !isModelLoaded}
          className="flex-1"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Ask AI Assistant
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={clearResponse}
          disabled={!response && !query}
        >
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Status Log (smaller in analysis mode) */}
      <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md h-24 overflow-y-auto">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium">
          Operation Log
        </div>
        <div className="p-2 font-mono text-xs">
          {statusLog.slice(-5).map((log, i) => (
            <div key={i} className={`mb-1 ${log.isError ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-gray-700">
          <div className="flex items-start space-x-2 mb-3">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">
              AI Analysis
            </h3>
          </div>
          <div className="prose prose-blue dark:prose-invert max-w-none">
            {response.split('\n').map((paragraph, i) => (
              <p key={i} className="text-gray-700 dark:text-gray-300 mb-2">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        LLM-Powered Log Analysis
      </h2>
      
      {downloadState !== DOWNLOAD_STEPS.COMPLETE ? renderDownloadUI() : renderAnalysis()}
    </div>
  );
};

export default LlmAnalysis; 