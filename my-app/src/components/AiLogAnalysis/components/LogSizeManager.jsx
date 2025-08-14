import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Zap, AlertTriangle } from 'lucide-react';

const LogSizeManager = ({ logContent, modelContextLimit, modelName, chunkingEnabled }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const [utilizationPercentage, setUtilizationPercentage] = useState(0);
  const [willRequireChunking, setWillRequireChunking] = useState(false);

  useEffect(() => {
    // Approximate token count (characters / 4)
    const approximateTokens = Math.ceil(logContent.length / 4);
    setTokenCount(approximateTokens);
    
    if (modelContextLimit > 0) {
      const utilization = (approximateTokens / modelContextLimit) * 100;
      setUtilizationPercentage(utilization);
      setWillRequireChunking(approximateTokens > modelContextLimit);
    } else {
      setUtilizationPercentage(0);
      setWillRequireChunking(false);
    }
  }, [logContent, modelContextLimit]);

  const getUtilizationColor = () => {
    if (willRequireChunking) return "bg-red-500";
    if (utilizationPercentage > 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getContextLimitDisplay = () => {
    if (modelContextLimit <= 0) return "Unknown";
    if (modelContextLimit >= 1000) {
      return `${Math.floor(modelContextLimit / 1000)}K tokens`;
    }
    return `${modelContextLimit} tokens`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Log Analysis Overview</h3>
          <div className="relative group">
            <InfoIcon 
              className="h-4 w-4 text-muted-foreground cursor-help"
              title="Shows how your log content fits within the model's context window. Large logs will be automatically chunked for analysis." 
            />
            <div className="absolute hidden group-hover:block bg-black text-white p-2 rounded shadow-lg w-64 text-xs -right-2 top-6 z-10">
              The model's context window determines how much text can be analyzed at once. Large logs are automatically split into chunks for comprehensive analysis.
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {modelName && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
              <Zap className="h-3 w-3 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">{modelName}</span>
            </div>
          )}
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            <span className="text-gray-700 dark:text-gray-300">
              Limit: {getContextLimitDisplay()}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Context Utilization</span>
          <span>
            {willRequireChunking 
              ? `${Math.floor(utilizationPercentage)}% (Will chunk)` 
              : `${Math.min(100, utilizationPercentage.toFixed(1))}%`
            }
          </span>
        </div>
        <Progress 
          value={Math.min(100, utilizationPercentage)} 
          className={getUtilizationColor()}
        />
      </div>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Content Size: {tokenCount.toLocaleString()} tokens</span>
        <span>Model Limit: {modelContextLimit > 0 ? modelContextLimit.toLocaleString() : 'Unknown'} tokens</span>
      </div>

      {willRequireChunking && chunkingEnabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Automatic Chunking Active</AlertTitle>
          <AlertDescription>
            Your log content exceeds the model's context window. It will be automatically split into 
            {Math.ceil(tokenCount / modelContextLimit)} chunks for analysis with intelligent overlap.
          </AlertDescription>
        </Alert>
      )}

      {willRequireChunking && !chunkingEnabled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Content Too Large</AlertTitle>
          <AlertDescription>
            Your log content exceeds the model's context window by {Math.floor(utilizationPercentage - 100)}%. 
            Please enable chunking or reduce the log size for analysis.
          </AlertDescription>
        </Alert>
      )}

      {modelContextLimit <= 0 && (
        <Alert variant="outline">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Model Detection Pending</AlertTitle>
          <AlertDescription>
            Connect to your AI provider to detect the model's capabilities and context limits.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LogSizeManager; 