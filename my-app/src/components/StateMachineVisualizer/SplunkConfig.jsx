import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function SplunkConfig({ onClose, onSave }) {
  const [config, setConfig] = useState({
    serverUrl: '',
    port: '',
    token: '',
    index: '',
    username: '',
    password: ''
  });

  const handleSave = () => {
    localStorage.setItem('splunkConfig', JSON.stringify(config));
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Splunk Configuration
          </h2>
          
          <div className="space-y-4">
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
            </div>

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