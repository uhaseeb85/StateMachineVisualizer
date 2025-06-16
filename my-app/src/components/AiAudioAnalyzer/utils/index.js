/**
 * Utility functions for AI Audio Analyzer
 * Common helper functions used across components
 */

import { FILE_SIZE_UNITS, FILE_SIZE_BASE, AUDIO_EXTENSIONS, SUSPICIOUS_KEYWORDS } from '../constants';

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(FILE_SIZE_BASE));
  return parseFloat((bytes / Math.pow(FILE_SIZE_BASE, i)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[i];
};

/**
 * Format time duration in MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format ISO date string to locale date
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString();
};

/**
 * Format ISO date string to locale time
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted time string
 */
export const formatDateTime = (isoString) => {
  return new Date(isoString).toLocaleTimeString();
};

/**
 * Check if file is a valid audio file
 * @param {File} file - File object to check
 * @returns {boolean} True if file is audio
 */
export const isAudioFile = (file) => {
  if (!file) return false;
  
  // Check MIME type
  if (file.type && file.type.startsWith('audio/')) {
    return true;
  }
  
  // Check file extension
  return AUDIO_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
};

/**
 * Filter audio files from a file list
 * @param {FileList|File[]} files - Files to filter
 * @returns {File[]} Array of audio files
 */
export const filterAudioFiles = (files) => {
  const fileArray = Array.from(files);
  return fileArray.filter(isAudioFile);
};

/**
 * Generate unique ID for files
 * @returns {string} Unique identifier
 */
export const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

/**
 * Analyze text for suspicious content
 * @param {string} text - Text to analyze
 * @returns {object} Analysis result with suspicion score and detected phrases
 */
export const analyzeSuspiciousContent = (text) => {
  if (!text) return { score: 0, detectedPhrases: [] };
  
  const lowerText = text.toLowerCase();
  const detectedPhrases = SUSPICIOUS_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  const score = detectedPhrases.length / SUSPICIOUS_KEYWORDS.length;
  
  return {
    score,
    detectedPhrases,
    isSuspicious: score > 0.2 // Threshold for suspicion
  };
};

/**
 * Calculate statistics from processed files
 * @param {Array} processedFiles - Array of processed files
 * @returns {object} Statistics object
 */
export const calculateStats = (processedFiles) => {
  const total = processedFiles.length;
  
  if (total === 0) {
    return {
      total: 0,
      suspicious: 0,
      clear: 0,
      suspiciousRate: 0,
      avgConfidence: 0
    };
  }
  
  const suspicious = processedFiles.filter(f => f.status === 'suspicious').length;
  const clear = processedFiles.filter(f => f.status === 'clear').length;
  const suspiciousRate = (suspicious / total) * 100;
  
  const avgConfidence = processedFiles.reduce((sum, f) => sum + (f.confidence || 0), 0) / total;
  
  return {
    total,
    suspicious,
    clear,
    suspiciousRate,
    avgConfidence
  };
};

/**
 * Export data as JSON file
 * @param {object} data - Data to export
 * @param {string} filename - Name of the file
 */
export const exportToJson = (data, filename = 'export.json') => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Generate analysis report
 * @param {Array} processedFiles - Processed files
 * @param {object} transcriptions - Transcription data
 * @param {object} analysisResults - Analysis results
 * @returns {object} Report object
 */
export const generateReport = (processedFiles, transcriptions, analysisResults) => {
  const stats = calculateStats(processedFiles);
  
  return {
    title: 'AI Audio Analysis Report',
    generatedAt: new Date().toISOString(),
    summary: stats,
    files: processedFiles.map(file => ({
      ...file,
      transcription: transcriptions[file.id],
      analysis: analysisResults[file.id]
    })),
    recommendations: generateRecommendations(stats)
  };
};

/**
 * Generate recommendations based on analysis results
 * @param {object} stats - Analysis statistics
 * @returns {Array} Array of recommendations
 */
export const generateRecommendations = (stats) => {
  const recommendations = [];
  
  if (stats.suspiciousRate > 50) {
    recommendations.push({
      type: 'critical',
      message: 'High suspicious activity rate detected. Immediate review recommended.',
      action: 'Review all flagged recordings and implement additional security measures.'
    });
  } else if (stats.suspiciousRate > 25) {
    recommendations.push({
      type: 'warning',
      message: 'Moderate suspicious activity detected. Enhanced monitoring suggested.',
      action: 'Increase monitoring frequency and review training protocols.'
    });
  }
  
  if (stats.avgConfidence < 0.7) {
    recommendations.push({
      type: 'info',
      message: 'Low average confidence in detections. Model may need adjustment.',
      action: 'Consider fine-tuning the AI model or adjusting detection parameters.'
    });
  }
  
  if (stats.total > 0) {
    recommendations.push({
      type: 'success',
      message: `Successfully analyzed ${stats.total} audio files.`,
      action: 'Continue regular monitoring and analysis procedures.'
    });
  }
  
  return recommendations;
};

/**
 * Debounce function to limit frequent calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if browser supports File System Access API
 * @returns {boolean} True if supported
 */
export const supportsFileSystemAccess = () => {
  return 'showDirectoryPicker' in window && window.isSecureContext;
};

/**
 * Validate API endpoint URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}; 