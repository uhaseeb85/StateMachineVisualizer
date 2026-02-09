import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import LogSizeManager from '../LogSizeManager';

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
  checkApiConnection,
  logContent,
  detectedModelName,
  modelContextLimit,
  isDetectingModel,
  chunkingEnabled
}) => {
  let statusContent = <p className="text-gray-500">Connection status unknown</p>;

  if (demoMode) {
    statusContent = (
      <p className="text-amber-600 dark:text-amber-400">✓ Demo mode is active - using simulated AI responses</p>
    );
  } else if (apiAvailable === true) {
    statusContent = (
      <div>
        <p className="text-green-600 dark:text-green-400">✓ Connected to AI API</p>
        {detectedModelName && detectedModelName !== 'Unknown' && (
          <p className="text-blue-600 dark:text-blue-400 mt-1">
            Model: {detectedModelName} ({Math.floor(modelContextLimit / 1000)}K tokens)
          </p>
        )}
      </div>
    );
  } else if (apiAvailable === false) {
    statusContent = (
      <p className="text-red-600 dark:text-red-400">✗ Cannot connect to AI</p>
    );
  }

  return (
    <div className="p-5 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">
        AI Connection Settings
      </h3>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
            <LogSizeManager 
              logContent={logContent}
              modelContextLimit={modelContextLimit}
              modelName={detectedModelName}
              chunkingEnabled={chunkingEnabled}
            />
          </div>
          
          <div className="flex-1 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex flex-col h-full justify-center gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                      Demo Mode
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Simulate AI responses for demonstration purposes
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button
                  onClick={toggleDemoMode}
                  variant={demoMode ? "default" : "outline"}
                  size="sm"
                  className={demoMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                >
                  {demoMode ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            AI Provider
          </p>
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
          <label htmlFor="api-endpoint" className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            API Endpoint
          </label>
          <Input
            id="api-endpoint"
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
            <label htmlFor="ollama-model-name" className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Model Name
            </label>
            <Input
              id="ollama-model-name"
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
            disabled={demoMode || isDetectingModel}
          >
            {isDetectingModel ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Detecting Model...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1" />
                Test Connection
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs mt-2">
          {statusContent}
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
  checkApiConnection: PropTypes.func.isRequired,
  logContent: PropTypes.string.isRequired,
  detectedModelName: PropTypes.string.isRequired,
  modelContextLimit: PropTypes.number.isRequired,
  isDetectingModel: PropTypes.bool.isRequired,
  chunkingEnabled: PropTypes.bool.isRequired
};

export default ApiSettings; 