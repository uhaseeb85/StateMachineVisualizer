import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

/**
 * Component to display API connection warning when connection fails
 */
const ApiWarning = ({ checkApiConnection, toggleDemoMode }) => {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Cannot Connect to AI Service
          </h3>
          <div className="mt-1 text-sm text-red-700 dark:text-red-300">
            <p className="mb-2">
              Unable to connect to the specified AI service. You can enable Demo Mode for testing or check your network connection and endpoint settings.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-300"
                onClick={checkApiConnection}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Connection
              </Button>
              <Button
                size="sm"
                variant="default"
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={toggleDemoMode}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Enable Demo Mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ApiWarning.propTypes = {
  checkApiConnection: PropTypes.func.isRequired,
  toggleDemoMode: PropTypes.func.isRequired,
};

export default ApiWarning; 