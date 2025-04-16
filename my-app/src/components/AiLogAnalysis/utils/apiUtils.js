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
 * @param {Array} chatHistory Chat history array
 * @param {string} currentQuery User's current query
 * @param {string} combinedLogs Combined log content
 * @param {string} dictionaryInfo Dictionary information
 * @param {string} systemPrompt System prompt
 * @returns {Array} Formatted messages for API request
 */
export const prepareApiMessages = (chatHistory, currentQuery, combinedLogs, dictionaryInfo, systemPrompt) => {
  // Filter out any messages with empty content fields
  const validChatHistory = chatHistory.filter(msg => msg.content && msg.content.trim() !== '');
  
  return [
    { role: 'system', content: systemPrompt },
    // Add previous relevant messages from chat history (limit to last 10)
    ...validChatHistory.slice(-10),
    { 
      role: 'user', 
      content: `${currentQuery}\n\nHere are the log files to analyze:${combinedLogs}${dictionaryInfo}` 
    }
  ];
};