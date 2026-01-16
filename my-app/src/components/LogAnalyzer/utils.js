import ExcelJS from 'exceljs';

/**
 * Process logs against patterns dictionary
 * @param {Array} logs - Array of log entries
 * @param {Array} dictionary - Array of regex patterns 
 * @returns {Array} - Matched results organized by category and severity
 */
export const processLogs = (logs, dictionary) => {
  const matchGroups = new Map();
  
  // Pre-compile regex patterns for better performance
  const compiledPatterns = dictionary.map(pattern => {
    try {
      return {
        pattern,
        regex: new RegExp(pattern.regex_pattern, 'i')
      };
    } catch (error) {
      console.error(`Invalid regex pattern: ${pattern.regex_pattern}`, error);
      return null;
    }
  }).filter(p => p !== null);
  
  // Process each log entry against all patterns
  logs.forEach(log => {
    compiledPatterns.forEach(({ pattern, regex }) => {
      try {
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
        console.error(`Error testing pattern: ${pattern.regex_pattern}`, error);
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
export const downloadSampleDictionary = async (samplePatterns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sample');
  
  // Set columns
  const columns = Object.keys(samplePatterns[0]).map(key => ({
    header: key,
    key: key,
    width: 20
  }));
  worksheet.columns = columns;
  
  // Add rows
  samplePatterns.forEach(pattern => {
    worksheet.addRow(pattern);
  });
  
  // Generate and download CSV
  const buffer = await workbook.csv.writeBuffer();
  const blob = new Blob([buffer], { type: 'text/csv' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'log_dictionary_sample.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Process and parse uploaded log files
 * @param {Array} files - Array of file objects
 * @param {Function} progressCallback - Callback function to report progress (0-100)
 * @returns {Promise<Array>} - Promise resolving to processed log entries
 */
export const processLogFiles = async (files, progressCallback = () => {}) => {
  // Report initial progress
  progressCallback(0);
  
  const logs = [];
  
  // Process each file sequentially with progress updates
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    
    // Read file in chunks to avoid blocking the UI
    const fileSize = file.size;
    const fileChunkSize = 1024 * 1024; // 1MB chunks for file reading
    let offset = 0;
    let fileContent = '';
    
    while (offset < fileSize) {
      const blob = file.slice(offset, offset + fileChunkSize);
      const chunkText = await blob.text();
      fileContent += chunkText;
      offset += fileChunkSize;
      
      // Update progress during file reading
      const readProgress = Math.min(15, (offset / fileSize) * 15);
      progressCallback(Math.round((fileIndex / files.length) * 30) + readProgress);
      
      // Yield to UI thread
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    const allLines = fileContent.split('\n').map(line => line.trim());
    
    const fileResults = [];
    // Update progress after file is read
    progressCallback(Math.round((fileIndex / files.length) * 30) + 15);
    
    // Process lines in smaller chunks to allow frequent UI updates
    const lineChunkSize = 1000; // Reduced chunk size from 5000 to 1000 lines
    const totalChunks = Math.ceil(allLines.length / lineChunkSize);
    
    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const startLine = chunk * lineChunkSize;
      const endLine = Math.min((chunk + 1) * lineChunkSize, allLines.length);
      
      // Create groups of three lines with overlap for better context
      for (let i = startLine; i < endLine; i++) {
        const threeLines = allLines.slice(i, i + 3).join('\n');
        if (threeLines) {
          fileResults.push({
            message: threeLines,
            lineNumber: i + 1,
            context: {
              before: allLines.slice(Math.max(0, i - 2), i),
              after: allLines.slice(i + 3, Math.min(allLines.length, i + 6))
            },
            matchedLines: allLines.slice(i, i + 3)
          });
        }
        
        // Yield more frequently - every 200 lines
        if ((i - startLine) % 200 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      // Update progress based on chunks processed and file progress
      const fileProgress = (chunk + 1) / totalChunks;
      const overallProgress = 30 + (fileIndex / files.length * 70) + (fileProgress * 70 / files.length);
      progressCallback(Math.round(overallProgress));
      
      // Allow UI to update by yielding execution more frequently
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    logs.push(...fileResults);
  }
  
  // Final progress update
  progressCallback(100);
  
  return logs;
}; 