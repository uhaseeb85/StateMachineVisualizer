// Modern Splunk REST API integration
export async function searchSplunk(config, searchQuery) {
  try {
    // Get authentication token
    const authResponse = await fetch(`${config.host}/services/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`,
    });

    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }

    const authData = await authResponse.text();
    const sessionKey = authData.match(/<sessionKey>([^<]+)<\/sessionKey>/)[1];

    // Create search job
    const searchJobResponse = await fetch(`${config.host}/services/search/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Splunk ${sessionKey}`,
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
        `${config.host}/services/search/jobs/${sid}?output_mode=json`,
        {
          headers: {
            'Authorization': `Splunk ${sessionKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error('Failed to check job status');
      }

      const statusData = await statusResponse.json();
      const isDone = statusData.entry[0].content.isDone;

      if (isDone) {
        // Get results
        const resultsResponse = await fetch(
          `${config.host}/services/search/jobs/${sid}/results?output_mode=json`,
          {
            headers: {
              'Authorization': `Splunk ${sessionKey}`,
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

    return results;
  } catch (error) {
    console.error('Splunk API error:', error);
    throw error;
  }
}

export async function testSplunkConnection(config) {
  try {
    const authResponse = await fetch(`${config.host}/services/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`,
    });

    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }

    return true;
  } catch (error) {
    console.error('Splunk connection test failed:', error);
    throw error;
  }
} 