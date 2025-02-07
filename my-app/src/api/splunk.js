import * as splunk from 'splunk-sdk';

export async function searchSplunk(config, query) {
  const service = new splunk.Service({
    username: config.username,
    password: config.password,
    scheme: config.serverUrl.startsWith('https') ? 'https' : 'http',
    host: config.serverUrl.replace(/^https?:\/\//, ''),
    port: config.port,
    version: '8.0'
  });

  return new Promise((resolve, reject) => {
    service.search(query, { earliest_time: '-24h', latest_time: 'now' }, 
      (err, job) => {
        if (err) {
          reject(err);
          return;
        }

        job.fetch((err, job) => {
          if (err) {
            reject(err);
            return;
          }

          job.results({ count: 100 }, (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(results);
          });
        });
      }
    );
  });
} 