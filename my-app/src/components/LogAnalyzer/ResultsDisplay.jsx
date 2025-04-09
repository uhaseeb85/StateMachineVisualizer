import React from 'react';
import PropTypes from 'prop-types';
import { SEVERITY_COLORS } from './constants';

const ResultsDisplay = ({ results }) => {
  if (!results) return null;
  
  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Analysis Results
      </h3>
      
      {results.length === 0 ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No patterns matched in the logs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {result.pattern.category}
                </h4>
                <span className={`text-sm font-medium ${SEVERITY_COLORS[result.pattern.severity.toLowerCase()]}`}>
                  {result.pattern.severity} Severity
                </span>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {result.pattern.cause}
              </p>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suggestions:
                </h5>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {result.pattern.suggestions.split(';').map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Occurrence (Line {result.firstMatch.lineNumber}):
                </h5>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs overflow-x-auto">
                  {result.firstMatch.context.before.map((line, i) => (
                    <div key={`before-${i}`} className="text-gray-500">{line}</div>
                  ))}
                  {result.firstMatch.matchedLines.map((line, i) => (
                    <div key={`match-${i}`} className="text-blue-600 dark:text-blue-400 font-semibold">{line}</div>
                  ))}
                  {result.firstMatch.context.after.map((line, i) => (
                    <div key={`after-${i}`} className="text-gray-500">{line}</div>
                  ))}
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Total occurrences: {result.totalMatches}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ResultsDisplay.propTypes = {
  results: PropTypes.array
};

export default ResultsDisplay; 