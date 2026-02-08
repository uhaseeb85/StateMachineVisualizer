/**
 * Loading Spinner Component
 * Displays loading state
 * 
 * SOLID Principle: Single Responsibility - Only displays loading UI
 */

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading diagram...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
