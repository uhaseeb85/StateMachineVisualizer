/**
 * Constants for the LogAnalyzer component
 */

// Screen navigation constants
export const SCREENS = {
  SELECT: 'select',
  SPLUNK: 'splunk',
  FILE: 'file'
};

// Severity color mapping
export const SEVERITY_COLORS = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500'
};

// Sample log patterns for the dictionary
export const SAMPLE_PATTERNS = [
  {
    category: "Database Error",
    regex_pattern: ".*Error executing SQL query: (ORA-\\d+).*",
    cause: "Database connection or query execution failure",
    severity: "High",
    suggestions: "Check database connectivity;Verify SQL syntax;Review database logs"
  },
  {
    category: "Authentication",
    regex_pattern: ".*Failed login attempt for user &apos;(.+)&apos; from IP (\\d+\\.\\d+\\.\\d+\\.\\d+).*",
    cause: "Multiple failed login attempts detected",
    severity: "Medium",
    suggestions: "Verify user credentials;Check for suspicious IP activity;Review security logs"
  },
  {
    category: "System Resource",
    regex_pattern: ".*Memory usage exceeded (\\d+)%.*",
    cause: "High memory utilization",
    severity: "High",
    suggestions: "Review memory allocation;Check for memory leaks;Consider scaling resources"
  }
]; 