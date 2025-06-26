/**
 * Constants for AI Audio Analyzer
 * Centralized configuration and mock data
 */

// File processing constants
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'];
export const AUDIO_MIME_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/aac'];

// File size constants
export const FILE_SIZE_UNITS = ['Bytes', 'KB', 'MB', 'GB'];
export const FILE_SIZE_BASE = 1024;

// Status constants
export const FILE_STATUS = {
  SUSPICIOUS: 'suspicious',
  CLEAR: 'clear',
  PROCESSING: 'processing',
  ERROR: 'error'
};

// Risk levels
export const RISK_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

// Status colors mapping
export const STATUS_COLORS = {
  [FILE_STATUS.SUSPICIOUS]: 'bg-red-500/20 text-red-400 border-red-500/50',
  [FILE_STATUS.CLEAR]: 'bg-green-500/20 text-green-400 border-green-500/50',
  [FILE_STATUS.PROCESSING]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  [FILE_STATUS.ERROR]: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

// Risk level colors
export const RISK_COLORS = {
  [RISK_LEVELS.HIGH]: 'bg-red-500/20 text-red-400 border-red-500/50',
  [RISK_LEVELS.MEDIUM]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  [RISK_LEVELS.LOW]: 'bg-green-500/20 text-green-400 border-green-500/50'
};

// Default monitoring settings
export const DEFAULT_MONITORING_INTERVAL = 5; // seconds
export const MAX_RECENT_FILES = 10;

// Storage keys
export const STORAGE_KEYS = {
  AUDIO_ANALYZER: 'aiAudioAnalyzer'
};

// Tab constants
export const TABS = {
  ANALYZE: 'analyze',
  MONITOR: 'monitor',
  TRANSCRIPTIONS: 'transcriptions',
  REPORTS: 'reports'
};

// Mock conversation data for demo purposes
export const DEMO_CONVERSATION = [
  {
    speaker: 'Agent',
    message: "Hello, this is Sarah from First National Bank. I'm calling regarding your account ending in 4532.",
    timestamp: '00:00',
    suspicious: false
  },
  {
    speaker: 'Customer',
    message: "Hi, yes, that's my account.",
    timestamp: '00:05',
    suspicious: false
  },
  {
    speaker: 'Agent',
    message: "We've noticed some unusual activity and need to verify your identity. Can you please provide your full social security number?",
    timestamp: '00:08',
    suspicious: true
  },
  {
    speaker: 'Customer',
    message: "Um, okay... it's 123-45-6789",
    timestamp: '00:15',
    suspicious: false
  },
  {
    speaker: 'Agent',
    message: "Thank you. Also, what's your mother's maiden name for verification purposes?",
    timestamp: '00:20',
    suspicious: true
  },
  {
    speaker: 'Customer',
    message: "It's Johnson",
    timestamp: '00:25',
    suspicious: false
  },
  {
    speaker: 'Agent',
    message: "Perfect. Now we need to update your account information. Please provide your current PIN number.",
    timestamp: '00:28',
    suspicious: true
  },
  {
    speaker: 'Customer',
    message: "Wait, why do you need my PIN?",
    timestamp: '00:35',
    suspicious: false
  },
  {
    speaker: 'Agent',
    message: "If you don't provide this information immediately, we'll have to freeze your account within the next 30 minutes. This is urgent.",
    timestamp: '00:38',
    suspicious: true
  }
];

// Suspicious keywords/phrases for fraud detection
export const SUSPICIOUS_KEYWORDS = [
  'social security number',
  'pin number',
  'account verification',
  'urgent',
  'immediately',
  'freeze your account',
  'suspended',
  'verify your identity',
  'security purposes',
  'mothers maiden name'
];

// Analysis report template
export const ANALYSIS_REPORT_TEMPLATE = {
  title: 'AI Audio Analysis Report',
  generatedAt: null,
  summary: {
    totalFiles: 0,
    suspiciousFiles: 0,
    clearFiles: 0,
    suspiciousRate: 0,
    avgConfidence: 0
  },
  files: [],
  recommendations: []
}; 