import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Component to display a notice when demo mode is active
 */
const DemoNotice = () => {
  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
      <div className="flex items-start">
        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Demo Mode Active
          </h3>
          <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            <p>This is a demonstration with simulated AI responses. Your log files are being read, but analysis is performed using pre-defined responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoNotice; 