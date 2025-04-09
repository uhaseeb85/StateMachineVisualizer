import { DEMO_RESPONSES, DEMO_KEYWORDS } from '../constants/apiConstants';

/**
 * Adds a message to the status log
 * @param {Function} setStatusLog State setter function for status logs 
 * @param {string} message Message to add to log
 * @param {boolean} isError Whether this is an error message
 */
export const addStatusLog = (setStatusLog, message, isError = false) => {
  const timestamp = new Date().toLocaleTimeString();
  setStatusLog(prev => [...prev, { message, timestamp, isError }]);
};

/**
 * Checks if the AI API is available by making a test request
 * @param {string} apiEndpoint The API endpoint URL
 * @param {string} apiProvider The provider name (LM_STUDIO, OLLAMA, or CUSTOM)
 * @param {Function} setApiAvailable State setter for API availability
 * @param {Function} statusLogFunc Status log function
 */
export const checkApiConnection = async (apiEndpoint, apiProvider, setApiAvailable, statusLogFunc) => {
  try {
    statusLogFunc(`Checking AI API connection...`);
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
      statusLogFunc("AI API connected successfully");
    } else {
      setApiAvailable(false);
      statusLogFunc("AI API returned an error", true);
    }
  } catch (error) {
    console.error("API connection error:", error);
    setApiAvailable(false);
    statusLogFunc(`Failed to connect to AI API: ${error.message}`, true);
  }
};

/**
 * Gets a demo response based on query content
 * @param {string} userQuery The user's query text
 * @returns {string} Appropriate demo response
 */
export const getDemoResponse = (userQuery) => {
  // Ensure we have a string to work with
  const query = (userQuery || "").toLowerCase();
  
  // Default response if query is empty or none of the keywords match
  if (!query.trim()) {
    return DEMO_RESPONSES.default || "I've analyzed your logs and found some interesting patterns. Would you like me to explain them in detail?";
  }
  
  // Check for keyword matches
  if (DEMO_KEYWORDS.error.some(keyword => query.includes(keyword))) {
    return DEMO_RESPONSES.error || "I've found several error patterns in your logs that might need attention.";
  } else if (DEMO_KEYWORDS.performance.some(keyword => query.includes(keyword))) {
    return DEMO_RESPONSES.performance || "Your logs show some performance issues that could be optimized.";
  } else if (DEMO_KEYWORDS.authentication.some(keyword => query.includes(keyword))) {
    return DEMO_RESPONSES.authentication || "I've analyzed the authentication events in your logs and found some patterns worth reviewing.";
  } else if (DEMO_KEYWORDS.summary.some(keyword => query.includes(keyword))) {
    return DEMO_RESPONSES.summary || "Here's a summary of the main events in your logs.";
  }
  
  // Fallback to default response
  return DEMO_RESPONSES.default || "I've analyzed your logs and found some interesting patterns. Would you like me to explain them in detail?";
}; 