// Default API endpoints
export const DEFAULT_ENDPOINTS = {
  LM_STUDIO: "http://localhost:1234/v1/chat/completions",
  OLLAMA: "http://localhost:11434/api/chat",
  CUSTOM: "http://your-llm-server/v1/chat/completions"
};

// Known model context limits (in tokens)
export const MODEL_CONTEXT_LIMITS = {
  // OpenAI models
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-16k': 16384,
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-4-turbo': 128000,
  'gpt-4o': 128000,
  
  // Anthropic Claude
  'claude-3-haiku': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-opus': 200000,
  'claude-instant': 100000,
  
  // Common open source models
  'llama2': 4096,
  'llama2-7b': 4096,
  'llama2-13b': 4096,
  'llama2-70b': 4096,
  'llama3': 8192,
  'llama3-8b': 8192,
  'llama3-70b': 8192,
  'mistral': 8192,
  'mistral-7b': 8192,
  'codellama': 16384,
  'phi3': 4096,
  'gemma': 8192,
  
  // Default fallback
  'default': 4096
};

// Provider-specific model detection patterns
export const MODEL_DETECTION_PATTERNS = {
  LM_STUDIO: {
    endpoint: '/v1/models',
    method: 'GET'
  },
  OLLAMA: {
    endpoint: '/api/tags',
    method: 'GET'
  },
  CUSTOM: {
    endpoint: '/v1/models',
    method: 'GET'
  }
};

// Demo mode sample responses
export const DEMO_RESPONSES = {
  greeting: "I'm analyzing your log files in demo mode. What would you like to know about your logs?",
  default: "Based on my analysis of your log files, I can see several patterns. There appear to be some connection issues and authentication errors in these logs. I also notice some resource utilization spikes that might indicate a performance bottleneck. Would you like me to focus on a specific area?",
  error: "I've identified several error patterns in your logs:\n\n1. Database connection failures at timestamps 15:42:13 and 16:03:27\n2. Multiple failed authentication attempts from IP 192.168.1.105\n3. Memory usage spike to 92% at 15:58:32\n\nThe database errors appear to be related to timeout issues, possibly due to high query volume. Would you like me to provide more details on any of these issues?",
  performance: "Analyzing performance patterns in your logs:\n\n- Response time increased from avg 120ms to 350ms between 15:45 and 16:15\n- Database query time doubled during this period\n- Memory utilization peaked at 92%\n- CPU usage remained steady at 70-75%\n\nThis suggests a database-related bottleneck rather than a CPU constraint. The logs show several slow queries that might benefit from optimization.",
  authentication: "Authentication analysis of your logs:\n\n- 7 failed login attempts from IP 192.168.1.105 between 15:40-15:43\n- 3 successful logins from the same IP at 15:44\n- 2 password resets for user 'jsmith' at 15:39\n\nThis pattern could indicate a brute force attempt that eventually succeeded. I recommend reviewing the account activity for 'jsmith' and possibly implementing additional security measures like IP-based rate limiting.",
  summary: "Summary of log activity between 15:30-16:30:\n\n- 12 error events (7 authentication, 3 database, 2 resource)\n- 3 warning events (all performance related)\n- 2 critical events (memory usage at 15:58, database timeout at 16:03)\n\nMost urgent issues appear to be related to database performance and resource constraints. There's also a potential security concern with multiple failed login attempts."
};

// Keywords for smarter demo responses
export const DEMO_KEYWORDS = {
  error: ['error', 'exception', 'fail', 'issue', 'problem', 'crash', 'bug'],
  performance: ['performance', 'slow', 'speed', 'response time', 'latency', 'timeout', 'memory', 'cpu', 'resource', 'utilization'],
  authentication: ['auth', 'login', 'password', 'credential', 'access', 'permission', 'token', 'session', 'account', 'user'],
  summary: ['summary', 'overview', 'analyze', 'report', 'brief', 'highlight']
}; 