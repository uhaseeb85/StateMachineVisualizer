/**
 * SplunkConfig Component
 * 
 * A configuration modal for setting up Splunk integration parameters.
 * This component handles:
 * - Server URL and port configuration
 * - Token-based authentication
 * - Index selection
 * - Local storage persistence
 * 
 * The configuration is stored in localStorage and used by the LogAnalyzer
 * component for Splunk-based log analysis.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

// Default configuration structure
const DEFAULT_CONFIG = {
  serverUrl: '',
  port: '',
  token: '',
  index: ''
};

export default function SplunkConfig({ onClose, onSave }) {
  /**
   * Initialize configuration state from localStorage
   * Falls back to default empty configuration if no saved config exists
   * or if there's an error loading the saved configuration
   */
  const [config, setConfig] = useState(() => {
    try {
      const savedConfig = localStorage.getItem('splunkConfig');
      return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error loading Splunk config:', error);
      return DEFAULT_CONFIG;
    }
  });

  /**
   * Handles the configuration save operation
   * - Validates required fields
   * - Persists to localStorage
   * - Notifies parent component
   * - Shows success/error feedback
   */
  const handleSave = () => {
    // Validate all required fields
    if (!config.serverUrl || !config.port || !config.token || !config.index) {
      toast.error('All fields are required');
      return;
    }

    try {
      // Persist configuration
      localStorage.setItem('splunkConfig', JSON.stringify(config));
      toast.success('Splunk configuration saved successfully');
      
      // Notify parent components and close modal
      onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving Splunk config:', error);
      toast.error('Failed to save Splunk configuration');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Splunk Configuration
          </h2>
          
          <div className="space-y-4">
            {/* Server URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Server URL
              </label>
              <Input
                type="text"
                value={config.serverUrl}
                onChange={(e) => setConfig({...config, serverUrl: e.target.value})}
                placeholder="https://your-splunk-server.com"
              />
            </div>

            {/* Port Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Port
              </label>
              <Input
                type="text"
                value={config.port}
                onChange={(e) => setConfig({...config, port: e.target.value})}
                placeholder="8089"
              />
            </div>

            {/* Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Token
              </label>
              <Input
                type="password"
                value={config.token}
                onChange={(e) => setConfig({...config, token: e.target.value})}
                placeholder="Splunk API Token"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Use a Splunk authentication token for secure access. Never share or expose your token.
              </p>
            </div>

            {/* Index Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Index
              </label>
              <Input
                type="text"
                value={config.index}
                onChange={(e) => setConfig({...config, index: e.target.value})}
                placeholder="main"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

SplunkConfig.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};
