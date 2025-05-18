import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Sparkles, Settings, Sliders, Thermometer, Cpu, Key } from 'lucide-react';
import { DEFAULT_ENDPOINTS, DEFAULT_MODELS } from '../../constants/apiConstants';

/**
 * API Settings component for configuring AI connections for SQL generation
 */
const ApiSettings = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [apiAvailable, setApiAvailable] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  
  const handleProviderChange = (provider) => {
    const newSettings = {
      ...localSettings,
      provider,
      endpoint: DEFAULT_ENDPOINTS[provider]
    };
    
    if (provider === 'OLLAMA') {
      newSettings.model = DEFAULT_MODELS.OLLAMA;
    } else {
      newSettings.model = '';
    }
    
    setLocalSettings(newSettings);
  };
  
  const handleInputChange = (field, value) => {
    setLocalSettings({
      ...localSettings,
      [field]: value
    });
  };
  
  const handleTemperatureChange = (e) => {
    setLocalSettings({
      ...localSettings,
      temperature: parseFloat(e.target.value)
    });
  };
  
  const handleMaxTokensChange = (e) => {
    setLocalSettings({
      ...localSettings,
      maxTokens: parseInt(e.target.value)
    });
  };
  
  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
  };
  
  const checkApiConnection = async () => {
    // In a real implementation, this would check the API connection
    // For now, we'll simulate a response
    setApiAvailable(true);
  };
  
  const saveSettings = () => {
    onSettingsChange({
      ...localSettings,
      demoMode
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">API Settings</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-500" />
            SQL Generator API Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Cpu className="w-4 h-4 mr-1 text-blue-500" />
                AI Provider
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={localSettings.provider === 'LM_STUDIO' ? 'default' : 'outline'}
                  className={`text-xs ${localSettings.provider === 'LM_STUDIO' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  onClick={() => handleProviderChange('LM_STUDIO')}
                  disabled={demoMode}
                >
                  LM Studio
                </Button>
                <Button
                  variant={localSettings.provider === 'OLLAMA' ? 'default' : 'outline'}
                  className={`text-xs ${localSettings.provider === 'OLLAMA' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  onClick={() => handleProviderChange('OLLAMA')}
                  disabled={demoMode}
                >
                  Ollama
                </Button>
                <Button
                  variant={localSettings.provider === 'CUSTOM' ? 'default' : 'outline'}
                  className={`text-xs ${localSettings.provider === 'CUSTOM' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  onClick={() => handleProviderChange('CUSTOM')}
                  disabled={demoMode}
                >
                  Custom
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center">
                <Key className="w-4 h-4 mr-1 text-blue-500" />
                API Endpoint
              </label>
              <Input
                value={localSettings.endpoint}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
                placeholder="Enter API endpoint URL"
                disabled={demoMode}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {localSettings.provider === 'LM_STUDIO' && 'Default: http://localhost:1234/v1/chat/completions'}
                {localSettings.provider === 'OLLAMA' && 'Default: http://localhost:11434/api/chat'}
                {localSettings.provider === 'CUSTOM' && 'Enter your custom API endpoint URL'}
              </p>
            </div>
            
            {localSettings.provider === 'OLLAMA' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model Name
                </label>
                <Input
                  value={localSettings.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="llama3"
                  disabled={demoMode}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Required for Ollama (e.g., llama3, mistral, phi3)
                </p>
              </div>
            )}
            
            {localSettings.provider === 'CUSTOM' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  API Key
                </label>
                <Input
                  value={localSettings.apiKey || ''}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  placeholder="Enter API key if required"
                  type="password"
                  disabled={demoMode}
                />
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
          
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center">
                  <Thermometer className="w-4 h-4 mr-1 text-blue-500" />
                  Temperature: {localSettings.temperature.toFixed(1)}
                </label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={handleTemperatureChange}
                  disabled={demoMode}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3">
                  Max Tokens: {localSettings.maxTokens}
                </label>
                <Input
                  type="range"
                  min="500"
                  max="4000"
                  step="100"
                  value={localSettings.maxTokens}
                  onChange={handleMaxTokensChange}
                  disabled={demoMode}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>500</span>
                  <span>4000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

ApiSettings.propTypes = {
  settings: PropTypes.shape({
    endpoint: PropTypes.string.isRequired,
    apiKey: PropTypes.string,
    model: PropTypes.string,
    provider: PropTypes.string.isRequired,
    temperature: PropTypes.number.isRequired,
    maxTokens: PropTypes.number.isRequired
  }).isRequired,
  onSettingsChange: PropTypes.func.isRequired
};

export default ApiSettings;
