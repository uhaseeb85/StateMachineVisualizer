/**
 * Custom hook for managing folder monitoring functionality
 * Handles file system access, monitoring intervals, and file detection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  DEFAULT_MONITORING_INTERVAL, 
  MAX_RECENT_FILES, 
  AUDIO_EXTENSIONS 
} from '../constants';
import { supportsFileSystemAccess } from '../utils';

export const useFolderMonitor = ({ onFileDetected, onProcessFile }) => {
  const [monitoredFolder, setMonitoredFolder] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [monitoringStats, setMonitoringStats] = useState({
    filesProcessed: 0,
    lastCheck: null,
    totalSize: 0
  });
  const [checkInterval, setCheckInterval] = useState(DEFAULT_MONITORING_INTERVAL);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [processedFileNames, setProcessedFileNames] = useState(new Set());

  const intervalRef = useRef(null);

  /**
   * Start monitoring for new files
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      checkForNewFiles();
    }, checkInterval * 1000);

    toast.success(`Started monitoring folder: ${monitoredFolder}`);
  }, [checkInterval, monitoredFolder]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Check for new files in the monitored folder
   */
  const checkForNewFiles = useCallback(async () => {
    setMonitoringStats(prev => ({
      ...prev,
      lastCheck: new Date().toISOString()
    }));

    if (directoryHandle) {
      // Use File System Access API to check for real files
      try {
        const newFiles = [];
        
        for await (const [name, handle] of directoryHandle.entries()) {
          if (handle.kind === 'file') {
            // Check if it's an audio file
            const isAudioFile = AUDIO_EXTENSIONS.some(ext => 
              name.toLowerCase().endsWith(ext)
            );
            
            if (isAudioFile && !processedFileNames.has(name)) {
              const file = await handle.getFile();
              newFiles.push({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                type: file.type,
                file: file // Store the actual file object
              });
              
              // Mark as processed to avoid reprocessing
              setProcessedFileNames(prev => new Set([...prev, name]));
            }
          }
        }

        if (newFiles.length > 0) {
          // Process new files
          for (const fileInfo of newFiles) {
            setRecentFiles(prev => [fileInfo, ...prev.slice(0, MAX_RECENT_FILES - 1)]);
            setMonitoringStats(prev => ({
              ...prev,
              filesProcessed: prev.filesProcessed + 1,
              totalSize: prev.totalSize + fileInfo.size
            }));

            // Notify parent component
            if (onFileDetected) {
              onFileDetected(fileInfo);
            }

            // Auto-process detected file
            if (onProcessFile) {
              await onProcessFile(fileInfo.file);
            }
            
            toast.success(`New audio file detected and processed: ${fileInfo.name}`);
          }
        }
      } catch (error) {
        console.error('Error checking for files:', error);
        toast.error('Error accessing folder. Please check permissions.');
      }
    } else if (recentFiles.length > 0) {
      // Fallback mode - process files that were selected manually
      const unprocessedFiles = recentFiles.filter(fileInfo => 
        !processedFileNames.has(fileInfo.name)
      );
      
      if (unprocessedFiles.length > 0) {
        for (const fileInfo of unprocessedFiles) {
          setMonitoringStats(prev => ({
            ...prev,
            filesProcessed: prev.filesProcessed + 1,
            totalSize: prev.totalSize + fileInfo.size
          }));

          // Mark as processed
          setProcessedFileNames(prev => new Set([...prev, fileInfo.name]));

          // Auto-process file
          if (onProcessFile && fileInfo.file) {
            await onProcessFile(fileInfo.file);
            toast.success(`Processing file: ${fileInfo.name}`);
          }
        }
      }
    }
  }, [directoryHandle, recentFiles, processedFileNames, onFileDetected, onProcessFile]);

  /**
   * Select folder for monitoring
   */
  const selectFolder = useCallback(async () => {
    try {
      // Check if the File System Access API is supported and we're in a secure context
      if (supportsFileSystemAccess()) {
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read'
        });
        
        setDirectoryHandle(dirHandle);
        setMonitoredFolder(dirHandle.name);
        setProcessedFileNames(new Set()); // Reset processed files list
        toast.success(`Folder selected: ${dirHandle.name}`);
      } else {
        // Enhanced fallback - create a file input that accepts directories
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.accept = 'audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac';
        
        // Create a promise to handle the file selection
        const fileSelectionPromise = new Promise((resolve, reject) => {
          input.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              const firstFile = files[0];
              const pathParts = firstFile.webkitRelativePath.split('/');
              const folderName = pathParts[0];
              
              setMonitoredFolder(folderName);
              
              // Store files for manual monitoring
              setRecentFiles(files.map(file => ({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                type: file.type,
                file: file
              })));
              
              setProcessedFileNames(new Set());
              toast.success(`Folder selected: ${folderName} (${files.length} files found)`);
              resolve();
            } else {
              reject(new Error('No files selected'));
            }
          };
          
          input.oncancel = () => {
            reject(new Error('Selection cancelled'));
          };
        });
        
        input.click();
        await fileSelectionPromise;
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      if (error.name !== 'AbortError') {
        toast.error('Failed to select folder. Please try again.');
      }
    }
  }, []);

  /**
   * Toggle monitoring state
   */
  const toggleMonitoring = useCallback(() => {
    if (!monitoredFolder && !directoryHandle) {
      toast.error('Please select a folder first');
      return;
    }
    
    setIsMonitoring(prev => !prev);
  }, [monitoredFolder, directoryHandle]);

  /**
   * Reset monitoring stats
   */
  const resetStats = useCallback(() => {
    setMonitoringStats({
      filesProcessed: 0,
      lastCheck: null,
      totalSize: 0
    });
    setProcessedFileNames(new Set());
    toast.success('Monitoring stats reset');
  }, []);

  /**
   * Handle file click (for triggering transcription view)
   */
  const handleFileClick = useCallback((fileName) => {
    // Dispatch custom event for showing transcription
    const event = new CustomEvent('showTranscription', {
      detail: { file: { name: fileName } }
    });
    window.dispatchEvent(event);
  }, []);

  // Effect to start/stop monitoring based on state
  useEffect(() => {
    if (isMonitoring && (monitoredFolder || directoryHandle)) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring, monitoredFolder, directoryHandle, startMonitoring, stopMonitoring]);

  return {
    // State
    monitoredFolder,
    isMonitoring,
    recentFiles,
    monitoringStats,
    checkInterval,
    directoryHandle,
    processedFileNames,
    
    // Actions
    setMonitoredFolder,
    setIsMonitoring,
    setCheckInterval,
    selectFolder,
    toggleMonitoring,
    resetStats,
    handleFileClick,
    
    // Computed
    hasFileSystemAccess: supportsFileSystemAccess()
  };
}; 