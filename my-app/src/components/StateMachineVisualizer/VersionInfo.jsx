/**
 * VersionInfo Component
 * 
 * A simple component that displays the current version of the application.
 * Positioned in the bottom-left corner with muted styling to be informative
 * but not distracting.
 * 
 * The version information is useful for:
 * - Support and bug reporting
 * - Feature compatibility tracking
 * - Release management
 * - User feedback
 */

// Import version from package.json or environment variables if needed
const VERSION = "Beta";    // Update this with your version number

const VersionInfo = () => {
  return (
    <div 
      className="fixed bottom-4 left-4 text-xs text-gray-400 dark:text-gray-600"
      title={`Version: ${VERSION}`}  // Add tooltip for better accessibility
    >
      {VERSION}
    </div>
  );
};

export default VersionInfo;
