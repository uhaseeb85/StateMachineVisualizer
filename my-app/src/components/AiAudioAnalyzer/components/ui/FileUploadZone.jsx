/**
 * FileUploadZone Component
 * Handles file uploads with drag-and-drop support and validation
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileAudio, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { filterAudioFiles, formatFileSize } from '../../utils';

const FileUploadZone = ({ 
  onFileUpload, 
  audioFiles = [], 
  disabled = false,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024 // 50MB
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState([]);

  /**
   * Handle file selection from input
   */
  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  }, []);

  /**
   * Handle drag and drop events
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [disabled]);

  /**
   * Process and validate files
   */
  const processFiles = useCallback((files) => {
    const newErrors = [];
    
    // Check total number of files
    if (audioFiles.length + files.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed. Current: ${audioFiles.length}, Adding: ${files.length}`);
    }

    // Filter and validate audio files
    const validFiles = filterAudioFiles(files);
    
    if (validFiles.length === 0) {
      newErrors.push('No valid audio files found. Supported formats: MP3, WAV, M4A, OGG, FLAC, AAC');
    }

    // Check file sizes
    const oversizedFiles = validFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      newErrors.push(`${oversizedFiles.length} file(s) exceed size limit of ${formatFileSize(maxFileSize)}`);
    }

    // Update errors
    setErrors(newErrors);

    // If no errors, proceed with upload
    if (newErrors.length === 0) {
      onFileUpload(validFiles);
    }
  }, [audioFiles.length, maxFiles, maxFileSize, onFileUpload]);

  /**
   * Remove file from upload queue
   */
  const removeFile = useCallback((index) => {
    const newFiles = audioFiles.filter((_, i) => i !== index);
    onFileUpload(newFiles);
  }, [audioFiles, onFileUpload]);

  /**
   * Open file selector
   */
  const openFileSelector = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card 
        className={`transition-all duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'hover:border-gray-600 bg-slate-800/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={openFileSelector}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <motion.div
              animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
              className="p-4 rounded-full bg-blue-500/20 text-blue-400"
            >
              <Upload className="w-8 h-8" />
            </motion.div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {isDragOver ? 'Drop files here' : 'Upload Audio Files'}
              </h3>
              <p className="text-gray-400 text-sm">
                Drag and drop audio files here, or click to browse
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Supports MP3, WAV, M4A, OGG, FLAC, AAC • Max {formatFileSize(maxFileSize)} per file
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Error messages */}
      {errors.length > 0 && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertDescription>
            <ul className="text-red-400 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* File list */}
      {audioFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-medium">Files to Process ({audioFiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {audioFiles.map((file, index) => (
              <FileListItem
                key={`${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={removeFile}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual file list item component
 */
const FileListItem = ({ file, index, onRemove, disabled }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-gray-700"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-purple-500/20 rounded">
        <FileAudio className="w-4 h-4 text-purple-400" />
      </div>
      <div>
        <p className="text-white text-sm font-medium truncate max-w-48">{file.name}</p>
        <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
      </div>
    </div>
    
    <Button
      size="sm"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        onRemove(index);
      }}
      disabled={disabled}
      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
    >
      <X className="w-4 h-4" />
    </Button>
  </motion.div>
);

export default FileUploadZone; 