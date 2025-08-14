/**
 * Smart log chunking utility that extracts relevant error/warning contexts
 */

// Patterns to identify important log entries
const IMPORTANCE_PATTERNS = {
  ERROR: /\b(error|exception|fail(ed|ure)?|crash(ed)?)\b/i,
  WARNING: /\b(warn(ing)?|deprecated)\b/i,
  EXCEPTION_STACK: /^\s+at\s+.+\(.+\)/,
  TIMESTAMP: /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/,
};

/**
 * Extracts context around a matched line
 * @param {string[]} lines Array of log lines
 * @param {number} matchIndex Index of the matched line
 * @param {number} contextLines Number of lines to include before and after
 * @returns {string[]} Lines with context
 */
const extractContext = (lines, matchIndex, contextLines = 5) => {
  const start = Math.max(0, matchIndex - contextLines);
  const end = Math.min(lines.length, matchIndex + contextLines + 1);
  return lines.slice(start, end);
};

/**
 * Determines if a line is part of a stack trace
 * @param {string} line Log line to check
 * @returns {boolean}
 */
const isStackTraceLine = (line) => {
  return IMPORTANCE_PATTERNS.EXCEPTION_STACK.test(line) ||
         line.includes('Caused by:') ||
         line.includes('at ') && line.includes('.java:');
};

/**
 * Smart chunking of log content
 * @param {string} logContent Raw log content
 * @param {number} maxTokens Maximum tokens allowed (chars/4 approximation)
 * @returns {{chunks: string[], metadata: Object}} Chunked log content and metadata
 */
export const smartChunkLog = (logContent, maxTokens) => {
  console.log('=== SMART CHUNK LOG START ===');
  console.log('Input content length:', logContent.length);
  console.log('maxTokens:', maxTokens);
  
  const lines = logContent.split('\n');
  console.log('Total lines:', lines.length);
  
  const chunks = [];
  let currentChunk = [];
  let currentChunkTokens = 0;
  const charsPerToken = 4;
  let metadata = {
    totalErrors: 0,
    totalWarnings: 0,
    skippedLines: 0,
    originalLength: lines.length,
  };

  // First pass: identify important lines and their context
  const importantRanges = new Set();
  let inStackTrace = false;
  let stackTraceStart = 0;

  lines.forEach((line, index) => {
    const isError = IMPORTANCE_PATTERNS.ERROR.test(line);
    const isWarning = IMPORTANCE_PATTERNS.WARNING.test(line);
    const isStack = isStackTraceLine(line);

    if (isError) {
      metadata.totalErrors++;
      console.log('Found error at line', index, ':', line.substring(0, 100));
    }
    if (isWarning) {
      metadata.totalWarnings++;
      console.log('Found warning at line', index, ':', line.substring(0, 100));
    }

    if (isError || isWarning || isStack) {
      if (isStack && !inStackTrace) {
        inStackTrace = true;
        stackTraceStart = index;
      } else if (!isStack && inStackTrace) {
        // Add entire stack trace range
        extractContext(lines, stackTraceStart, index - stackTraceStart)
          .forEach((_, i) => importantRanges.add(stackTraceStart + i));
        inStackTrace = false;
      }

      // Add context around important lines
      extractContext(lines, index).forEach((_, i) => {
        const contextIndex = index - 5 + i;
        if (contextIndex >= 0 && contextIndex < lines.length) {
          importantRanges.add(contextIndex);
        }
      });
    }
  });

  console.log('Important ranges found:', importantRanges.size);
  console.log('Total errors:', metadata.totalErrors);
  console.log('Total warnings:', metadata.totalWarnings);

  // If no important ranges found, include all content in chunks
  if (importantRanges.size === 0) {
    console.log('No error/warning patterns found, chunking all content');
    
    // Simple chunking: divide content into chunks based on token limit
    let currentText = '';
    let currentTokens = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTokens = Math.ceil(line.length / charsPerToken);
      
      if (currentTokens + lineTokens <= maxTokens) {
        currentText += (currentText ? '\n' : '') + line;
        currentTokens += lineTokens;
      } else {
        if (currentText) {
          chunks.push(currentText);
        }
        currentText = line;
        currentTokens = lineTokens;
      }
    }
    
    // Add the last chunk
    if (currentText) {
      chunks.push(currentText);
    }
    
    console.log('All-content chunking result:', chunks.length, 'chunks');
    metadata.chunks = chunks.length;
    return { chunks, metadata };
  }

  // Second pass: build chunks from important ranges
  let currentSection = [];
  let lastIndex = -1;

  lines.forEach((line, index) => {
    if (importantRanges.has(index)) {
      // If there's a gap, start a new section
      if (lastIndex !== -1 && index > lastIndex + 1) {
        if (currentSection.length > 0) {
          const sectionText = currentSection.join('\n');
          const sectionTokens = Math.ceil(sectionText.length / charsPerToken);

          if (currentChunkTokens + sectionTokens <= maxTokens) {
            currentChunk.push(sectionText);
            currentChunkTokens += sectionTokens;
          } else {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.join('\n\n'));
            }
            currentChunk = [sectionText];
            currentChunkTokens = sectionTokens;
          }
        }
        currentSection = [];
      }

      currentSection.push(line);
      lastIndex = index;
    } else {
      metadata.skippedLines++;
    }
  });

  // Add the last section if it exists
  if (currentSection.length > 0) {
    const sectionText = currentSection.join('\n');
    const sectionTokens = Math.ceil(sectionText.length / charsPerToken);

    if (currentChunkTokens + sectionTokens <= maxTokens) {
      currentChunk.push(sectionText);
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
      }
      chunks.push(sectionText);
    }
  }

  // Add the last chunk if it exists
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  metadata.chunks = chunks.length;
  metadata.retainedLines = metadata.originalLength - metadata.skippedLines;

  return { chunks, metadata };
};

/**
 * Process multiple log files with smart chunking
 * @param {Object} logContents Map of filename to content
 * @param {number} maxTokens Maximum tokens per chunk
 * @returns {Array<{filename: string, chunk: string}>} Array of chunked logs with filenames
 */
export const processLogsWithChunking = (logContents, maxTokens) => {
  console.log('=== CHUNKING FUNCTION START ===');
  console.log('Input logContents keys:', Object.keys(logContents));
  console.log('maxTokens:', maxTokens);
  
  const processedChunks = [];
  const metadata = {
    totalFiles: Object.keys(logContents).length,
    totalChunks: 0,
    totalErrors: 0,
    totalWarnings: 0,
  };

  try {
    for (const [filename, content] of Object.entries(logContents)) {
      console.log('Processing file:', filename, 'content length:', content.length);
      
      const { chunks, metadata: fileMetadata } = smartChunkLog(content, maxTokens);
      console.log('File chunks created:', chunks.length);
      
      metadata.totalChunks += chunks.length;
      metadata.totalErrors += fileMetadata.totalErrors;
      metadata.totalWarnings += fileMetadata.totalWarnings;

      chunks.forEach((chunk, index) => {
        processedChunks.push({
          filename,
          chunk,
          chunkIndex: index + 1,
          totalChunks: chunks.length,
          metadata: fileMetadata
        });
      });
    }

    console.log('=== CHUNKING FUNCTION COMPLETE ===');
    console.log('Total processed chunks:', processedChunks.length);
    console.log('Metadata:', metadata);
    console.log('===============================');
    
    return { processedChunks, metadata };
  } catch (error) {
    console.error('Error in processLogsWithChunking:', error);
    throw error;
  }
}; 