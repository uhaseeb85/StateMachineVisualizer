import React from 'react';

export default function VersionInfo() {
  const version = "Beta-v0.6";    // Update this with your version number

  return (
    <div className="fixed bottom-4 left-4 text-xs text-gray-400 dark:text-gray-600">
      {version}
    </div>
  );
} 