/**
 * Smart log chunking utility that extracts relevant error/warning contexts
 */

// Patterns to identify important log entries - Enhanced for Java Spring + log4j
const IMPORTANCE_PATTERNS = {
  // Core error patterns
  ERROR: /\b(error|exception|fail(ed|ure)?|crash(ed)?|fatal|critical|severe)\b/i,
  
  // Warning patterns
  WARNING: /\b(warn(ing)?|deprecated|caution|notice)\b/i,
  
  // Java/Spring specific exception patterns
  JAVA_EXCEPTION: /\b(Exception|Error|Throwable|SQLException|IOException|RuntimeException|NullPointerException|IllegalArgumentException|IllegalStateException|ClassNotFoundException|NoSuchMethodException|OutOfMemoryError|StackOverflowError|TimeoutException|InterruptedException)\b/,
  
  // Spring-specific patterns
  SPRING_ERROR: /\b(BeanCreationException|BeanDefinitionStoreException|NoSuchBeanDefinitionException|ApplicationContextException|DataAccessException|TransactionException|SecurityException|AuthenticationException|AccessDeniedException)\b/,
  
  // Database/JPA patterns
  DATABASE_ISSUE: /\b(SQLException|DataAccessException|ConstraintViolationException|OptimisticLockException|PessimisticLockException|TransactionRollbackException|ConnectionException|HibernateException|JDBCException)\b/,
  
  // Web/HTTP patterns
  HTTP_ERROR: /\b(HttpStatus|status.*[45]\d{2}|400|401|403|404|405|408|409|410|422|429|500|501|502|503|504|timeout|connection.*refused|connection.*reset)\b/i,
  
  // Log4j specific patterns
  LOG4J_ERROR: /\b(ERROR|FATAL)\s+\[/,
  LOG4J_WARN: /\b(WARN|WARNING)\s+\[/,
  
  // Spring Boot startup/shutdown patterns
  SPRING_LIFECYCLE: /\b(Started|Stopped|Failed to start|Shutdown|Shutting down|Application startup|Context initialization|Bean.*created|Bean.*destroyed|Port.*already in use|Unable to start embedded|Tomcat.*started|Tomcat.*stopped)\b/i,
  
  // Performance and resource patterns
  PERFORMANCE: /\b(slow|timeout|latency|OutOfMemoryError|memory.*leak|GC.*overhead|thread.*pool.*exhausted|connection.*pool.*exhausted|deadlock|blocked|waiting)\b/i,
  
  // Security patterns
  SECURITY: /\b(Unauthorized|Forbidden|Authentication.*failed|Access.*denied|Security.*violation|CSRF|XSS|SQL.*injection|Invalid.*token|Session.*expired|Login.*failed)\b/i,
  
  // Stack trace patterns (Java specific)
  EXCEPTION_STACK: /^\s*at\s+[\w\.$]+\([^)]*\).*$/,
  CAUSED_BY: /^Caused by:/,
  
  // Spring/Java common timestamp patterns
  TIMESTAMP: /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\d{2}[\.,]\d{3}|\d{13}|\[.*\d{4}-\d{2}-\d{2}.*\]/,
  
  // Request/Response patterns
  REQUEST_RESPONSE: /\b(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+\/|Request.*processing|Response.*time|Controller.*mapping|RestController|RequestMapping|ResponseEntity)\b/i
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
         IMPORTANCE_PATTERNS.CAUSED_BY.test(line) ||
         /^\s*at\s+/.test(line) ||  // Java stack trace lines
         /^\s*\.{3}\s*\d+\s+more/.test(line) ||  // "... 5 more" lines
         /^\s*Suppressed:/.test(line) ||  // Suppressed exceptions
         line.includes('.java:') && line.includes('at ');
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
    // Check all pattern categories
    const isError = IMPORTANCE_PATTERNS.ERROR.test(line);
    const isWarning = IMPORTANCE_PATTERNS.WARNING.test(line);
    const isJavaException = IMPORTANCE_PATTERNS.JAVA_EXCEPTION.test(line);
    const isSpringError = IMPORTANCE_PATTERNS.SPRING_ERROR.test(line);
    const isDatabaseIssue = IMPORTANCE_PATTERNS.DATABASE_ISSUE.test(line);
    const isHttpError = IMPORTANCE_PATTERNS.HTTP_ERROR.test(line);
    const isLog4jError = IMPORTANCE_PATTERNS.LOG4J_ERROR.test(line);
    const isLog4jWarn = IMPORTANCE_PATTERNS.LOG4J_WARN.test(line);
    const isSpringLifecycle = IMPORTANCE_PATTERNS.SPRING_LIFECYCLE.test(line);
    const isPerformance = IMPORTANCE_PATTERNS.PERFORMANCE.test(line);
    const isSecurity = IMPORTANCE_PATTERNS.SECURITY.test(line);
    const isRequestResponse = IMPORTANCE_PATTERNS.REQUEST_RESPONSE.test(line);
    const isStack = isStackTraceLine(line);
    const isCausedBy = IMPORTANCE_PATTERNS.CAUSED_BY.test(line);

    // Count errors and warnings (including Java-specific ones)
    if (isError || isJavaException || isSpringError || isDatabaseIssue || isHttpError || isLog4jError || isSecurity) {
      metadata.totalErrors++;
      console.log('Found error/exception at line', index, ':', line.substring(0, 100));
    }
    if (isWarning || isLog4jWarn || isPerformance) {
      metadata.totalWarnings++;
      console.log('Found warning at line', index, ':', line.substring(0, 100));
    }

    // Check if this line is important (should be included in chunks)
    const isImportant = isError || isWarning || isJavaException || isSpringError || 
                       isDatabaseIssue || isHttpError || isLog4jError || isLog4jWarn ||
                       isSpringLifecycle || isPerformance || isSecurity || 
                       isRequestResponse || isStack || isCausedBy;

    if (isImportant) {
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