/**
 * Save Notification Component
 * Displays success notification after save
 * 
 * SOLID Principle: Single Responsibility - Only displays save notification
 */
import PropTypes from 'prop-types';

const SaveNotification = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg 
                    transition-opacity duration-300 flex items-center space-x-2
                    animate-fade-in-out pointer-events-auto">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-lg font-medium">Flow saved successfully!</span>
      </div>
    </div>
  );
};

SaveNotification.propTypes = {
  show: PropTypes.bool.isRequired,
};

export default SaveNotification;
