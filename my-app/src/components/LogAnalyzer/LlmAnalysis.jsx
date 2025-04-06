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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Settings, FileText, Brain, Send, X, RefreshCw, Server, Trash } from 'lucide-react';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

// Default API endpoints
const DEFAULT_ENDPOINTS = {
  LM_STUDIO: "http://localhost:1234/v1/chat/completions",
  OLLAMA: "http://localhost:11434/api/chat",
  CUSTOM: "http://your-llm-server/v1/chat/completions"
};

const LlmAnalysis = ({ logFiles, sessionData, logDictionary }) => {
  // State
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_ENDPOINTS.LM_STUDIO);
  const [apiProvider, setApiProvider] = useState('LM_STUDIO'); // 'LM_STUDIO', 'OLLAMA', or 'CUSTOM'
  const [modelName, setModelName] = useState(''); // Only used for Ollama
  const [statusLog, setStatusLog] = useState([]);
  const [logContents, setLogContents] = useState({}); // Object mapping file names to their content
  const [showSettings, setShowSettings] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  
  // Chat history state
  const [chatHistory, setChatHistory] = useState(() => {
    const savedChat = sessionStorage.getItem('llmChatHistory');
    return savedChat ? JSON.parse(savedChat) : [];
  });
  
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

  // Check if API is available
  useEffect(() => {
    checkApiConnection();
  }, [apiEndpoint, apiProvider]);

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

  // Check API connection based on provider
  const checkApiConnection = async () => {
    try {
      addStatusLog(`Checking LLM API connection...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      let testUrl;
      if (apiProvider === 'LM_STUDIO') {
        testUrl = apiEndpoint.replace('/chat/completions', '/models');
      } else if (apiProvider === 'OLLAMA') {
        testUrl = apiEndpoint.replace('/api/chat', '/api/tags');
      } else {
        // For custom endpoints, just attempt a HEAD request to the base URL
        const urlObj = new URL(apiEndpoint);
        testUrl = `${urlObj.protocol}//${urlObj.host}`;
      }
      
      const response = await fetch(testUrl, {
        method: apiProvider === 'CUSTOM' ? 'HEAD' : 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setApiAvailable(true);
        addStatusLog("LLM API connected successfully");
      } else {
        setApiAvailable(false);
        addStatusLog("LLM API returned an error", true);
      }
    } catch (error) {
      console.error("API connection error:", error);
      setApiAvailable(false);
      addStatusLog(`Failed to connect to LLM API: ${error.message}`, true);
    }
  };

  // Add a message to the status log
  const addStatusLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setStatusLog(prev => [...prev, { message, timestamp, isError }]);
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
          const text = await file.text();
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

  // Submit query to LLM API
  const handleQuerySubmit = async () => {
    if (!query.trim() || Object.keys(logContents).length === 0) return;
    
    try {
      setLoading(true);
      setStreamedResponse('');
      addStatusLog(`Submitting query to LLM API: ${query}`);
      
      // Add user message to chat history immediately
      const userMessage = {
        role: 'user',
        content: query,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // Combine and truncate logs if they're too large
      let combinedLogs = '';
      const MAX_SIZE_PER_FILE = 20000; // characters
      
      // Add each file's content with a header
      Object.entries(logContents).forEach(([fileName, content]) => {
        const truncatedContent = content.length > MAX_SIZE_PER_FILE
          ? content.substring(0, MAX_SIZE_PER_FILE) + "...[truncated]"
          : content;
          
        combinedLogs += `\n\n===== FILE: ${fileName} =====\n${truncatedContent}`;
      });
      
      // Ensure total size isn't too large
      const MAX_TOTAL_SIZE = 100000; // characters
      if (combinedLogs.length > MAX_TOTAL_SIZE) {
        combinedLogs = combinedLogs.substring(0, MAX_TOTAL_SIZE) + "\n\n...[content truncated due to size]";
      }
      
      // Format the dictionary information for the AI if available
      let dictionaryInfo = '';
      if (logDictionary && logDictionary.length > 0) {
        dictionaryInfo = '\n\n===== LOG PATTERNS DICTIONARY =====\n';
        dictionaryInfo += 'Use these known log patterns to help with your analysis:\n\n';
        
        logDictionary.forEach((pattern, index) => {
          dictionaryInfo += `Pattern ${index + 1}:\n`;
          dictionaryInfo += `Category: ${pattern.category}\n`;
          dictionaryInfo += `Regex: ${pattern.regex_pattern}\n`;
          dictionaryInfo += `Cause: ${pattern.cause}\n`;
          dictionaryInfo += `Severity: ${pattern.severity}\n`;
          dictionaryInfo += `Suggestions: ${pattern.suggestions}\n\n`;
        });
      }
      
      // Base system prompt with instructions
      let systemPrompt = `You are an AI log analyzer. Your task is to analyze log files and provide insights.
      
Analyze the log content below carefully. When providing answers:
1. Be specific and technical in your analysis
2. Identify patterns, errors, and potential issues
3. Provide context and suggest possible causes for issues
4. If appropriate, suggest solutions to identified problems
5. When possible, cite specific line numbers or timestamps from the logs

${dictionaryInfo ? 'You have been provided with a log patterns dictionary that contains known patterns, their causes, severity levels, and suggested solutions. Use these patterns to enhance your analysis.' : ''}`;

      // Add messages for API call based on API provider
      let messages = [];
      
      if (apiProvider === 'LM_STUDIO' || apiProvider === 'CUSTOM') {
        messages = [
          { role: 'system', content: systemPrompt },
          // Add previous relevant messages from chat history (limit to last 10)
          ...chatHistory.slice(-10),
          { 
            role: 'user', 
            content: `${query}\n\nHere are the log files to analyze:${combinedLogs}${dictionaryInfo}` 
          }
        ];
      } else if (apiProvider === 'OLLAMA') {
        messages = [
          { role: 'system', content: systemPrompt },
          // Add previous relevant messages from chat history (limit to last 10)
          ...chatHistory.slice(-10),
          { 
            role: 'user', 
            content: `${query}\n\nHere are the log files to analyze:${combinedLogs}${dictionaryInfo}` 
          }
        ];
      }
      
      // Create the prompt
      const prompt = messages.map(message => ({
        role: message.role,
        content: message.content
      })).join('\n');
      
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
      
      // Add placeholder for assistant response
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '',
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
          
          addStatusLog('Completed streaming response from LLM API');
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

  // Render API settings
  const renderSettings = () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-900 dark:text-white">
          AI Settings
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowSettings(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* API Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LLM Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div 
              className={`p-3 rounded-lg border cursor-pointer ${
                apiProvider === 'LM_STUDIO' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => setApiProvider('LM_STUDIO')}
            >
              <div className="font-medium text-sm">LM Studio</div>
              <div className="text-xs text-gray-500 mt-1">OpenAI compatible</div>
            </div>
            <div 
              className={`p-3 rounded-lg border cursor-pointer ${
                apiProvider === 'OLLAMA' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => setApiProvider('OLLAMA')}
            >
              <div className="font-medium text-sm">Ollama</div>
              <div className="text-xs text-gray-500 mt-1">Requires model name</div>
            </div>
            <div 
              className={`p-3 rounded-lg border cursor-pointer ${
                apiProvider === 'CUSTOM' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => setApiProvider('CUSTOM')}
            >
              <div className="font-medium text-sm">Custom</div>
              <div className="text-xs text-gray-500 mt-1">OpenAI compatible</div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Endpoint
          </label>
          <Input
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="Enter LLM API endpoint URL"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The URL for the chat completions API endpoint
          </p>
        </div>
        
        {apiProvider === 'OLLAMA' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model Name
            </label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="llama3"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Required for Ollama (e.g., llama3, mistral, phi3)
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={checkApiConnection}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Test Connection
          </Button>
        </div>
        
        <div className="text-xs mt-2">
          {apiAvailable === true && (
            <p className="text-green-600 dark:text-green-400">✓ Connected to AI</p>
          )}
          {apiAvailable === false && (
            <p className="text-red-600 dark:text-red-400">✗ Cannot connect to AI</p>
          )}
          {apiAvailable === null && (
            <p className="text-gray-500">Connection status unknown</p>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render a chat message
  const renderChatMessage = (message, index) => {
    const isUser = message.role === 'user';
    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div 
        key={index} 
        className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}
      >
        <div className={`inline-block max-w-[80%] px-4 py-3 rounded-lg 
          ${isUser 
            ? 'bg-blue-500 text-white rounded-tr-none' 
            : message.isError 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-tl-none border border-red-200 dark:border-red-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
          }`}
        >
          <div className="font-medium text-sm mb-1">
            {isUser ? 'You' : 'AI Assistant'}
          </div>
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
            {message.streaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-blue-300 dark:bg-blue-500 animate-pulse"></span>
            )}
          </div>
          <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {formattedTime}
          </div>
        </div>
      </div>
    );
  };

  // Main component UI with two-pane layout
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI-Powered Log Analysis
        </h2>
        <div className="flex gap-2">
          {chatHistory.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearChatHistory}
              className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            API Settings
          </Button>
        </div>
      </div>
      
      {!logFiles || logFiles.length === 0 ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
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
      ) : (
        <>
          {showSettings && renderSettings()}
          
          {/* API Connection Warning */}
          {apiAvailable === false && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Cannot Connect to LLM API
                  </h3>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    <p className="mb-2">
                      Unable to connect to the specified LLM API. Please check your network connection and API endpoint.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-300"
                      onClick={checkApiConnection}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry Connection
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Two-pane layout */}
          <div className="grid grid-cols-1 gap-6">
            {/* Right pane - Chat interface */}
            <div className="flex flex-col h-full">
              {/* Chat messages container */}
              <div 
                ref={chatContainerRef}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-y-auto"
                style={{ height: chatHistory.length ? "60vh" : "auto", minHeight: "400px" }}
              >
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                      <p>Ask a question about your logs to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {chatHistory.map(renderChatMessage)}
                  </div>
                )}
              </div>
              
              {/* Query Input */}
              <div className="space-y-2">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about your logs..."
                  className="min-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleQuerySubmit();
                    }
                  }}
                />
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleQuerySubmit}
                    disabled={loading || !query.trim() || Object.keys(logContents).length === 0 || apiAvailable === false}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {isStreaming ? 'Receiving response...' : 'Analyzing...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearResponse}
                    disabled={!query}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Press Shift+Enter for a new line. Press Enter to send.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {logDictionary && (
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 flex items-center">
          <div className="flex-shrink-0 mr-2">
            <Server className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-300">
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