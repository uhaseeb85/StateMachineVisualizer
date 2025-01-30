import React from 'react';

export default function VersionInfo() {
  const commitId = "beta"; // Update this with your latest commit ID
  const version = "0.0.3";    // Update this with your version number

  return (
    <div className="fixed bottom-4 left-4 text-xs text-gray-400 dark:text-gray-600">
      v{version} ({commitId})
    </div>
  );
} 