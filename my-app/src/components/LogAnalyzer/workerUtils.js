/**
 * Worker Utilities for Log Analyzer
 * 
 * Helper functions to manage Web Workers for regex pattern processing
 */

/**
 * Split an array into chunks
 * @param {Array} array - Array to split
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array} Array of chunks
 */
export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Merge results from multiple workers
 * @param {Array} workerResults - Results from all workers
 * @returns {Array} Merged results
 */
export const mergeWorkerResults = (workerResults) => {
  const mergedMap = new Map();
  
  // Combine all results
  workerResults.forEach(results => {
    results.forEach(result => {
      if (mergedMap.has(result.pattern.category)) {
        // If category exists, update count
        const existing = mergedMap.get(result.pattern.category);
        existing.totalMatches += result.totalMatches;
      } else {
        // Add new category
        mergedMap.set(result.pattern.category, {
          pattern: result.pattern,
          firstMatch: result.firstMatch,
          totalMatches: result.totalMatches
        });
      }
    });
  });
  
  // Convert map to array and sort by severity
  return Array.from(mergedMap.values()).sort((a, b) => {
    const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return severityOrder[a.pattern.severity] - severityOrder[b.pattern.severity];
  });
};

/**
 * Process logs using Web Workers
 * @param {Array} logs - Array of log entries
 * @param {Array} patterns - Array of regex patterns
 * @param {Function} progressCallback - Function to call with progress updates
 * @returns {Promise<Array>} Promise resolving to matched results
 */
export const processLogsWithWorkers = (logs, patterns, progressCallback = () => {}) => {
  return new Promise((resolve, reject) => {
    if (!logs || !patterns || logs.length === 0 || patterns.length === 0) {
      resolve([]);
      return;
    }
    
    // Optimal number of workers based on available CPU cores
    // Use navigator.hardwareConcurrency with a fallback to 4
    const optimalWorkerCount = Math.min(
      Math.max(2, navigator.hardwareConcurrency || 4),
      5 // Cap at 5 workers to avoid excessive resource usage
    );
    
    // Create pattern batches - distribute patterns across workers
    const patternBatches = chunkArray(patterns, Math.ceil(patterns.length / optimalWorkerCount));
    
    // Track progress for each worker
    const workerProgress = new Map();
    const workerResults = new Map();
    
    // Create and start workers
    const workers = patternBatches.map((patternBatch, index) => {
      const worker = new Worker('/regexWorker.js');
      const workerId = `worker-${index}`;
      
      workerProgress.set(workerId, 0);
      
      // Handle messages from worker
      worker.onmessage = (e) => {
        const { type, workerId, value, results, error } = e.data;
        
        if (type === 'progress') {
          // Update progress
          workerProgress.set(workerId, value);
          
          // Calculate overall progress - average of all workers
          const totalProgress = Array.from(workerProgress.values())
            .reduce((sum, val) => sum + val, 0) / workerProgress.size;
          
          progressCallback(Math.round(totalProgress));
        } 
        else if (type === 'result') {
          // Store results
          workerResults.set(workerId, results);
          
          // Check if all workers are done
          if (workerResults.size === patternBatches.length) {
            // All workers completed - merge results
            const allResults = mergeWorkerResults(Array.from(workerResults.values()));
            
            // Terminate all workers
            workers.forEach(w => w.terminate());
            
            // Resolve with merged results
            resolve(allResults);
          }
        }
        else if (type === 'error') {
          console.error(`Worker ${workerId} error:`, error);
          reject(new Error(`Worker error: ${error}`));
          
          // Terminate all workers
          workers.forEach(w => w.terminate());
        }
      };
      
      // Handle worker errors
      worker.onerror = (error) => {
        console.error(`Worker ${workerId} error:`, error);
        reject(error);
        
        // Terminate all workers
        workers.forEach(w => w.terminate());
      };
      
      // Start the worker
      worker.postMessage({
        logs,
        patterns: patternBatch,
        workerId
      });
      
      return worker;
    });
    
    // Add a timeout safety mechanism in case workers get stuck
    const timeout = setTimeout(() => {
      console.warn('Worker processing timeout - forcing completion');
      
      // If any workers are still running, terminate them
      workers.forEach(worker => worker.terminate());
      
      // If we have some results, return them
      if (workerResults.size > 0) {
        const partialResults = mergeWorkerResults(Array.from(workerResults.values()));
        resolve(partialResults);
      } else {
        // No results at all
        reject(new Error('Processing timed out without results'));
      }
    }, 120000); // 2 minute timeout
    
    // Clear timeout when all workers complete
    const clearTimeoutWhenDone = () => {
      clearTimeout(timeout);
    };
    
    // Add the clear timeout callback to the promise chain
    resolve.then = function(onFulfilled, onRejected) {
      return Promise.prototype.then.call(this, 
        result => {
          clearTimeoutWhenDone();
          return onFulfilled ? onFulfilled(result) : result;
        },
        error => {
          clearTimeoutWhenDone();
          return onRejected ? onRejected(error) : Promise.reject(error);
        }
      );
    };
  });
}; 