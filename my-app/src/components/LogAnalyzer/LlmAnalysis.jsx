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
import { AlertCircle, Settings, FileText, Brain, Send, X, RefreshCw, Server, Trash, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

// Default API endpoints
const DEFAULT_ENDPOINTS = {
  LM_STUDIO: "http://localhost:1234/v1/chat/completions",
  OLLAMA: "http://localhost:11434/api/chat",
  CUSTOM: "http://your-llm-server/v1/chat/completions"
};

// Demo mode sample responses
const DEMO_RESPONSES = {
  greeting: "I'm analyzing your log files in demo mode. What would you like to know about your logs?",
  default: "Based on my analysis of your log files, I can see several patterns. There appear to be some connection issues and authentication errors in these logs. I also notice some resource utilization spikes that might indicate a performance bottleneck. Would you like me to focus on a specific area?",
  error: "I've identified several error patterns in your logs:\n\n1. Database connection failures at timestamps 15:42:13 and 16:03:27\n2. Multiple failed authentication attempts from IP 192.168.1.105\n3. Memory usage spike to 92% at 15:58:32\n\nThe database errors appear to be related to timeout issues, possibly due to high query volume. Would you like me to provide more details on any of these issues?",
  performance: "Analyzing performance patterns in your logs:\n\n- Response time increased from avg 120ms to 350ms between 15:45 and 16:15\n- Database query time doubled during this period\n- Memory utilization peaked at 92%\n- CPU usage remained steady at 70-75%\n\nThis suggests a database-related bottleneck rather than a CPU constraint. The logs show several slow queries that might benefit from optimization.",
  authentication: "Authentication analysis of your logs:\n\n- 7 failed login attempts from IP 192.168.1.105 between 15:40-15:43\n- 3 successful logins from the same IP at 15:44\n- 2 password resets for user 'jsmith' at 15:39\n\nThis pattern could indicate a brute force attempt that eventually succeeded. I recommend reviewing the account activity for 'jsmith' and possibly implementing additional security measures like IP-based rate limiting.",
  summary: "Summary of log activity between 15:30-16:30:\n\n- 12 error events (7 authentication, 3 database, 2 resource)\n- 3 warning events (all performance related)\n- 2 critical events (memory usage at 15:58, database timeout at 16:03)\n\nMost urgent issues appear to be related to database performance and resource constraints. There's also a potential security concern with multiple failed login attempts."
};

// Verify demo responses are loaded
console.log("DEMO_RESPONSES loaded:", Object.keys(DEMO_RESPONSES).join(", "));
console.log("Default response length:", DEMO_RESPONSES.default.length);

// Keywords for smarter demo responses
const DEMO_KEYWORDS = {
  error: ['error', 'exception', 'fail', 'issue', 'problem', 'crash', 'bug'],
  performance: ['performance', 'slow', 'speed', 'response time', 'latency', 'timeout', 'memory', 'cpu', 'resource', 'utilization'],
  authentication: ['auth', 'login', 'password', 'credential', 'access', 'permission', 'token', 'session', 'account', 'user'],
  summary: ['summary', 'overview', 'analyze', 'report', 'brief', 'highlight']
};

const LlmAnalysis = ({ logFiles, sessionData, logDictionary }) => {
  // Debug log for component initialization
  console.log("LlmAnalysis component initializing");
  
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
  const [demoMode, setDemoMode] = useState(true); // Enable demo mode by default
  
  // Initialize chat history with initial message instead of from storage
  const [chatHistory, setChatHistory] = useState([{
    role: 'assistant',
    content: DEMO_RESPONSES.greeting,
    timestamp: new Date().toISOString()
  }]);
  
  // Log component setup
  console.log("Chat history initialized with greeting message");
  
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
        content: DEMO_RESPONSES.greeting,
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
          content: DEMO_RESPONSES.greeting,
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
        content: DEMO_RESPONSES.greeting,
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

  // Check API connection based on provider
  const checkApiConnection = async () => {
    try {
      addStatusLog(`Checking AI API connection...`);
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
        addStatusLog("AI API connected successfully");
      } else {
        setApiAvailable(false);
        addStatusLog("AI API returned an error", true);
      }
    } catch (error) {
      console.error("API connection error:", error);
      setApiAvailable(false);
      addStatusLog(`Failed to connect to AI API: ${error.message}`, true);
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

  // Add stop streaming functionality
  const stopStreaming = () => {
    if (isStreaming) {
      setIsStreaming(false);
      setLoading(false);
      addStatusLog('Streaming response stopped by user');
      
      // Update the streaming message in chat history to mark it as no longer streaming
      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === 'assistant' && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            streaming: false,
            content: updated[lastIndex].content + " [Stopped]"
          };
        }
        return updated;
      });
    }
  };

  // Get a demo response based on query content
  const getDemoResponse = (userQuery) => {
    // Ensure we have a string to work with
    const query = (userQuery || "").toLowerCase();
    
    // Add console log for debugging
    console.log("Demo mode response being generated for query:", query);
    
    // Default response if query is empty or none of the keywords match
    if (!query.trim()) {
      return DEMO_RESPONSES.default;
    }
    
    // Check for keyword matches
    if (DEMO_KEYWORDS.error.some(keyword => query.includes(keyword))) {
      return DEMO_RESPONSES.error;
    } else if (DEMO_KEYWORDS.performance.some(keyword => query.includes(keyword))) {
      return DEMO_RESPONSES.performance;
    } else if (DEMO_KEYWORDS.authentication.some(keyword => query.includes(keyword))) {
      return DEMO_RESPONSES.authentication;
    } else if (DEMO_KEYWORDS.summary.some(keyword => query.includes(keyword))) {
      return DEMO_RESPONSES.summary;
    }
    
    // Fallback to default response
    return DEMO_RESPONSES.default;
  };
  
  // Simulate streaming response in demo mode
  const simulateStreamingResponse = async (response) => {
    // Ensure we have a valid response string and log it for debugging
    if (!response) {
      console.error("Empty response provided to simulateStreamingResponse");
      toast.error("Demo response failed - empty content");
      setLoading(false);
      return;
    }
    
    const safeResponse = response;
    console.log("Simulating streaming response - length:", safeResponse.length);
    console.log("Response starts with:", safeResponse.substring(0, 50));

    // Add visible toast notification for debugging
    toast.info("Demo: Starting response simulation");
    
    setIsStreaming(true);
    setLoading(true);
    setStreamedResponse('');
    
    // Add a streaming message to chat history
    const streamingMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      streaming: true
    };
    
    console.log("Adding initial empty assistant message to chat history");
    setChatHistory(prev => [...prev, streamingMessage]);
    
    try {
      // Simplified approach - add content in chunks with slight delays
      const chunks = 10; // Split into 10 chunks regardless of content
      const chunkSize = Math.ceil(safeResponse.length / chunks);
      
      for (let i = 0; i < safeResponse.length; i += chunkSize) {
        if (!isStreaming) {
          console.log("Streaming was cancelled");
          break; // Stop if streaming was cancelled
        }
        
        const chunk = safeResponse.substring(i, i + chunkSize);
        console.log(`Adding chunk ${i/chunkSize + 1}/${chunks}, size: ${chunk.length}`);
        
        // Short delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100)); 
        
        setStreamedResponse(prev => prev + chunk);
        
        // Update the streaming message in chat history
        setChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].streaming) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk
            };
          }
          return updated;
        });
      }
      
      console.log("Completed adding all chunks to response");
    } catch (error) {
      console.error("Error in streaming simulation:", error);
      toast.error("Demo simulation error: " + error.message);
      
      // If streaming fails, add the full response at once as a fallback
      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: safeResponse,
            streaming: false
          };
        }
        return updated;
      });
    } finally {
      // Mark streaming as complete
      setIsStreaming(false);
      setLoading(false);
      
      console.log("Finishing streaming process");
      // Toast for debugging
      toast.success("Demo: Response completed");
      
      // Update the message to no longer be streaming
      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].streaming) {
          console.log("Marking last chat message as complete");
          updated[lastIndex] = {
            ...updated[lastIndex],
            streaming: false
          };
        }
        return updated;
      });
      
      addStatusLog('Completed demo response');
    }
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
        content: query,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      const currentQuery = query; // Store the current query before clearing
      setQuery(''); // Clear input after sending
      
      // Use demo mode if enabled or if API is not available
      if (demoMode || apiAvailable === false) {
        addStatusLog("Using demo mode for response");
        toast.info("Demo mode: Generating response");
        
        // SIMPLIFIED APPROACH: Directly add response without streaming
        console.log("Adding direct demo response");
        
        // Get appropriate demo response based on query
        let responseText = "";
        if (currentQuery.toLowerCase().includes("error")) {
          responseText = DEMO_RESPONSES.error;
        } else if (currentQuery.toLowerCase().includes("performance")) {
          responseText = DEMO_RESPONSES.performance;
        } else {
          responseText = DEMO_RESPONSES.default;
        }
        
        console.log("Demo response text (first 50 chars):", responseText.substring(0, 50));
        
        // Add directly to chat history
        setTimeout(() => {
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: responseText,
            timestamp: new Date().toISOString()
          }]);
          
          setLoading(false);
          addStatusLog("Demo response complete");
          toast.success("Response generated");
        }, 500); // Small delay to simulate processing
        
        return;
      }
      
      // Continue with real API call if not in demo mode
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
            content: `${currentQuery}\n\nHere are the log files to analyze:${combinedLogs}${dictionaryInfo}` 
          }
        ];
      } else if (apiProvider === 'OLLAMA') {
        messages = [
          { role: 'system', content: systemPrompt },
          // Add previous relevant messages from chat history (limit to last 10)
          ...chatHistory.slice(-10),
          { 
            role: 'user', 
            content: `${currentQuery}\n\nHere are the log files to analyze:${combinedLogs}${dictionaryInfo}` 
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

  // Render API settings
  const renderSettings = () => (
    <div className="p-5 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">
        AI Connection Settings
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Demo Mode
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Simulate AI responses for demonstration purposes
              </p>
            </div>
          </div>
          <Button
            onClick={toggleDemoMode}
            variant={demoMode ? "default" : "outline"}
            size="sm"
            className={demoMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
          >
            {demoMode ? "Enabled" : "Disabled"}
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            AI Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={apiProvider === 'LM_STUDIO' ? 'default' : 'outline'}
              className={`text-xs ${apiProvider === 'LM_STUDIO' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              onClick={() => setApiProvider('LM_STUDIO')}
              disabled={demoMode}
            >
              LM Studio
            </Button>
            <Button
              variant={apiProvider === 'OLLAMA' ? 'default' : 'outline'}
              className={`text-xs ${apiProvider === 'OLLAMA' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              onClick={() => setApiProvider('OLLAMA')}
              disabled={demoMode}
            >
              Ollama
            </Button>
            <Button
              variant={apiProvider === 'CUSTOM' ? 'default' : 'outline'}
              className={`text-xs ${apiProvider === 'CUSTOM' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              onClick={() => setApiProvider('CUSTOM')}
              disabled={demoMode}
            >
              Custom
            </Button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            API Endpoint
          </label>
          <Input
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="Enter API endpoint URL"
            disabled={demoMode}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {apiProvider === 'LM_STUDIO' && 'Default: http://localhost:1234/v1/chat/completions'}
            {apiProvider === 'OLLAMA' && 'Default: http://localhost:11434/api/chat'}
            {apiProvider === 'CUSTOM' && 'Enter your custom API endpoint URL'}
          </p>
        </div>
        
        {apiProvider === 'OLLAMA' && (
          <div>
            <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Model Name
            </label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="llama3"
              disabled={demoMode}
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
            disabled={demoMode}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Test Connection
          </Button>
        </div>
        
        <div className="text-xs mt-2">
          {demoMode ? (
            <p className="text-amber-600 dark:text-amber-400">✓ Demo mode is active - using simulated AI responses</p>
          ) : apiAvailable === true ? (
            <p className="text-green-600 dark:text-green-400">✓ Connected to AI API</p>
          ) : apiAvailable === false ? (
            <p className="text-red-600 dark:text-red-400">✗ Cannot connect to AI</p>
          ) : (
            <p className="text-gray-500">Connection status unknown</p>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render a chat message with safety checks
  const renderChatMessage = (message, index) => {
    // Safety check - if message is invalid, provide fallback
    if (!message || typeof message !== 'object') {
      console.error("Invalid message object at index", index);
      return (
        <div key={`error-${index}`} className="p-2 bg-red-100 text-red-700 rounded mb-2">
          Error rendering message: Invalid data
        </div>
      );
    }
    
    const isUser = message.role === 'user';
    const content = message.content || "(No content)";  // Safe fallback for content
    const formattedTime = message.timestamp ? 
      new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      "Unknown time";
    
    console.log(`Rendering message ${index}: role=${message.role}, content length=${content.length}`);
    
    return (
      <div 
        key={index} 
        className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}
      >
        <div className={`inline-block max-w-[80%] px-4 py-3 rounded-lg border ${isUser ? 'border-blue-300' : 'border-gray-300'}
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
            {content}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI-Powered Log Analysis
        </h2>
        <div className="flex gap-3 self-end sm:self-auto">
          <Button 
            variant="primary" 
            onClick={() => setShowSettings(!showSettings)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            AI Settings
          </Button>
          {chatHistory.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearChatHistory}
              className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          )}
        </div>
      </div>
      
      {demoMode && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
          <div className="flex items-start">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Demo Mode Active
              </h3>
              <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                <p>This is a demonstration with simulated AI responses. Your log files are being read, but analysis is performed using pre-defined responses.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showSettings && renderSettings()}
      
      {/* API Connection Warning */}
      {apiAvailable === false && !demoMode && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                Cannot Connect to AI Service
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p className="mb-2">
                  Unable to connect to the specified AI service. You can enable Demo Mode for testing or check your network connection and endpoint settings.
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 border-red-300"
                    onClick={checkApiConnection}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry Connection
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={toggleDemoMode}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Enable Demo Mode
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!logFiles || logFiles.length === 0 && !demoMode ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
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
      ) : null}
      
      {/* Two-pane layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Right pane - Chat interface */}
        <div className="flex flex-col h-full">
          {/* Chat messages container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-y-auto p-4"
            style={{ height: "60vh", minHeight: "400px" }}
          >
            {chatHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p>Ask a question about your logs to get started</p>
                </div>
              </div>
            ) : (
              <div>
                {chatHistory.map((message, index) => (
                  renderChatMessage(message, index)
                ))}
                {demoMode && (
                  <div className="mt-2 p-2 rounded bg-amber-50 text-amber-700 text-sm">
                    <p>Demo mode active - responses are simulated</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Query Input */}
          <div className="space-y-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={(!logFiles || logFiles.length === 0) && !demoMode ? "Upload log files first to start analysis" : "Ask a question about your logs..."}
              className="min-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuerySubmit();
                }
              }}
              disabled={(!logFiles || logFiles.length === 0) && !demoMode}
            />
            <div className="flex space-x-3">
              <Button 
                onClick={handleQuerySubmit}
                disabled={loading || !query.trim() || (Object.keys(logContents).length === 0 && !demoMode) || (apiAvailable === false && !demoMode) || isStreaming}
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
              
              {isStreaming ? (
                <Button 
                  variant="destructive" 
                  onClick={stopStreaming}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={clearResponse}
                  disabled={!query}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Press Shift+Enter for a new line. Press Enter to send.
            </p>
          </div>
        </div>
      </div>
      
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