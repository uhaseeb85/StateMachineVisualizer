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

// Import components from their new locations
import { ChatContainer } from './components/ChatUI';
import { ApiSettings, ApiWarning, DemoNotice } from './components/ApiSettings';
import StatusLog from './components/StatusLog/StatusLog';

// Import constants and utilities from their new locations
import { DEFAULT_ENDPOINTS, DEMO_RESPONSES } from './constants/apiConstants';
import { addStatusLog as addLog, checkApiConnection as checkApi, getDemoResponse } from './utils/aiHelpers';
import { processCombinedLogs, formatLogDictionary, createSystemPrompt, prepareApiMessages } from './utils/apiUtils';
import useAiStreaming from './hooks/useAiStreaming';

const LlmAnalysis = ({ logFiles, sessionData, logDictionary }) => {
  // Debug log for component initialization
  console.log("LlmAnalysis component initializing");
  
  // State
  const [query, setQuery] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_ENDPOINTS.LM_STUDIO);
  const [apiProvider, setApiProvider] = useState('LM_STUDIO'); // 'LM_STUDIO', 'OLLAMA', or 'CUSTOM'
  const [modelName, setModelName] = useState(''); // Only used for Ollama
  const [statusLog, setStatusLog] = useState([]);
  const [logContents, setLogContents] = useState({}); // Object mapping file names to their content
  const [showSettings, setShowSettings] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(null);
  const [demoMode, setDemoMode] = useState(true); // Enable demo mode by default
  
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
    if (logFiles && logFiles.length > 0) {
      readLogFiles();
    } else {
      setLogContents({});
    }
  }, [logFiles]);

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

  // Check if API is available only if demo mode is disabled
  useEffect(() => {
    if (!demoMode) {
      checkApiConnection();
    } else {
      // In demo mode, we simulate a successful connection
      setApiAvailable(true);
    }
  }, [apiEndpoint, apiProvider, demoMode]);

  // Update API endpoint when provider changes
  useEffect(() => {
    if (apiProvider === 'LM_STUDIO') {
      setApiEndpoint(DEFAULT_ENDPOINTS.LM_STUDIO);
    } else if (apiProvider === 'OLLAMA') {
      setApiEndpoint(DEFAULT_ENDPOINTS.OLLAMA);
    } else if (apiProvider === 'CUSTOM') {
      setApiEndpoint(DEFAULT_ENDPOINTS.CUSTOM);
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
    checkApi(apiEndpoint, apiProvider, setApiAvailable, addStatusLog);
  };

  // Toggle demo mode
  const toggleDemoMode = () => {
    const newDemoMode = !demoMode;
    console.log("Toggling demo mode from", demoMode, "to", newDemoMode);
    
    setDemoMode(newDemoMode);
    
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

  // Read the log files content
  const readLogFiles = async () => {
    try {
      setLogContents({});
      
      if (logFiles.length === 0) {
        addStatusLog("No log files to read");
        return;
      }
      
      addStatusLog(`Reading ${logFiles.length} log file(s)...`);
      
      const fileContents = {};
      let totalSize = 0;
      
      for (const file of logFiles) {
        try {
          // Read file in smaller chunks to prevent UI from blocking
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
            
            // Report progress periodically
            const percentRead = Math.round((offset / fileSize) * 100);
            if (percentRead % 20 === 0) { // Report every 20%
              addStatusLog(`Reading ${file.name}: ${percentRead}% complete`);
            }
            
            // Yield to the UI thread to prevent browser from showing unresponsive warning
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
      
      setLogContents(fileContents);
      addStatusLog(`All log files loaded. Total size: ${Math.round(totalSize / 1024)} KB`);
      
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

  // Submit query to LLM API or demo mode
  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    // In demo mode, we can proceed even without log files
    if (!demoMode && Object.keys(logContents).length === 0) {
      toast.warning("Please upload at least one log file for analysis.");
      return;
    }
    
    try {
      setLoading(true);
      setStreamedResponse('');
      addStatusLog(`Submitting query: ${query}`);
      
      // Add user message to chat history immediately
      const userMessage = {
        role: 'user',
        content: query.trim(), // Ensure content is trimmed and not empty
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      const currentQuery = query; // Store the current query before clearing
      setQuery(''); // Clear input after sending
      
      // Use demo mode if enabled or if API is not available
      if (demoMode || apiAvailable === false) {
        addStatusLog("Using demo mode for response");
        
        // Get appropriate demo response based on query
        const responseText = getDemoResponse(currentQuery);
        
        // Simulate streaming for demo mode
        await simulateStreamingResponse(responseText, setChatHistory);
        return;
      }
      
      // Continue with real API call if not in demo mode
      // Process log files with progress tracking
      addStatusLog("Processing log files...");
      const combinedLogs = await processCombinedLogs(logContents, (progress) => {
        // Update status log with progress every 25%
        if (progress % 25 === 0) {
          addStatusLog(`Processing logs: ${progress}% complete`);
        }
      });
      addStatusLog("Log processing complete");
      
      // Format the dictionary information for the AI if available
      const dictionaryInfo = formatLogDictionary(logDictionary);
      
      // Create system prompt
      const systemPrompt = createSystemPrompt(dictionaryInfo);
      
      // Prepare messages for API
      addStatusLog("Preparing message for AI...");
      const messages = prepareApiMessages(
        chatHistory,
        currentQuery,
        combinedLogs,
        dictionaryInfo,
        systemPrompt
      );
      
      // Validate that all messages have non-empty content
      const invalidMessage = messages.find(msg => !msg.content || msg.content.trim() === '');
      if (invalidMessage) {
        throw new Error('Message with empty content detected. Please try again.');
      }
      
      // Prepare request body based on API provider
      let requestBody;
      if (apiProvider === 'LM_STUDIO' || apiProvider === 'CUSTOM') {
        requestBody = JSON.stringify({
          messages: messages,
          stream: true
        });
      } else if (apiProvider === 'OLLAMA') {
        requestBody = JSON.stringify({
          model: modelName || "llama3",
          messages: messages,
          stream: true
        });
      }
      
      addStatusLog("Sending request to AI API...");
      // Call LLM API with streaming enabled
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      addStatusLog("Response received, streaming content...");
      // Add placeholder for assistant response
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: ' ', // Initialize with a space to avoid empty content error
        timestamp: new Date().toISOString(),
        streaming: true
      }]);
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setIsStreaming(true);
      
      let isFirst = true;
      let buffer = '';
      let currentResponse = '';
      
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          setIsStreaming(false);
          setLoading(false);
          
          // Update the final message in chat history
          setChatHistory(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: currentResponse,
                streaming: false
              };
            }
            return updated;
          });
          
          addStatusLog('Completed streaming response from AI API');
          break;
        }
        
        // Decode the chunk and process it
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process the SSE data - handle multi-line and partial chunks
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.substring(6); // Remove 'data: ' prefix
            
            if (content.includes('[DONE]')) {
              continue; // Skip the [DONE] message
            }
            
            try {
              const jsonData = JSON.parse(content);
              
              // Handle OpenAI/LM Studio format
              if ((apiProvider === 'LM_STUDIO' || apiProvider === 'CUSTOM') && 
                  jsonData.choices && jsonData.choices[0].delta) {
                const delta = jsonData.choices[0].delta;
                
                if (delta.content) {
                  // If this is the first chunk, log it
                  if (isFirst) {
                    addStatusLog('Started receiving streaming response');
                    isFirst = false;
                  }
                  
                  // Update the streamed response and chat history
                  currentResponse += delta.content;
                  setStreamedResponse(currentResponse);
                  
                  // Update the streaming message in chat history
                  setChatHistory(prev => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                      updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: currentResponse,
                        streaming: true
                      };
                    }
                    return updated;
                  });
                }
              }
              // Handle Ollama format
              else if (apiProvider === 'OLLAMA' && jsonData.message && jsonData.message.content) {
                // If this is the first chunk, log it
                if (isFirst) {
                  addStatusLog('Started receiving streaming response');
                  isFirst = false;
                }
                
                // Update the streamed response and chat history
                currentResponse += jsonData.message.content;
                setStreamedResponse(currentResponse);
                
                // Update the streaming message in chat history
                setChatHistory(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: currentResponse,
                      streaming: true
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing query:', error);
      toast.error('Error analyzing query: ' + error.message);
      addStatusLog('Error analyzing query: ' + error.message, true);
      setLoading(false);
      setIsStreaming(false);
      
      // Add error message to chat history
      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        
        // If there's a placeholder assistant message, update it with the error
        if (lastIndex >= 0 && updated[lastIndex].role === 'assistant' && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: `Error: ${error.message}`,
            streaming: false,
            isError: true
          };
          return updated;
        }
        
        // Otherwise add a new error message
        return [...prev, {
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          streaming: false,
          isError: true
        }];
      });
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
      {showSettings && (
        <ApiSettings
          apiProvider={apiProvider}
          setApiProvider={setApiProvider}
          apiEndpoint={apiEndpoint}
          setApiEndpoint={setApiEndpoint}
          modelName={modelName}
          setModelName={setModelName}
          apiAvailable={apiAvailable}
          demoMode={demoMode}
          toggleDemoMode={toggleDemoMode}
          checkApiConnection={checkApiConnection}
        />
      )}
      
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
    </div>
  );
};

LlmAnalysis.propTypes = {
  logFiles: PropTypes.array.isRequired,
  sessionData: PropTypes.object,
  logDictionary: PropTypes.array
};

export default LlmAnalysis; 