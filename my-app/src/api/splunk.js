// Modern Splunk REST API integration with token-based authentication
export async function searchSplunk(config, searchQuery) {
  try {
    const baseUrl = `${config.serverUrl}:${config.port}`;

    // Create search job
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

    // Poll for results
    let isDone = false;
    let attempts = 0;
    const maxAttempts = 30;
    let results = [];

    while (!isDone && attempts < maxAttempts) {
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
        // Get results
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
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
    }

    if (attempts >= maxAttempts) {
      throw new Error('Search job timed out');
    }

    return results;
  } catch (error) {
    console.error('Splunk API error:', error);
    throw error;
  }
}

export async function testSplunkConnection(config) {
  try {
    const baseUrl = `${config.serverUrl}:${config.port}`;
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
