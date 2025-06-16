/**
 * AI Audio Analyzer - Main Component
 * Refactored for better maintainability and separation of concerns
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Brain,
  MessageSquare,
  List,
  Monitor,
  RotateCcw,
  Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom hooks
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { useFolderMonitor } from './hooks/useFolderMonitor';

// Components
import ApiSettings from '../AiLogAnalysis/components/ApiSettings/ApiSettings';
import AudioAnalysis from './components/AudioUpload';
import FolderMonitor from './components/FolderMonitor';
import TranscriptionView from './components/TranscriptionView';
import AnalysisReport from './components/AnalysisReport';

// Constants
import { TABS } from './constants';

const AiAudioAnalyzer = ({ onChangeMode }) => {
  // Use custom hooks for state management
  const audioAnalyzer = useAudioAnalyzer();
  
  // Use folder monitoring hook
  const folderMonitor = useFolderMonitor({
    onFileDetected: (fileInfo) => {
      // Handle file detection from folder monitor
      console.log('File detected:', fileInfo.name);
    },
    onProcessFile: audioAnalyzer.processAudio
  });

  // Handle custom events from folder monitor
  React.useEffect(() => {
    const handleShowTranscription = (event) => {
      const { file } = event.detail;
      audioAnalyzer.setActiveTab(TABS.ANALYZE);
      // You can add logic here to automatically select the file in the unified interface
    };
    
    window.addEventListener('showTranscription', handleShowTranscription);
    
    return () => {
      window.removeEventListener('showTranscription', handleShowTranscription);
    };
  }, [audioAnalyzer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Audio Analyzer</h1>
              <p className="text-purple-300">Analyze IVR conversations for fraudulent activity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => audioAnalyzer.setShowSettings(!audioAnalyzer.showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={onChangeMode}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>

        {/* API Settings */}
        <AnimatePresence>
          {audioAnalyzer.showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <ApiSettings
                apiProvider={audioAnalyzer.apiProvider}
                setApiProvider={audioAnalyzer.setApiProvider}
                apiEndpoint={audioAnalyzer.apiEndpoint}
                setApiEndpoint={audioAnalyzer.setApiEndpoint}
                modelName={audioAnalyzer.modelName}
                setModelName={audioAnalyzer.setModelName}
                apiAvailable={audioAnalyzer.apiAvailable}
                demoMode={audioAnalyzer.demoMode}
                toggleDemoMode={audioAnalyzer.toggleDemoMode}
                checkApiConnection={audioAnalyzer.checkApiConnection}
                logContent=""
                onContextSizeChange={() => {}}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs 
            value={audioAnalyzer.activeTab} 
            onValueChange={audioAnalyzer.setActiveTab} 
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value={TABS.ANALYZE} className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Analyze
              </TabsTrigger>
              <TabsTrigger value={TABS.MONITOR} className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Monitor
              </TabsTrigger>
              <TabsTrigger value={TABS.TRANSCRIPTIONS} className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Transcriptions
              </TabsTrigger>
              <TabsTrigger value={TABS.REPORTS} className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value={TABS.ANALYZE} className="space-y-6">
              <AudioAnalysis
                onFileUpload={audioAnalyzer.handleFileUpload}
                audioFiles={audioAnalyzer.audioFiles}
                onProcessAll={audioAnalyzer.processAllFiles}
                isProcessing={audioAnalyzer.isProcessing}
                currentAudio={audioAnalyzer.currentAudio}
                onProcessSingle={audioAnalyzer.processAudio}
                onClearAll={audioAnalyzer.clearAudioFiles}
                demoMode={audioAnalyzer.demoMode}
                processedFiles={audioAnalyzer.processedFiles}
                transcriptions={audioAnalyzer.transcriptions}
                analysisResults={audioAnalyzer.analysisResults}
              />
            </TabsContent>

            <TabsContent value={TABS.MONITOR} className="space-y-6">
              <FolderMonitor
                monitoredFolder={folderMonitor.monitoredFolder}
                setMonitoredFolder={folderMonitor.setMonitoredFolder}
                isMonitoring={folderMonitor.isMonitoring}
                setIsMonitoring={folderMonitor.setIsMonitoring}
                onFileDetected={audioAnalyzer.handleFileUpload}
                processedFiles={audioAnalyzer.processedFiles}
                onProcessFile={audioAnalyzer.processAudio}
              />
            </TabsContent>

            <TabsContent value={TABS.TRANSCRIPTIONS} className="space-y-6">
              <TranscriptionView
                processedFiles={audioAnalyzer.processedFiles}
                transcriptions={audioAnalyzer.transcriptions}
                analysisResults={audioAnalyzer.analysisResults}
              />
            </TabsContent>

            <TabsContent value={TABS.REPORTS} className="space-y-6">
              <AnalysisReport
                processedFiles={audioAnalyzer.processedFiles}
                analysisResults={audioAnalyzer.analysisResults}
                onClearAll={audioAnalyzer.clearProcessedFiles}
                onExportReport={audioAnalyzer.exportReport}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AiAudioAnalyzer;
