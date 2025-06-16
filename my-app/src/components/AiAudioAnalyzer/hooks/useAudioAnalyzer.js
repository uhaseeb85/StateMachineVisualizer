/**
 * Custom hook for managing AI Audio Analyzer state and logic
 * Centralizes business logic and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  STORAGE_KEYS, 
  FILE_STATUS, 
  TABS,
  DEMO_CONVERSATION,
  SUSPICIOUS_KEYWORDS
} from '../constants';
import { 
  generateId, 
  filterAudioFiles, 
  analyzeSuspiciousContent, 
  generateReport,
  exportToJson
} from '../utils';
import { DEFAULT_ENDPOINTS } from '../../AiLogAnalysis/constants/apiConstants';

export const useAudioAnalyzer = () => {
  // AI Settings State
  const [apiProvider, setApiProvider] = useState('LM_STUDIO');
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_ENDPOINTS.LM_STUDIO);
  const [modelName, setModelName] = useState('');
  const [apiAvailable, setApiAvailable] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  // Audio Analysis State
  const [audioFiles, setAudioFiles] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [monitoredFolder, setMonitoredFolder] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [transcriptions, setTranscriptions] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});

  // UI State
  const [activeTab, setActiveTab] = useState(TABS.ANALYZE);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * Load stored data from localStorage
   */
  const loadStoredData = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_ANALYZER);
      if (stored) {
        const data = JSON.parse(stored);
        setProcessedFiles(data.processedFiles || []);
        setTranscriptions(data.transcriptions || {});
        setAnalysisResults(data.analysisResults || {});
        setMonitoredFolder(data.monitoredFolder || '');
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
      toast.error('Failed to load previous session data');
    }
  }, []);

  /**
   * Save data to localStorage
   */
  const saveData = useCallback(() => {
    try {
      const data = {
        processedFiles,
        transcriptions,
        analysisResults,
        monitoredFolder
      };
      localStorage.setItem(STORAGE_KEYS.AUDIO_ANALYZER, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save session data');
    }
  }, [processedFiles, transcriptions, analysisResults, monitoredFolder]);

  /**
   * Check API connection status
   */
  const checkApiConnection = useCallback(async () => {
    if (demoMode) {
      setApiAvailable(true);
      return;
    }

    try {
      setApiAvailable(null);
      
      if (apiProvider === 'OLLAMA') {
        const response = await fetch(`${apiEndpoint.replace('/api/chat', '')}/api/tags`);
        setApiAvailable(response.ok);
      } else {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
            temperature: 0
          })
        });
        setApiAvailable(response.ok);
      }
    } catch (error) {
      console.error('API connection failed:', error);
      setApiAvailable(false);
      toast.error('Failed to connect to AI API');
    }
  }, [apiProvider, apiEndpoint, demoMode]);

  /**
   * Toggle demo mode
   */
  const toggleDemoMode = useCallback(() => {
    setDemoMode(prev => {
      const newDemoMode = !prev;
      setApiAvailable(newDemoMode);
      toast.success(`Demo mode ${newDemoMode ? 'enabled' : 'disabled'}`);
      return newDemoMode;
    });
  }, []);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback((files) => {
    // Handle array input (for remove/clear operations)
    if (Array.isArray(files)) {
      setAudioFiles(files);
      return;
    }

    // Handle FileList input (for actual file uploads)
    const audioFiles = filterAudioFiles(files);

    if (audioFiles.length === 0) {
      toast.error('Please select valid audio files');
      return;
    }

    setAudioFiles(prev => [...prev, ...audioFiles]);
    toast.success(`Added ${audioFiles.length} audio file(s) for processing`);
  }, []);

  /**
   * Clear uploaded audio files
   */
  const clearAudioFiles = useCallback(() => {
    setAudioFiles([]);
    toast.success('Upload queue cleared');
  }, []);

  /**
   * Simulate audio transcription
   */
  const transcribeAudio = useCallback(async (file) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    if (demoMode) {
      // Return demo conversation as transcription
      return DEMO_CONVERSATION.map(item => 
        `[${item.timestamp}] ${item.speaker}: ${item.message}`
      ).join('\n');
    }

    // In a real implementation, this would call the actual transcription API
    return `Transcription for ${file.name} - This would contain the actual transcribed text from the audio file.`;
  }, [demoMode]);

  /**
   * Analyze transcription for fraud indicators
   */
  const analyzeForFraud = useCallback(async (transcription, fileName) => {
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    if (demoMode) {
      // Use sophisticated analysis for demo
      const suspiciousAnalysis = analyzeSuspiciousContent(transcription);
      const confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence
      const riskLevel = suspiciousAnalysis.score > 0.5 ? 'HIGH' : 
                       suspiciousAnalysis.score > 0.2 ? 'MEDIUM' : 'LOW';

      return {
        isFraudulent: suspiciousAnalysis.isSuspicious,
        confidence,
        riskLevel,
        detectedPhrases: suspiciousAnalysis.detectedPhrases,
        score: suspiciousAnalysis.score,
        reasoning: suspiciousAnalysis.isSuspicious 
          ? `Detected ${suspiciousAnalysis.detectedPhrases.length} suspicious phrases indicating potential fraud attempt.`
          : 'No significant fraud indicators detected in the conversation.',
        recommendations: suspiciousAnalysis.isSuspicious 
          ? ['Review call recording manually', 'Flag customer account', 'Escalate to security team']
          : ['Continue normal processing', 'No additional action required']
      };
    }

    // Fallback simple analysis
    const confidence = Math.random();
    const isFraudulent = confidence > 0.7;
    
    return {
      isFraudulent,
      confidence,
      riskLevel: isFraudulent ? 'HIGH' : 'LOW',
      detectedPhrases: [],
      score: confidence,
      reasoning: `Analysis completed for ${fileName}`,
      recommendations: []
    };
  }, [demoMode]);

  /**
   * Process a single audio file
   */
  const processAudio = useCallback(async (file) => {
    setIsProcessing(true);
    setCurrentAudio(file);

    try {
      const transcription = await transcribeAudio(file);
      const analysis = await analyzeForFraud(transcription, file.name);

      const processedFile = {
        id: generateId(),
        name: file.name,
        size: file.size,
        processedAt: new Date().toISOString(),
        status: analysis.isFraudulent ? FILE_STATUS.SUSPICIOUS : FILE_STATUS.CLEAR,
        confidence: analysis.confidence,
        transcription: transcription,
        analysis: analysis
      };

      setProcessedFiles(prev => [...prev, processedFile]);
      setTranscriptions(prev => ({ ...prev, [processedFile.id]: transcription }));
      setAnalysisResults(prev => ({ ...prev, [processedFile.id]: analysis }));

      const statusMessage = analysis.isFraudulent 
        ? 'Suspicious activity detected' 
        : 'No fraud detected';
      
      toast.success(`Processed ${file.name} - ${statusMessage}`);
      
      return processedFile;
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error(`Failed to process ${file.name}`);
    } finally {
      setIsProcessing(false);
      setCurrentAudio(null);
    }
  }, [transcribeAudio, analyzeForFraud]);

  /**
   * Process all uploaded files
   */
  const processAllFiles = useCallback(async () => {
    if (audioFiles.length === 0) {
      toast.error('No files to process');
      return;
    }

    for (const file of audioFiles) {
      await processAudio(file);
    }
    
    setAudioFiles([]);
    toast.success('All files processed successfully');
  }, [audioFiles, processAudio]);

  /**
   * Clear all processed files
   */
  const clearProcessedFiles = useCallback(() => {
    setProcessedFiles([]);
    setTranscriptions({});
    setAnalysisResults({});
    toast.success('All processed files cleared');
  }, []);

  /**
   * Export analysis report
   */
  const exportReport = useCallback(() => {
    const report = generateReport(processedFiles, transcriptions, analysisResults);
    const filename = `audio-analysis-report-${new Date().toISOString().split('T')[0]}.json`;
    exportToJson(report, filename);
    toast.success('Report exported successfully');
  }, [processedFiles, transcriptions, analysisResults]);

  // Initialize component
  useEffect(() => {
    loadStoredData();
    checkApiConnection();
  }, [loadStoredData, checkApiConnection]);

  // Auto-save data when it changes
  useEffect(() => {
    saveData();
  }, [saveData]);

  // Listen for API settings changes
  useEffect(() => {
    checkApiConnection();
  }, [checkApiConnection, apiProvider, apiEndpoint]);

  return {
    // State
    apiProvider,
    apiEndpoint,
    modelName,
    apiAvailable,
    demoMode,
    audioFiles,
    currentAudio,
    isProcessing,
    processedFiles,
    monitoredFolder,
    isMonitoring,
    transcriptions,
    analysisResults,
    activeTab,
    showSettings,
    
    // Actions
    setApiProvider,
    setApiEndpoint,
    setModelName,
    setDemoMode,
    setMonitoredFolder,
    setIsMonitoring,
    setActiveTab,
    setShowSettings,
    toggleDemoMode,
    handleFileUpload,
    clearAudioFiles,
    processAudio,
    processAllFiles,
    clearProcessedFiles,
    exportReport,
    checkApiConnection
  };
}; 