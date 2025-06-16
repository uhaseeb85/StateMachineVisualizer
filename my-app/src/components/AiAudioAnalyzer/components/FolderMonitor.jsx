/**
 * FolderMonitor Component - Refactored
 * Uses the new useFolderMonitor hook for cleaner state management
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Monitor, 
  MonitorX, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileAudio,
  Settings2,
  RotateCcw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import utilities and constants
import { formatFileSize, formatDateTime } from '../utils';
import { useFolderMonitor } from '../hooks/useFolderMonitor';

const FolderMonitor = ({ 
  monitoredFolder, 
  setMonitoredFolder, 
  isMonitoring, 
  setIsMonitoring,
  onFileDetected,
  processedFiles,
  onProcessFile
}) => {
  // Use the custom hook for folder monitoring
  const folderMonitor = useFolderMonitor({
    onFileDetected,
    onProcessFile
  });

  return (
    <div className="space-y-6">
      {/* Folder Selection */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            Folder Monitoring Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Select folder to monitor for new audio files
              </label>
              <div className="flex gap-2">
                <Input
                  value={folderMonitor.monitoredFolder || 'No folder selected'}
                  readOnly
                  className="flex-1"
                  placeholder="Click 'Select Folder' to choose a directory"
                />
                <Button 
                  onClick={folderMonitor.selectFolder}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Select Folder
                </Button>
              </div>
            </div>

            {/* File System Access API Info */}
            {!folderMonitor.hasFileSystemAccess && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300">
                  <strong>Limited Browser Support:</strong> Your browser doesn't support the File System Access API. 
                  You can still select a folder, but monitoring will be simulated.
                </AlertDescription>
              </Alert>
            )}

            {/* Monitoring Interval */}
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Check interval (seconds)
              </label>
              <Input
                type="number"
                min="1"
                max="60"
                value={folderMonitor.checkInterval}
                onChange={(e) => folderMonitor.setCheckInterval(parseInt(e.target.value) || 5)}
                className="w-32"
              />
            </div>

            {/* Monitoring Controls */}
            <div className="flex gap-2">
              <Button
                onClick={folderMonitor.toggleMonitoring}
                disabled={!folderMonitor.monitoredFolder}
                className={folderMonitor.isMonitoring 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700"
                }
              >
                {folderMonitor.isMonitoring ? (
                  <>
                    <MonitorX className="w-4 h-4 mr-2" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Monitor className="w-4 h-4 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={folderMonitor.resetStats}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Stats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      <MonitoringStatus 
        isMonitoring={folderMonitor.isMonitoring}
        monitoringStats={folderMonitor.monitoringStats}
        monitoredFolder={folderMonitor.monitoredFolder}
      />

      {/* Recent Files */}
      {folderMonitor.recentFiles.length > 0 && (
        <RecentFilesSection 
          recentFiles={folderMonitor.recentFiles}
          onFileClick={folderMonitor.handleFileClick}
        />
      )}

      {/* Instructions */}
      <InstructionsCard />
    </div>
  );
};

/**
 * Monitoring Status Component
 */
const MonitoringStatus = ({ isMonitoring, monitoringStats, monitoredFolder }) => (
  <Card className={`border ${
    isMonitoring 
      ? 'border-green-500/50 bg-green-500/10' 
      : 'border-gray-600 bg-slate-800/50'
  }`}>
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        {isMonitoring ? (
          <Monitor className="w-5 h-5 text-green-400" />
        ) : (
          <MonitorX className="w-5 h-5 text-gray-400" />
        )}
        Monitoring Status
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`} />
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <p className="text-white font-medium">
              {isMonitoring ? 'Active' : 'Stopped'}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-400">Files Processed</p>
          <p className="text-white font-medium">{monitoringStats.filesProcessed}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-400">Total Size</p>
          <p className="text-white font-medium">
            {formatFileSize(monitoringStats.totalSize)}
          </p>
        </div>
      </div>
      
      {monitoringStats.lastCheck && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-sm text-gray-400">
            Last checked: {formatDateTime(monitoringStats.lastCheck)}
          </p>
        </div>
      )}
      
      {monitoredFolder && (
        <div className="mt-2">
          <p className="text-sm text-gray-400">Monitoring: </p>
          <p className="text-white text-sm font-mono bg-slate-800/50 p-2 rounded mt-1">
            {monitoredFolder}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

/**
 * Recent Files Section Component
 */
const RecentFilesSection = ({ recentFiles, onFileClick }) => (
  <Card className="bg-slate-800/50">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <FileAudio className="w-5 h-5 text-purple-400" />
        Recently Detected Files ({recentFiles.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {recentFiles.map((file, index) => (
          <motion.div
            key={`${file.name}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-gray-600 hover:bg-slate-700/70 transition-colors cursor-pointer"
            onClick={() => onFileClick(file.name)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded">
                <FileAudio className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-48">
                  {file.name}
                </p>
                <p className="text-gray-400 text-sm">
                  {formatFileSize(file.size)} • {formatDateTime(file.lastModified)}
                </p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-green-600 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Detected
            </Badge>
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Instructions Card Component
 */
const InstructionsCard = () => (
  <Card className="bg-slate-800/30 border-slate-700">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-blue-400" />
        How Folder Monitoring Works
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400">
        <div>
          <h5 className="text-white font-medium mb-2">Setup:</h5>
          <div className="space-y-1">
            <div>• Click "Select Folder" to choose a directory</div>
            <div>• Set check interval (how often to scan)</div>
            <div>• Click "Start Monitoring" to begin</div>
            <div>• New audio files will be auto-detected</div>
          </div>
        </div>
        <div>
          <h5 className="text-white font-medium mb-2">Automatic Processing:</h5>
          <div className="space-y-1">
            <div>• Detected files are automatically processed</div>
            <div>• Results appear in the Analysis tab</div>
            <div>• Click detected files to view transcriptions</div>
            <div>• Monitor stats show processing progress</div>
          </div>
        </div>
      </div>
      
      <Alert className="mt-4 border-blue-500/50 bg-blue-500/10">
        <AlertCircle className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          <strong>Browser Compatibility:</strong> This feature works best in modern browsers with 
          File System Access API support (Chrome, Edge). In other browsers, it will use a fallback mode.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
);

export default FolderMonitor; 