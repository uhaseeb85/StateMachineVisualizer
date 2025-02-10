/**
 * Splunk API Integration Module
 * 
 * Provides modern REST API integration with Splunk Enterprise using token-based authentication.
 * This module implements two main functions:
 * 1. Searching Splunk logs with polling for results
 * 2. Testing Splunk connectivity and authentication
 * 
 * The implementation follows Splunk's REST API best practices and includes
 * proper error handling and timeout mechanisms.
 * 
 * @typedef {Object} SplunkConfig
 * @property {string} serverUrl - Splunk server URL (e.g., https://splunk.example.com)
 * @property {string} port - Server port number (e.g., 8089)
 * @property {string} token - Authentication token
 * @property {string} index - Splunk index name
 * 
 * @typedef {Object} SplunkSearchResult
 * @property {string} _raw - Raw log message
 * @property {string} _time - Timestamp
 * @property {string} source - Log source
 * @property {string} sourcetype - Log source type
 * @property {string} host - Host name
 * @property {Object} [fields] - Additional fields
 */

// Constants for API configuration
const POLL_INTERVAL = 1000; // Time between polling attempts (1 second)
const MAX_POLL_ATTEMPTS = 30; // Maximum number of polling attempts (30 seconds total)
const REQUEST_TIMEOUT = 10000; // Request timeout (10 seconds)
const MAX_RETRIES = 3; // Maximum number of retry attempts for network failures

/**
 * Handles fetch requests with timeout and retry logic
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} If request fails after all retries
 */
async function fetchWithRetry(url, options) {
  let lastError;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry if it was a timeout or abort
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      // Only retry on network errors
      if (attempt < MAX_RETRIES - 1 && error.name === 'TypeError') {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
}

/**
 * Execute a search query against Splunk and retrieve results
 * 
 * @param {SplunkConfig} config - Splunk configuration object
 * @param {string} searchQuery - The search query to execute
 * @returns {Promise<SplunkSearchResult[]>} Array of search results
 * @throws {Error} If search creation, execution, or result retrieval fails
 */
export async function searchSplunk(config, searchQuery) {
  try {
    const baseUrl = `${config.serverUrl}:${config.port}`;
    const headers = {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Step 1: Create a new search job
    const searchJobResponse = await fetchWithRetry(
      `${baseUrl}/services/search/jobs`,
      {
        method: 'POST',
        headers,
        body: `search=${encodeURIComponent(searchQuery)}&output_mode=json`,
      }
    );

    const searchJobData = await searchJobResponse.json();
    const sid = searchJobData.sid;

    if (!sid) {
      throw new Error('Invalid search job response: missing sid');
    }

    // Step 2: Poll for search completion
    let isDone = false;
    let attempts = 0;
    let results = [];

    while (!isDone && attempts < MAX_POLL_ATTEMPTS) {
      // Check job status
      const statusResponse = await fetchWithRetry(
        `${baseUrl}/services/search/jobs/${sid}?output_mode=json`,
        { headers }
      );

      const statusData = await statusResponse.json();
      
      if (!statusData.entry?.[0]?.content) {
        throw new Error('Invalid status response format');
      }
      
      isDone = statusData.entry[0].content.isDone;

      if (isDone) {
        // Step 3: Retrieve results once search is complete
        const resultsResponse = await fetchWithRetry(
          `${baseUrl}/services/search/jobs/${sid}/results?output_mode=json`,
          { headers }
        );

        const resultsData = await resultsResponse.json();
        
        if (!Array.isArray(resultsData.results)) {
          throw new Error('Invalid results format');
        }
        
        results = resultsData.results;
        break;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }

    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error('Search job timed out');
    }

    return results;
  } catch (error) {
    console.error('Splunk API error:', error);
    
    // Enhance error messages for common failures
    if (error.name === 'TypeError') {
      throw new Error('Network error: Unable to connect to Splunk server');
    }
    if (error.message.includes('401')) {
      throw new Error('Authentication failed: Invalid token');
    }
    if (error.message.includes('403')) {
      throw new Error('Authorization failed: Insufficient permissions');
    }
    
    throw error;
  }
}

/**
 * Test Splunk connectivity and authentication
 * 
 * Attempts to make a simple API call to verify:
 * - Server is accessible
 * - Port is open
 * - Authentication token is valid
 * - User has appropriate permissions
 * 
 * @param {SplunkConfig} config - Splunk configuration object
 * @returns {Promise<boolean>} True if connection is successful
 * @throws {Error} If connection test fails with specific error message
 */
export async function testSplunkConnection(config) {
  try {
    const baseUrl = `${config.serverUrl}:${config.port}`;
    
    // Attempt to list a single search job to verify connectivity
    const response = await fetchWithRetry(
      `${baseUrl}/services/search/jobs?output_mode=json&count=1`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      }
    );

    const data = await response.json();
    
    // Verify response format
    if (!data.entry) {
      throw new Error('Invalid response format from Splunk server');
    }

    return true;
  } catch (error) {
    console.error('Splunk connection test failed:', error);
    
    // Provide specific error messages for different failure cases
    if (error.name === 'TypeError') {
      throw new Error('Unable to connect to Splunk server. Please verify the server URL and port.');
    }
    if (error.message.includes('401')) {
      throw new Error('Invalid authentication token. Please check your token and try again.');
    }
    if (error.message.includes('403')) {
      throw new Error('Insufficient permissions. Please verify your token has the required permissions.');
    }
    
    throw new Error('Failed to connect to Splunk: ' + error.message);
  }
}
