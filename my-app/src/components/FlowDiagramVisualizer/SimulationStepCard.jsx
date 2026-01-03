/**
 * SimulationStepCard Component
 * Enhanced step card for simulation mode with inline editing capabilities
 * Features hover actions for quick editing and connection management
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
  Settings,
  Plus,
} from 'lucide-react';

/**
 * Returns the appropriate icon component based on step status
 * @param {'current' | 'success' | 'failure' | 'end'} status - Status of the step
 * @returns {JSX.Element} Icon component
 */
const getStatusIcon = (status) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failure':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'current':
      return <ArrowRight className="h-5 w-5 text-blue-500" />;
    case 'end':
      return <X className="h-5 w-5 text-gray-500" />;
    default:
      return null;
  }
};

/**
 * Generates CSS classes for step cards based on their status and type
 * @param {'current' | 'success' | 'failure' | 'end'} status - Status of the step
 * @param {boolean} isSubStep - Whether the step is a sub-step
 * @returns {string} CSS classes string
 */
const getStepCardClasses = (status, isSubStep) => {
  let baseClasses = "p-4 rounded-lg border transition-all duration-200 ";
  
  // Status-based styling
  const statusClasses = status === 'current' ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : 
                       status === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200' :
                       status === 'failure' ? 'bg-red-50 dark:bg-red-900/30 border-red-200' :
                       status === 'end' ? 'bg-gray-50 dark:bg-gray-800 border-gray-200' :
                       'bg-gray-50 dark:bg-gray-800';

  // Different styling for main steps and sub-steps
  const stepTypeClasses = isSubStep ? 
    'border-dashed bg-opacity-70 dark:bg-opacity-70' : 
    'border-solid shadow-md';

  return `${baseClasses} ${statusClasses} ${stepTypeClasses}`;
};

/**
 * SimulationStepCard Component
 * @param {Object} props
 * @param {Object} props.step - The step object
 * @param {'current' | 'success' | 'failure' | 'end'} props.status - Current status of the step
 * @param {boolean} props.isSubStep - Whether this is a sub-step
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onAddConnection - Callback when add connection button is clicked
 */
const SimulationStepCard = ({ 
  step, 
  status, 
  isSubStep = false,
  onEdit, 
  onAddConnection 
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card 
      className={`
        ${getStepCardClasses(status, isSubStep)}
        group relative
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-3">
        <div className={`status-icon ${status} transition-all duration-300`}>
          {getStatusIcon(status)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200">
            {step.name}
          </h3>
          {step.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step.description}
            </p>
          )}
        </div>
        
        {/* Action buttons - show on hover */}
        {showActions && status !== 'end' && (
          <div className="flex gap-1 items-center animate-fade-in">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(step);
              }}
              title="Edit this step"
            >
              <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/50"
              onClick={(e) => {
                e.stopPropagation();
                onAddConnection(step);
              }}
              title="Add connection"
            >
              <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

SimulationStepCard.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    parentId: PropTypes.string
  }).isRequired,
  status: PropTypes.oneOf(['current', 'success', 'failure', 'end']).isRequired,
  isSubStep: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onAddConnection: PropTypes.func.isRequired
};

export default SimulationStepCard;
