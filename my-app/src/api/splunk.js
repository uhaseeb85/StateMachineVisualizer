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
 */

// Constants for API configuration
const POLL_INTERVAL = 1000; // Time between polling attempts (1 second)
const MAX_POLL_ATTEMPTS = 30; // Maximum number of polling attempts (30 seconds total)

/**
 * Execute a search query against Splunk and retrieve results
 * 
 * @param {Object} config - Splunk configuration object
 * @param {string} config.serverUrl - Splunk server URL
 * @param {string} config.port - Splunk server port
 * @param {string} config.token - Authentication token
 * @param {string} searchQuery - The search query to execute
 * @returns {Promise<Array>} Array of search results
 * @throws {Error} If search creation, execution, or result retrieval fails
 */
export async function searchSplunk(config, searchQuery) {
  try {
    const baseUrl = `${config.serverUrl}:${config.port}`;

    // Step 1: Create a new search job
    const searchJobResponse = await fetch(`${baseUrl}/services/search/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `search=${encodeURIComponent(searchQuery)}&output_mode=json`,
    });

    if (!searchJobResponse.ok) {
      throw new Error('Failed to create search job');
    }

    const searchJobData = await searchJobResponse.json();
    const sid = searchJobData.sid;

    // Step 2: Poll for search completion
    let isDone = false;
    let attempts = 0;
    let results = [];

    while (!isDone && attempts < MAX_POLL_ATTEMPTS) {
      // Check job status
      const statusResponse = await fetch(
        `${baseUrl}/services/search/jobs/${sid}?output_mode=json`,
        {
          headers: {
            'Authorization': `Bearer ${config.token}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error('Failed to check job status');
      }

      const statusData = await statusResponse.json();
      isDone = statusData.entry[0].content.isDone;

      if (isDone) {
        // Step 3: Retrieve results once search is complete
        const resultsResponse = await fetch(
          `${baseUrl}/services/search/jobs/${sid}/results?output_mode=json`,
          {
            headers: {
              'Authorization': `Bearer ${config.token}`,
            },
          }
        );

        if (!resultsResponse.ok) {
          throw new Error('Failed to fetch results');
        }

        const resultsData = await resultsResponse.json();
        results = resultsData.results;
        break;
      }

      attempts++;
      // Wait before next poll attempt
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }

    // Check for timeout
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error('Search job timed out');
    }

    return results;
  } catch (error) {
    console.error('Splunk API error:', error);
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
 * @param {Object} config - Splunk configuration object
 * @param {string} config.serverUrl - Splunk server URL
 * @param {string} config.port - Splunk server port
 * @param {string} config.token - Authentication token
 * @returns {Promise<boolean>} True if connection is successful
 * @throws {Error} If connection test fails
 */
export async function testSplunkConnection(config) {
  try {
    const baseUrl = `${config.serverUrl}:${config.port}`;
    
    // Attempt to list a single search job to verify connectivity
    const response = await fetch(`${baseUrl}/services/search/jobs?output_mode=json&count=1`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    return true;
  } catch (error) {
    console.error('Splunk connection test failed:', error);
    throw error;
  }
}
