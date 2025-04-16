import React from 'react';
import PropTypes from 'prop-types';

/**
 * Status log component to show operation status messages
 */
const StatusLog = ({ statusLog }) => {
  if (!statusLog || statusLog.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs overflow-y-auto" 
         style={{ maxHeight: "150px" }}>
      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Status Log</h3>
      <ul className="space-y-1">
        {statusLog.map((log, index) => (
          <li key={index} className={`${log.isError ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            <span className="text-gray-400 dark:text-gray-500">[{log.timestamp}]</span> {log.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

StatusLog.propTypes = {
  statusLog: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      isError: PropTypes.bool
    })
  ).isRequired
};

export default StatusLog; 