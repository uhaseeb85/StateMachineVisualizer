/**
 * AudioUpload Component - Refactored
 * Handles file upload, processing, and display using the new architecture
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Trash2,
  Loader2,
  CheckCircle2,
  Info,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import new architecture components
import FileUploadZone from './ui/FileUploadZone';
import FileStatusBadge from './ui/FileStatusBadge';
import ConversationView from './ui/ConversationView';

// Import utilities and constants
import { formatFileSize, formatDate, formatDateTime } from '../utils';
import { FILE_STATUS } from '../constants';

const AudioAnalysis = ({ 
  onFileUpload, 
  audioFiles, 
  onProcessAll, 
  isProcessing, 
  currentAudio, 
  onProcessSingle,
  onClearAll,
  demoMode,
  processedFiles,
  transcriptions,
  analysisResults
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Listen for custom events from folder monitor
  useEffect(() => {
    const handleShowTranscription = (event) => {
      const { file } = event.detail;
      setSelectedFile(file);
      // Scroll to transcription view
      setTimeout(() => {
        const transcriptionElement = document.getElementById('transcription-view');
        if (transcriptionElement) {
          transcriptionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };
    
    window.addEventListener('showTranscription', handleShowTranscription);
    
    return () => {
      window.removeEventListener('showTranscription', handleShowTranscription);
    };
  }, []);

  // Filter processed files based on search and status
  const filteredFiles = processedFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || file.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            Audio File Upload & Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploadZone
            onFileUpload={onFileUpload}
            audioFiles={audioFiles}
            disabled={isProcessing}
          />
          
          {audioFiles.length > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={onProcessAll} 
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Process All Files
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClearAll}
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && currentAudio && (
        <ProcessingStatus currentAudio={currentAudio} />
      )}

      {/* Demo Mode Info */}
      {demoMode && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            Demo Mode Active: Using simulated analysis results for demonstration purposes.
          </AlertDescription>
        </Alert>
      )}

      {/* Processed Files Section */}
      {processedFiles.length > 0 && (
        <ProcessedFilesSection
          processedFiles={filteredFiles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          transcriptions={transcriptions}
          analysisResults={analysisResults}
          onProcessSingle={onProcessSingle}
          demoMode={demoMode}
        />
      )}
    </div>
  );
};

/**
 * Processing Status Component
 */
const ProcessingStatus = ({ currentAudio }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
  >
    <div className="flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      <div>
        <p className="text-white font-medium">Processing Audio File</p>
        <p className="text-blue-300 text-sm">{currentAudio.name}</p>
      </div>
    </div>
    <div className="mt-3">
      <Progress value={undefined} className="h-2" />
      <p className="text-xs text-gray-400 mt-1">
        Transcribing and analyzing for fraudulent activity...
      </p>
    </div>
  </motion.div>
);

/**
 * Processed Files Section Component
 */
const ProcessedFilesSection = ({
  processedFiles,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  selectedFile,
  setSelectedFile,
  transcriptions,
  analysisResults,
  onProcessSingle,
  demoMode
}) => (
  <Card className="bg-slate-800/50">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        Processed Files ({processedFiles.length})
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value={FILE_STATUS.SUSPICIOUS}>Suspicious</SelectItem>
            <SelectItem value={FILE_STATUS.CLEAR}>Clear</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {processedFiles.map((file, index) => (
          <ProcessedFileItem
            key={file.id}
            file={file}
            index={index}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onProcessSingle={onProcessSingle}
          />
        ))}
      </div>

      {/* Selected File Details */}
      {selectedFile && (
        <FileDetailsSection
          file={selectedFile}
          transcriptions={transcriptions}
          analysisResults={analysisResults}
          demoMode={demoMode}
        />
      )}
    </CardContent>
  </Card>
);

/**
 * Individual Processed File Item
 */
const ProcessedFileItem = ({ 
  file, 
  index, 
  selectedFile, 
  setSelectedFile, 
  onProcessSingle 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`p-4 rounded-lg border transition-all cursor-pointer ${
      selectedFile?.id === file.id
        ? 'border-blue-500 bg-blue-500/10'
        : 'border-gray-700 bg-slate-800/30 hover:bg-slate-800/50'
    }`}
    onClick={() => setSelectedFile(file)}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-white font-medium truncate max-w-48">
            {file.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDateTime(file.processedAt)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <FileStatusBadge 
          status={file.status} 
          riskLevel={file.analysis?.riskLevel}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFile(file);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    {file.confidence && (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Confidence</span>
          <span>{Math.round(file.confidence * 100)}%</span>
        </div>
        <Progress value={file.confidence * 100} className="h-1" />
      </div>
    )}
  </motion.div>
);

/**
 * File Details Section with Transcription
 */
const FileDetailsSection = ({ 
  file, 
  transcriptions, 
  analysisResults, 
  demoMode 
}) => (
  <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-gray-600">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-white font-medium">File Details: {file.name}</h4>
      <FileStatusBadge 
        status={file.status} 
        riskLevel={file.analysis?.riskLevel}
      />
    </div>
    
    {/* Analysis Summary */}
    {analysisResults[file.id] && (
      <div className="mb-4 p-3 bg-slate-800/50 rounded border">
        <h5 className="text-white font-medium mb-2">Analysis Summary</h5>
        <p className="text-gray-300 text-sm">
          {analysisResults[file.id].reasoning || analysisResults[file.id].summary}
        </p>
        
        {analysisResults[file.id].detectedPhrases?.length > 0 && (
          <div className="mt-2">
            <p className="text-red-400 text-xs mb-1">Detected suspicious phrases:</p>
            <div className="flex flex-wrap gap-1">
              {analysisResults[file.id].detectedPhrases.map((phrase, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    
    {/* Transcription */}
    <div id="transcription-view">
      <h5 className="text-white font-medium mb-3">Conversation Transcription</h5>
      <ConversationView 
        transcription={transcriptions[file.id]}
        showDemo={demoMode}
      />
    </div>
  </div>
);

export default AudioAnalysis; 