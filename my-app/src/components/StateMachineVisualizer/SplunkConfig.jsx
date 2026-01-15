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
 * 
 * @typedef {Object} SplunkConfiguration
 * @property {string} serverUrl - Splunk server URL (e.g., https://splunk.example.com)
 * @property {string} port - Server port number (e.g., 8089)
 * @property {string} token - Authentication token
 * @property {string} index - Splunk index name
 */

import storage from '@/utils/storageWrapper';

import { useState, useEffect } from 'react';
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

// Input validation patterns
const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const PORT_PATTERN = /^([1-9][0-9]{0,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

const SplunkConfig = ({ onClose, onSave }) => {
  // Form state
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load config from IndexedDB on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await storage.getItem('splunkConfig');
        if (savedConfig) {
          setConfig(savedConfig);
        }
      } catch (error) {
        console.error('Error loading Splunk config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Validation state
  const [errors, setErrors] = useState({
    serverUrl: '',
    port: '',
    token: '',
    index: ''
  });

  /**
   * Validates the configuration form
   * @returns {boolean} True if validation passes, false otherwise
   */
  const validateForm = () => {
    const newErrors = {
      serverUrl: '',
      port: '',
      token: '',
      index: ''
    };

    let isValid = true;

    // Server URL validation
    if (!config.serverUrl) {
      newErrors.serverUrl = 'Server URL is required';
      isValid = false;
    } else if (!URL_PATTERN.test(config.serverUrl)) {
      newErrors.serverUrl = 'Invalid URL format';
      isValid = false;
    }

    // Port validation
    if (!config.port) {
      newErrors.port = 'Port is required';
      isValid = false;
    } else if (!PORT_PATTERN.test(config.port)) {
      newErrors.port = 'Port must be between 1 and 65535';
      isValid = false;
    }

    // Token validation
    if (!config.token) {
      newErrors.token = 'Token is required';
      isValid = false;
    }

    // Index validation
    if (!config.index) {
      newErrors.index = 'Index is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handles input changes and updates the configuration state
   * @param {string} field - The field being updated
   * @param {string} value - The new value
   */
  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handles the configuration save operation
   * Validates input, persists to localStorage, and notifies parent
   */
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    try {
      await storage.setItem('splunkConfig', config);
      toast.success('Splunk configuration saved successfully');
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
                onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                placeholder="https://your-splunk-server.com"
                className={errors.serverUrl ? 'border-red-500' : ''}
              />
              {errors.serverUrl && (
                <p className="mt-1 text-sm text-red-500">{errors.serverUrl}</p>
              )}
            </div>

            {/* Port Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Port
              </label>
              <Input
                type="text"
                value={config.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                placeholder="8089"
                className={errors.port ? 'border-red-500' : ''}
              />
              {errors.port && (
                <p className="mt-1 text-sm text-red-500">{errors.port}</p>
              )}
            </div>

            {/* Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Token
              </label>
              <Input
                type="password"
                value={config.token}
                onChange={(e) => handleInputChange('token', e.target.value)}
                placeholder="Splunk API Token"
                className={errors.token ? 'border-red-500' : ''}
              />
              {errors.token && (
                <p className="mt-1 text-sm text-red-500">{errors.token}</p>
              )}
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
                onChange={(e) => handleInputChange('index', e.target.value)}
                placeholder="main"
                className={errors.index ? 'border-red-500' : ''}
              />
              {errors.index && (
                <p className="mt-1 text-sm text-red-500">{errors.index}</p>
              )}
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
};

SplunkConfig.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default SplunkConfig;
