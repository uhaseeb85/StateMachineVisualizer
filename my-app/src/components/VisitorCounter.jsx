import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EyeIcon, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:5001';

const VisitorCounter = () => {
  const [count, setCount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the current visitor count
  const fetchVisitorCount = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching visitor count...');
      const response = await fetch(`${API_URL}/api/visitor-count`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Count data received:', data);
      setCount(data.count);
    } catch (error) {
      console.error('Error fetching visitor count:', error);
      setError(`Failed to fetch count: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh the count manually
  const handleRefresh = () => {
    fetchVisitorCount();
  };

  // Initial fetch
  useEffect(() => {
    fetchVisitorCount();
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/50">
            <RefreshCw className="w-4 h-4 text-purple-300 animate-spin" />
            <span className="text-sm text-purple-100">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400 max-w-[250px]">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-500/50"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        ) : count !== null ? (
          <div className="flex items-center gap-1 bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/50">
            <EyeIcon className="w-4 h-4 text-purple-300" />
            <Badge variant="secondary" className="bg-purple-500/30 text-purple-100">
              {count} {count === 1 ? 'visitor' : 'visitors'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 ml-1 hover:bg-purple-500/30 text-purple-300"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        ) : null}
      </div>
      
      {(!isLoading && !error && count === null) && (
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border-purple-500/50"
          onClick={handleRefresh}
        >
          <EyeIcon className="w-4 h-4 mr-1" />
          Show Visitor Count
        </Button>
      )}
    </div>
  );
};

export default VisitorCounter; 