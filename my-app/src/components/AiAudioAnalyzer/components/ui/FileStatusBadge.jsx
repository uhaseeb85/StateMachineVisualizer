/**
 * FileStatusBadge Component
 * Reusable component for displaying file processing status with consistent styling
 */

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { FILE_STATUS, STATUS_COLORS, RISK_LEVELS, RISK_COLORS } from '../../constants';

const FileStatusBadge = ({ status, riskLevel, className = '' }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case FILE_STATUS.SUSPICIOUS:
        return <AlertTriangle className="w-3 h-3" />;
      case FILE_STATUS.CLEAR:
        return <CheckCircle className="w-3 h-3" />;
      case FILE_STATUS.PROCESSING:
        return <Clock className="w-3 h-3" />;
      case FILE_STATUS.ERROR:
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case FILE_STATUS.SUSPICIOUS:
        return 'Suspicious';
      case FILE_STATUS.CLEAR:
        return 'Clear';
      case FILE_STATUS.PROCESSING:
        return 'Processing';
      case FILE_STATUS.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getRiskText = (riskLevel) => {
    switch (riskLevel) {
      case RISK_LEVELS.HIGH:
        return 'High Risk';
      case RISK_LEVELS.MEDIUM:
        return 'Medium Risk';
      case RISK_LEVELS.LOW:
        return 'Low Risk';
      default:
        return '';
    }
  };

  // Use status color by default, or risk color if risk level is provided
  const colorClass = riskLevel 
    ? RISK_COLORS[riskLevel] || STATUS_COLORS[status] 
    : STATUS_COLORS[status] || STATUS_COLORS[FILE_STATUS.ERROR];

  const displayText = riskLevel ? getRiskText(riskLevel) : getStatusText(status);
  
  return (
    <Badge 
      className={`flex items-center gap-1 border ${colorClass} ${className}`}
      variant="outline"
    >
      {getStatusIcon(status)}
      <span className="text-xs font-medium">{displayText}</span>
    </Badge>
  );
};

export default FileStatusBadge; 