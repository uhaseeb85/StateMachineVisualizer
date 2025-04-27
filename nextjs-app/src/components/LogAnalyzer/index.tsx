import React from 'react';

interface LogAnalyzerProps {
  onChangeMode: () => void;
}

const LogAnalyzer: React.FC<LogAnalyzerProps> = ({ onChangeMode }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Log Analyzer</h1>
        <button 
          onClick={onChangeMode}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Change Mode
        </button>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Log Analyzer component is being migrated to Next.js and TypeScript.
        </p>
      </div>
    </div>
  );
};

export default LogAnalyzer;
