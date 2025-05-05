import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from 'lucide-react';

const contextSizeOptions = [
  { value: 4000, label: '4K tokens' },
  { value: 8000, label: '8K tokens' },
  { value: 16000, label: '16K tokens' },
  { value: 32000, label: '32K tokens' },
];

const LogSizeManager = ({ logContent, onContextSizeChange }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const [selectedContextSize, setSelectedContextSize] = useState(4000);
  const [utilizationPercentage, setUtilizationPercentage] = useState(0);

  useEffect(() => {
    // Approximate token count (characters / 4)
    const approximateTokens = Math.ceil(logContent.length / 4);
    setTokenCount(approximateTokens);
    setUtilizationPercentage((approximateTokens / selectedContextSize) * 100);
  }, [logContent, selectedContextSize]);

  const handleContextSizeChange = (value) => {
    const numValue = parseInt(value);
    setSelectedContextSize(numValue);
    onContextSizeChange(numValue);
  };

  const getUtilizationColor = () => {
    if (utilizationPercentage > 90) return "bg-red-500";
    if (utilizationPercentage > 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Log Size Management</h3>
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <Select
          value={selectedContextSize.toString()}
          onValueChange={handleContextSizeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select context size" />
          </SelectTrigger>
          <SelectContent>
            {contextSizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Context Utilization</span>
          <span>{Math.min(100, utilizationPercentage.toFixed(1))}%</span>
        </div>
        <Progress 
          value={Math.min(100, utilizationPercentage)} 
          className={getUtilizationColor()}
        />
      </div>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Approximate Tokens: {tokenCount.toLocaleString()}</span>
        <span>Context Size: {selectedContextSize.toLocaleString()}</span>
      </div>

      {utilizationPercentage > 100 && (
        <Alert variant="destructive">
          <AlertTitle>Context Window Exceeded</AlertTitle>
          <AlertDescription>
            Your log file exceeds the selected context size by {Math.floor(utilizationPercentage - 100)}%. 
            Consider increasing the context window or splitting the analysis into smaller chunks.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LogSizeManager; 