/**
 * TranscriptionView Component - Refactored
 * Uses new ConversationView component and utility functions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import new architecture components
import ConversationView from './ui/ConversationView';
import FileStatusBadge from './ui/FileStatusBadge';

// Import utilities and constants
import { formatDateTime } from '../utils';
import { FILE_STATUS } from '../constants';

const TranscriptionView = ({ processedFiles, transcriptions, analysisResults }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter files based on search and status
  const filteredFiles = processedFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || file.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Transcription Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search transcriptions..."
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
          
          {/* Search Instructions */}
          <SearchInstructions />
        </CardContent>
      </Card>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <EmptyState searchQuery={searchQuery} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File List */}
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Files ({filteredFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredFiles.map((file, index) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    index={index}
                    selectedFile={selectedFile}
                    onSelect={setSelectedFile}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transcription Display */}
          <Card className="bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {selectedFile ? `Transcription: ${selectedFile.name}` : 'Select a file to view transcription'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <TranscriptionDetails
                  file={selectedFile}
                  transcription={transcriptions[selectedFile.id]}
                  analysis={analysisResults[selectedFile.id]}
                />
              ) : (
                <SelectFilePrompt />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

/**
 * Search Instructions Component
 */
const SearchInstructions = () => (
  <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
    <h5 className="text-white font-medium mb-2 flex items-center gap-2">
      <Search className="w-4 h-4 text-blue-400" />
      Search & Filter Instructions:
    </h5>
    <div className="space-y-1 text-sm text-gray-400">
      <div>• <strong className="text-white">Search:</strong> Type any part of a filename to find specific recordings</div>
      <div>• <strong className="text-white">Filter by Status:</strong> Show only suspicious or clear files</div>
      <div>• <strong className="text-white">View Transcriptions:</strong> Click any file to see the full conversation</div>
      <div>• <strong className="text-white">Suspicious Content:</strong> Red highlights indicate potential fraud phrases</div>
    </div>
  </div>
);

/**
 * Empty State Component
 */
const EmptyState = ({ searchQuery }) => (
  <Card className="bg-slate-800/50">
    <CardContent className="p-12">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">
          {searchQuery ? 'No matching transcriptions found' : 'No transcriptions available'}
        </h3>
        <p className="text-gray-400 mb-4">
          {searchQuery 
            ? `No transcriptions match your search for "${searchQuery}"`
            : 'Process some audio files to see transcriptions here'
          }
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          {searchQuery ? (
            <>
              <p>• Try adjusting your search terms</p>
              <p>• Check the status filter settings</p>
              <p>• Make sure files have been processed</p>
            </>
          ) : (
            <>
              <p>• Go to the "Analyze" tab to upload audio files</p>
              <p>• Process files to generate transcriptions</p>
              <p>• Results will appear here automatically</p>
            </>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * File List Item Component
 */
const FileListItem = ({ file, index, selectedFile, onSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`p-4 rounded-lg border transition-all cursor-pointer ${
      selectedFile?.id === file.id
        ? 'border-purple-500 bg-purple-500/10'
        : 'border-gray-700 bg-slate-800/30 hover:bg-slate-800/50'
    }`}
    onClick={() => onSelect(file)}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{file.name}</p>
        <p className="text-sm text-gray-400">
          {formatDateTime(file.processedAt)}
        </p>
      </div>
      <FileStatusBadge 
        status={file.status} 
        riskLevel={file.analysis?.riskLevel}
      />
    </div>
    
    <div className="flex items-center justify-between text-xs text-gray-400">
      <div className="flex items-center gap-2">
        <span>Confidence: {Math.round((file.confidence || 0) * 100)}%</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(file);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Eye className="w-3 h-3" />
      </Button>
    </div>
    
    {selectedFile?.id === file.id && (
      <div className="mt-2 text-xs text-purple-300">
        Selected for viewing →
      </div>
    )}
  </motion.div>
);

/**
 * Select File Prompt Component
 */
const SelectFilePrompt = () => (
  <div className="text-center py-8">
    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h4 className="text-lg font-medium text-white mb-2">Select a file to view transcription</h4>
    <p className="text-gray-400 text-sm">
      Click on any file from the list to see its conversation transcription
    </p>
  </div>
);

/**
 * Transcription Details Component
 */
const TranscriptionDetails = ({ file, transcription, analysis }) => (
  <div className="space-y-4">
    {/* Analysis Summary */}
    {analysis && (
      <Alert className={`${
        analysis.isFraudulent
          ? 'border-red-500/50 bg-red-500/10'
          : 'border-green-500/50 bg-green-500/10'
      }`}>
        {analysis.isFraudulent ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-400" />
        )}
        <AlertDescription className={
          analysis.isFraudulent ? 'text-red-300' : 'text-green-300'
        }>
          <strong>Analysis:</strong> {analysis.reasoning || analysis.summary || 'Analysis completed'}
        </AlertDescription>
      </Alert>
    )}

    {/* Detected Phrases */}
    {analysis?.detectedPhrases?.length > 0 && (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h5 className="text-red-400 font-medium mb-2">Suspicious Phrases Detected:</h5>
        <div className="flex flex-wrap gap-1">
          {analysis.detectedPhrases.map((phrase, index) => (
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

    {/* File Information */}
    <div className="p-3 bg-slate-900/50 rounded-lg border border-gray-600">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Status:</span>
          <div className="mt-1">
            <FileStatusBadge 
              status={file.status} 
              riskLevel={analysis?.riskLevel}
            />
          </div>
        </div>
        <div>
          <span className="text-gray-400">Confidence:</span>
          <p className="text-white font-medium">
            {Math.round((file.confidence || 0) * 100)}%
          </p>
        </div>
      </div>
    </div>

    {/* Conversation Transcription */}
    <div className="p-4 bg-slate-900/50 rounded-lg border border-gray-600 max-h-96 overflow-y-auto">
      <h5 className="text-white font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Conversation Transcript
      </h5>
      <ConversationView 
        transcription={transcription}
        showDemo={!transcription || transcription.length < 50}
      />
    </div>
  </div>
);

export default TranscriptionView; 