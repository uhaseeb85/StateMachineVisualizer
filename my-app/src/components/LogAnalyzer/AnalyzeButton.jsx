import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { SCREENS } from './constants';

const AnalyzeButton = ({ 
  analyzeLogs, 
  loading, 
  logDictionary, 
  screen, 
  sessionId, 
  logFiles 
}) => {
  const isDisabled = !logDictionary || 
                      loading || 
                      (screen === SCREENS.SPLUNK && !sessionId) || 
                      (screen === SCREENS.FILE && logFiles.length === 0);
  
  return (
    <Button 
      onClick={analyzeLogs} 
      disabled={isDisabled}
      className="w-full"
    >
      {loading ? 'Analyzing...' : 'Analyze Logs'}
    </Button>
  );
};

AnalyzeButton.propTypes = {
  analyzeLogs: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  logDictionary: PropTypes.array,
  screen: PropTypes.string.isRequired,
  sessionId: PropTypes.string.isRequired,
  logFiles: PropTypes.array.isRequired
};

export default AnalyzeButton; 