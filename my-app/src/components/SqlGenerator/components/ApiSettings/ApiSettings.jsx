import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RefreshCw, Sparkles, Settings, Sliders, Thermometer, Cpu, Key, Wand2, Database, MessageSquare } from 'lucide-react';
import { DEFAULT_ENDPOINTS, DEFAULT_MODELS } from '../../constants/apiConstants';

/**
 * API Settings component for configuring AI connections for SQL generation
 */
const ApiSettings = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [localSettings, setLocalSettings] = useState(settings);
  const [apiAvailable, setApiAvailable] = useState(null);
  
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
  
  const checkApiConnection = async () => {
    try {
      setApiAvailable(null); // Reset state while checking
      
      const endpoint = localSettings.endpoint.trim();
      if (!endpoint) {
        throw new Error('API endpoint is required');
      }

      let testEndpoint = endpoint;
      // For Ollama, test the health endpoint
      if (localSettings.provider === 'OLLAMA') {
        testEndpoint = 'http://localhost:11434/api/health';
      }
      
      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          ...(localSettings.apiKey && { 'Authorization': `Bearer ${localSettings.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      setApiAvailable(true);
    } catch (error) {
      console.error('API Connection Error:', error);
      setApiAvailable(false);
    }
  };
  
  const getConnectionStatusMessage = () => {
    if (apiAvailable === null) {
      return {
        text: 'Click "Test Connection" to verify API access',
        className: 'text-gray-500'
      };
    } else if (apiAvailable === true) {
      return {
        text: '✓ Successfully connected to AI API',
        className: 'text-green-600 dark:text-green-400'
      };
    } else {
      return {
        text: '✗ Failed to connect to AI API. Please check your settings and try again.',
        className: 'text-red-600 dark:text-red-400'
      };
    }
  };
  
  const saveSettings = () => {
    onSettingsChange({
      ...localSettings
    });
    setIsOpen(false);
  };
  
  // Welcome Modal Content
  const WelcomeModal = () => (
    <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="h-6 w-6 text-purple-500" />
            Welcome to SQL Generator
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your AI-powered assistant for SQL query generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Key Features
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-green-500 mt-1" />
                <span>Natural Language to SQL: Simply describe your query in plain English, and let AI generate the SQL for you.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sliders className="h-4 w-4 text-amber-500 mt-1" />
                <span>Customizable Settings: Adjust temperature and token limits to control the AI's creativity and response length.</span>
              </li>
              <li className="flex items-start gap-2">
                <Cpu className="h-4 w-4 text-blue-500 mt-1" />
                <span>Multiple AI Providers: Choose between LM Studio, Ollama, or custom providers for SQL generation.</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Getting Started
            </h3>
            <p className="text-sm text-muted-foreground">
              Click the "API Settings" button to configure your AI provider and start generating SQL queries. Make sure to test your connection before getting started.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setShowWelcome(false)}>
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <>
      <WelcomeModal />
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
                  >
                    LM Studio
                  </Button>
                  <Button
                    variant={localSettings.provider === 'OLLAMA' ? 'default' : 'outline'}
                    className={`text-xs ${localSettings.provider === 'OLLAMA' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                    onClick={() => handleProviderChange('OLLAMA')}
                  >
                    Ollama
                  </Button>
                  <Button
                    variant={localSettings.provider === 'CUSTOM' ? 'default' : 'outline'}
                    className={`text-xs ${localSettings.provider === 'CUSTOM' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                    onClick={() => handleProviderChange('CUSTOM')}
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
                  />
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={checkApiConnection}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Test Connection
                </Button>
              </div>
              
              <div className="text-xs mt-2">
                <p className={getConnectionStatusMessage().className}>
                  {getConnectionStatusMessage().text}
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
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
    </>
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
