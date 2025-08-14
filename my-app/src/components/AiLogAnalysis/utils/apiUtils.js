import { MODEL_CONTEXT_LIMITS, MODEL_DETECTION_PATTERNS } from '../constants/apiConstants';

/**
 * Detect the model name and context limit from an API endpoint
 * @param {string} apiEndpoint The API endpoint URL
 * @param {string} apiProvider The API provider type (LM_STUDIO, OLLAMA, CUSTOM)
 * @param {string} userModelName User-specified model name (for Ollama)
 * @returns {Promise<Object>} Object containing modelName and contextLimit
 */
export const detectModelCapabilities = async (apiEndpoint, apiProvider, userModelName = '') => {
  try {
    const detectionConfig = MODEL_DETECTION_PATTERNS[apiProvider];
    if (!detectionConfig) {
      return { modelName: 'Unknown', contextLimit: MODEL_CONTEXT_LIMITS.default };
    }

    // For LM Studio, the baseUrl should be constructed more carefully
    let baseUrl;
    if (apiProvider === 'LM_STUDIO') {
      // LM Studio endpoint: http://localhost:1234/v1/chat/completions
      // We want base: http://localhost:1234
      baseUrl = apiEndpoint.replace('/v1/chat/completions', '');
    } else if (apiProvider === 'OLLAMA') {
      // Ollama endpoint: http://localhost:11434/api/chat
      // We want base: http://localhost:11434
      baseUrl = apiEndpoint.replace('/api/chat', '');
    } else {
      // For custom endpoints, try to extract base URL
      // Remove the last path segment
      baseUrl = apiEndpoint.replace(/\/[^\/]*$/, '');
      // If it ends with /v1, that's probably fine to keep
    }
    
    const detectionUrl = `${baseUrl}${detectionConfig.endpoint}`;
    
    console.log(`Detecting model capabilities for ${apiProvider}`);
    console.log(`Original endpoint: ${apiEndpoint}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Detection URL: ${detectionUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(detectionUrl, {
      method: detectionConfig.method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let modelName = 'Unknown';
    let contextLimit = MODEL_CONTEXT_LIMITS.default;

    console.log(`Model detection response for ${apiProvider}:`, data);

    if (apiProvider === 'LM_STUDIO' || apiProvider === 'CUSTOM') {
      // OpenAI-compatible API response format
      if (data.data && data.data.length > 0) {
        modelName = data.data[0].id || 'Unknown';
      }
    } else if (apiProvider === 'OLLAMA') {
      // Ollama API response format
      if (userModelName) {
        // Use user-specified model name for Ollama
        modelName = userModelName;
      } else if (data.models && data.models.length > 0) {
        modelName = data.models[0].name || 'Unknown';
      }
    }

    // Look up context limit based on model name
    contextLimit = getContextLimitForModel(modelName);

    console.log(`Detected model: ${modelName}, context limit: ${contextLimit}`);
    return { modelName, contextLimit };
  } catch (error) {
    console.error('Error detecting model capabilities:', error);
    return { 
      modelName: userModelName || 'Unknown', 
      contextLimit: userModelName ? getContextLimitForModel(userModelName) : MODEL_CONTEXT_LIMITS.default 
    };
  }
};

/**
 * Get context limit for a specific model name
 * @param {string} modelName The model name to look up
 * @returns {number} Context limit in tokens
 */
export const getContextLimitForModel = (modelName) => {
  if (!modelName || modelName === 'Unknown') {
    return MODEL_CONTEXT_LIMITS.default;
  }

  // Normalize model name for lookup
  const normalizedName = modelName.toLowerCase().trim();

  // Direct match
  if (MODEL_CONTEXT_LIMITS[normalizedName]) {
    return MODEL_CONTEXT_LIMITS[normalizedName];
  }

  // Pattern matching for common model variations
  for (const [knownModel, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (knownModel === 'default') continue;
    
    // Check if the model name contains the known model pattern
    if (normalizedName.includes(knownModel) || knownModel.includes(normalizedName)) {
      return limit;
    }
  }

  // Special case patterns
  if (normalizedName.includes('gpt-4') && normalizedName.includes('32k')) {
    return MODEL_CONTEXT_LIMITS['gpt-4-32k'];
  }
  if (normalizedName.includes('gpt-4') && (normalizedName.includes('turbo') || normalizedName.includes('preview'))) {
    return MODEL_CONTEXT_LIMITS['gpt-4-turbo'];
  }
  if (normalizedName.includes('gpt-3.5') && normalizedName.includes('16k')) {
    return MODEL_CONTEXT_LIMITS['gpt-3.5-turbo-16k'];
  }
  if (normalizedName.includes('claude-3')) {
    return MODEL_CONTEXT_LIMITS['claude-3-sonnet']; // Default to sonnet
  }
  if (normalizedName.includes('llama') && normalizedName.includes('3')) {
    return MODEL_CONTEXT_LIMITS['llama3'];
  }
  if (normalizedName.includes('llama') && normalizedName.includes('2')) {
    return MODEL_CONTEXT_LIMITS['llama2'];
  }

  // Fallback to default
  return MODEL_CONTEXT_LIMITS.default;
};

/**
 * Process log files for AI analysis
 * @param {Object} logContents Object containing log file contents
 * @param {Function} progressCallback Optional callback for progress updates
 * @returns {Promise<string>} Combined and formatted log content
 */
export const processCombinedLogs = async (logContents, progressCallback = () => {}) => {
  // Combine and truncate logs if they're too large
  let combinedLogs = '';
  const MAX_TOTAL_SIZE = 500000; // characters total across all files
  const fileEntries = Object.entries(logContents);
  const totalFiles = fileEntries.length;
  
  // Calculate dynamic max size per file based on number of files
  const MAX_SIZE_PER_FILE = totalFiles > 0 
    ? Math.floor(MAX_TOTAL_SIZE / totalFiles) 
    : MAX_TOTAL_SIZE;
  
  // Add each file's content with a header, processing asynchronously
  for (let i = 0; i < fileEntries.length; i++) {
    const [fileName, content] = fileEntries[i];
    
    // Yield to UI thread to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // Update progress if callback provided
    progressCallback(Math.round((i / totalFiles) * 100));
    
    const truncatedContent = content.length > MAX_SIZE_PER_FILE
      ? content.substring(0, MAX_SIZE_PER_FILE) + "...[truncated]"
      : content;
      
    combinedLogs += `\n\n===== FILE: ${fileName} =====\n${truncatedContent}`;
    
    // Ensure total size isn't too large as we go
    if (combinedLogs.length > MAX_TOTAL_SIZE * 0.9) { // Start truncating before hitting the hard limit
      break;
    }
  }
  
  // Final size check
  if (combinedLogs.length > MAX_TOTAL_SIZE) {
    combinedLogs = combinedLogs.substring(0, MAX_TOTAL_SIZE) + "\n\n...[content truncated due to size]";
  }
  
  // Final progress update
  progressCallback(100);
  
  return combinedLogs;
};

/**
 * Format log dictionary for AI prompt
 * @param {Array} logDictionary Array of pattern objects
 * @returns {string} Formatted dictionary string for AI prompt
 */
export const formatLogDictionary = (logDictionary) => {
  if (!logDictionary || logDictionary.length === 0) {
    return '';
  }
  
  let dictionaryInfo = '\n\n===== LOG PATTERNS DICTIONARY =====\n';
  dictionaryInfo += 'Use these known log patterns to help with your analysis:\n\n';
  
  logDictionary.forEach((pattern, index) => {
    dictionaryInfo += `Pattern ${index + 1}:\n`;
    dictionaryInfo += `Category: ${pattern.category}\n`;
    dictionaryInfo += `Regex: ${pattern.regex_pattern}\n`;
    dictionaryInfo += `Cause: ${pattern.cause}\n`;
    dictionaryInfo += `Severity: ${pattern.severity}\n`;
    dictionaryInfo += `Suggestions: ${pattern.suggestions}\n\n`;
  });
  
  return dictionaryInfo;
};

/**
 * Create a system prompt for the AI
 * @param {string} dictionaryInfo Formatted dictionary information
 * @returns {string} System prompt for the AI
 */
export const createSystemPrompt = (dictionaryInfo) => {
  return `You are an AI log analyzer. Your task is to analyze log files and provide insights.
      
Analyze the log content below carefully. When providing answers:
1. Be specific and technical in your analysis
2. Identify patterns, errors, and potential issues
3. Provide context and suggest possible causes for issues
4. If appropriate, suggest solutions to identified problems
5. When possible, cite specific line numbers or timestamps from the logs

${dictionaryInfo ? 'You have been provided with a log patterns dictionary that contains known patterns, their causes, severity levels, and suggested solutions. Use these patterns to enhance your analysis.' : ''}`;
};

/**
 * Prepare request messages for the API
 * @param {Object} params Object containing query, logContents, logDictionary, contextSize, and chatHistory
 * @returns {Array} Formatted messages for API request
 */
export const prepareApiMessages = ({ query, logContents, logDictionary, contextSize, chatHistory }) => {
  // Create system prompt with dictionary info if available
  const dictionaryInfo = logDictionary ? formatLogDictionary(logDictionary) : '';
  const systemPrompt = createSystemPrompt(dictionaryInfo);

  // Process and combine logs
  const combinedLogs = Object.entries(logContents)
    .map(([filename, content]) => `File: ${filename}\n${content}`)
    .join('\n\n');

  // Calculate approximate token count (chars/4)
  const systemTokens = Math.ceil(systemPrompt.length / 4);
  const queryTokens = Math.ceil(query.length / 4);
  const availableTokens = contextSize - systemTokens - queryTokens - 100; // 100 tokens buffer

  // Truncate logs if they exceed available tokens
  let processedLogs = combinedLogs;
  if (Math.ceil(combinedLogs.length / 4) > availableTokens) {
    // If logs are too large, take content from the start and end
    const charsPerToken = 4;
    const availableChars = availableTokens * charsPerToken;
    const halfChars = Math.floor(availableChars / 2);
    
    const start = combinedLogs.substring(0, halfChars);
    const end = combinedLogs.substring(combinedLogs.length - halfChars);
    
    processedLogs = `${start}\n\n[...TRUNCATED...]\n\n${end}`;
  }

  // Prepare messages array
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `Here are the log files to analyze:\n\n${processedLogs}\n\nQuery: ${query}`
    }
  ];

  // Add relevant chat history if available
  if (chatHistory && chatHistory.length > 0) {
    // Only include the last few messages to stay within context
    const recentHistory = chatHistory.slice(-4); // Keep last 4 messages
    messages.splice(1, 0, ...recentHistory);
  }

  return messages;
};