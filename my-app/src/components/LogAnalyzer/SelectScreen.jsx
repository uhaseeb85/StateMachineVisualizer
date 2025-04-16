import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Download, Database, FileText, ArrowRight } from 'lucide-react';
import { downloadSampleDictionary } from './utils';
import { SAMPLE_PATTERNS } from './constants';

const SelectScreen = ({ handleModeSelect }) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Log Analysis Tools
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Powerful pattern matching and analysis to help you identify critical issues in your logs
        </p>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mt-4">
        Choose Your Analysis Method
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Splunk Analysis Card */}
        <div 
          onClick={() => handleModeSelect('splunk')}
          className="cursor-pointer rounded-xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors overflow-hidden shadow-sm hover:shadow-md"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4">
                <Database className="w-14 h-14 text-blue-500" />
              </div>
            </div>
            <div className="text-center flex-grow space-y-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Splunk Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect to your Splunk instance to analyze logs remotely
              </p>
              <ul className="text-sm text-left ml-5 space-y-1 text-gray-600 dark:text-gray-400 list-disc">
                <li>Query logs directly from Splunk</li>
                <li>Use session IDs to focus analysis</li>
                <li>No need to download log files</li>
              </ul>
              <div className="pt-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-300">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Select Splunk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Analysis Card */}
        <div 
          onClick={() => handleModeSelect('file')}
          className="cursor-pointer rounded-xl border-2 border-green-200 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors overflow-hidden shadow-sm hover:shadow-md"
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <FileText className="w-14 h-14 text-green-500" />
              </div>
            </div>
            <div className="text-center flex-grow space-y-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                File Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload and analyze your local log files
              </p>
              <ul className="text-sm text-left ml-5 space-y-1 text-gray-600 dark:text-gray-400 list-disc">
                <li>Analyze log files downloaded to your PC</li>
                <li>View results with line numbers</li>
                <li>See context around matched patterns</li>
              </ul>
              <div className="pt-4">
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Select File Analysis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full flex-shrink-0">
            <Download className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Log Dictionary
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              A log dictionary contains regex patterns to match in your logs. These patterns help identify common issues and provide context on their severity and potential solutions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => downloadSampleDictionary(SAMPLE_PATTERNS)}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample Dictionary
              </Button>
              <Button
                onClick={() => handleModeSelect('file')}
                variant="ghost"
                className="text-gray-600 dark:text-gray-300"
              >
                Learn More About Log Dictionaries
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SelectScreen.propTypes = {
  handleModeSelect: PropTypes.func.isRequired
};

export default SelectScreen; 