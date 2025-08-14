/**
 * LLM Analysis Component
 * 
 * This component provides LLM-powered analysis of log files
 * using remote LLM APIs (compatible with OpenAI, LM Studio or Ollama).
 * Features a chat-like interface that preserves history within the session.
 * Supports analyzing multiple log files simultaneously.
 * Can utilize a log dictionary to enhance analysis with known patterns.
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import { Server } from 'lucide-react';
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";

// Import components from their new locations
import { ChatContainer } from './components/ChatUI';
import { ApiSettings, ApiWarning, DemoNotice } from './components/ApiSettings';
import StatusLog from './components/StatusLog/StatusLog';
import LogSizeManager from './components/LogSizeManager';

// Import constants and utilities from their new locations
import { DEFAULT_ENDPOINTS, DEMO_RESPONSES } from './constants/apiConstants';
import { addStatusLog as addLog, checkApiConnection as checkApi, getDemoResponse } from './utils/aiHelpers';
import { processCombinedLogs, formatLogDictionary, createSystemPrompt, prepareApiMessages, detectModelCapabilities } from './utils/apiUtils';
import useAiStreaming from './hooks/useAiStreaming';
import { processLogsWithChunking } from './utils/logChunking';

const LlmAnalysis = ({ logFiles, sessionData, logDictionary }) => {
  // Debug log for component initialization
  console.log("LlmAnalysis component initializing");
  
  // State
  const [query, setQuery] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    const saved = localStorage.getItem('aiLogAnalysis_apiEndpoint');
    return saved || DEFAULT_ENDPOINTS.LM_STUDIO;
  });
  const [apiProvider, setApiProvider] = useState(() => {
    const saved = localStorage.getItem('aiLogAnalysis_apiProvider');
    return saved || 'LM_STUDIO';
  });
  const [modelName, setModelName] = useState(() => {
    const saved = localStorage.getItem('aiLogAnalysis_modelName');
    return saved || '';
  });
  const [statusLog, setStatusLog] = useState([]);
  const [logContents, setLogContents] = useState({}); // Object mapping file names to their content
  const [showSettings, setShowSettings] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(null);
  const [demoMode, setDemoMode] = useState(() => {
    const saved = localStorage.getItem('aiLogAnalysis_demoMode');
    return saved ? JSON.parse(saved) : true; // Default to true
  });
  const [detectedModelName, setDetectedModelName] = useState('Unknown');
  const [modelContextLimit, setModelContextLimit] = useState(4000);
  const [isDetectingModel, setIsDetectingModel] = useState(false);
  const [combinedLogContent, setCombinedLogContent] = useState('');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [processedChunks, setProcessedChunks] = useState([]);
  const [chunkMetadata, setChunkMetadata] = useState(null);
  
  // Get streaming functionality from custom hook
  const { 
    isStreaming, 
    setIsStreaming, 
    streamedResponse, 
    setStreamedResponse, 
    loading, 
    setLoading, 
    simulateStreamingResponse, 
    stopStreaming 
  } = useAiStreaming((msg, isError) => addStatusLog(msg, isError));
  
  // Initialize chat history with initial message instead of from storage
  const [chatHistory, setChatHistory] = useState([{
    role: 'assistant',
    content: DEMO_RESPONSES.greeting || "Hello! I'm ready to analyze your logs.",
    timestamp: new Date().toISOString()
  }]);
  
  // Helper function for adding status logs
  const addStatusLog = (message, isError = false) => {
    addLog(setStatusLog, message, isError);
  };
  
  // Ref for chat container scrolling
  const chatContainerRef = useRef(null);

  // Load log files' content
  useEffect(() => {
    console.log('LogFiles changed:', logFiles?.length || 0, 'files');
    if (logFiles && logFiles.length > 0) {
      readLogFiles();
    } else {
      setLogContents({});
      setCombinedLogContent('');
      setProcessedChunks([]); // Clear chunks when no files
    }
  }, [logFiles]);

  // Update combined log content when individual logs change
  useEffect(() => {
    const combined = Object.values(logContents).join('\n\n');
    setCombinedLogContent(combined);
  }, [logContents]);

  // Reprocess chunks when model context limit changes
  useEffect(() => {
    console.log('=== CHUNK PROCESSING USEEFFECT ===');
    console.log('logContents keys:', Object.keys(logContents).length);
    console.log('modelContextLimit:', modelContextLimit);
    console.log('=====================================');
    
    if (Object.keys(logContents).length > 0) {
      // Use actual limit if detected, otherwise use fallback
      const contextLimit = modelContextLimit > 0 ? modelContextLimit : 4000;
      console.log('Processing chunks with context limit:', contextLimit);
      
      try {
        const { processedChunks, metadata } = processLogsWithChunking(logContents, contextLimit);
        console.log('Processed chunks result:', processedChunks.length, 'chunks created');
        setProcessedChunks(processedChunks);
        setChunkMetadata(metadata);
        
        if (modelContextLimit > 0) {
          addStatusLog(`Chunks reprocessed for ${Math.floor(modelContextLimit / 1000)}K token limit. ${metadata.totalChunks} chunks created.`);
        } else {
          addStatusLog(`Chunks processed with fallback 4K token limit. ${metadata.totalChunks} chunks created.`);
        }
      } catch (error) {
        console.error('Error in chunk processing useEffect:', error);
        addStatusLog(`Error processing chunks: ${error.message}`, true);
      }
    } else {
      console.log('No log contents to process');
    }
  }, [modelContextLimit, logContents]);

  // Add log dictionary info to status log if available
  useEffect(() => {
    if (logDictionary) {
      addStatusLog(`Log dictionary loaded with ${logDictionary.length} patterns. AI will use these for enhanced analysis.`);
    }
  }, [logDictionary]);

  // Initialize chat state with clear storage
  useEffect(() => {
    // First clear any existing chat history to start fresh
    sessionStorage.removeItem('llmChatHistory');
    
    // Initialize with empty array
    setChatHistory([]);
    
    // Then immediately add greeting message if in demo mode
    if (demoMode) {
      console.log("Adding initial greeting message on component mount");
      
      // Use direct state update to add greeting
      const greeting = {
        role: 'assistant',
        content: DEMO_RESPONSES.greeting || "Hello! I'm ready to analyze your logs.",
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([greeting]);
      
      // Add toast for debugging
      toast.info("Demo mode active with greeting message");
      addStatusLog("Demo mode initialized with greeting");
    }
  }, []); // Empty dependency array - run only once on mount
  
  // Add a greeting message when demo mode is toggled on
  useEffect(() => {
    if (demoMode) {
      console.log("Demo mode enabled - checking if greeting needed");
      
      // If chat is empty when demo mode is enabled, add greeting
      if (chatHistory.length === 0) {
        console.log("Chat empty, adding greeting for demo mode");
        const greeting = {
          role: 'assistant',
          content: DEMO_RESPONSES.greeting || "Hello! I'm ready to analyze your logs.",
          timestamp: new Date().toISOString()
        };
        setChatHistory([greeting]);
        toast.info("Added demo greeting message");
        addStatusLog("Demo mode active. Added greeting message.");
      }
    }
  }, [demoMode, chatHistory.length]);

  // Check if API is available and detect model only if demo mode is disabled
  useEffect(() => {
    if (!demoMode) {
      checkApiConnection();
    } else {
      // In demo mode, we simulate a successful connection
      setApiAvailable(true);
      setDetectedModelName('Demo Mode');
      setModelContextLimit(32000);
    }
  }, [apiEndpoint, apiProvider, modelName, demoMode]);

  // Update API endpoint when provider changes (only if it's a default endpoint)
  useEffect(() => {
    const currentEndpoint = apiEndpoint;
    const isDefaultEndpoint = Object.values(DEFAULT_ENDPOINTS).includes(currentEndpoint);
    
    // Only auto-update if the current endpoint is one of the defaults
    if (isDefaultEndpoint) {
      if (apiProvider === 'LM_STUDIO') {
        updateApiEndpoint(DEFAULT_ENDPOINTS.LM_STUDIO);
      } else if (apiProvider === 'OLLAMA') {
        updateApiEndpoint(DEFAULT_ENDPOINTS.OLLAMA);
      } else if (apiProvider === 'CUSTOM') {
        updateApiEndpoint(DEFAULT_ENDPOINTS.CUSTOM);
      }
    }
  }, [apiProvider]);
  
  // Save chat history to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('llmChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamedResponse]);

  // Handle API connection failures by prompting for demo mode
  useEffect(() => {
    if (apiAvailable === false && !demoMode) {
      toast.info("Cannot connect to AI API. Demo mode is available for testing.", {
        action: {
          label: "Enable Demo Mode",
          onClick: () => toggleDemoMode()
        }
      });
    }
  }, [apiAvailable, demoMode]);

  // Check API connection
  const checkApiConnection = async () => {
    // First check basic connection
    checkApi(apiEndpoint, apiProvider, setApiAvailable, addStatusLog);
    
    // Then try to detect model capabilities separately (don't block on this)
    if (!demoMode) {
      // Run model detection in the background
      setTimeout(() => {
        detectModel();
      }, 1000); // Small delay to let connection check complete first
    }
  };

  // Detect model capabilities
  const detectModel = async () => {
    if (demoMode) {
      setDetectedModelName('Demo Mode');
      setModelContextLimit(32000); // Generous limit for demo
      return;
    }

    setIsDetectingModel(true);
    addStatusLog('Detecting model capabilities...');
    
    try {
      const { modelName: detected, contextLimit } = await detectModelCapabilities(
        apiEndpoint, 
        apiProvider, 
        modelName
      );
      
      setDetectedModelName(detected);
      setModelContextLimit(contextLimit);
      
      addStatusLog(`Detected model: ${detected} (${Math.floor(contextLimit / 1000)}K tokens)`);
    } catch (error) {
      console.error('Error detecting model:', error);
      console.log('Model detection failed, but connection may still work for chat');
      
      // Don't fail the entire connection for model detection issues
      // Use fallback values and still allow chat to work
      setDetectedModelName(modelName || 'Unknown Model');
      setModelContextLimit(4000); // Conservative fallback
      
      addStatusLog(`Could not detect model details (${error.message}), using fallback settings`, false);
    } finally {
      setIsDetectingModel(false);
    }
  };

  // Toggle demo mode
  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    console.log("Toggling demo mode from", demoMode, "to", newDemoMode);
    
    setDemoMode(newDemoMode);
    localStorage.setItem('aiLogAnalysis_demoMode', JSON.stringify(newDemoMode));
    
    if (newDemoMode) {
      setApiAvailable(true);
      addStatusLog("Demo mode activated. AI responses will be simulated.");
      toast.success("Demo mode enabled");
      
      // Always add a greeting if enabling demo mode
      const greeting = {
        role: 'assistant',
        content: DEMO_RESPONSES.greeting || "Hello! I'm ready to analyze your logs.",
        timestamp: new Date().toISOString()
      };
      
      console.log("Adding demo greeting message");
      
      // Clear history and add initial greeting
      sessionStorage.removeItem('llmChatHistory');
      setChatHistory([greeting]);
    } else {
      setApiAvailable(null);
      addStatusLog("Demo mode deactivated. Checking for real AI API connection...");
      toast.info("Demo mode disabled");
      checkApiConnection();
    }
  };

  // Helper functions to persist API settings
  const updateApiProvider = (provider) => {
    setApiProvider(provider);
    localStorage.setItem('aiLogAnalysis_apiProvider', provider);
  };

  const updateApiEndpoint = (endpoint) => {
    setApiEndpoint(endpoint);
    localStorage.setItem('aiLogAnalysis_apiEndpoint', endpoint);
  };

  const updateModelName = (name) => {
    setModelName(name);
    localStorage.setItem('aiLogAnalysis_modelName', name);
  };

  // Read the log files content
  const readLogFiles = async () => {
    try {
      setLogContents({});
      setProcessedChunks([]);
      setChunkMetadata(null);
      
      if (logFiles.length === 0) {
        addStatusLog("No log files to read");
        return;
      }
      
      addStatusLog(`Reading ${logFiles.length} log file(s)...`);
      
      const fileContents = {};
      let totalSize = 0;
      
      for (const file of logFiles) {
        try {
          const fileSize = file.size;
          const fileChunkSize = 1024 * 1024; // 1MB chunks
          let offset = 0;
          let text = '';
          
          addStatusLog(`Reading ${file.name} (${Math.round(fileSize / 1024)} KB)...`);
          
          while (offset < fileSize) {
            const blob = file.slice(offset, offset + fileChunkSize);
            const chunkText = await blob.text();
            text += chunkText;
            offset += fileChunkSize;
            
            const percentRead = Math.round((offset / fileSize) * 100);
            if (percentRead % 20 === 0) {
              addStatusLog(`Reading ${file.name}: ${percentRead}% complete`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          
          fileContents[file.name] = text;
          totalSize += text.length;
          addStatusLog(`Log file loaded: ${file.name} (${Math.round(text.length / 1024)} KB)`);
        } catch (error) {
          console.error(`Error reading log file ${file.name}:`, error);
          addStatusLog(`Error reading log file ${file.name}: ${error.message}`, true);
        }
      }
      
      console.log('=== FILE READING COMPLETE ===');
      console.log('Total files read:', Object.keys(fileContents).length);
      console.log('File names:', Object.keys(fileContents));
      console.log('Total size:', totalSize, 'characters');
      console.log('==============================');
      
      // Set log contents first
      setLogContents(fileContents);
      
      // Small delay to ensure state is updated, then process chunks
      setTimeout(() => {
        try {
          // Process chunks after loading files - use fallback if model limit not detected yet
          const contextLimit = modelContextLimit > 0 ? modelContextLimit : 4000; // Fallback to 4K
          console.log('Processing chunks with context limit:', contextLimit);
          
          const { processedChunks, metadata } = processLogsWithChunking(fileContents, contextLimit);
          console.log('Initial chunk processing result:', processedChunks.length, 'chunks');
          console.log('Chunk metadata:', metadata);
          
          setProcessedChunks(processedChunks);
          setChunkMetadata(metadata);
          
          addStatusLog(`All log files processed. Found ${metadata.totalErrors} errors and ${metadata.totalWarnings} warnings across ${metadata.totalChunks} chunks.`);
        } catch (chunkError) {
          console.error('Error during chunk processing:', chunkError);
          addStatusLog(`Error processing chunks: ${chunkError.message}`, true);
          // Still set empty chunks if processing fails
          setProcessedChunks([]);
          setChunkMetadata({ totalChunks: 0, totalErrors: 0, totalWarnings: 0 });
        }
      }, 100); // Small delay to ensure state updates
      
    } catch (error) {
      console.error("Error reading log files:", error);
      addStatusLog(`Error reading log files: ${error.message}`, true);
      toast.error(`Error reading log files: ${error.message}`);
    }
  };

  // Stop streaming handler that uses the hook function
  const handleStopStreaming = () => {
    stopStreaming(setChatHistory);
  };

  // Modify handleQuerySubmit to handle chunks
  const handleQuerySubmit = async () => {
    console.log('=== QUERY SUBMIT DEBUG ===');
    console.log('Demo mode:', demoMode);
    console.log('LogContents keys:', Object.keys(logContents).length);
    console.log('LogContents:', Object.keys(logContents));
    console.log('Processed chunks:', processedChunks.length);
    console.log('Model context limit:', modelContextLimit);
    console.log('Query:', query.trim());
    console.log('========================');
    
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    if (loading) {
      toast.error("Please wait for the current analysis to complete");
      return;
    }

    // Only check for log files if not in demo mode
    if (!demoMode && (processedChunks.length === 0 && Object.keys(logContents).length === 0)) {
      console.log('No log files uploaded');
      toast.warning("Please upload log files to analyze");
      return;
    }

    // If we have log contents but no processed chunks, it might be a processing issue
    if (!demoMode && Object.keys(logContents).length > 0 && processedChunks.length === 0) {
      console.log('Log contents exist but no processed chunks - triggering manual reprocessing');
      
      // Try to reprocess chunks immediately
      const contextLimit = modelContextLimit > 0 ? modelContextLimit : 4000;
      console.log('Using context limit:', contextLimit);
      
      try {
        const { processedChunks: newChunks, metadata } = processLogsWithChunking(logContents, contextLimit);
        console.log('Manual reprocessing result:', newChunks.length, 'chunks');
        
        if (newChunks.length > 0) {
          setProcessedChunks(newChunks);
          setChunkMetadata(metadata);
          console.log('Chunks updated, proceeding with query');
          // Don't return here, let the query continue
        } else {
          toast.warning("Could not process log files. Please try uploading them again.");
          return;
        }
      } catch (error) {
        console.error('Error in manual chunk processing:', error);
        toast.error("Error processing log files. Please try uploading them again.");
        return;
      }
    }

    setLoading(true);
    setIsStreaming(true);
    setStreamedResponse('');

    const timestamp = new Date().toISOString();
    const userMessage = { role: 'user', content: query, timestamp };
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');

    try {
      if (demoMode) {
        // Get demo response
        const demoResponse = getDemoResponse(query);
        
        // Add placeholder for assistant response
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          streaming: true
        }]);

        // Simulate streaming for demo mode
        let streamedContent = '';
        const words = demoResponse.split(' ');
        
        for (const word of words) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing delay
          streamedContent += word + ' ';
          
          // Update the streaming message in chat history
          setChatHistory(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: streamedContent.trim(),
                streaming: true
              };
            }
            return updated;
          });
        }

        // Update final message in chat history
        setChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: streamedContent.trim(),
              streaming: false
            };
          }
          return updated;
        });

      } else {
        // Process each chunk sequentially
        let combinedResponse = '';
        
        for (const chunk of processedChunks) {
          const chunkQuery = `Analyzing chunk ${chunk.chunkIndex}/${chunk.totalChunks} from ${chunk.filename}:\n\n${query}`;
          
          const messages = prepareApiMessages({
            query: chunkQuery,
            logContents: { [chunk.filename]: chunk.chunk },
            logDictionary,
            contextSize: modelContextLimit,
            chatHistory: [] // Don't include chat history for chunk analysis
          });

          // Add placeholder for assistant response
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: `Analyzing chunk ${chunk.chunkIndex}/${chunk.totalChunks}...\n`,
            timestamp: new Date().toISOString(),
            streaming: true
          }]);

          // Prepare request body
          const requestBody = JSON.stringify({
            messages,
            stream: true
          });

          addStatusLog(`Analyzing chunk ${chunk.chunkIndex}/${chunk.totalChunks} from ${chunk.filename}...`);
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          // Handle streaming response for this chunk
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let currentChunkResponse = '';

          while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const content = line.substring(6);
                if (content.includes('[DONE]')) continue;

                try {
                  const jsonData = JSON.parse(content);
                  if (jsonData.choices?.[0]?.delta?.content) {
                    const newContent = jsonData.choices[0].delta.content;
                    currentChunkResponse += newContent;
                    combinedResponse = currentChunkResponse;
                    
                    // Update the streaming message
                    setChatHistory(prev => {
                      const updated = [...prev];
                      const lastIndex = updated.length - 1;
                      if (lastIndex >= 0) {
                        updated[lastIndex] = {
                          ...updated[lastIndex],
                          content: combinedResponse,
                          streaming: true
                        };
                      }
                      return updated;
                    });
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        }

        // Update final response in chat history
        setChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: combinedResponse,
              streaming: false
            };
          }
          return updated;
        });

        addStatusLog('Completed analysis of all chunks');
      }
    } catch (error) {
      console.error('Error in handleQuerySubmit:', error);
      addStatusLog(`Error during analysis: ${error.message}`, true);
      toast.error("Error during analysis");
      
      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: `Error: ${error.message}`,
            streaming: false,
            isError: true
          };
          return updated;
        }
        return [...prev, {
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          streaming: false,
          isError: true
        }];
      });
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  // Clear current response and input
  const clearResponse = () => {
    setStreamedResponse('');
    setQuery('');
    addStatusLog('Input cleared');
  };
  
  // Clear chat history
  const clearChatHistory = () => {
    setChatHistory([]);
    sessionStorage.removeItem('llmChatHistory');
    addStatusLog('Chat history cleared');
    toast.success('Chat history cleared');
  };

  // Main component UI
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            
          </h2>
          <div className="flex gap-3 self-end sm:self-auto">
            <Button 
              variant="primary" 
              onClick={() => setShowSettings(!showSettings)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              AI Settings
            </Button>
            {chatHistory.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearChatHistory}
                className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear History
              </Button>
            )}
          </div>
        </div>
        
        {/* Demo mode notice */}
        {demoMode && <DemoNotice />}
        
        {/* API Settings */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogPortal>
            <DialogOverlay className="!bg-black" />
            <DialogContent className="w-[125%] max-w-5xl p-0 border-0 bg-white dark:bg-gray-900 shadow-lg">
              <DialogTitle className="sr-only">
                API Settings
              </DialogTitle>
              <ApiSettings
                apiProvider={apiProvider}
                setApiProvider={updateApiProvider}
                apiEndpoint={apiEndpoint}
                setApiEndpoint={updateApiEndpoint}
                modelName={modelName}
                setModelName={updateModelName}
                apiAvailable={apiAvailable}
                demoMode={demoMode}
                toggleDemoMode={toggleDemoMode}
                checkApiConnection={checkApiConnection}
                logContent={combinedLogContent}
                detectedModelName={detectedModelName}
                modelContextLimit={modelContextLimit}
                isDetectingModel={isDetectingModel}
                chunkingEnabled={true}
              />
            </DialogContent>
          </DialogPortal>
        </Dialog>
        
        {/* API Connection Warning */}
        {apiAvailable === false && !demoMode && (
          <ApiWarning
            checkApiConnection={checkApiConnection}
            toggleDemoMode={toggleDemoMode}
          />
        )}
        
        {/* Empty log files warning */}
        {!logFiles || logFiles.length === 0 && !demoMode ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
            <div className="flex items-start">
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Log File Required
                </h3>
                <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>Please upload log files to use the LLM analysis feature.</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Chat Container */}
        <ChatContainer
          chatHistory={chatHistory}
          query={query}
          setQuery={setQuery}
          handleQuerySubmit={handleQuerySubmit}
          clearResponse={clearResponse}
          loading={loading}
          isStreaming={isStreaming}
          stopStreaming={handleStopStreaming}
          demoMode={demoMode}
        />
        
        {/* Status Log */}
        <StatusLog statusLog={statusLog} />
        
        {logDictionary && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 flex items-center">
            <div className="flex-shrink-0 mr-2">
              <Server className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-green-800 dark:text-green-300">
              Using log dictionary with {logDictionary.length} patterns to enhance AI analysis
            </p>
          </div>
        )}

        {chunkMetadata && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Log Analysis Summary</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>Found {chunkMetadata.totalErrors} errors and {chunkMetadata.totalWarnings} warnings</p>
              <p>Split into {chunkMetadata.totalChunks} chunks for analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

LlmAnalysis.propTypes = {
  logFiles: PropTypes.array.isRequired,
  sessionData: PropTypes.object,
  logDictionary: PropTypes.array
};

export default LlmAnalysis; 