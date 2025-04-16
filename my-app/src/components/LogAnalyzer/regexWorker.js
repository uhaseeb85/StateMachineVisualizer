/**
 * Web Worker for regex pattern processing
 * 
 * This worker receives log entries and regex patterns,
 * performs matching in a separate thread to avoid blocking the UI,
 * and sends match results back to the main thread.
 * 
 * This file is loaded as a module-type worker in modern browsers.
 */

// Register the message handler - use self for the global scope
self.onmessage = function(e) {
  const { logs, patterns, workerId } = e.data;
  const matchGroups = new Map();
  
  // Progress tracking
  const totalOperations = logs.length * patterns.length;
  let completedOperations = 0;
  let lastReportedProgress = 0;
  
  // Report initial progress
  self.postMessage({
    type: 'progress',
    workerId,
    value: 0
  });
  
  try {
    // Compile regex patterns once for better performance
    const compiledPatterns = patterns.map(pattern => {
      try {
        return {
          pattern,
          regex: new RegExp(pattern.regex_pattern, 'i')
        };
      } catch (error) {
        console.error(`Invalid regex pattern: ${pattern.regex_pattern}`);
        return null;
      }
    }).filter(p => p !== null);
    
    // Process each log entry against all patterns
    logs.forEach((log, logIndex) => {
      compiledPatterns.forEach((compiledPattern, patternIndex) => {
        if (!compiledPattern) return;
        
        try {
          const match = compiledPattern.regex.test(log.message);
          
          if (match) {
            const pattern = compiledPattern.pattern;
            if (matchGroups.has(pattern.category)) {
              const group = matchGroups.get(pattern.category);
              group.totalMatches++;
            } else {
              matchGroups.set(pattern.category, {
                pattern,
                firstMatch: log,
                totalMatches: 1
              });
            }
          }
        } catch (err) {
          // Catch errors for individual regex tests to prevent worker from crashing
          console.error(`Error testing pattern ${compiledPattern.pattern.regex_pattern}:`, err);
        }
        
        // Update progress every 500 operations or at the end
        completedOperations++;
        const currentProgress = Math.floor((completedOperations / totalOperations) * 100);
        
        if (currentProgress >= lastReportedProgress + 5 || completedOperations === totalOperations) {
          lastReportedProgress = currentProgress;
          self.postMessage({
            type: 'progress',
            workerId,
            value: currentProgress
          });
        }
      });
    });
    
    // Send final results
    self.postMessage({
      type: 'result',
      workerId,
      results: Array.from(matchGroups.values())
    });
  } catch (error) {
    // Report any errors back to the main thread
    self.postMessage({
      type: 'error',
      workerId,
      error: error.message
    });
  }
}; 