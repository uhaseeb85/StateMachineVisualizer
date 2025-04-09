import * as XLSX from 'xlsx-js-style';

/**
 * Process logs against patterns dictionary
 * @param {Array} logs - Array of log entries
 * @param {Array} dictionary - Array of regex patterns 
 * @returns {Array} - Matched results organized by category and severity
 */
export const processLogs = (logs, dictionary) => {
  const matchGroups = new Map();
  
  // Process each log entry against all patterns
  logs.forEach(log => {
    dictionary.forEach(pattern => {
      try {
        const regex = new RegExp(pattern.regex_pattern, 'i');
        const match = regex.test(log.message);
        
        if (match) {
          // If this pattern already has matches, increment count
          if (matchGroups.has(pattern.category)) {
            const group = matchGroups.get(pattern.category);
            group.totalMatches++;
          } else {
            // First match for this pattern
            matchGroups.set(pattern.category, {
              pattern,
              firstMatch: log,
              totalMatches: 1
            });
          }
        }
      } catch (error) {
        console.error(`Invalid regex pattern: ${pattern.regex_pattern}`, error);
      }
    });
  });
  
  // Convert map to array and sort by severity
  return Array.from(matchGroups.values()).sort((a, b) => {
    const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return severityOrder[a.pattern.severity] - severityOrder[b.pattern.severity];
  });
};

/**
 * Create a downloadable sample dictionary
 */
export const downloadSampleDictionary = (samplePatterns) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(samplePatterns);
  XLSX.utils.book_append_sheet(wb, ws, "Sample");
  XLSX.writeFile(wb, 'log_dictionary_sample.csv');
};

/**
 * Process and parse uploaded log files
 * @param {Array} files - Array of file objects
 * @returns {Promise<Array>} - Promise resolving to processed log entries
 */
export const processLogFiles = async (files) => {
  const logs = await Promise.all(files.map(async (file) => {
    const text = await file.text();
    const allLines = text.split('\n').map(line => line.trim());
    
    // Create groups of three lines with overlap for better context
    const logs = [];
    for (let i = 0; i < allLines.length; i++) {
      const threeLines = allLines.slice(i, i + 3).join('\n');
      if (threeLines) {
        logs.push({
          message: threeLines,
          lineNumber: i + 1,
          context: {
            before: allLines.slice(Math.max(0, i - 2), i),
            after: allLines.slice(i + 3, Math.min(allLines.length, i + 6))
          },
          matchedLines: allLines.slice(i, i + 3)
        });
      }
    }
    
    return logs;
  }));
  
  return logs.flat();
}; 