import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Sparkles } from 'lucide-react';
import { DEFAULT_ENDPOINTS } from '../../constants/apiConstants';

/**
 * API Settings component for configuring AI connections
 */
const ApiSettings = ({ 
  apiProvider, 
  setApiProvider, 
  apiEndpoint, 
  setApiEndpoint,
  modelName,
  setModelName,
  apiAvailable,
  demoMode,
  toggleDemoMode,
  checkApiConnection
}) => {
  return (
    <div className="p-5 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">
        AI Connection Settings
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Demo Mode
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Simulate AI responses for demonstration purposes
              </p>
            </div>
          </div>
          <Button
            onClick={toggleDemoMode}
            variant={demoMode ? "default" : "outline"}
            size="sm"
            className={demoMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
          >
            {demoMode ? "Enabled" : "Disabled"}
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            AI Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={apiProvider === 'LM_STUDIO' ? 'default' : 'outline'}
              className={`text-xs ${apiProvider === 'LM_STUDIO' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              onClick={() => setApiProvider('LM_STUDIO')}
              disabled={demoMode}
            >
              LM Studio
            </Button>
            <Button
              variant={apiProvider === 'OLLAMA' ? 'default' : 'outline'}
              className={`text-xs ${apiProvider === 'OLLAMA' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              onClick={() => setApiProvider('OLLAMA')}
              disabled={demoMode}
            >
              Ollama
            </Button>
            <Button
              variant={apiProvider === 'CUSTOM' ? 'default' : 'outline'}
              className={`text-xs ${apiProvider === 'CUSTOM' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
              onClick={() => setApiProvider('CUSTOM')}
              disabled={demoMode}
            >
              Custom
            </Button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            API Endpoint
          </label>
          <Input
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="Enter API endpoint URL"
            disabled={demoMode}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {apiProvider === 'LM_STUDIO' && 'Default: http://localhost:1234/v1/chat/completions'}
            {apiProvider === 'OLLAMA' && 'Default: http://localhost:11434/api/chat'}
            {apiProvider === 'CUSTOM' && 'Enter your custom API endpoint URL'}
          </p>
        </div>
        
        {apiProvider === 'OLLAMA' && (
          <div>
            <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Model Name
            </label>
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="llama3"
              disabled={demoMode}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Required for Ollama (e.g., llama3, mistral, phi3)
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={checkApiConnection}
            disabled={demoMode}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Test Connection
          </Button>
        </div>
        
        <div className="text-xs mt-2">
          {demoMode ? (
            <p className="text-amber-600 dark:text-amber-400">✓ Demo mode is active - using simulated AI responses</p>
          ) : apiAvailable === true ? (
            <p className="text-green-600 dark:text-green-400">✓ Connected to AI API</p>
          ) : apiAvailable === false ? (
            <p className="text-red-600 dark:text-red-400">✗ Cannot connect to AI</p>
          ) : (
            <p className="text-gray-500">Connection status unknown</p>
          )}
        </div>
      </div>
    </div>
  );
};

ApiSettings.propTypes = {
  apiProvider: PropTypes.string.isRequired,
  setApiProvider: PropTypes.func.isRequired,
  apiEndpoint: PropTypes.string.isRequired,
  setApiEndpoint: PropTypes.func.isRequired,
  modelName: PropTypes.string,
  setModelName: PropTypes.func.isRequired,
  apiAvailable: PropTypes.bool,
  demoMode: PropTypes.bool.isRequired,
  toggleDemoMode: PropTypes.func.isRequired,
  checkApiConnection: PropTypes.func.isRequired
};

export default ApiSettings; 